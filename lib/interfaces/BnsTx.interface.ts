
import { BitcoinAddress } from "..";
import * as bsv from 'bsv';

export interface BnsTxInterface { 
    // Sets change to the script (replaces multiple calls with latest)
    setChangeOutput: (changeScript: string, changeSatoshis: number) => BnsTxInterface;
    // Adds funding input to the script
    addFundingInput: (utxo: { txId: string, outputIndex: number, unlockScript: string, satoshis: number }) => BnsTxInterface;
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
 