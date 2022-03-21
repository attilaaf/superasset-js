import { BnsTxInterface } from './interfaces/BnsTx.interface';
import { ExtensionOutputData } from './interfaces/ExtensionOutputData.interface';
import { buildContractClass, toHex, signTx, Ripemd160, Sig, PubKey, Bool, Bytes, compile, num2bin, getPreimage, bsv } from 'scryptlib';
import { BitcoinAddress } from '.';
import { BnsContractConfig } from './interfaces/BnsContractConfig.interface';
import { bnsclaim } from "./bnsclaim_release_desc";

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
    private bnsContractConfig: any;
    constructor(private prevOutput: ExtensionOutputData, private debug = false, private tx: bsv.Transaction = new bsv.Transaction() ) {
        if (this.debug) {
            console.log('Debug', 'constructor.issuerPkh', this.prevOutput.issuerPkh);
            console.log('Debug', 'constructor.claimHash', this.prevOutput.claimHash);
            console.log('Debug', 'constructor.dupHash', this.prevOutput.dupHash);
            console.log('Debug', 'constructor.charHex', this.prevOutput.charHex);
            console.log('Debug', 'constructor.currentDimension', this.prevOutput.currentDimension);
            console.log('Debug', 'constructor.sighashTypeBns', sighashTypeBns.toString(16));
        }
        this.bnsContractConfig = BnsTx.getBnsContractConfig(prevOutput.issuerPkh);
        this.scryptBns = new this.bnsContractConfig.BNS(
            new Bytes(this.prevOutput.bnsConstant),
            new Ripemd160(this.prevOutput.issuerPkh),
            new Ripemd160(this.prevOutput.claimHash),
            new Ripemd160(this.prevOutput.dupHash),
            this.prevOutput.currentDimension,
            new Bytes(this.prevOutput.charHex)
        );
        const asmVars = {
            'Tx.checkPreimageOpt_.sigHashType': sighashTypeBns.toString(16),
        };
        this.scryptBns.replaceAsmVars(asmVars);
        // If it's the root tx, then we know we must extend from the 0'th output
        // Otherwise me extend from the letter (after the NFT in 0'th position, hence the + 1)
        const outputScript = this.prevOutput.charHex === 'ff' ? this.prevOutput.tx.outputs[0] : this.prevOutput.tx.outputs[this.prevOutput.outputIndex + 1];
        this.addBnsInput(this.prevOutput.txId, this.prevOutput.outputIndex, outputScript); // Must skip the NFT at position 0   
        this.addBnsOutputs();
    }

    static getBnsContractConfig(issuerPkh: string): BnsContractConfig {
        const letterOutputSatoshisInt = 800;
        // If changing to 'release' then update the outputSize to 'f2' (to reflect smaller output size). Use 'fc' for debug.
        //const outputSize = 'fc'; // Change to fc for debug or f2 for release
        const BNS = buildContractClass(bnsclaim());
        const bnsConstant = Buffer.from('bns1', 'utf8').toString('hex');
        const claimNftScriptSCRIPT = buildNFTPublicKeyHashOut(num2bin(0, 36), issuerPkh);
        const claimNftScript = claimNftScriptSCRIPT.toHex();
        const claimOutputSatoshisInt = 300;
        const outputSize = num2bin(claimNftScript.length / 2, 1); // SANFT: 'f2' for release' and 'fc' for debug or P2NFTPKH: 3f (63 bytes)
        const claimOutput = num2bin(claimOutputSatoshisInt, 8) + outputSize + claimNftScript;
        const claimOutputHash160 = bsv.crypto.Hash.ripemd160(Buffer.from(claimOutput, 'hex')).toString('hex');  
        return {
            BNS,
            miningFee: 20000,
            bnsConstant,
            claimOutputHash160,
            claimOutput,
            claimNftScript,
            claimOutputSatoshisInt,
            letterOutputSatoshisInt,
            rootCharHex: 'ff',
        }
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
                const h = bsv.crypto.Hash.sha256sha256(Buffer.from(preimageHex, 'hex'));// bsv2.Hash.sha256Sha256(Buffer.from(preimageHex, 'hex'));
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

    public addChangeOutput(changeAddress: BitcoinAddress): BnsTxInterface {
        this.tx.change(changeAddress.toString());
        this.tx.setInputScript(0, (tx, output) => {
            const preimage = BnsTx.generatePreimage(true, this.tx, this.prevOutput.script, this.prevOutput.satoshis, sighashTypeBns);
            const changeAddressHash160 = new Bytes(changeAddress.toHash160Bytes());
            const changeSatoshisBytes = num2bin(this.tx.getChangeAmount(), 8);
            const issuerPubKey = new Bytes('00');
            const issuerSig = new Bytes('00');
            // const dividedSatoshisBytesWithSize = new Bytes(num2bin(this.bnsContractConfig.claimOutputSatoshi
            const dividedSatoshisBytesWithSize = num2bin(this.bnsContractConfig.letterOutputSatoshisInt, 8) + 'fd' + num2bin(this.scryptBns.lockingScript.toHex().length / 2, 2);
            const scriptUnlock = this.scryptBns.extend(
                preimage,
                new Bytes(dividedSatoshisBytesWithSize),
                new Bytes(this.bnsContractConfig.claimOutput), // Todo: check if this is the full output
                changeAddressHash160,
                new Bytes(changeSatoshisBytes),
                new Bool(false),
                issuerSig,
                issuerPubKey).toScript();

            if (this.debug) {
                console.log('Debug', 'unlockBnsInput.preimage', preimage);
                console.log('Debug', 'unlockBnsInput.changeSatoshisBytes', changeSatoshisBytes);
                console.log('Debug', 'unlockBnsInput.changeAddressHash160', changeAddressHash160);
                console.log('Debug', 'unlockBnsInput.claimOutput', this.bnsContractConfig.claimOutput);
                console.log('Debug', 'unlockBnsInput.dividedSatoshisBytesWithSize', dividedSatoshisBytesWithSize);
            }

            return scriptUnlock;
        });
        if (this.debug) {
            console.log('4. unlockBns', this.tx, this.tx.toString().length / 2);
        }
        return this;
    }

    public signFundingInput(privateKey: bsv.PrivateKey) {
        this.tx.sign(privateKey, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID)
            .seal()

        
        if (this.debug) {
            console.log('5. signFundingInput', JSON.stringify(this.tx, null, '\n'), this.tx.toString().length / 2);
        }

        return this;
    }

    private addBnsInput(prevTxId: string, outputIndex: number, prevScript: bsv.Script): BnsTxInterface {
        console.log('addBnsInput', prevTxId, prevScript, outputIndex)
        this.tx.addInput(new bsv.Transaction.Input({
            // prevTxId: prevTx.id,
            prevTxId,
            outputIndex: outputIndex,
            script: new bsv.Script(), // placeholder
            output: prevScript, // prevTx.outputs[outputIndex]
        }));
        if (this.debug || true) {
            console.log('1. AddInput', outputIndex, this.tx, this.tx.toString().length / 2);
        }
        return this.tx;
    }

    public addFundingInput(utxo: { txId: string, txid?: string, outputIndex: number, script: string, satoshis: number }): BnsTxInterface {
        this.fundingInput = utxo;
        /* this.tx.addInput(new bsv.Transaction.Input({
           prevTxId: utxo.txId ? utxo.txId : utxo.txid,
           outputIndex: utxo.outputIndex,
           script: new bsv.Script(),  
         }), utxo.script, utxo.satoshis);
         */
        this.tx.from(utxo);
        return this.tx;
    }
    private addBnsOutputs() {
        // Add the claim output
        this.tx.addOutput(
            new bsv.Transaction.Output({
                script: bsv.Script.fromHex(this.bnsContractConfig.claimNftScript),
                satoshis: this.bnsContractConfig.claimOutputSatoshisInt,
            })
        );
        if (this.debug) {
            console.log('2. addClaimOutput', this.tx, this.tx.toString().length / 2);
        }
        // Add the extension outputs

        const lockingScriptsLevel0 = {};
        let dupHashesLevel0;
        // For the initial spend we must combine the root outpoint as part of the dedup hash
        let combinedDupHash = this.prevOutput.dupHash + this.prevOutput.outpointHex + this.prevOutput.charHex; // 'ff'; // The parent root node is 'ff' 
        // If it's not the root the dup hash is actually just the previous one
        if (this.prevOutput.charHex !== 'ff') {
            combinedDupHash = this.prevOutput.dupHash + this.prevOutput.charHex;
        }
        const currentDimension = this.prevOutput.currentDimension + 1;
        const dupHash = bsv.crypto.Hash.ripemd160(Buffer.from(combinedDupHash, 'hex')).toString('hex');

        if (this.debug) {
            console.log('Debug', 'addExtensionOutputs.prevOutput.dupHash', this.prevOutput.dupHash);
            console.log('Debug', 'addExtensionOutputs.prevOutput.charHex', this.prevOutput.charHex);
            console.log('Debug', 'addExtensionOutputs.prevOutput.char', this.prevOutput.char);
            console.log('Debug', 'addExtensionOutputs.prevOutput.outpointHex', this.prevOutput.outpointHex);
            console.log('Debug', 'addExtensionOutput.currentDimension', currentDimension);
            console.log('Debug', 'addExtensionOutput.dupHash', dupHash);
        }
        let step2ExtendLockingScripts: any = [];
        for (let i = 0; i < letters.length; i++) {
            let letter = letters[i];
            dupHashesLevel0 = dupHash;
            //console.log('currentDimension', currentDimension);
            const newLockingScript = getLockingScriptForCharacter(this.scryptBns.lockingScript.toASM(), letter, currentDimension, dupHash);
            lockingScriptsLevel0[letter] = newLockingScript;
            step2ExtendLockingScripts.push({
                newLockingScript,
                dupHash
            });
            if (this.debug) {
                console.log('Debug', 'addExtensionOutputs.newLockingScript.length', newLockingScript.toHex().length);
            }
            this.tx.addOutput(
                new bsv.Transaction.Output({
                    script: newLockingScript,
                    satoshis: this.bnsContractConfig.letterOutputSatoshisInt,
                })
            );
        }
        if (this.debug) {
            console.log('3. addLetters', this.tx, this.tx.toString().length / 2);
        }
        return this.tx;
    }

    public getTx(): bsv.Transaction {
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
        const rawTxHexSize = this.tx.toString().length / 2;
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
            totalSats += parseInt(this.tx.outputs[i].satoshis);
        }
        return totalSats;
    }
}
