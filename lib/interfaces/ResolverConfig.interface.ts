import { GetNameTransactionsResult } from "./GetNameTransactionsResult.interface";

export interface ResolverConfigInterface {
    testnet?: string;
    root?: string;
    url?: string;
    debug?: boolean;
    bnsOutputRipemd160?: string;
    processGetNameTransactions?: (name: string, cfg: ResolverConfigInterface) => Promise<GetNameTransactionsResult>;
    processGetSPV?: (txid: string, cfg: ResolverConfigInterface) => Promise<any>
}