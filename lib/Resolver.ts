import { Name } from "./Name";
import { NameInterface } from "./interfaces/Name.interface";
import { ResolverInterface } from "./interfaces/Resolver.interface";
import { ResolverConfigInterface } from "./interfaces/ResolverConfig.interface";

const BNS_ROOT = 'b3b582b4ae134d329c99ef665b7e31b226892a17';
const BNS_API_URL = 'https://resolver.based.org/api/v1';

export class Resolver implements ResolverInterface { 
    private nameTransactions = {};
    private resolverConfig: any = {
        testnet: false,
        root: BNS_ROOT,
        url: BNS_API_URL,
        bnsOutputRipemd160: 'b3b582b4ae134d329c99ef665b7e31b226892a17'
    }
    private constructor(resolverConfig?: ResolverConfigInterface) {
        if (resolverConfig) {
            this.resolverConfig = Object.assign({}, this.resolverConfig, resolverConfig);
        }
    }
    static create(resolverConfig?: ResolverConfigInterface): ResolverInterface {
        return new Resolver(resolverConfig);
    }

    public async getName(name: string): Promise<NameInterface> {
        this.nameTransactions[name] = await this.getNameTransactions(name);
        const nameObject = new Name({
            testnet: this.resolverConfig.testnet,
        }, this.resolverConfig.bnsOutputRipemd160);
        await nameObject.init(this.nameTransactions[name], this.resolverConfig.root);
        return nameObject;
    }

    public getResolverConfig(): ResolverConfigInterface {
        return this.resolverConfig;
    }

    private async getNameTransactions(name: string): Promise<string[]> {
        if (this.resolverConfig.processGetNameTransactions) {
            return this.resolverConfig.processGetNameTransactions(name, this.resolverConfig);
        }
        // Provide a default implementation
        return [];
    }
}
