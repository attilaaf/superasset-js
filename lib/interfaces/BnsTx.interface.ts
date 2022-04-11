
import { BitcoinAddress } from "..";
import * as bsv from 'bsv';

export interface BnsTxInterface {

    addFundingInput: (utxo: { txId: string, txid?: string, outputIndex: number, script: string, satoshis: number }) => BnsTxInterface;

    addChangeOutput: (changeAddress: BitcoinAddress) => BnsTxInterface;

    signFundingInput: (privateKey: bsv.PrivateKey) => BnsTxInterface;

    getTx: () => bsv.Transaction;

    getTotalSatoshisExcludingChange: () => number;

    getTotalSatoshis: () => number;

    getFeeRate: () => number;

    getFee: () => number;
}
