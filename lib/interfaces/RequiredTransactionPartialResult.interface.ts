import * as bsv from 'bsv';
import { ExtensionOutputData } from './ExtensionOutputData.interface';
export interface RequiredTransactionPartialResult {   
    tx: bsv.Transaction;
    fulfilledName: string;
    lastExtensionOutput: ExtensionOutputData | null;
    expectedExtensionOutput: ExtensionOutputData | null;
}