import { NFT } from "./NFT";
export { InvalidNameError, MaxClaimFeeExceededError, InvalidNFTTxError } from "./Errors";
export { NFT } from "./NFT";
export { BitcoinAddress } from "./BitcoinAddress";

export class SuperAssetClient {
}
export function instance() {
  return new SuperAssetClient();
}
try {
  if (window) {
    window['superasset'] = {
      instance: instance,
      NFT
    };
  }
}
catch (ex) {
  // Window is not defined, must be running in windowless node env...
}

