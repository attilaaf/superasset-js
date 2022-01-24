import { Name } from "./Name";
import { NameInterface } from "./Name.interface";
import { ResolverInterface } from "./Resolver.interface";
import { ResolverConfigInterface } from "./ResolverConfig.interface";

const BNS_ROOT = '';
const BNS_API_URL = 'https://resolver.based.org/api/v1';

export class Resolver implements ResolverInterface { 
    private nameTransactions = {};
    private resolverConfig: any = {
        root: BNS_ROOT,
        url: BNS_API_URL
    }
    private constructor(resolverConfig?: ResolverConfigInterface) {
        if (resolverConfig) {
            this.resolverConfig = resolverConfig;
        }
    }
    static createResolver(resolverConfig?: ResolverConfigInterface): ResolverInterface {
        return new Resolver(resolverConfig);
    }

    public async getName(name: string): Promise<NameInterface> {
        this.nameTransactions[name] = await this.fetchNameTransactions(name);
        const nameObject = new Name();
        nameObject.init(this.nameTransactions[name], this.resolverConfig.root);
        return nameObject;
    }

    public getResolverConfig(): ResolverConfigInterface {
        return this.resolverConfig;
    }

    private async fetchNameTransactions(name: string): Promise<string[]> {
        return [
            'rawtx1'
        ]
    }
}
