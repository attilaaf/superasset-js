import { BNSInterface } from "./interfaces/BNS.interface";
import { NameInterface } from "./interfaces/Name.interface";
import { Resolver } from "./Resolver";
import { ResolverInterface } from "./interfaces/Resolver.interface";
import { ResolverConfigInterface } from "./interfaces/ResolverConfig.interface";
export { Name } from "./Name";
export { Resolver } from "./Resolver";
export { TreeProcessor } from "./TreeProcessor";
export { ParameterMissingError } from "./errors/ParameterMissingError";
export { ParameterListEmptyError } from "./errors/ParameterListEmptyError";
export { ParameterExpectedRootEmptyError } from "./errors/ParameterExpectedRootEmptyError";
export { ParameterListInsufficientSpendError } from "./errors/ParameterListInsufficientSpendError";
export { PrefixChainMismatchError } from "./errors/PrefixChainMismatchError";
export { RootOutputHashMismatchError } from "./errors/RootOutputHashMismatchError";
export { GetNameTransactionsError } from "./errors/GetNameTransactionsError";
export { InvalidNameTransactionsError } from "./errors/InvalidNameTransactionsError";
export { MissingNextTransactionError } from "./errors/MissingNextTransactionError";
export { RequiredTransactionPartialResult } from "./interfaces/RequiredTransactionPartialResult.interface";
export { NotInitError } from "./errors/NotInitError";
export { NFTChainError } from "./errors/NFTChainError";
export { bnsclaim } from "./bnsclaim_release_desc";
export {
  InvalidBnsConstantError,
  InvalidCurrentDimensionError,
  InvalidCharError,
  InvalidDupHashError
} from "./errors/OutputErrors";
export { BitcoinAddress } from "./BitcoinAddress";
export { GetNameTransactionsResult, GetNameTransactionsResultEnum } from "./interfaces/GetNameTransactionsResult.interface";

const defaultOptions: any = {
  api: 'https://api.mattercloud.io/api/v3/main/address/ADDRESS_STR/utxo', // Use ADDRESS_STR as replacement
  feeb: 0.5,
  minfee: 1000,
  verbose: false,
}

export class BNS implements BNSInterface {
  // get a resolver. Uses default if no alternative configuration is provided
  public resolver(config?: ResolverConfigInterface): ResolverInterface {
    return Resolver.create(config);
  }
  // Uses default resolver underneath
  public async getName(name: string): Promise<NameInterface> {
    return this.resolver().getName(name);
  }
}

export function instance(): BNSInterface {
  return new BNS();
}


try {
  if (window) {
    window['BNS'] = {
      instance: instance
    };
  }
}
catch (ex) {
  // Window is not defined, must be running in windowless node env...
}

