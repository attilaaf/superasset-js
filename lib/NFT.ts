import { BitcoinAddress } from "./BitcoinAddress";
import { OpResult } from "./interfaces/OpResult.interface";
import { Record, Records } from "./interfaces/Record.interface";
import * as bsv2 from 'bsv2';
import { buildAssetFromTxIdOutputIndex, generatePreimage, intToLE, prevOutpointFromTxIn, sighashTypeAll, sighashTypeSingle } from "./Helpers";
import { Bool, bsv, Bytes, num2bin, PubKey, signTx, toHex } from "scryptlib/dist";
import { NFTInterface } from "./interfaces/NFT.interface";
import { MintInfo } from "./interfaces/MintInfo.interface";
import { InvalidArgumentError, InvalidChainError, InvalidP2NFTPKHError, NotInitError } from "./Errors";
import { NFTDeployOptsInterface } from "./interfaces/NFTDeployOpts.interface";
import { Resolver } from "./Resolver";
import { getNFT } from "./contracts/ContractBuilder";
import { NFTMintOptsInterface } from "./interfaces/NFTMintOpts.interface";

export class NFT implements NFTInterface {
    private initialized = false;
    private mintInfo: MintInfo | null = null;
    private mintTxId: string;
    private assetId: string;
    private isMinted: boolean = false;
    private constructor(private rawtxs: string[], private ownerAddress: BitcoinAddress, private initialOutputIndex: number, private deployDatas: string[]) {
        if (!rawtxs || !rawtxs.length) {
            throw new Error('Invalid rawtxs');
        }
        const parsedTx = new bsv.Transaction(rawtxs[0]);
        this.mintTxId = parsedTx.hash;
        this.assetId = Buffer.from(this.mintTxId, 'hex').reverse().toString('hex') + intToLE(this.initialOutputIndex);
        // If at least 1 rawtx was spent, then we know it was minted.
        if (rawtxs.length >= 2) {
            this.isMinted = true;
        }
        this.initialized = true;
    }

    public getOwner(): BitcoinAddress | null {
        this.ensureInit();
        return this.ownerAddress;
    }

    public async setOwner(address: string): Promise<OpResult> {
        this.ensureInit();
        return {
            success: false
        }
    }

    public getMintInfo(): MintInfo | null {
        this.ensureInit();
        return this.mintInfo;
    }

    public getDeployDatas(encoding: 'hex' | 'utf8' | any = 'hex'): string[] {
        this.ensureInit();
        const hexDecoded: any[] = [];
        if (!encoding) {
            encoding = 'hex'
        }
        for (const data of this.deployDatas) {
            hexDecoded.push(Buffer.from(data, 'hex').toString(encoding));
        }
        return hexDecoded;
    }

    public async update(records: Array<{ type: string, name: string, value: string }>): Promise<OpResult> {
        this.ensureInit();
        return {
            success: false
        }
    }

    public getAssetId(): string {
        return this.assetId;
    }

    public getMintTxId(): string {
        return this.mintTxId;
    }

    public getRecords(): Records {
        return {};
    }

    public getUTXO(): { txId: string, outputIndex: number, script: string, satoshis: number } {
        const utxo = { txId: 'xx', outputIndex: 0, script: 'aa', satoshis: 1 };
        return utxo
    }

    public getRawtxs(): string[] {
        this.ensureInit();
        return this.rawtxs;
    }

    public getClaimTx(): string {
        this.ensureInit();
        return this.rawtxs[0];
    }

    async init(rawtxs: string[]) {
        if (!rawtxs || !rawtxs.length) {
            throw new Error();
        }
        this.rawtxs = rawtxs;
        this.initialized = true;
    }

