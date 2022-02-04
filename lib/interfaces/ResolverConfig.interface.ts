export interface ResolverConfigInterface { 
    testnet?: string;
    root?: string;
    url?: string;
    bnsOutputRipemd160?: string;
    processGetNameTransactions?: (name: string, cfg: ResolverConfigInterface) => Promise<string[]>
}