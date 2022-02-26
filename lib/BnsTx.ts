import * as bsv from 'bsv';
import { BnsTxInterface } from './interfaces/BnsTx.interface';

export class BnsTx implements BnsTxInterface { 
    constructor(private tx: bsv.Tx){
    }

    public setChangeOutput(changeScript: string, changeSatoshis: number): BnsTxInterface {
        return this;
    }
    
    public addFundingInput(utxo: { txId: string, outputIndex: number, unlockScript: string, satoshis: number }): BnsTxInterface {
        return this;
    }

    public getTx(): bsv.Tx {
        return this.tx;
    }

    public getTotalSatoshisExcludingChange(): number {
        let totalSats = 0;
        for (let i = 0; i < 39; i++) {
            totalSats += parseInt(this.tx.txOuts[i].valueBn.toString());
        }
        return totalSats;
    }

    public getFeeRate(): number {

        return 0;
    }
 
    public getFee(): number {
        return 0;
    }
} 