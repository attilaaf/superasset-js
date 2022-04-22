import { BitcoinAddress } from "../BitcoinAddress";
import * as bsv from 'bsv';
 
export interface NFTMintOptsInterface {
    fundingPrivateKey: bsv.PrivateKey,
    satoshis: number,
    dataOuts?: string[],
    sendTx?: (tx: bsv.Transaction) => any;
    fetchUtxos?: (bitcoinAddress: string) => 
        Promise<Array<{
            txId: string,
            outputIndex: number,
            script: string,
            satoshis: number
        }>[]>;
}