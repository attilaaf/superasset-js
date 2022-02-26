import * as bsv from 'bsv';
import { BnsContractConfig } from './BnsContractConfig.interface';
import { ExtensionOutputData } from './ExtensionOutputData.interface';
export interface RequiredTransactionPartialResult {   
    success: boolean; 
    prevOutput: ExtensionOutputData;
    bnsContractConfig: BnsContractConfig;
    fulfilledName: string;
    nextMissingChar: string;
    requiredTx: bsv.Tx;
    prevTx: bsv.Tx;
}