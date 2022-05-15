import { NFTChainError, ParameterExpectedRootEmptyError } from ".";
import { BitcoinAddress } from "./BitcoinAddress";
import { ParameterListEmptyError } from "./errors/ParameterListEmptyError";
import { ParameterMissingError } from "./errors/ParameterMissingError";
import { NameInterface } from "./interfaces/Name.interface";
import { OpResult } from "./interfaces/OpResult.interface";
import * as bsv2 from 'bsv2';
import * as bsv from 'bsv';
import { ParameterExpectedRootMismatchError } from "./errors/ParameterExpectedRootMismatchError";
import { NotInitError } from "./errors/NotInitError";
import { RootOutputHashMismatchError } from "./errors/RootOutputHashMismatchError";
import { createOutputFromSatoshisAndHex, generatePreimage, PrefixParseResult, prevOutpointFromTxIn, sighashType2Hex } from "./Helpers";
import { NameInfo } from "./interfaces/NameInfo.interface";
import { TreeProcessorInterface } from "./interfaces/TreeProcessor.interface";
import { TreeProcessor } from "./TreeProcessor";
import { Resolver } from "./Resolver";
import { buildContractClass, Bytes, num2bin, PubKey, Ripemd160, toHex } from "scryptlib/dist";
import { SuperAssetNFTMinFee } from "./contracts/SuperAssetNFTMinFee";
import { SigningService } from "./SigningService";
import { SuperAssetFeeBurner } from "./contracts/SuperAssetFeeBurner";
import { getFeeBurner, getNameNFT } from "./contracts/ContractBuilder";
import { SuperAssetNFT } from "./contracts/SuperAssetNFT";
import { feeBurnerRefundAmount, feeBurnerSatoshis } from "./Constants";
import { MaxClaimFeeExceededError } from "./errors/Errors";
import { NFT } from "./NFT";
import { NFTInterface } from "./interfaces/NFT/NFT.interface";

export class Name implements NameInterface {
    private initialized = false;                        // Whether it is initialized
    private nameString = '';                            // Name string this name object represents
    private nameInfo: NameInfo | null = null;           // Name record information 
    private nftPtr: string | null = null;               // The NFT pointer
    private claimTx: string | null = null;              // Claim tx for the name token
    private rootTx: any | null = null;                  // Root tx for BNS
    private rawtxIndexForClaim: number = 0;             // The raw tx index for the claim tx in the rawtxs array
    //private nameNFT: NFTInterface | null = null;        // The name NFT if it exists
    public isClaimNFTSpent = false;
    public ownerAddress: BitcoinAddress | null = null;
    public rawtxs: string[] = [];
    public expectedRoot: string = '';

    constructor(private opts?: { testnet: boolean }, private bnsOutputRipemd160?: string) {
        this.bnsOutputRipemd160 = this.bnsOutputRipemd160 ? this.bnsOutputRipemd160 : 'b3b582b4ae134d329c99ef665b7e31b226892a17';
    }

    async init(rawtxs: string[], expectedRoot?: string) {
        this.rawtxs = rawtxs ? rawtxs : [];
        this.expectedRoot = expectedRoot ? expectedRoot : '';

        if (!rawtxs) {
            throw new ParameterMissingError();
        }

        if (rawtxs.length === 0) {
            throw new ParameterListEmptyError();
        }

        if (!expectedRoot) {
            throw new ParameterExpectedRootEmptyError();
        }

        this.rootTx = new bsv.Transaction(rawtxs[0]);
        if (!this.rootTx) {
            throw new ParameterExpectedRootEmptyError();
        }

        const calculatedRoot = this.rootTx.hash;
        if (expectedRoot !== calculatedRoot) {
            throw new ParameterExpectedRootMismatchError();
        }
        // Make sure the first output is a BNS output of a known hash type
        const outputHash = bsv2.Hash.ripemd160(this.rootTx.outputs[0].script.toBuffer()).toString('hex');
        if (this.bnsOutputRipemd160 !== outputHash) {
            throw new RootOutputHashMismatchError();
        }
        this.expectedRoot = calculatedRoot;
        const treeProcessor: TreeProcessorInterface = new TreeProcessor();
        const result: PrefixParseResult = await treeProcessor.validatePrefixTree(rawtxs);
        this.rawtxIndexForClaim = result.rawtxIndexForClaim;
        await this.validateBuildRecords();
        this.nameString = result.nameString;
        // this.nameNFT = await NFT.createNFT(this.rawtxs, this.isTestnet());
        this.initialized = true;
    }

