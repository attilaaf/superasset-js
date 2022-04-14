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
import { PrefixParseResult } from "./interfaces/PrefixParseResult.interface";
import { createOutputFromSatoshisAndHex, generatePreimage, prevOutpointFromTxIn, sighashType2Hex } from "./Helpers";
import { NameInfo } from "./interfaces/NameInfo.interface";
import { TreeProcessorInterface } from "./interfaces/TreeProcessor.interface";
import { TreeProcessor } from "./TreeProcessor";
import { Resolver } from "./Resolver";
import { Bool, buildContractClass, Bytes, num2bin, PubKey, Ripemd160, signTx, toHex } from "scryptlib/dist";
import { SuperAssetNFTMinFee } from "./contracts/SuperAssetNFTMinFee";
import { SigningService } from "./SigningService";
import { SuperAssetFeeBurner } from "./contracts/SuperAssetFeeBurner";
import { getFeeBurner, getNameNFT } from "./contracts/ContractBuilder";
import { SuperAssetNFT } from "./contracts/SuperAssetNFT";
import { feeBurnerRefundAmount, feeBurnerSatoshis } from "./Constants";

export class Name implements NameInterface {
    private initialized = false;                // Whether it is initialized
    private nameString = '';                    // Name string this name object represents
    private nameInfo: NameInfo | null = null;   // Name record information 
    private nftPtr: string | null = null;       // The NFT pointer
    private claimTx: string | null = null;      // Claim tx for the name token
    private rootTx: any | null = null;        // Root tx for BNS
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
        await this.validateBuildRecords(rawtxs.slice(result.rawtxIndexForClaim));
        this.nameString = result.nameString;
        this.initialized = true;
    }

    private async validateBuildRecords(rawtxs: string[]) {
        const mintTx = bsv2.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const assetTxId = (await mintTx.hash()).toString('hex')
        const assetId = assetTxId + '00000000';
        let prefixMap = {};
        prefixMap[`${assetId}`] = mintTx;
        this.claimTx = mintTx.toHex();
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
        }
    }

    /**
     * Helper callback method to be able to test and swap out implementations of signing of a claim input
     * 
     * @param rawtx Rawtx to sign
     * @param script Input script to sign
     * @param satoshis Satoshis of the input
     * @param inputIndex Index of the input
     * @param sighashType Sighash type to sign with. Usually SIGHASH_ALL for this type of tx
     * @returns 
     */
    public async callbackSignClaimInput(rawtx: string, script: string, satoshis: number, inputIndex: number, sighashType: number, isRemote = true): Promise<any> {
        const signingService = new SigningService();
        const sig = await signingService.signTx(rawtx, script, satoshis, inputIndex, sighashType, isRemote);
        return sig;
    }

    public async claim(key: string | bsv.PrivateKey, fundingKey: string | bsv.PrivateKey, callback = this.callbackSignClaimInput, isRemote = true): Promise<any> {
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
        // Get a UTXO to create the claim TX, require at least 10,000 satoshis.
        const bitcoinAddress = new BitcoinAddress(privateKey.toAddress());
        const bitcoinAddressFunding = new BitcoinAddress(privateKeyFunding.toAddress());
        const utxos = await Resolver.fetchUtxos(bitcoinAddressFunding.toString());
        console.log('utxos for ' + bitcoinAddressFunding.toString(), utxos);
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
        console.log('feeOutputHash160 ---:', feeOutputHash160);
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
        transferTx.addInput(new bsv.Transaction.Input({
            prevTxId: claimTxObject.hash,
            outputIndex: 0,
            script: new bsv.Script(), // placeholder
            output: claimTxObject.outputs[0], // prevTx.outputs[outputIndex]
        }));

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


        transferTx.setOutput(0, (tx) => {
            return new bsv.Transaction.Output({
                script: superAssetNFT.lockingScript,
                satoshis: claimTxObject.outputs[0].satoshis,
            });
        })
        const output0 = num2bin(transferTx.outputs[0].satoshis, 8) + (transferTx.outputs[0].script.toHex().length / 2).toString(16) + transferTx.outputs[0].script.toHex();
        console.log('------------ output 0', transferTx.outputs[0].satoshis, transferTx.outputs[0].script.toHex(),
            output0
        )
        // Construct the fee burner and allocate the required satoshis
        const SuperAssetFeeBurnerClass = buildContractClass(SuperAssetFeeBurner());
        const superAssetFeeBurner = new SuperAssetFeeBurnerClass(feeBurnerRefundAmount);
        
        superAssetFeeBurner.replaceAsmVars(asmVarsAll);
        transferTx.setOutput(1, (tx) => {
            return new bsv.Transaction.Output({
                script: superAssetFeeBurner.lockingScript,
                satoshis: feeBurnerSatoshis,
            })
        });

        const output1 = num2bin(transferTx.outputs[1].satoshis, 8) + (transferTx.outputs[1].script.toHex().length / 2).toString(16) + transferTx.outputs[1].script.toHex();
        console.log('------------ output 1', transferTx.outputs[1].satoshis, transferTx.outputs[1].script.toHex(),
            output1
        )
        console.log('transferTx before', transferTx);
        transferTx.from(utxos[0]);
        transferTx.change(bitcoinAddressFunding.toString());

        const output2 =  num2bin(transferTx.outputs[2].satoshis, 8) + (transferTx.outputs[2].script.toHex().length / 2).toString(16) + transferTx.outputs[2].script.toHex();
        console.log('------------ output 2', transferTx.outputs[2].satoshis, transferTx.outputs[2].script.toHex(),
           output2
        )
        const receiveAddressWithSize = new Bytes('14' + privateKey.toAddress().toHex().substring(2));
        console.log('claimNftMinFee.lockingScript', claimNftMinFee.lockingScript, claimNftMinFee.lockingScript.toHex().length);
        console.log('claimTxObject.outputs[0].script', claimTxObject.outputs[0].script, claimTxObject.outputs[0].script.toHex().length);
        const preimage = generatePreimage(true, transferTx, claimTxObject.outputs[0].script, claimTxObject.outputs[0].satoshis, sighashTypeAll);
        const outputSizeWithLength = (superAssetNFT.lockingScript.toHex().length / 2).toString(16); // num2bin(superAssetNFT.lockingScript.toHex().length / 2, 2);
        console.log('outputSizeWithLength', outputSizeWithLength);
        const outputSatsWithSize = new Bytes(num2bin(claimTxObject.outputs[0].satoshis, 8) + `${outputSizeWithLength}24`);
        console.log('preimage', preimage);
        console.log('output.script', claimTxObject.outputs[0].script.toASM());
        console.log('output.satoshis', claimTxObject.outputs[0].satoshis);
        console.log('outputSatsWithSize', outputSatsWithSize);
        console.log('receiveAddressWithBytes', receiveAddressWithSize);
        console.log('publicKey', new PubKey(toHex(publicKey)));
        console.log('nameOutputHash160', nameOutputHash160);
        console.log('feeOutputHash160', feeOutputHash160);
        console.log('lockingScriptHashedPartHex', lockingScriptHashedPartHex);
        console.log('feeBurnerOutputHex', feeBurnerOutputHex);
        console.log('sighashTypeAll', num2bin(sighashTypeAll, 2));
        const changeScriptHex = transferTx.outputs[2].script.toHex();
        console.log('changeScriptHex', changeScriptHex);
        const changeOutput = num2bin(transferTx.outputs[2].satoshis, 8) + num2bin(changeScriptHex.length / 2, 1) + changeScriptHex;
        console.log('callbackInside changeOutput', changeOutput);
        const sig = await callback(transferTx.toString(), claimTxObject.outputs[0].script, claimTxObject.outputs[0].satoshis, 0, sighashTypeAll, isRemote)
        console.log('sig', sig);
        /*
            .setInputScript(0, (tx, output) => {
            const preimage = generatePreimage(true, tx, prevLockingScript, output.satoshis, sighashType);
            // Update prev locking script
            const outputSatsWithSize = new Bytes(num2bin(nftAmount, 8) + `${outputSize}24`);
            console.log('preimage', preimage);
            console.log('output.script', output.script.toASM());
            console.log('output.satoshis', output.satoshis);
            console.log('outputSatsWithSize', outputSatsWithSize);
            console.log('isTransform', new Bool(false));
            console.log('receiveAddress', new Bytes(privateKey.toAddress().toHex().substring(2)));
            console.log('unlock pubKey', new PubKey(toHex(publicKey)));
            const sig = signTx(tx, privateKey, output.script, output.satoshis, 0, sighashType);
            console.log('sig', sig);
            return nft.unlock(preimage, outputSatsWithSize, new Bytes('14' + privateKey.toAddress().toHex().substring(2)), new Bool(false), sig, new PubKey(toHex(publicKey))).toScript()
        })

        */
        const script = claimNftMinFee.unlock(
            preimage,
            outputSatsWithSize,
            new Bytes('14' + privateKey.toAddress().toHex().substring(2)),
            sig,
            new PubKey(toHex(publicKey)),
            new Bytes(lockingScriptHashedPartHex),
            new Bytes(feeBurnerOutputHex),
            new Bytes(changeOutput)
        ).toScript();

        //transferTx.setInputScript(0, script)
        transferTx.setInputScript(0, (tx, output) => {
            const preimage = generatePreimage(true, tx, output.script, output.satoshis, sighashTypeAll);
            // Update prev locking script
            // const outputSatsWithSize = new Bytes(num2bin(claimTxObject.outputs[0].satoshis, 8) + `${outputSize}24`);
            console.log('callbackInside preimage', preimage);
            console.log('callbackInside claimTxObject.outputs[0].script.toHex', claimTxObject.outputs[0].script.toHex());
            console.log('callbackInside output.hex', output.script.toHex());
            console.log('callbackInside output.script', output.script.toASM());
            console.log('callbackInside output.satoshis', output.satoshis);
            console.log('callbackInside outputSatsWithSize', outputSatsWithSize);
            console.log('callbackInside isTransform', new Bool(false));
            console.log('callbackInside receiveAddressWithSize', receiveAddressWithSize);
            console.log('callbackInside unlock pubKey', new PubKey(toHex(publicKey)));
            console.log('callbackInside changeOutput', changeOutput);
            //  const tx = new bsv.Transaction(rawtx);f
            //  console.log('abouto to sign tx', tx);
            // const sig = await signTx(tx, privateKey, lockScript/*lockScript.toASM()*/, lockSatoshis, inputIndex, sighashType);
            // return sig;

            //  const sig = await callback(transferTx.toString(), claimTxObject.outputs[0].script, claimTxObject.outputs[0].satoshis, 0, sighashTypeAll, isRemote)
            //   console.log('sig', sig);
            const sig = signTx(tx, privateKey, output.script, output.satoshis, 0, sighashTypeAll);
            //  const sig = signTx(tx, privateKey, output.script, output.satoshis, 0, sighashTypeAll);
            console.log('callbackInside sig', sig);
            console.log('-----------------');
            console.log('outputSatsWithSize', outputSatsWithSize);
            console.log('this.assetid', assetId);
            console.log('receiveAddressWithSize', receiveAddressWithSize);
            console.log('nameNFT', lockingScriptHashedPartHex);
            console.log('feeBurner', feeBurnerOutputHex);
            console.log('changeOutput', changeOutput);

            console.log('----------------- stiched outputs: ');

            console.log('nameNFT', outputSatsWithSize + assetId + receiveAddressWithSize + lockingScriptHashedPartHex);
            console.log('feeBurner', feeBurnerOutputHex);
            console.log('changeOutput', changeOutput);

            console.log('----------------- actual tx outputs: ');
            console.log('output0', output0);
            console.log('output1', output1);
            console.log('output2', output2);
            console.log('-----------------');
            return claimNftMinFee.unlock(
                preimage,
                outputSatsWithSize,
                receiveAddressWithSize,
                sig,
                new PubKey(toHex(publicKey)),
                new Bytes(lockingScriptHashedPartHex),
                new Bytes(feeBurnerOutputHex),
                new Bytes(changeScriptHex)
            ).toScript()
        })
        .sign(privateKeyFunding);

        console.log('output2modded', num2bin(transferTx.outputs[2].satoshis, 8));

        transferTx
        .seal()
        console.log('Claim TX', JSON.stringify(transferTx), transferTx.toString());
        // Broadcast a spend of the fee burner token, paying back the reimbursement to the address
        const result = await Resolver.sendTx(transferTx);
        console.log('SendTx Reslt', result);
        return true;
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
