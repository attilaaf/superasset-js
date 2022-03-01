import * as bsv2 from 'bsv';
import { BnsTxInterface } from './interfaces/BnsTx.interface';
import { ExtensionOutputData } from './interfaces/ExtensionOutputData.interface';
import { toHex, signTx, Ripemd160, Sig, PubKey, Bool, Bytes, compile, num2bin, getPreimage, bsv } from 'scryptlib';
import { BitcoinAddress } from '.';
import { BnsContractConfig } from './interfaces/BnsContractConfig.interface';

const MSB_THRESHOLD = 0x7e;

function buildNFTPublicKeyHashOut(asset, pkh) {
    const script = bsv.Script.fromAsmString(`${asset} ${pkh} OP_NIP OP_OVER OP_HASH160 OP_EQUALVERIFY OP_CHECKSIG`);
    return script;
}
function getLockingScriptForCharacter(lockingScriptASM, letter, dimensionCount, dupHash) {
    const slicedPrefix = lockingScriptASM.substring(0, 90);
    const slicedSuffix = lockingScriptASM.substring(138);
    const replaced = slicedPrefix + ' ' + dupHash + ' ' + num2bin(dimensionCount, 1) + ' ' + letter + ' ' + slicedSuffix;
    return bsv.Script.fromAsmString(replaced);
}

const Signature = bsv.Sig;
const sighashTypeBns = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
const letters = [
    '2d',
    '5f',
    // '2e',
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '61',
    '62',
    '63',
    '64',
    '65',
    '66',
    '67',
    '68',
    '69',
    '6a',
    '6b',
    '6c',
    '6d',
    '6e',
    '6f',
    '70',
    '71',
    '72',
    '73',
    '74',
    '75',
    '76',
    '77',
    '78',
    '79',
    '7a'
];

export class BnsTx implements BnsTxInterface {
    private fundingInput: any;
    private scryptBns: any;
    constructor(private bnsContractConfig: BnsContractConfig, private prevOutput: ExtensionOutputData, private tx: bsv.Transaction) {
        this.scryptBns = new this.bnsContractConfig.BNS(
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
        this.scryptBns.replaceAsmVars(asmVars);
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

    public addChangeOutput(bitcoinAddress: BitcoinAddress, changeSatoshis: number): BnsTxInterface {
        const script = bsv.Script.fromASM(bitcoinAddress.toP2PKH());
        this.tx.addOutput(
            new bsv.Transaction.Output({
                script,
                satoshis: changeSatoshis
            })
        );
        return this;
    }
    
    public unlockBnsInput(bitcoinAddress: BitcoinAddress, changeSatoshis: number): BnsTxInterface {
        const txLegacy: bsv.Transaction = new bsv.Transaction(this.tx.toHex());
        const preimage = BnsTx.generatePreimage(true, txLegacy, this.prevOutput.script, this.prevOutput.satoshis, sighashTypeBns);
        const changeAddress = new Bytes(bitcoinAddress.toHash160Bytes());
        const changeSatoshisBytes = num2bin(changeSatoshis, 8);
        const issuerPubKey = new Bytes('0000');
        const issuerSig = new Bytes('0000');

        const dividedSatoshisBytesWithSize = num2bin(this.bnsContractConfig.letterOutputSatoshisInt, 8) + 'fd' + num2bin(this.scryptBns.lockingScript.toHex().length / 2, 2);
        const scriptUnlock = this.scryptBns.extend(
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

    public signFundingInput(privateKey: bsv.PrivateKey, sighashType: any) {
 
        return this;
    }

    public addBnsInput(tx: bsv.Transaction, outputIndex: number): BnsTxInterface {
        const outputIdx = outputIndex || 0
        this.tx.addInput(new bsv.Transaction.Input({
          prevTxId: tx.id,
          outputIndex: outputIdx,
          script: new bsv.Script(), // placeholder
          output: tx.outputs[outputIdx]
        }));
        return this.tx;
    }

    public addFundingInput(utxo: { txid: string, outputIndex: number, script: string, satoshis: number }): BnsTxInterface {
        this.tx.addInput(new bsv.Transaction.Input({
          prevTxId: utxo.txid,
          outputIndex: utxo.outputIndex,
          script: new bsv.Script(),  
          output: utxo.script
        }));
        return this.tx;
    }

    public addClaimOutput(): bsv.Tx {
        this.tx.setOutput(0, (tx) => {
            return new bsv.Transaction.Output({
                script: bsv.Script.fromHex(this.bnsContractConfig.claimOutput),
                satoshis: this.bnsContractConfig.claimOutputSatoshisInt,
            });
        });
        return this.tx;
    }

    public addExtensionOutputs(prevOutput: ExtensionOutputData) {
        const dividedSatoshisBytesWithSize = new Bytes(this.bnsContractConfig.claimOutputSatoshisHex + 'fd' + num2bin(this.scryptBns.lockingScript.toHex().length / 2, 2)); // Change to length of script 
        const lockingScriptsLevel0 = {};
        let dupHashesLevel0;
        // For the initial spend we must combine the root outpoint as part of the dedup hash
        const combinedDupHash = prevOutput.dupHash + prevOutput.outpointHex + prevOutput.charHex; // 'ff'; // The parent root node is 'ff' 
        const currentDimension = prevOutput.currentDimension + 1;
        const dupHash = bsv.Hash.ripemd160(Buffer.from(combinedDupHash, 'hex')).toString('hex');
        let step2ExtendLockingScripts: any = [];
        for (let i = 0; i < letters.length; i++) {
            let letter = letters[i];
            dupHashesLevel0 = dupHash;
            const newLockingScript = getLockingScriptForCharacter(this.scryptBns.lockingScript.toASM(), letter, currentDimension, dupHash);
            lockingScriptsLevel0[letter] = newLockingScript;
            step2ExtendLockingScripts.push({
                newLockingScript,
                dupHash
            });
            const valueBn = new bsv.Bn(this.bnsContractConfig.letterOutputSatoshisInt);
            const script = new bsv.Script().fromHex(newLockingScript.toHex());
            const scriptVi = bsv.VarInt.fromNumber(script.toBuffer().length);
            const txOut = new bsv.TxOut().fromObject({
                valueBn: valueBn,
                scriptVi: scriptVi,
                script: script
            });
            this.tx.addTxOut(txOut);
        }
        return this.tx;
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
