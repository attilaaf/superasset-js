import { NameInterface } from "./Name.interface";
import { ResolverInterface } from "./Resolver.interface";
import { ResolverConfigInterface } from "./ResolverConfig.interface";
 
export interface BNSInterface { 
    // get a resolver. Uses default if no alternative configuration is provided
    resolver: (config?: ResolverConfigInterface) => ResolverInterface;
    // Uses default resolver underneath
    getName: (name: string) => Promise<NameInterface>;
}