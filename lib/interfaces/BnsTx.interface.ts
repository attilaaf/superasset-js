
import { BitcoinAddress } from "..";
import * as bsvlegacy from 'bsvlegacy';
import { BnsContractConfig } from "./BnsContractConfig.interface";
import { ExtensionOutputData } from "./ExtensionOutputData.interface";

export interface BnsTxInterface { 
    
    addBnsInput: (prevTx: bsvlegacy.Transaction) => BnsTxInterface;

    addFundingInput: (utxo: { txid: string, outputIndex: number, script: string, satoshis: number }) => BnsTxInterface;

    addClaimOutput: () => BnsTxInterface;
 
    addExtensionOutputs: () => BnsTxInterface;

    addChangeOutput: (bitcoinAddress: BitcoinAddress, changeSatoshis: number) => BnsTxInterface;

    unlockBnsInput: (bitcoinAddress: BitcoinAddress, changeSatoshis: number) => BnsTxInterface;

    signFundingInput: (privateKey: bsvlegacy.PrivateKey) => BnsTxInterface;
    
    getTx: () => bsvlegacy.Transaction;

    getTotalSatoshisExcludingChange: () => number;

    getTotalSatoshis: () => number;

    getFeeRate: () => number;

    getFee: () => number;
}
 