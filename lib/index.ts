import { BNSInterface } from "./BNS.interface";
import { NameInterface } from "./Name.interface";
import { Resolver } from "./Resolver";
import { ResolverInterface } from "./Resolver.interface";
import { ResolverConfigInterface } from "./ResolverConfig.interface";
export { Name } from "./Name";
export { ParameterMissingError } from "./errors/ParameterMissingError";
export { ParameterListEmptyError } from "./errors/ParameterListEmptyError";
export { ParameterExpectedRootEmptyError } from "./errors/ParameterExpectedRootEmptyError";
export { BitcoinAddress } from "./BitcoinAddress";
 
const defaultOptions: any = {
  api: 'https://api.mattercloud.io/api/v3/main/address/ADDRESS_STR/utxo', // Use ADDRESS_STR as replacement
  feeb: 0.5,
  minfee: 1000,
  verbose: false,
}

export class BNS implements BNSInterface {
  // get a resolver. Uses default if no alternative configuration is provided
  public resolver(config?: ResolverConfigInterface): ResolverInterface {
    return Resolver.createResolver(config);
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