    private async validateBuildRecords() {
        const rawtxs = this.rawtxs.slice(this.rawtxIndexForClaim);
        const mintTx = bsv2.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const assetTxId = (await mintTx.hash()).toString('hex')
        const assetId = assetTxId + '00000000';
        let prefixMap = {};
        prefixMap[`${assetId}`] = mintTx;
        this.claimTx = mintTx.toHex();
        /*
        let prevTx = mintTx;
        let address;
        if (this.opts?.testnet) {
            address = new bsv2.Address.Testnet();
            address.versionByteNum = bsv2.Constants.Testnet.Address.pubKeyHash;
        } else {
            address = new bsv2.Address();
        }
        this.ownerAddress = new BitcoinAddress(address.fromPubKeyHashBuf(prevTx.txOuts[0].script.chunks[1].buf));
        for (let i = 1; i < rawtxs.length; i++) {
            const tx = bsv2.Tx.fromBuffer(Buffer.from(rawtxs[i], 'hex'));
            const txId = (await tx.hash()).toString('hex');

            console.log('tx', tx);
            const { prevOutpoint, outputIndex, prevTxId } = prevOutpointFromTxIn(tx.txIns[0]);
            // Enforce that each spend in the chain spends something from before
            if (!prefixMap[prevOutpoint]) {
                throw new NFTChainError();
            }
            // Look for records for building the zone records
            // Clear off the map to ensure a rawtx must spend directly of it's parent NFT output
            prefixMap = {};
            prefixMap[txId + '00000000'] = true;
            prevTx = tx;
            this.isClaimNFTSpent = true; // There was at least one spend therefore it is claimed
            this.ownerAddress = new BitcoinAddress(address.fromPubKeyHashBuf(prevTx.txOuts[0].script.chunks[1].buf));
        }*/
    }

    /**
     * Helper callback method to be able to test and swap out implementations of signing of a claim input
     * 
     * @param prefixRawtxs Prefix rawtxs
     * @param rawtx Rawtx to sign
     * @param script Input script to sign
     * @param satoshis Satoshis of the input
     * @param inputIndex Index of the input
     * @param sighashType Sighash type to sign with. Usually SIGHASH_ALL for this type of tx
     * @returns 
     */
    public async callbackSignClaimInput(prefixRawtxs: string[], rawtx: string, script: string, satoshis: number, inputIndex: number, sighashType: number, isRemote = true): Promise<any> {
        const signingService = new SigningService();
        const sig = await signingService.signTx(prefixRawtxs, rawtx, script, satoshis, inputIndex, sighashType, isRemote);
        return sig;
    }
    public async claim(
        key: string | bsv.PrivateKey,
        fundingKey: string | bsv.PrivateKey,
        opts: {
            maxClaimFee?: number,
            callback?: (prefixRawtxs: string[], rawtx: string, script: string, satoshis: number, inputIndex: number, sighashType: number) => any,
            isRemote?: boolean
        }): Promise<any> {

        let options = {
            maxClaimFee: 0,
            callback: this.callbackSignClaimInput,
            isRemote: true
        }
        if (opts) {
            options = Object.assign({}, options, opts);
        }
        console.log('running with options', options);

        this.ensureInit();
        if (this.isClaimed()) {
            throw new Error('Name already claimed')
        }
        let privateKey = key;
        if (typeof key === 'string' || key instanceof String) {
            privateKey = new bsv.PrivateKey.fromWIF(key);
        }
        let privateKeyFunding = fundingKey;
        if (typeof fundingKey === 'string' || fundingKey instanceof String) {
            privateKeyFunding = new bsv.PrivateKey.fromWIF(fundingKey);
        }
        const claimInfo = await Resolver.getNameClaimFee(this.nameString);        
        console.log('claimInfo', claimInfo);

        if (options.maxClaimFee && claimInfo.claimFee > options.maxClaimFee) {
            throw new MaxClaimFeeExceededError('Cannot claim because max')
        }
 
        // Get a UTXO to create the claim TX, require at least 10,000 satoshis.
        const bitcoinAddressFunding = new BitcoinAddress(privateKeyFunding.toAddress());
        const utxos = await Resolver.fetchUtxos(bitcoinAddressFunding.toString());
        // Construct the claim transaction which includes the name token and a fee burner token
        const SuperAssetNFTMinFeeClass = buildContractClass(SuperAssetNFTMinFee());
        const publicKey = privateKey.publicKey
        const publicKeyHash = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer())
        const Signature = bsv.crypto.Signature;
        const sighashTypeSingle = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_SINGLE | Signature.SIGHASH_FORKID;
        const sighashTypeAll = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
        const claimTxObject = new bsv.Transaction(this.claimTx);
        const feeBurnerHex = getFeeBurner().lockingScript.toHex();
        const feeBurnerOutputHex = createOutputFromSatoshisAndHex(10000, feeBurnerHex);
        const feeOutputHash160 = bsv.crypto.Hash.ripemd160(Buffer.from(feeBurnerOutputHex, 'hex')).toString('hex');
        // Only hash the part after the parameters (last one is the pkh)
        const firstOutputScript = this.rootTx.outputs[0].script;
        const lockingScriptHashedPartHex = getNameNFT(firstOutputScript.chunks[2].buf.toString('hex')).lockingScript.toHex().substring((1 + 36 + 1 + 20) * 2);
        const nameOutputHash160 = bsv.crypto.Hash.ripemd160(Buffer.from(lockingScriptHashedPartHex, 'hex')).toString('hex');
        const claimNftMinFee = new SuperAssetNFTMinFeeClass(
            new Bytes(claimTxObject.hash + '00000000'),
            new Ripemd160(toHex(publicKeyHash)),
            new Bytes(nameOutputHash160),
            new Bytes(feeOutputHash160));

