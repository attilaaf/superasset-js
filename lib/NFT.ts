import { BitcoinAddress } from "./BitcoinAddress";
import { NotInitError } from "./errors/NotInitError";
import { MintInfo } from "./interfaces/NFT/MintInfo.interface";
import { NFTInterface } from "./interfaces/NFT/NFT.interface";
import { OpResult } from "./interfaces/OpResult.interface";
import { Record, Records } from "./interfaces/Record.interface.ts";

export class NFT implements NFTInterface {
    private assetId;
    private initialized = false;                 
    private mintInfo: MintInfo | null = null;  
    public ownerAddress: BitcoinAddress | null = null;
    public rawtxs: string[] = [];

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

    public getRecords(): Records {
        return {};
    }

    public getUTXO(): { txId: string, outputIndex: number, script: string, satoshis: number } {
        const utxo = { txId: 'xx', outputIndex: 0, script: 'aa', satoshis: 1 };
        return utxo
    }

    public getRawtxs(): string[] {
        return this.rawtxs;
    }

    private ensureInit() {
        if (!this.initialized) {
            throw new NotInitError();
        }
    }
}
