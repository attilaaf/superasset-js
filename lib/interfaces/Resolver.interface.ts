import { NameInterface } from "./Name.interface";
import { ResolverConfigInterface } from "./ResolverConfig.interface";

export interface ResolverInterface { 
    getName: (name: string) => Promise<NameInterface>;
    getResolverConfig: () => ResolverConfigInterface;
}
