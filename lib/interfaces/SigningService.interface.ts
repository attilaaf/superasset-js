
import { BitcoinAddress } from "..";
 
export interface SigningServiceInterface { 
    signTx: (rawtx: string, lockScript, lockSatoshis, inputIndex, sighashType) => any;
}
  