import { BitcoinAddress } from "./BitcoinAddress";
import { NameInterface } from "./Name.interface";
import { OpResult } from "./OpResult.interface";
import { Record } from "./Record.interface.ts";
import { ResolverConfigInterface } from "./ResolverConfig.interface";

export interface ResolverInterface { 
    getName: (name: string) => Promise<NameInterface>;
    getResolverConfig: () => ResolverConfigInterface;
}