    public async mint(opts: NFTMintOptsInterface, currentOwnerPrivateKey: bsv.PrivateKey, firstOwner: string, satoshis: number = 1, dataOuts: string[] = []): Promise<{ txid: string, rawtx: string }> {
        if (typeof firstOwner !== 'string') {
            throw new InvalidArgumentError();
        }
        if (this.rawtxs.length !== 1) {
            console.log('Cannot mint if it was not deployed');
            throw new InvalidArgumentError();
        }
        const mintTx = new bsv.Transaction(this.rawtxs[0]);
        const options = Object.assign({}, {
            isTestnet: false,
            sendTx: Resolver.sendTx,
            fetchUtxos: Resolver.fetchUtxos
        }, opts);
        const addressString = options.fundingPrivateKey.toAddress().toString();
        const fundingAddress = BitcoinAddress.fromString(addressString);
        const firstOwnerAddress = BitcoinAddress.fromString(firstOwner);
        const utxos = await options.fetchUtxos(fundingAddress.toString())
        const tx = new bsv.Transaction();
        console.log('nftClass ctor', firstOwnerAddress.toHash160Bytes(), buildAssetFromTxIdOutputIndex(mintTx.hash, this.initialOutputIndex));
        const nftClass = getNFT(firstOwnerAddress.toHash160Bytes(), buildAssetFromTxIdOutputIndex(mintTx.hash, this.initialOutputIndex));
        console.log('nftClass', nftClass.lockingScript.toASM());
        tx.addInput(new bsv.Transaction.Input({
            prevTxId: mintTx.hash,
            outputIndex: this.initialOutputIndex,
            script: new bsv.Script(), // placeholder
            output: mintTx.outputs[this.initialOutputIndex]
        }));
        tx.from(utxos);
        tx.addOutput(new bsv.Transaction.Output({
            script: nftClass.lockingScript,
            satoshis,
        }))
        if (dataOuts) {
            for (let i = 0; i < dataOuts.length; i++) {
                tx.addOutput(new bsv.Transaction.Output({
                    script: bsv.Script.fromASM('OP_FALSE OP_RETURN ' + Buffer.from(dataOuts[i], 'utf8').toString('hex')),
                    satoshis: 0
                }))
            }
        }
        tx.change(addressString)
        tx.setInputScript(0, (theTx, output) => {
            console.log('setInputScript')
            const receiveAddressWithSize = new Bytes('14' + firstOwnerAddress.toHash160Bytes());
            const newLockingScript = nftClass.lockingScript;
            const outputSizeWithLength = (newLockingScript.toHex().length / 2).toString(16);
            const outputSatsWithSize = new Bytes(num2bin(satoshis, 8) + `${outputSizeWithLength}24`);
            const preimage = generatePreimage(true, tx, mintTx.outputs[this.initialOutputIndex].script, mintTx.outputs[this.initialOutputIndex].satoshis, sighashTypeSingle);
            const sig = signTx(tx, currentOwnerPrivateKey, mintTx.outputs[this.initialOutputIndex].script, mintTx.outputs[this.initialOutputIndex].satoshis, output.outputIndex, sighashTypeSingle);
            console.log('output.script', output.script.toASM(), output.script.toHex());
            console.log('preimage', preimage);
            console.log('outputSatsWithSize', outputSatsWithSize);
            console.log('receiveAddressWithSize', receiveAddressWithSize);
            console.log('sig', sig);
            console.log('currentOwnerPrivateKey.publicKey', toHex(currentOwnerPrivateKey.publicKey));
            const unlockScript = nftClass.unlock(
                preimage,
                outputSatsWithSize,
                receiveAddressWithSize,
                new Bool(false),
                sig,
                new PubKey(toHex(currentOwnerPrivateKey.publicKey))
            ).toScript();
            console.log('log input script', unlockScript.toHex());
            return unlockScript;
        });
        console.log('right before SIGNING');
        tx.sign(options.fundingPrivateKey);
        tx.seal();
        console.log('right before send');
        const txid = await options.sendTx(tx);
        const nfts: NFTInterface[] = [];
        console.log('sendResult', txid, nfts);
        return {
            txid,
            rawtx: tx.toString()
        };
    }

    static async deploy(opts: NFTDeployOptsInterface, mintAddress: any, satoshis: number, editions: number, dataOuts: string[]): Promise<{ txid: string, nfts: NFTInterface[] }> {
        if (typeof mintAddress !== 'string') {
            throw new InvalidArgumentError();
        }
        const options = Object.assign({}, {
            isTestnet: false,
            sendTx: Resolver.sendTx,
            fetchUtxos: Resolver.fetchUtxos
        }, opts);
        const addressString = options.fundingPrivateKey.toAddress().toString();
        const fundingAddress = BitcoinAddress.fromString(addressString);
        const expectedMintAddress = BitcoinAddress.fromString(mintAddress);
        const utxos = await options.fetchUtxos(fundingAddress.toString())
        const tx = new bsv.Transaction()
        tx.from(utxos);
        for (let i = 0; i < editions; i++) {
            tx.addOutput(new bsv.Transaction.Output({
                script: getNFT(expectedMintAddress.toHash160Bytes()).lockingScript,
                satoshis
            }))
        }
        if (dataOuts) {
            for (let i = 0; i < dataOuts.length; i++) {
                tx.addOutput(new bsv.Transaction.Output({
                    script: bsv.Script.fromASM('OP_FALSE OP_RETURN ' + Buffer.from(dataOuts[i], 'utf8').toString('hex')),
                    satoshis: 0
                }))
            }
        }
        tx.change(addressString).sign(options.fundingPrivateKey)
        const txid = await options.sendTx(tx);

        const nfts: NFTInterface[] = [];
        for (let i = 0; i < editions; i++) {
            const nft = await NFT.fromTransactions([tx.toString()], i, options.isTestnet)
            nfts.push(nft);
        }

        console.log('sendResult', txid, nfts);
        return {
            txid,
            nfts
        };
    }