        const asmVarsAll = {
            'Tx.checkPreimageOpt_.sigHashType':
                sighashType2Hex(sighashTypeAll)
        };
        claimNftMinFee.replaceAsmVars(asmVarsAll);
        // Add claim as input
        const transferTx = new bsv.Transaction();
        const savedSetInputScript = bsv.Transaction.prototype.setInputScript;
        async function asyncMapForEach(theMap, callback) {
            const keys = theMap.keys();
            for (const [key, value] of theMap.entries()) {
                await callback(value, key, theMap);
            }
        }
        // Patch the setInputScript to be able to accept an awaitable function
        // Useful for making remote API calls for the signature
        bsv.Transaction.prototype.setInputScript = async function (inputIndex, unlockScriptOrCallback: any) {
            if (unlockScriptOrCallback instanceof Function) {
                const sc = await unlockScriptOrCallback(this, this.inputs[inputIndex].output);
                this.unlockScriptCallbackMap.set(inputIndex, unlockScriptOrCallback);
                this.inputs[inputIndex].setScript(sc)
            } else {
                this.inputs[inputIndex].setScript(unlockScriptOrCallback)
            }
            this._updateChangeOutput()
            return this;
        }
        const savedSeal = bsv.Transaction.prototype.seal;
        bsv.Transaction.prototype.seal = async function () {
            const self = this;
            this.outputCallbackMap.forEach(function (outputCallback, key) {
                self.outputs[key] = outputCallback(self)
            })
            await asyncMapForEach(this.unlockScriptCallbackMap, async (unlockScriptCallback, key) => {
                self.inputs[key].setScript(await unlockScriptCallback(self, self.inputs[key].output))
            });
            if (this._privateKey) {
                this.sign(this._privateKey, this._sigType)
            }
            this.isSeal = true;
            return this;
        }

        transferTx.FEE_PER_KB = 800;

        // Construct the NFT to morph into, according to allowed nameNftHash
        const assetId = Buffer.from(claimTxObject.hash, 'hex').reverse().toString('hex') + '00000000';
        const SuperAssetNFTClass = buildContractClass(SuperAssetNFT());
        const superAssetNFT = new SuperAssetNFTClass(
            new Bytes(assetId),
            new Ripemd160(toHex(publicKeyHash))
        );
        const asmVarsSingle = {
            'Tx.checkPreimageOpt_.sigHashType':
                sighashType2Hex(sighashTypeSingle)
        };
        superAssetNFT.replaceAsmVars(asmVarsSingle);
        // Construct the fee burner and allocate the required satoshis
        const SuperAssetFeeBurnerClass = buildContractClass(SuperAssetFeeBurner());
        const superAssetFeeBurner = new SuperAssetFeeBurnerClass(feeBurnerRefundAmount);
        superAssetFeeBurner.replaceAsmVars(asmVarsAll);

        console.log('claimTxObject', claimTxObject, utxos);
        transferTx.addInput(new bsv.Transaction.Input({
            prevTxId: claimTxObject.hash,
            outputIndex: 0,
            script: new bsv.Script(), // placeholder
            output: claimTxObject.outputs[0],
        }))
            .from(utxos)
            .setOutput(0, (tx) => {
                return new bsv.Transaction.Output({
                    script: superAssetNFT.lockingScript,
                    satoshis: claimTxObject.outputs[0].satoshis,
                });
            })
            .setOutput(1, (tx) => {
                return new bsv.Transaction.Output({
                    script: superAssetFeeBurner.lockingScript,
                    satoshis: feeBurnerSatoshis,
                })
            })
        // If there is a claim fee, then ensure that it is attached as an output
        transferTx.setOutput(2, (tx) => {
            return new bsv.Transaction.Output({
                script: bsv.Script.fromASM(BitcoinAddress.fromString(claimInfo.claimFeeAddress).toP2PKH()),
                satoshis: claimInfo.claimFee
            })
        })
        transferTx.change(bitcoinAddressFunding.toString())

