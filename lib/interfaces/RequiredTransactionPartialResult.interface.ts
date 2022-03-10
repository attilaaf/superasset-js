import * as bsv2 from 'bsv2';
import { BnsContractConfig } from './BnsContractConfig.interface';
import { BnsTxInterface } from './BnsTx.interface';
import { ExtensionOutputData } from './ExtensionOutputData.interface';
export interface RequiredTransactionPartialResult {   
    success: boolean; 
    prevOutput: ExtensionOutputData;
    bnsContractConfig: BnsContractConfig;
    fulfilledName: string;
    nextMissingCharHex: string;
    nextMissingChar: string;
    requiredBnsTx: BnsTxInterface;
    prevTx: any;
}