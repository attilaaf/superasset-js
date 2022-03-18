import * as bsv from 'bsv';

export interface ExtensionOutputData { 
    outpointHex: string;
    txId: string;
    txIdBuf: Buffer;
    outputIndex: number;
    bnsConstant: string;
    issuerPkh: string;
    claimHash: string;
    dupHash: string;
    currentDimension: number;
    char: string;
    charHex: string;
    script: any;
    satoshis: number;
    tx: bsv.Transaction;
}
