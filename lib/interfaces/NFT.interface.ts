 
import * as bsv from 'bsv';
import { String } from 'scryptlib/dist';
import { BitcoinAddress } from '../BitcoinAddress';
import { MintInfo } from "./MintInfo.interface";
import { NFTMintOptsInterface } from './NFTMintOpts.interface';
import { OpResult } from './OpResult.interface';
import { Records } from './Record.interface';
 
export interface NFTInterface {
    // The current owner of the name UTXO
    getOwner: () => BitcoinAddress | null;
    // Set the new owner of the name UTXO (transfer)
    setOwner: (address: string, fundingKey: string | bsv.PrivateKey) => Promise<OpResult>;
    // Get all mint info
    getMintInfo: () => MintInfo | null;
    // Get Deploy op return datas
    getDeployDatas: (encoding: 'hex' | 'utf8') => string[];
    // Mint to the first owner
    mint: (opts: NFTMintOptsInterface, firstOwner: string, satoshis: number, dataOuts: string[]) => Promise< {txid: string, rawtx: string}>;
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
