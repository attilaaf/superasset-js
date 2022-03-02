import * as bsv2 from 'bsv';
import { BnsTxInterface } from './interfaces/BnsTx.interface';
import { ExtensionOutputData } from './interfaces/ExtensionOutputData.interface';
import { toHex, signTx, Ripemd160, Sig, PubKey, Bool, Bytes, compile, num2bin, getPreimage, bsv } from 'scryptlib';
import { BitcoinAddress } from '.';
import { BnsContractConfig } from './interfaces/BnsContractConfig.interface';

const MSB_THRESHOLD = 0x7e;

function buildNFTPublicKeyHashOut(asset, pkh) {
    const script = bsv.Script.fromASM(`${asset} ${pkh} OP_NIP OP_OVER OP_HASH160 OP_EQUALVERIFY OP_CHECKSIG`);
    return script;
}
function getLockingScriptForCharacter(lockingScriptASM, letter, dimensionCount, dupHash) {
    const slicedPrefix = lockingScriptASM.substring(0, 90);
    const slicedSuffix = lockingScriptASM.substring(138);
    const replaced = slicedPrefix + ' ' + dupHash + ' ' + num2bin(dimensionCount, 1) + ' ' + letter + ' ' + slicedSuffix;
    return bsv.Script.fromASM(replaced);
}

const Signature = bsv.crypto.Signature;
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
            new Bytes(dividedSatoshisBytesWithSize),
            new Bytes(this.bnsContractConfig.claimOutput), // Todo: check if this is the full output
            changeAddress,
            new Bytes(changeSatoshisBytes),
            new Bool(false),
            issuerSig,
            issuerPubKey).toScript();

        this.tx.setInputScript(0, (tx, output) => {
            return scriptUnlock;
        });
        return this;
    }

    public signFundingInput(privateKey: bsv.PrivateKey) {
        this.tx.sign(privateKey, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID)
        .seal()
        return this;
    }

    public addBnsInput(prevTx: bsv.Transaction): BnsTxInterface {
        const outputIdx = this.prevOutput.outputIndex || 0
        this.tx.addInput(new bsv.Transaction.Input({
          prevTxId: prevTx.id,
          outputIndex: outputIdx,
          script: new bsv.Script(), // placeholder
          output: prevTx.outputs[outputIdx]
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

    public addClaimOutput(): bsv.Transaction {
        console.log('this.tx', this.tx);
        this.tx.addOutput(
            new bsv.Transaction.Output({
                script: bsv.Script.fromHex(this.bnsContractConfig.claimOutput),
                satoshis: this.bnsContractConfig.claimOutputSatoshisInt,
            })
        );
  
        return this.tx;
    }

    public addExtensionOutputs() {
        const dividedSatoshisBytesWithSize = new Bytes(this.bnsContractConfig.claimOutputSatoshisHex + 'fd' + num2bin(this.scryptBns.lockingScript.toHex().length / 2, 2)); // Change to length of script 
        const lockingScriptsLevel0 = {};
        let dupHashesLevel0;
        // For the initial spend we must combine the root outpoint as part of the dedup hash
        const combinedDupHash = this.prevOutput.dupHash + this.prevOutput.outpointHex + this.prevOutput.charHex; // 'ff'; // The parent root node is 'ff' 
        const currentDimension = this.prevOutput.currentDimension + 1;
        const dupHash = bsv.crypto.Hash.ripemd160(Buffer.from(combinedDupHash, 'hex')).toString('hex');
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

            this.tx.addOutput(
                new bsv.Transaction.Output({
                    script: newLockingScript,
                    satoshis: this.bnsContractConfig.letterOutputSatoshisInt,
                })
            );
        }
        return this.tx;
    }

    public getTx(): bsv.Transaction {
        console.log('tx--', this.tx);
        return this.tx;
    }

    public getTotalSatoshisExcludingChange(): number {
        let totalSats = 0;
        for (let i = 0; i < 39; i++) {
            totalSats += this.tx.outputs[i].satoshis;
        }
        return totalSats;
    }

    public getTotalSatoshis(): number {
        let totalSats = 0;
        for (let i = 0; i < this.tx.outputs.length; i++) {
            totalSats += this.tx.outputs[i].satoshis;
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
        for (let i = 0; i < this.tx.outputs.length; i++) {
            totalSats += parseInt(this.tx.outputs[i].valueBn.toString());
        }
        return totalSats;
    }
}
