import * as bsv from 'bsv';

export interface ExtensionOutputData { 
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
    script: bsv.Script
}
