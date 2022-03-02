
import { BitcoinAddress } from "..";
import * as bsv from 'bsv';
import { BnsContractConfig } from "./BnsContractConfig.interface";
import { ExtensionOutputData } from "./ExtensionOutputData.interface";

export interface BnsTxInterface { 
    
    addBnsInput: (prevTx: bsv.Transaction) => BnsTxInterface;

    addFundingInput: (utxo: { txid: string, outputIndex: number, script: string, satoshis: number }) => BnsTxInterface;

    addClaimOutput: () => BnsTxInterface;
 
    addExtensionOutputs: () => BnsTxInterface;

    addChangeOutput: (bitcoinAddress: BitcoinAddress, changeSatoshis: number) => BnsTxInterface;

    unlockBnsInput: (bitcoinAddress: BitcoinAddress, changeSatoshis: number) => BnsTxInterface;

    signFundingInput: (privateKey: bsv.PrivateKey) => BnsTxInterface;
    
    getTx: () => bsv.Transaction;

    getTotalSatoshisExcludingChange: () => number;

    getTotalSatoshis: () => number;

    getFeeRate: () => number;

    getFee: () => number;
}
 