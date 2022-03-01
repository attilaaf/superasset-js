import { ParameterListInsufficientSpendError, ParameterMissingError } from ".";
import * as bsv from 'bsv';
import { PrefixChainMismatchError } from "./errors/PrefixChainMismatchError";
import { PrefixParseResult } from "./interfaces/PrefixParseResult.interface";
import { parseExtensionOutputData, prevOutpointFromTxIn } from "./Helpers";
import { TreeProcessorInterface } from "./interfaces/TreeProcessor.interface";
import { RequiredTransactionPartialResult } from "./interfaces/RequiredTransactionPartialResult.interface";
import { InvalidBnsConstantError, InvalidCharError, InvalidCurrentDimensionError, InvalidDupHashError } from "./errors/OutputErrors";
import { buildContractClass, toHex, signTx, Ripemd160, Sig, PubKey, Bool, Bytes, compile, num2bin, getPreimage } from "scryptlib";
import { bnsclaim } from "./bnsclaim_release_desc";
import { ExtensionOutputData } from "./interfaces/ExtensionOutputData.interface";
import { BnsContractConfig } from "./interfaces/BnsContractConfig.interface";
import { BnsTx } from "./BnsTx";
import { BnsTxInterface } from "./interfaces/BnsTx.interface";

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
/**
 * Process the transaction tree
 */
