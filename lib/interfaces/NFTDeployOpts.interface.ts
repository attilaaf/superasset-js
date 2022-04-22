import { BitcoinAddress } from "../BitcoinAddress";
import * as bsv from 'bsv';
 
export interface NFTDeployOptsInterface {
    fundingPrivateKey: bsv.PrivateKey,
    sendTx?: (tx: bsv.Transaction) => any;
    fetchUtxos?: (bitcoinAddress: string) => 
        Promise<Array<{
            txId: string,
            outputIndex: number,
            script: string,
            satoshis: number
        }>[]>;
}