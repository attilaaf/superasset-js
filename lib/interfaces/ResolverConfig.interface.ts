 
export interface ResolverConfigInterface {
    testnet?: string;
    url?: string;
    debug?: boolean;
    fetchTransactions?: (assetId: string, cfg: ResolverConfigInterface) => Promise<Array<{rawtx: string}>[]>;
}