import { BnsTxInterface } from './interfaces/BnsTx.interface';
import { ExtensionOutputData } from './interfaces/ExtensionOutputData.interface';
import { buildContractClass, toHex, signTx, Ripemd160, Sig, PubKey, Bool, Bytes, compile, num2bin, getPreimage, bsv } from 'scryptlib';
import { BitcoinAddress } from '.';
import { BnsContractConfig } from './interfaces/BnsContractConfig.interface';
import { SuperAssetBNS } from './contracts/SuperAssetBNS';
import { SuperAssetFeeBurner } from './contracts/SuperAssetFeeBurner';
import { SuperAssetNFT } from './contracts/SuperAssetNFT';
import { generatePreimage, sighashType2Hex } from './Helpers';
import { SuperAssetNFTMinFee } from './contracts/SuperAssetNFTMinFee';

const Signature = bsv.crypto.Signature;
const sighashTypeSingle = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_SINGLE | Signature.SIGHASH_FORKID;
const sighashTypeAll = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;

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
    constructor(
        private prevOutput: ExtensionOutputData, 
        private claimPkh: string,
        private debug = false, 
        private tx: bsv.Transaction = new bsv.Transaction()
    ) {
        if (this.debug) {
            console.log('Debug', 'constructor.issuerPkh', this.prevOutput.issuerPkh);
            console.log('Debug', 'constructor.claimHash', this.prevOutput.claimHash);
            console.log('Debug', 'constructor.dupHash', this.prevOutput.dupHash);
            console.log('Debug', 'constructor.charHex', this.prevOutput.charHex);
            console.log('Debug', 'constructor.currentDimension', this.prevOutput.currentDimension);
            console.log('Debug', 'constructor.sighashTypeBns', sighashTypeAll.toString(16));
        }
        this.bnsContractConfig = BnsTx.getBnsContractConfig(claimPkh);
        console.log('bnsContractConfig', this.bnsContractConfig);
        this.scryptBns = new this.bnsContractConfig.BNS(
            new Bytes(this.prevOutput.bnsConstant),
            new Ripemd160(this.prevOutput.issuerPkh),
            new Ripemd160(this.prevOutput.claimHash),
            new Ripemd160(this.prevOutput.dupHash),
            this.prevOutput.currentDimension,
            new Bytes(this.prevOutput.charHex)
        );
        const asmVars = {
            'Tx.checkPreimageOpt_.sigHashType': sighashTypeAll.toString(16),
        };
        this.scryptBns.replaceAsmVars(asmVars);
        // If it's the root tx, then we know we must extend from the 0'th output
        // Otherwise me extend from the letter (after the NFT in 0'th position, hence the + 1)
        const outputScript = this.prevOutput.charHex === 'ff' ? this.prevOutput.tx.outputs[0] : this.prevOutput.tx.outputs[this.prevOutput.outputIndex + 1];
        this.addBnsInput(this.prevOutput.txId, this.prevOutput.outputIndex, outputScript); // Must skip the NFT at position 0   
        this.addBnsOutputs();
    }

    static getClaimNFT(claimPkh: string) {
        const feeOutputHash160 = bsv.crypto.Hash.ripemd160(Buffer.from(BnsTx.getFeeBurner().lockingScript.toHex(), 'hex')).toString('hex');
        // Only hash the part after the parameters (last one is the pkh)
        const lockingScriptHashedPart = BnsTx.getNameNFT(claimPkh).lockingScript.toHex().substring((1 + 36 + 1 + 20) * 2);
        const nameOutputHash160 = bsv.crypto.Hash.ripemd160(Buffer.from(lockingScriptHashedPart, 'hex')).toString('hex');
        // Attach the minimal fee contract to the BNS contract
        const SuperAssetNFTMinFeeClass = buildContractClass(SuperAssetNFTMinFee());
        const superAssetNFTMinFee = new SuperAssetNFTMinFeeClass(
            new Bytes('000000000000000000000000000000000000000000000000000000000000000000000000'),
            new Ripemd160(toHex(claimPkh)),
            new Bytes(nameOutputHash160),
            new Bytes(feeOutputHash160)
        );
 
        const asmVarsMinFee = {
            'Tx.checkPreimageOpt_.sigHashType': sighashType2Hex(sighashTypeAll)
        };
        superAssetNFTMinFee.replaceAsmVars(asmVarsMinFee);
        return superAssetNFTMinFee;
    }

    static getClaimNFTOutput(claimPkh: string) {
        const claimNftScript = BnsTx.getClaimNFT(claimPkh).lockingScript;
        const claimNftScriptHex = claimNftScript.toHex();
        const claimSatoshisInt = 300;
        const claimSatoshisWithFullOutput = num2bin(claimSatoshisInt, 8) + 'fd' + num2bin(claimNftScriptHex.length / 2, 2) + claimNftScriptHex;
        return {
            hex: claimSatoshisWithFullOutput,
            satoshis: claimSatoshisInt,
            script: claimNftScript,
            hash: bsv.crypto.Hash.ripemd160(Buffer.from(claimSatoshisWithFullOutput, 'hex')).toString('hex')
        };
    }

    static getFeeBurner() {
        // Generate the fee burner contract
        // The feeOutputHash160 is for the entire script
        const SuperAssetFeeBurnerClass = buildContractClass(SuperAssetFeeBurner());
        const superAssetFeeBurner = new SuperAssetFeeBurnerClass();
        const superAssetFeeBurnerAsmVars = {
            'Tx.checkPreimageOpt_.sigHashType': sighashType2Hex(sighashTypeAll)
        };
        superAssetFeeBurner.replaceAsmVars(superAssetFeeBurnerAsmVars);
        return superAssetFeeBurner;
    }

    static getNameNFT(claimPkh: string) {
        // Generate the regular nft contract
        // The nameOutputHash160 is for the part of the contract after the assetId and the p2pkh address
        const SuperAssetNFTClass = buildContractClass(SuperAssetNFT());
        const superAssetNFT = new SuperAssetNFTClass(
            new Bytes('000000000000000000000000000000000000000000000000000000000000000000000000'),
            new Ripemd160(toHex(claimPkh)),
        );
        const superAssetNFTAsmVars = {
            'Tx.checkPreimageOpt_.sigHashType': sighashType2Hex(sighashTypeSingle)
        };
 
        superAssetNFT.replaceAsmVars(superAssetNFTAsmVars);
 
        return superAssetNFT;  
    }

    static getBnsContractConfig(claimPkh: string): BnsContractConfig {
        const letterOutputSatoshisInt = 800;
        // If changing to 'release' then update the outputSize to 'f2' (to reflect smaller output size). Use 'fc' for debug.
        //const outputSize = 'fc'; // Change to fc for debug or f2 for release
        const BNS = buildContractClass(SuperAssetBNS(true));
        const bnsConstant = Buffer.from('bns1', 'utf8').toString('hex');
        const claimOutput = BnsTx.getClaimNFTOutput(claimPkh);
        return {
            BNS,
            miningFee: 20000,
            bnsConstant,
            claimOutputHash160: claimOutput.hash,
            claimOutput: claimOutput.hex,
            claimNftScript: claimOutput.script.toHex(),
            claimOutputSatoshisInt: claimOutput.satoshis,
            letterOutputSatoshisInt,
            rootCharHex: 'ff',
        }
    }

    public addChangeOutput(changeAddress: BitcoinAddress): BnsTxInterface {
        this.tx.change(changeAddress.toString());
        this.tx.setInputScript(0, (tx, output) => {
            const preimage = generatePreimage(true, this.tx, this.prevOutput.script, this.prevOutput.satoshis, sighashTypeAll);
            const changeAddressHash160 = new Bytes(changeAddress.toHash160Bytes());
            const changeSatoshisBytes = num2bin(this.tx.getChangeAmount(), 8);
            const issuerPubKey = new Bytes('00');
            const issuerSig = new Bytes('00');
            // const dividedSatoshisBytesWithSize = new Bytes(num2bin(this.bnsContractConfig.claimOutputSatoshi
            const dividedSatoshisBytesWithSize = num2bin(this.bnsContractConfig.letterOutputSatoshisInt, 8) + 'fd' + num2bin(this.scryptBns.lockingScript.toHex().length / 2, 2);
            const scriptUnlock = this.scryptBns.extend(
                preimage,
                new Bytes(dividedSatoshisBytesWithSize),
                new Bytes(this.bnsContractConfig.claimOutput), 
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
        return this;
    }

    public signFundingInput(privateKey: bsv.PrivateKey) {
        this.tx.sign(privateKey, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID)
            .seal()
        return this;
    }

    private addBnsInput(prevTxId: string, outputIndex: number, prevScript: bsv.Script): BnsTxInterface {
        this.tx.addInput(new bsv.Transaction.Input({
            // prevTxId: prevTx.id,
            prevTxId,
            outputIndex: outputIndex,
            script: new bsv.Script(), // placeholder
            output: prevScript, // prevTx.outputs[outputIndex]
        }));
        return this.tx;
    }

    public addFundingInput(utxo: { txId: string, txid?: string, outputIndex: number, script: string, satoshis: number }): BnsTxInterface {
        this.fundingInput = utxo;
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
