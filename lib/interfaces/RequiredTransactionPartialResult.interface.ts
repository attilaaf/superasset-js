import * as bsv from 'bsv';
export interface RequiredTransactionPartialResult {   
    success: boolean; 
    fulfilledName: string;
    nextMissingChar: string;
    requiredTx: bsv.Tx;
    prevTx: bsv.Tx;
}