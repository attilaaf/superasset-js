
import { BitcoinAddress } from "..";
import * as bsvlegacy from 'bsvlegacy';
import { BnsContractConfig } from "./BnsContractConfig.interface";
import { ExtensionOutputData } from "./ExtensionOutputData.interface";

export interface BnsTxInterface { 
    
    addBnsInput: (tx: bsvlegacy.Transaction, outputIndex: number) => BnsTxInterface;

    addFundingInput: (utxo: { txid: string, outputIndex: number, script: string, satoshis: number }) => BnsTxInterface;

    addClaimOutput: () => BnsTxInterface;
 
    addExtensionOutputs: (prevOutput: ExtensionOutputData) => BnsTxInterface;

    addChangeOutput: (bitcoinAddress: BitcoinAddress, changeSatoshis: number) => BnsTxInterface;

    unlockBnsInput: (bitcoinAddress: BitcoinAddress, changeSatoshis: number) => BnsTxInterface;

    signFundingInput: (privateKey: bsvlegacy.PrivateKey, sighashType: any) => BnsTxInterface;
    
    getTx: () => bsvlegacy.Transaction;

    getTotalSatoshisExcludingChange: () => number;

    getFeeRate: () => number;

    getFee: () => number;
}
 