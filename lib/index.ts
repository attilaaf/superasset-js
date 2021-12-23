
import axios from 'axios';
import { Factory } from './Factory';

const defaultOptions: any = {
  api: 'https://api.mattercloud.io/api/v3/main/address/ADDRESS_STR/utxo', // Use ADDRESS_STR as replacement
  feeb: 0.5,
  minfee: 1000,
  verbose: false,
}

export class SuperAssetClient {
  options;
  constructor(providedOptions?: any) {
    this.options = Object.assign({}, defaultOptions, providedOptions);
  }

  setOptions(newOptions) {
    this.options = Object.assign({}, this.options, newOptions);
  }

  public factory() {
    return Factory;
  }
  
  instance(newOptions?: any): SuperAssetClient {
    const mergedOptions = Object.assign({}, defaultOptions, newOptions);
    return new SuperAssetClient(mergedOptions);
  }
}

export function instance(newOptions?: any): SuperAssetClient {
  const mergedOptions = Object.assign({}, defaultOptions, newOptions);
  return new SuperAssetClient(mergedOptions);
}

try {
  if (window) {
    window['superasset'] = {
      instance: instance
    };
  }
}
catch (ex) {
  // Window is not defined, must be running in windowless node env...
}

