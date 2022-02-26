import * as bsv from 'bsv';
import { BnsContractConfig } from './BnsContractConfig.interface';
import { BnsTxInterface } from './BnsTx.interface';
import { ExtensionOutputData } from './ExtensionOutputData.interface';
export interface RequiredTransactionPartialResult {   
    success: boolean; 
    prevOutput: ExtensionOutputData;
    bnsContractConfig: BnsContractConfig;
    fulfilledName: string;
    nextMissingChar: string;
    requiredBnsTx: BnsTxInterface;
    prevTx: bsv.Tx;
}