        await transferTx.setInputScript(0, async (tx, output) => {
            const receiveAddressWithSize = new Bytes('14' + privateKey.toAddress().toHex().substring(2));
            const outputSizeWithLength = (superAssetNFT.lockingScript.toHex().length / 2).toString(16);
            const outputSatsWithSize = new Bytes(num2bin(claimTxObject.outputs[0].satoshis, 8) + `${outputSizeWithLength}24`);
            const preimage = generatePreimage(true, transferTx, claimTxObject.outputs[0].script, claimTxObject.outputs[0].satoshis, sighashTypeAll);
            
            const claimFeeScriptHex = transferTx.outputs[2].script.toHex();
            const claimFeeOutput = num2bin(transferTx.outputs[2].satoshis, 8) + num2bin(claimFeeScriptHex.length / 2, 1) + claimFeeScriptHex;

            const changeScriptHex = transferTx.outputs[3].script.toHex();
            const changeOutput = num2bin(transferTx.outputs[3].satoshis, 8) + num2bin(changeScriptHex.length / 2, 1) + changeScriptHex;
            const extraOutputs = claimFeeOutput + changeOutput;

            const sig = await options.callback(this.rawtxs, transferTx.toString(), claimTxObject.outputs[0].script, claimTxObject.outputs[0].satoshis, 0, sighashTypeAll, options.isRemote);
            console.log('preimage', preimage);
            console.log('outputSatsWithSize', outputSatsWithSize);
            console.log('receiveAddressWithSize', receiveAddressWithSize);
            console.log('sig', sig);
            console.log('publicKey', publicKey);
            console.log('lockingScriptHashedPartHex', lockingScriptHashedPartHex);
            console.log('feeBurnerOutputHex', feeBurnerOutputHex);
            console.log('changeOutput', changeOutput);
            console.log('extraOutputs', extraOutputs);
            const unlockScript = claimNftMinFee.unlock(
                preimage,
                outputSatsWithSize,
                receiveAddressWithSize,
                sig,
                new PubKey(toHex(publicKey)),
                new Bytes(lockingScriptHashedPartHex),
                new Bytes(feeBurnerOutputHex),
                new Bytes(extraOutputs)  
            ).toScript();
            return unlockScript;
        });
        transferTx.sign(privateKeyFunding)
        await transferTx.seal();
        // Restore the set input script
        bsv.Transaction.prototype.setInputScript = savedSetInputScript
        bsv.Transaction.prototype.seal = savedSeal;
        // Broadcast a spend of the fee burner token, paying back the reimbursement to the address
        const txid = await Resolver.sendTx(transferTx);
        // Add the rawtx to the list
        this.rawtxs.push(transferTx.toString());
         //await this.validateBuildRecords();
        // this.nameNFT?.processTx(transferTx.toString());
        return {
            success: true,
            txid,
            rawtx: transferTx.toString(),
           // nameNFT: this.nameNFT
        };
    }

    public getRawtxs(): string[] {
        this.ensureInit();
        return this.rawtxs;
    }

    public getClaimTx(): string {
        this.ensureInit();
        return this.rawtxs[this.rawtxIndexForClaim];
    }

    public isClaimed(): boolean {
        this.ensureInit();
        return this.isClaimNFTSpent;
    }

    public getRoot(): string {
        this.ensureInit();
        return this.expectedRoot;
    }

    public getNameString(): string {
        this.ensureInit();
        return this.nameString;
    }

    public getOwner(): BitcoinAddress | null {
        this.ensureInit();
        return this.ownerAddress;
    }

    public async setOwner(address: BitcoinAddress): Promise<OpResult> {
        this.ensureInit();
        return {
            success: false
        }
    }

    public getNameInfo(): NameInfo | null {
        this.ensureInit();
        return this.nameInfo;
    }

    public async updateRecords(records: Array<{ type: string, name: string, value: string, ttl?: number }>): Promise<OpResult> {
        this.ensureInit();
        return {
            success: false
        }
    }

    public async getAddress(coinSymbol: string): Promise<string> {
        this.ensureInit();
        return '';
    }

    private ensureInit() {
        if (!this.initialized) {
            throw new NotInitError();
        }
    }

    public isTestnet(): boolean {
        return this.opts ? this.opts.testnet : false;
    }
}
