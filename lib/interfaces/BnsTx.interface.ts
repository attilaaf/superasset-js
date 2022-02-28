
import { BitcoinAddress } from "..";
import * as bsv from 'bsv';

export interface BnsTxInterface { 
    // Sets change to the script (replaces multiple calls with latest)
    setChangeOutput: (bitcoinAddress: BitcoinAddress, changeSatoshis: number) => BnsTxInterface;
    // Unlock the Bns input
    unlockBnsInput: (bitcoinAddress: BitcoinAddress, changeSatoshis: number) => BnsTxInterface;
    // Adds funding input to the script
    setFundingInput: (utxo: { txid: string, outputIndex: number, script: string, satoshis: number }, unlockScript: string) => BnsTxInterface;
    // unlock the funding input
    unlockFundingInput: (privateKey: any) => void;
    // Get the underlying tx
    getTx: () => bsv.Tx;
    // Get the required fee
    getTotalSatoshisExcludingChange: () => number;
    // Get the fee rate (to be called after attaching inputs and outputs)
    // This is useful to estimate the transaction fee rate and then rebuild if needed
    getFeeRate: () => number;
    // Get the total fee
    getFee: () => number;
}
 