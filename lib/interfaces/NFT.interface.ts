 
import * as bsv from 'bsv';
import { BitcoinAddress } from '../BitcoinAddress';
import { MintInfo } from "./MintInfo.interface";
import { OpResult } from './OpResult.interface';
import { Records } from './Record.interface';
 
export interface NFTInterface {
    // The current owner of the name UTXO
    getOwner: () => BitcoinAddress | null;
    // Set the new owner of the name UTXO (transfer)
    setOwner: (address: BitcoinAddress, fundingKey: string | bsv.PrivateKey) => Promise<OpResult>;
    // Get all mint info
    getMintInfo: () => MintInfo | null;
    // Update records
    update: (records: Array<{ type: string, name: string, value: string, action?: 'set' | 'delete' }>) => Promise<OpResult>;
    // Get the records
    getRecords: () => Records;
    // Asset ID
    getAssetId: () => string;
    // Mint Txid ID
    getMintTxId: () => string;
    // Get the original rawtxs
    getRawtxs: () => string[]
    // Get the latest UTXO 
    getUTXO: () => { txId: string, outputIndex: number, script: string, satoshis: number }
}
