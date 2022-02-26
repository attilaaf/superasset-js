import * as bsv from 'bsv';
import { BnsTxInterface } from './interfaces/BnsTx.interface';
import { ExtensionOutputData } from './interfaces/ExtensionOutputData.interface';

export class BnsTx implements BnsTxInterface { 
    private fundingInput: any;
    constructor(private prevOutput: ExtensionOutputData, private tx: bsv.Tx){
    }

    public setChangeOutput(changeScript: string, changeSatoshis: number): BnsTxInterface {
        return this;
    }
    
    public setFundingInput(utxo: { txid: string, outputIndex: number, script: string, satoshis: number }): BnsTxInterface {
        this.fundingInput = utxo;
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
        const rawTxHexSize = this.tx.toHex().length / 2;
        return this.getFee() / rawTxHexSize;
    }
 
    public getFee(): number {
        return this.getTotalInputs() - this.getTotalOutputs();
    }

    private getTotalInputs(): number {
        return this.fundingInput.satoshis + this.prevOutput.satoshis;
    }

    private getTotalOutputs(): number {
        let totalSats = 0;
        for (let i = 0; i < this.tx.txOuts.length; i++) {
            totalSats += parseInt(this.tx.txOuts[i].valueBn.toString());
        }
        return totalSats;
    }
} 