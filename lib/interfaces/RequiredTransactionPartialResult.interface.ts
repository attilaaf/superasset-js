import * as bsv from 'bsv';
export interface RequiredTransactionPartialResult {   
    success: boolean; 
    fulfilledName: string;
    requiredTx: bsv.Tx;
}