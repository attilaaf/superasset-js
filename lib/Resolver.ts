import { Name } from "./Name";
import { NameInterface } from "./interfaces/Name.interface";
import { ResolverInterface } from "./interfaces/Resolver.interface";
import { ResolverConfigInterface } from "./interfaces/ResolverConfig.interface";
import { GetNameTransactionsError } from "./errors/GetNameTransactionsError";
import { GetNameTransactionsResult, GetNameTransactionsResultEnum } from "./interfaces/GetNameTransactionsResult.interface";

const BNS_ROOT = '1495550c8f58cfe0b23c4f8205662eaf02978676a3a5eddc905feb23fb7024b7';
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
        const txFetch = await this.getNameTransactions(name);
        if (txFetch.result === GetNameTransactionsResultEnum.FETCH_ERROR) {
            throw new GetNameTransactionsError();
        }
        this.nameTransactions[name] = txFetch.rawtxs;
        const nameObject = new Name({
            testnet: this.resolverConfig.testnet,
        }, this.resolverConfig.bnsOutputRipemd160);
        await nameObject.init(this.nameTransactions[name], this.resolverConfig.root);
        return nameObject;
    }

    public getResolverConfig(): ResolverConfigInterface {
        return this.resolverConfig;
    }

    private async getNameTransactions(name: string): Promise<GetNameTransactionsResult> {
        if (this.resolverConfig.processGetNameTransactions) {
            return this.resolverConfig.processGetNameTransactions(name, this.resolverConfig);
        }
        // Provide a default implementation
        return {
            result: GetNameTransactionsResultEnum.NOT_IMPLEMENTED,
            rawtxs: []
        }
    }
}
