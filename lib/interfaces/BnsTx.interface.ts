
import { BitcoinAddress } from "..";
import * as bsv from 'bsv';
import { BnsContractConfig } from "./BnsContractConfig.interface";
import { ExtensionOutputData } from "./ExtensionOutputData.interface";

export interface BnsTxInterface { 
    
    addBnsInput: (prevTx: bsv.Transaction, outputIndex: number) => BnsTxInterface;

    addFundingInput: (utxo: { txId: string, txid?: string, outputIndex: number, script: string, satoshis: number }) => BnsTxInterface;

    addClaimOutput: () => BnsTxInterface;
 
    addExtensionOutputs: () => BnsTxInterface;

    addChangeOutput: (bitcoinAddress: BitcoinAddress) => BnsTxInterface;

    unlockBnsInput: (bitcoinAddress: BitcoinAddress) => BnsTxInterface;

    signFundingInput: (privateKey: bsv.PrivateKey) => BnsTxInterface;
    
    getTx: () => bsv.Transaction;

    getTotalSatoshisExcludingChange: () => number;

    getTotalSatoshis: () => number;

    getFeeRate: () => number;

    getFee: () => number;
}
 