    static getOpReturnOutputDatas(tx: bsv.Transaction): string[] {
        const deployDatas: string[] = [];
        for (let i = 0; i < tx.outputs.length; i++) {
            if (tx.outputs[i].script.chunks[0] && tx.outputs[i].script.chunks[0].opcodenum === 0 &&
                tx.outputs[i].script.chunks[1] && tx.outputs[i].script.chunks[1].opcodenum === 106 &&
                tx.outputs[i].script.chunks[2] && tx.outputs[i].script.chunks[2].buf) {
                const potentialOpReturn = tx.outputs[i].script.chunks[2].buf.toString('hex');
                deployDatas.push(potentialOpReturn);
            }
        }
        return deployDatas
    }

    static async fromTransactions(rawtxs: string[], initialOutputIndex = 0, isTestnet = false): Promise<NFT> {
        if (!rawtxs || !rawtxs.length) {
            throw new InvalidArgumentError();
        }
        const mintTx = new bsv.Transaction(rawtxs[0]);
        const deployDatas: string[] = NFT.getOpReturnOutputDatas(mintTx);
        if (!NFT.isP2NFTPKH(mintTx, initialOutputIndex)) {
            throw new InvalidP2NFTPKHError();
        }
        const assetIdHex = mintTx.outputs[initialOutputIndex].script.chunks[0].buf.toString('hex');
        const addressHex = mintTx.outputs[initialOutputIndex].script.chunks[1].buf.toString('hex');
        if (assetIdHex !== '000000000000000000000000000000000000000000000000000000000000000000000000') {
            throw new InvalidArgumentError();
        }
        const assetId = Buffer.from(mintTx.hash, 'hex').reverse().toString('hex') + intToLE(initialOutputIndex);
        let prefixMap = {};
        prefixMap[`${assetId}`] = true;
        let address;
        if (isTestnet) {
            address = new bsv2.Address.Testnet();
            address.versionByteNum = bsv2.Constants.Testnet.Address.pubKeyHash;
        } else {
            address = new bsv2.Address();
        }
        let kvData: { [key: string]: any } = {};
        let ownerAddress = BitcoinAddress.fromHash160Buf(mintTx.outputs[initialOutputIndex].script.chunks[1].buf, isTestnet);
        for (let i = 1; i < rawtxs.length; i++) {
            const processResult: { ownerAddress, kvData, prefixMap } = await NFT.processTxIteration(prefixMap, rawtxs[i], kvData, isTestnet);
            ownerAddress = processResult.ownerAddress;
            kvData = processResult.kvData;
            prefixMap = processResult.prefixMap;
        }
        return new NFT(rawtxs, ownerAddress, initialOutputIndex, deployDatas);
    }

    static async processTxIteration(prefixMap: { [key: string]: any }, rawtx: string, kvData: { [key: string]: any }, isTestnet = false) {
        const tx = new bsv.Transaction(rawtx);
        const txId = tx.hash;
        if (!NFT.isP2NFTPKH(tx, 0)) {
            throw new InvalidP2NFTPKHError();
        }
        const { prevOutpoint, outputIndex, prevTxId } = prevOutpointFromTxIn(tx.inputs[0]);
        // Enforce that each spend in the chain spends something from before
        if (!prefixMap[prevOutpoint]) {
            throw new InvalidChainError();
        }
        let address;
        if (isTestnet) {
            address = new bsv2.Address.Testnet();
            address.versionByteNum = bsv2.Constants.Testnet.Address.pubKeyHash;
        } else {
            address = new bsv2.Address();
        }
        prefixMap = {};
        const reverseTxId = Buffer.from(txId, 'hex').reverse().toString('hex');
        prefixMap[reverseTxId + intToLE(outputIndex)] = true;
        return {
            ownerAddress: new BitcoinAddress(address.fromPubKeyHashBuf(tx.outputs[outputIndex].script.chunks[1].buf)),
            kvData: kvData,
            prefixMap
        };
    }

    static isP2NFTPKH(tx: bsv.Transaction, outputIndex = 0): boolean {

        if (!tx || !tx.outputs ||
            tx.outputs.length < (outputIndex + 1) ||
            !tx.outputs[outputIndex] ||
            !tx.outputs[outputIndex].script ||
            !tx.outputs[outputIndex].script.chunks ||
            tx.outputs[outputIndex].script.chunks.length < 2 ||
            !tx.outputs[outputIndex].script.chunks[0].buf ||
            !tx.outputs[outputIndex].script.chunks[1].buf) {
            return false;
        }
        const assetIdHex = tx.outputs[outputIndex].script.chunks[0].buf.toString('hex');
        const addressHex = tx.outputs[outputIndex].script.chunks[1].buf.toString('hex');
        if (assetIdHex.length === 72 && addressHex.length === 40) {
            return true;
        }
        return false;
    }
    private ensureInit() {
        if (!this.initialized) {
            throw new NotInitError();
        }
    }
}
