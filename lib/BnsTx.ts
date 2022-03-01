import * as bsv2 from 'bsv';
import { BnsTxInterface } from './interfaces/BnsTx.interface';
import { ExtensionOutputData } from './interfaces/ExtensionOutputData.interface';
import { toHex, signTx, Ripemd160, Sig, PubKey, Bool, Bytes, compile, num2bin, getPreimage, bsv } from 'scryptlib';
import { BitcoinAddress } from '.';
import { BnsContractConfig } from './interfaces/BnsContractConfig.interface';

const MSB_THRESHOLD = 0x7e;
const sighashTypeBns = bsv2.Sig.SIGHASH_ANYONECANPAY | bsv2.Sig.SIGHASH_ALL | bsv2.Sig.SIGHASH_FORKID;

export class BnsTx implements BnsTxInterface {
    private fundingInput: any;
    constructor(private bnsContractConfig: BnsContractConfig, private prevOutput: ExtensionOutputData, private tx: bsv2.Tx) {
    }

    static generatePreimage(isOpt, txLegacy, lockingScriptASM, satValue, sighashType, idx = 0) {
        let preimage: any = null;
        if (isOpt) {
            for (let i = 0; ; i++) {
                // malleate tx and thus sighash to satisfy constraint
                txLegacy.nLockTime = i;
                const preimage_ = getPreimage(txLegacy, lockingScriptASM, satValue, idx, sighashType);
                let preimageHex = toHex(preimage_);
                preimage = preimage_;
                const h = bsv2.Hash.sha256Sha256(Buffer.from(preimageHex, 'hex'));
                const msb = h.readUInt8();
                if (msb < MSB_THRESHOLD) {
                    // the resulting MSB of sighash must be less than the threshold
                    break;
                }
            }
        } else {
            preimage = getPreimage(txLegacy, lockingScriptASM, satValue, idx, sighashType);
        }
        return preimage;
    }

    public setChangeOutput(bitcoinAddress: BitcoinAddress, changeSatoshis: number): BnsTxInterface {
        const valueBn = new bsv2.Bn(changeSatoshis);
        const script = bsv2.Script.fromAsmString(bitcoinAddress.toP2PKH());
        const scriptVi = bsv2.VarInt.fromNumber(script.toBuffer().length);
        const txOut = new bsv2.TxOut().fromObject({
            valueBn: valueBn,
            scriptVi: scriptVi,
            script: script
        });
        this.tx.addTxOut(txOut);
        return this;
    }
    
    public unlockBnsInput(bitcoinAddress: BitcoinAddress, changeSatoshis: number): BnsTxInterface {
        console.log('unlockBnsInput', this.tx);
        const txLegacy: bsv.Transaction = new bsv.Transaction(this.tx.toHex());
        const preimage = BnsTx.generatePreimage(true, txLegacy, this.prevOutput.script, this.prevOutput.satoshis, sighashTypeBns);
        const changeAddress = new Bytes(bitcoinAddress.toHash160Bytes());
        const changeSatoshisBytes = num2bin(changeSatoshis, 8);
        const issuerPubKey = new Bytes('0000');
        const issuerSig = new Bytes('0000');
        const scryptBns = new this.bnsContractConfig.BNS(
            new Bytes(this.bnsContractConfig.bnsConstant),
            new Ripemd160(this.prevOutput.issuerPkh),
            new Ripemd160(this.bnsContractConfig.claimOutputHash160),
            new Ripemd160(this.prevOutput.dupHash),
            this.prevOutput.currentDimension + 1,
            new Bytes(this.bnsContractConfig.rootCharHex)
        );
        const asmVars = {
            'Tx.checkPreimageOpt_.sigHashType': sighashTypeBns.toString(16),
        };
        scryptBns.replaceAsmVars(asmVars);
        const dividedSatoshisBytesWithSize = num2bin(this.bnsContractConfig.letterOutputSatoshisInt, 8) + 'fd' + num2bin(scryptBns.lockingScript.toHex().length / 2, 2);
        const scriptUnlock = scryptBns.extend(
            preimage,
            new Bytes(dividedSatoshisBytesWithSize), // Todo: is size needed here?
            new Bytes(this.bnsContractConfig.claimOutput), // Todo: check if this is the full output
            changeAddress,
            new Bytes(changeSatoshisBytes),
            new Bool(false),
            issuerSig,
            issuerPubKey).toScript();

        const txIn = new bsv2.TxIn().fromProperties(
            this.prevOutput.txIdBuf,  
            this.prevOutput.outputIndex,
            scriptUnlock
        );
        this.tx.addTxIn(txIn);
        return this;
    }

    public unlockFundingInput(keyPair: bsv.KeyPair) {
        // Produce a signature and get the public key
       /* const sig = this.tx.sign(keyPair, bsv2.Sig.SIGHASH_ALL, 1, new bsv.Script())
        const pubKey = '';
        console.log('sig', sig);
        const txIn = new bsv2.TxIn().fromProperties(
            Buffer.from(this.fundingInput.txid, 'hex'),
            this.fundingInput.outputIndex,
            new bsv2.Script()
        );
        this.tx.addTxIn(txIn);*/
        return this;
    }

    public setFundingInput(utxo: { txid: string, outputIndex: number, script: string, satoshis: number }): BnsTxInterface {
        this.fundingInput = utxo;
        const txIn = new bsv2.TxIn().fromProperties(
            Buffer.from(this.fundingInput.txid, 'hex'),
            this.fundingInput.outputIndex,
            new bsv2.Script()
        );
        this.tx.addTxIn(txIn);
        return this;
    }

    public getTx(): bsv2.Tx {
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
