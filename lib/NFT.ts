import { BitcoinAddress } from "./BitcoinAddress";
import { InvalidNFTTxError } from "./errors/Errors";
import { InvalidNameTransactionsError } from "./errors/InvalidNameTransactionsError";
import { NotInitError } from "./errors/NotInitError";
import { MintInfo } from "./interfaces/NFT/MintInfo.interface";
import { NFTInterface } from "./interfaces/NFT/NFT.interface";
import { NFTTxInterface } from "./interfaces/NFT/NFTTx.interface";
import { OpResult } from "./interfaces/OpResult.interface";
import { Record, Records } from "./interfaces/Record.interface.ts";
import * as bsv2 from 'bsv2';
import { NFTChainError } from "./errors/NFTChainError";
import { prevOutpointFromTxIn } from "./Helpers";
import { bsv } from "scryptlib/dist";

export class NFT implements NFTInterface {
    private initialized = false;
    private mintInfo: MintInfo | null = null;

    private constructor(private rawtxs: string[], private ownerAddress: BitcoinAddress, private assetId: string, private mintTxId: string) {
        if (!rawtxs || !rawtxs.length) {
            throw new Error('Invalid rawtxs');
        }
        // this.mintInfo = NFT.parseMintInfo(rawtxs[0]);
        //  this.asseId = mintInfo.asseId;
        // const parsedTx: NFTTxInterface = NFT.parseTx(rawtxs[rawtxs.length - 1]);
        // this.ownerAddress = parsedTx.ownerAddress;
        this.initialized = true;
    }

    static parseTx(rawtx: string): NFTTxInterface | null {

        return null;
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

    public getMintInfo(): MintInfo | null {
        this.ensureInit();
        return this.mintInfo;
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

    public processTx(rawtx: string) {
        const tx = new bsv.Transaction(rawtx);
    }

    async init(rawtxs: string[]) {
        if (!rawtxs || !rawtxs.length) {
            throw new InvalidNameTransactionsError();
        }
        this.rawtxs = rawtxs;
        // const treeProcessor: TreeProcessorInterface = new TreeProcessor();
        //  const result: PrefixParseResult = await treeProcessor.validatePrefixTree(rawtxs);
        //  await this.validateBuildRecords();
        this.initialized = true;
    }

    static async createNFT(rawtxs: string[], isTestnet = false): Promise<NFT> {
        if (!rawtxs || !rawtxs.length) {
            throw new InvalidNFTTxError();
        }
        console.log('rawtxs', rawtxs);
        const mintTx = new bsv.Transaction(rawtxs[0]);

        console.log('mintTx', mintTx);
        if (mintTx.outputs[0].script.chunks[0].buf.length !== 36 || mintTx.outputs[0].script.chunks[1].buf.length !== 20) {
            throw new InvalidNFTTxError();
        }

        const mintTxId = mintTx.hash;
        console.log('mintTxId', mintTxId);
        const assetId = Buffer.from(mintTx.hash, 'hex').reverse().toString('hex') + '00000000';
        
        let prefixMap = {};
        prefixMap[`${assetId}`] = mintTx;
        // this.claimTx = mintTx.toHex();
        let prevTx = mintTx;
        let address;
        if (isTestnet) {
            address = new bsv2.Address.Testnet();
            address.versionByteNum = bsv2.Constants.Testnet.Address.pubKeyHash;
        } else {
            address = new bsv2.Address();
        }

        let ownerAddress = BitcoinAddress.fromHash160Buf(prevTx.outputs[0].script.chunks[1].buf, isTestnet);
        for (let i = 1; i < rawtxs.length; i++) {
            const tx = new bsv.Transaction(rawtxs[i]); // bsv2.Tx.fromBuffer(Buffer.from(rawtxs[i], 'hex'));
            const txId = tx.hash;
            const { prevOutpoint, outputIndex, prevTxId } = prevOutpointFromTxIn(tx.inputs[0]);
            // Enforce that each spend in the chain spends something from before
            console.log('prefixMap', prefixMap, prevOutpoint);
            if (!prefixMap[prevOutpoint]) {
                throw new NFTChainError();
            }
            // Look for records for building the zone records
            // Clear off the map to ensure a rawtx must spend directly of it's parent NFT output
            prefixMap = {};
            prefixMap[txId + '00000000'] = true;
            prevTx = tx;
            ownerAddress = new BitcoinAddress(address.fromPubKeyHashBuf(prevTx.txOuts[0].script.chunks[1].buf));
        }

        return new NFT(rawtxs, ownerAddress, assetId, mintTxId);
    }

    private ensureInit() {
        if (!this.initialized) {
            throw new NotInitError();
        }
    }
}
