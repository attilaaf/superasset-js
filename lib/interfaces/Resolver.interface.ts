 import { NFTInterface } from "./NFT.interface";
import { ResolverConfigInterface } from "./ResolverConfig.interface";

export interface ResolverInterface { 
    getNFT: (assetId: string) => Promise<NFTInterface>;
    getResolverConfig: () => ResolverConfigInterface;
}
