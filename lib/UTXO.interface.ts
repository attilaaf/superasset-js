export interface UTXO { 
    outputIndex: number;
    satoshis: number;
    txid: string;
    script: string;
}