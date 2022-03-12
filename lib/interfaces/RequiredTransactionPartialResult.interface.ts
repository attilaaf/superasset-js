import * as bsv2 from 'bsv2';
import * as bsv from 'bsv';
import { BnsContractConfig } from './BnsContractConfig.interface';
import { BnsTxInterface } from './BnsTx.interface';
import { ExtensionOutputData } from './ExtensionOutputData.interface';
export interface RequiredTransactionPartialResult {   
    tx: bsv.Transaction;
    fulfilledName: string;
    lastExtensionOutput: ExtensionOutputData | null;
    expectedExtensionOutput: ExtensionOutputData | null;
    expectedNextCharHex: string;
   /* prevOutput: ExtensionOutputData;
    bnsContractConfig: BnsContractConfig;
    fulfilledName: string;
    nextMissingCharHex: string;
    nextMissingChar: string;
    requiredBnsTx: BnsTxInterface;
    prevTx: any;*/
}