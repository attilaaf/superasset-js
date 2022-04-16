export interface SigningServiceInterface { 
    signTx: (prefixRawtxs: string[], rawtx: string, lockScript, lockSatoshis, inputIndex, sighashType) => any;
}
  