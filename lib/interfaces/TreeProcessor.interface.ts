
import { PrefixParseResult } from "./PrefixParseResult.interface";
import { RequiredTransactionPartialResult } from "./RequiredTransactionPartialResult.interface";

export interface TreeProcessorInterface { 
    // Parse rawtxs to get the prefix tree represented
    validatePrefixTree: (rawtxs: string[]) => Promise<PrefixParseResult>;
    // Get the next required transaction partial to fulfil the name
    // Note: call multiple times to consruct the full name after each broadcast
    getRequiredTransactionPartial: (name: string, rawtxs: string[]) => Promise<RequiredTransactionPartialResult>;
}