export class TreeProcessor implements TreeProcessorInterface { 
    public async validatePrefixTree(rawtxs: string[]): Promise<PrefixParseResult> {
        const rootTx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const calculatedRoot = (await rootTx.hash()).toString('hex');
        let prefixMap = {};
        prefixMap[`${calculatedRoot + '00000000'}`] = rootTx;
        let nameString = '';
        let prevPotentialClaimNft = '';
        let prevTx = rootTx;
        for (let i = 1; i < rawtxs.length; i++) {  
            const tx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[i], 'hex'));
            const txId = (await tx.hash()).toString('hex');
            const { prevOutpoint, outputIndex, prevTxId } = prevOutpointFromTxIn(tx.txIns[0]);
            // Enforce that each spend in the chain spends something from before
            if (!prefixMap[prevOutpoint]) {
                // Perhaps this is the claimNFT being spent?
                if (prevPotentialClaimNft === prevOutpoint) {
                    // Found a spend of a claim, return the position of the previous index then
                    // Return because we have successfully resolved the prefix tree to the location of the claim NFT that was spent.
                    return {
                        rawtxIndexForClaim: i - 1,
                        nameString,
                        isClaimed: true,
                    }
                } else {
                    throw new PrefixChainMismatchError();
                }
            } else {
                // Do not concat the root node, skip it
                if (i > 1) {
                    const prevTxOut = prevTx.txOuts[outputIndex];
                    const letter = prevTxOut.script.chunks[5].buf.toString('ascii');
                    nameString += letter; // Add the current letter that was spent
                }
            }
            // Clear off the map to ensure a rawtx must spend something directly of it's parent
            prefixMap = {};
            prevPotentialClaimNft = txId + '00000000'; // Potential NFT is always at position 1
            for (let o = 1; o < 38; o++) {  
                const buf = Buffer.allocUnsafe(4);
                buf.writeInt32LE(o);
                const outNumString = buf.toString('hex');
                prefixMap[txId + outNumString] = tx.txOuts[o];
            }
            prevTx = tx;
        }
        if (nameString === '') {
            throw new ParameterListInsufficientSpendError();
        }
        return {
            rawtxIndexForClaim: rawtxs.length - 1,
            nameString,
            isClaimed: false,
        }
    }

    public async getRequiredTransactionPartial(name: string, rawtxs: string[]): Promise<RequiredTransactionPartialResult> {
        const rootTx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const calculatedRoot = (await rootTx.hash()).toString('hex');
        let prefixMap = {};
        prefixMap[`${calculatedRoot + '00000000'}`] = rootTx;
        let nameString = '';
        let prevPotentialClaimNft = '';
        let prevTx = rootTx;
        let prevOutput: ExtensionOutputData | null = null;
        // For each letter of the name
        const extensionData = await parseExtensionOutputData(rootTx, 0);
        if (extensionData?.bnsConstant !== 'bns1') {
            throw new InvalidBnsConstantError('invalid bnsConstant');
        }
        if (extensionData?.dupHash !== '0000000000000000000000000000000000000000') {
            throw new InvalidDupHashError('invalid dupHash');
        }
        if (extensionData?.currentDimension !== 20) {
            throw new InvalidCurrentDimensionError('invalid currentDimension');
        }
        if (extensionData?.charHex !== 'ff') {
            throw new InvalidCharError('invalid charHex');
        }
        for (let i = 1; i < rawtxs.length; i++) {  
            const tx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[i], 'hex'));
            const txId = (await tx.hash()).toString('hex');
            const { prevOutpoint, outputIndex, prevTxId } = prevOutpointFromTxIn(tx.txIns[0]);
            // Enforce that each spend in the chain spends something from before
            if (!prefixMap[prevOutpoint]) {
                throw new PrefixChainMismatchError();
            } else {
                // Do not concat the root node, skip it
                if (i > 1) {
                    const prevTxOut = prevTx.txOuts[outputIndex];
                    prevOutput = await parseExtensionOutputData(prevTx, outputIndex);
                    if (!prevOutput) {
                        console.log('Should not happen prevOutput is null');
                        throw new PrefixChainMismatchError();
                    }
                    nameString += prevOutput.char; // Add the current letter that was spent
                }
            }
            // Clear off the map to ensure a rawtx must spend something directly of it's parent
            prefixMap = {};
            prevPotentialClaimNft = txId + '00000000';  
            for (let o = 1; o < 38; o++) {  
                const buf = Buffer.allocUnsafe(4);
                buf.writeInt32LE(o);
                const outNumString = buf.toString('hex');
                prefixMap[txId + outNumString] = tx.txOuts[o];
            }
            prevTx = tx;
        }
        let i = 0; // The position of the next letter to get
        if (nameString === '') {
            throw new ParameterListInsufficientSpendError();
        }  else {
            i = name.indexOf(nameString);
            if (i === -1) {
                throw new ParameterMissingError();
            }
            i = i + 1;
        }
        if (prevOutput === null) {
            throw new ParameterMissingError();
        } 

        const nextMissingChar = name.charAt(i);
        const bnsContractConfig: BnsContractConfig = this.getBnsContractConfig(prevOutput.issuerPkh);
        const requiredBnsTx: BnsTxInterface = new BnsTx(bnsContractConfig, prevOutput, this.buildRequiredTx(bnsContractConfig, prevOutput, prevTx, nextMissingChar));
        // Construct the transaction as it would need to be minus the funding input and change output
        return {
            success: false,
            prevOutput,
            bnsContractConfig,
            fulfilledName: nameString,
            nextMissingChar,
            requiredBnsTx,
            prevTx,
        };
    }

    private getBnsContractConfig(issuerPkh: string): BnsContractConfig {
        const letterOutputSatoshisInt = 800;
        // If changing to 'release' then update the outputSize to 'f2' (to reflect smaller output size). Use 'fc' for debug.
        //const outputSize = 'fc'; // Change to fc for debug or f2 for release
        const BNS = buildContractClass(bnsclaim());
        const tx = new bsv.Tx();
        const bnsConstant = Buffer.from('bns1', 'utf8').toString('hex');
        const claimNftScriptSCRIPT = buildNFTPublicKeyHashOut(num2bin(0, 36), issuerPkh);
        const claimNftScript = claimNftScriptSCRIPT.toHex();
        const claimOutputSatoshisInt = 300;
        const claimOutputSatoshisHex = num2bin(claimOutputSatoshisInt, 8)
        const outputSize = '3f'; // SANFT: 'f2' for release' and 'fc' for debug or P2NFTPKH: 3f (63 bytes)
        const claimOutput = num2bin(claimOutputSatoshisInt, 8) + outputSize + claimNftScript;
        const claimOutputHash160 = bsv.Hash.ripemd160(Buffer.from(claimOutput, 'hex')).toString('hex');  
        return {///Hash.sha256Ripemd160
            BNS,
            miningFee: 13000,
            bnsConstant,
            claimOutputHash160,
            claimOutput,
            claimOutputSatoshisInt,
            claimOutputSatoshisHex,
            letterOutputSatoshisInt,
            rootCharHex: 'ff',
        }
    }

    private addClaimOutput(bnsContractConfig: BnsContractConfig, tx: bsv.Tx): bsv.Tx {
        const valueBn = new bsv.Bn(bnsContractConfig.claimOutputSatoshisInt);
        const script = new bsv.Script().fromHex(bnsContractConfig.claimOutput);
        const scriptVi = bsv.VarInt.fromNumber(script.toBuffer().length);
        const txOut = new bsv.TxOut().fromObject({
            valueBn: valueBn,
            scriptVi: scriptVi,
            script: script
        });
        tx.addTxOut(txOut);
        return tx;
    }

    private addExtensionOutputs(scryptBns: any, bnsContractConfig: BnsContractConfig, tx: bsv.Tx, prevOutput: ExtensionOutputData) {
        const dividedSatoshisBytesWithSize = new Bytes(bnsContractConfig.claimOutputSatoshisHex + 'fd' + num2bin(scryptBns.lockingScript.toHex().length / 2, 2)); // Change to length of script 
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
            const newLockingScript = getLockingScriptForCharacter(scryptBns.lockingScript.toASM(), letter, currentDimension, dupHash);
            lockingScriptsLevel0[letter] = newLockingScript;
            step2ExtendLockingScripts.push({
                newLockingScript,
                dupHash
            });
            const valueBn = new bsv.Bn(bnsContractConfig.letterOutputSatoshisInt);
            const script = new bsv.Script().fromHex(newLockingScript.toHex());
            const scriptVi = bsv.VarInt.fromNumber(script.toBuffer().length);
            const txOut = new bsv.TxOut().fromObject({
                valueBn: valueBn,
                scriptVi: scriptVi,
                script: script
            });
            tx.addTxOut(txOut);
        }
        return tx;
    }
 
    private buildRequiredTx(bnsContractConfig: BnsContractConfig, prevOutput: ExtensionOutputData, prevTx: bsv.Tx, nextMissingChar: string): bsv.Tx {
        // Add Extension Letter Outputs
        const scryptBns = new bnsContractConfig.BNS(
            new Bytes(bnsContractConfig.bnsConstant),
            new Ripemd160(prevOutput.issuerPkh),
            new Ripemd160(bnsContractConfig.claimOutputHash160),
            new Ripemd160(prevOutput.dupHash),
            prevOutput.currentDimension + 1,
            new Bytes(bnsContractConfig.rootCharHex)
        );
        const asmVars = {
            'Tx.checkPreimageOpt_.sigHashType': sighashTypeBns.toString(16),
        };
        scryptBns.replaceAsmVars(asmVars);
        let tx: bsv.Tx = new bsv.Tx();

        // Add the input tx to unlock
        const txIn = new bsv.TxIn().fromProperties(
            prevOutput.txIdBuf,  
            prevOutput.outputIndex,
            new bsv.Script()
        );
        tx.addTxIn(txIn);

        tx = this.addClaimOutput(bnsContractConfig, tx);
        tx = this.addExtensionOutputs(scryptBns, bnsContractConfig, tx, prevOutput);
        // Only thing missing is a funding input and a change output.
        // It can be added like:
        // ...
        /*
           const updatedTx = TreeProcessor.attachUnlockAndChangeOutput(prevOutput, bnsContractConfig, tx, txOut);
           // Now attach required funding input by summing the total outputs and then adding at least enough to cover mining fee
        */
        return tx;
    }
}
