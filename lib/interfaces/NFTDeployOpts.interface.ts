import { BitcoinAddress } from "../BitcoinAddress";
import * as bsv from 'bsv';
 
export interface NFTDeployOptsInterface {
    fundingPrivateKey: bsv.PrivateKey,
    satoshis: number,
    editions: number,
    sendTx?: (tx: bsv.Transaction) => any;
    fetchUtxos?: (bitcoinAddress: string) => 
        Promise<Array<{
            txId: string,
            outputIndex: number,
            script: string,
            satoshis: number
        }>[]>;
}