import { BitcoinAddress } from "./BitcoinAddress";
import { OpResult } from "./interfaces/OpResult.interface";
import { Record, Records } from "./interfaces/Record.interface";
import * as bsv2 from 'bsv2';
import { prevOutpointFromTxIn } from "./Helpers";
import { bsv } from "scryptlib/dist";
import { NFTInterface } from "./interfaces/NFT.interface";
import { MintInfo } from "./interfaces/MintInfo.interface";
import { InvalidArgumentError, InvalidChainError, InvalidP2NFTPKHError, NotInitError } from "./Errors";

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

    async init(rawtxs: string[]) {
        if (!rawtxs || !rawtxs.length) {
            throw new Error();
        }
        this.rawtxs = rawtxs;
        this.initialized = true;
    }

    static async fromTransactions(rawtxs: string[], isTestnet = false): Promise<NFT> {
        if (!rawtxs || !rawtxs.length) {
            throw new InvalidArgumentError();
        }
        const mintTx = new bsv.Transaction(rawtxs[0]);

        if (!NFT.isP2NFTPKH(mintTx, 0)) {
            throw new InvalidP2NFTPKHError();
        }

        const assetIdHex = mintTx.outputs[0].script.chunks[0].buf.toString('hex');
        const addressHex = mintTx.outputs[0].script.chunks[1].buf.toString('hex');

        if (assetIdHex !== '000000000000000000000000000000000000000000000000000000000000000000000000') {
            throw new InvalidArgumentError();
        }

        const mintTxId = mintTx.hash;
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

            if (!NFT.isP2NFTPKH(tx, 0)) {
                throw new InvalidP2NFTPKHError();
            }

            const reverseTxId = Buffer.from(txId, 'hex').reverse().toString('hex');
            const { prevOutpoint, outputIndex, prevTxId } = prevOutpointFromTxIn(tx.inputs[0]);
            // Enforce that each spend in the chain spends something from before
            if (!prefixMap[prevOutpoint]) {
                throw new InvalidChainError();
            }
            // Look for records for building the zone records
            // Clear off the map to ensure a rawtx must spend directly of it's parent NFT output
            prefixMap = {};
            prefixMap[reverseTxId + '00000000'] = true;
            prevTx = tx;
            ownerAddress = new BitcoinAddress(address.fromPubKeyHashBuf(prevTx.outputs[0].script.chunks[1].buf));
        }

        return new NFT(rawtxs, ownerAddress, assetId, mintTxId);
    }

    static isP2NFTPKH(tx: bsv.Transaction, outputIndex = 0): boolean {
        if (!tx || !tx.outputs || 
            tx.outputs.length < (outputIndex - 1) || 
            !tx.outputs[outputIndex].script || 
            !tx.outputs[outputIndex].script.chunks || 
            tx.outputs[outputIndex].script.length < 2 ||
            !tx.outputs[outputIndex].script.chunks[0].buf  ||
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
