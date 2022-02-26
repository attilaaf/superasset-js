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

function buildNFTPublicKeyHashOut(asset, pkh) {
    console.log('pubkey hash out');
    const script = bsv.Script.fromAsmString(`${asset} ${pkh} OP_NIP OP_OVER OP_HASH160 OP_EQUALVERIFY OP_CHECKSIG`);
    console.log('pubkey hash out s', script);
    return script;
}
function getLockingScriptForCharacter(lockingScriptASM, letter, dimensionCount, dupHash) {
    console.log('lockingScriptASM', lockingScriptASM);
    const slicedPrefix = lockingScriptASM.substring(0, 90);
    const slicedSuffix = lockingScriptASM.substring(138);
    const replaced = slicedPrefix + ' ' + dupHash + ' ' + num2bin(dimensionCount, 1) + ' ' + letter + ' ' + slicedSuffix;
    console.log('replaced', replaced);
    return bsv.Script.fromAsmString(replaced);
}

const Signature = bsv.Sig;
const sighashTypeBns = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
const asmVars = {
    'Tx.checkPreimageOpt_.sigHashType': sighashTypeBns.toString(16),
};
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
        const requiredTx = this.buildRequiredTx(prevOutput, prevTx, nextMissingChar);
        // Construct the transaction as it would need to be minus the funding input and change output
        return {
            success: false,
            fulfilledName: nameString,
            nextMissingChar,
            requiredTx,
            prevTx,
        };
    }

    private getBnsContractConfig(issuerPkh: string): BnsContractConfig {
        const letterOutputSatoshisInt = 800;
        const letterOutputSatoshisHex = num2bin(letterOutputSatoshisInt, 8);
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
            bnsConstant,
            claimOutputHash160,
            claimOutput,
            claimOutputSatoshisInt,
            claimOutputSatoshisHex,
            letterOutputSatoshisInt,
            letterOutputSatoshisHex,
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
        console.log('addExt', scryptBns.lockingScript);
        const dividedSatoshisBytesWithSize = new Bytes(bnsContractConfig.claimOutputSatoshisHex + 'fd' + num2bin(scryptBns.lockingScript.toHex().length / 2, 2)); // Change to length of script 
        const lockingScriptsLevel0 = {};
        let dupHashesLevel0;
        // For the initial spend we must combine the root outpoint as part of the dedup hash
       // const parentOutpoint = Buffer.from(deployTx.id, 'hex').reverse().toString('hex') + '00000000'; 
        const combinedDupHash = prevOutput.dupHash + prevOutput.outpointHex + prevOutput.charHex; // 'ff'; // The parent root node is 'ff' 
        const currentDimension = prevOutput.currentDimension + 1;
       // console.log('rootOutpoint', currentDimension, prevOutput.outpointHex, combinedDupHash);
        const dupHash = bsv.Hash.ripemd160(Buffer.from(combinedDupHash, 'hex')).toString('hex');
       // console.log('dupHash', dupHash);
        let step2ExtendLockingScripts: any = [];
        for (let i = 0; i < letters.length; i++) {
            let letter = letters[i];
            dupHashesLevel0 = dupHash;
            console.log('here');
            const newLockingScript = getLockingScriptForCharacter(scryptBns.lockingScript.toASM(), letter, currentDimension, dupHash);
            lockingScriptsLevel0[letter] = newLockingScript;
            const lockingScriptSizeNew = newLockingScript.toHex().length / 2;

            if (i == 0) {
                console.log('tree before', scryptBns.lockingScript);
                console.log('lockingScriptSizeNew size', lockingScriptSizeNew, newLockingScript, newLockingScript.toHex(), num2bin(lockingScriptSizeNew, 2));
            }

            step2ExtendLockingScripts.push({
                newLockingScript,
                dupHash
            });
            console.log('newLockingScript', newLockingScript);
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

    public attachUnlockAndChangeOutput(tx: bsv.Tx, txOut: bsv.TxOut): bsv.Tx {
       /* const preimage = generatePreimage(true, tx, prevOutput.script, prevOutput.satoshis, sighashTypeBns);
        // const changeAddress = new Bytes(privateKey.toAddress().toHex().substring(2));
         //const changeSatoshis = num2bin(tx.getChangeAmount(), 8);
         const issuerPubKey = new Bytes('0000');
         // Signature is only needed for release
         // const sig = signTx(tx, privateKey, output.script, output.satoshis, 0, sighashTypeBns);
         const issuerSig = new Bytes('0000');
         // Attach the claim NFT manually to extend
       //  console.log('bnsContractConfig.claimOutput should be full output: ', bnsContractConfig.claimOutput)
         const scriptUnlock = scryptBns.extend(
             preimage,
             bnsContractConfig.letterOutputSatoshisHex + SIZE_NEEDED_HERE?,
             new Bytes(bnsContractConfig.claimOutput), // Todo: check if this is the full output
             changeAddress,
             new Bytes(changeSatoshis),
             new Bool(false),
             issuerSig,
             issuerPubKey).toScript()
         });
 
         const txIn = new bsv.TxIn().fromProperties(
             prevOutput.txIdBuf, // Todo maybe it is reversed
             prevOutput.outputIndex,
             scriptUnlock
         );
         const tx = new bsv.Tx();
 
 
            
         tx.addTxIn(txIn)*/
        return tx;
    }

    private buildRequiredTx(prevOutput: ExtensionOutputData, prevTx: bsv.Tx, nextMissingChar: string): bsv.Tx {
        const bnsContractConfig: BnsContractConfig = this.getBnsContractConfig(prevOutput.issuerPkh);
        // Add Extension Letter Outputs
        const scryptBns = new bnsContractConfig.BNS(
            new Bytes(bnsContractConfig.bnsConstant),
            new Ripemd160(prevOutput.issuerPkh),
            new Ripemd160(bnsContractConfig.claimOutputHash160),
            new Ripemd160(prevOutput.dupHash),
            prevOutput.currentDimension + 1,
            new Bytes(bnsContractConfig.rootCharHex)
        );
        console.log('asmVars', asmVars);
        scryptBns.replaceAsmVars(asmVars);
        let tx: bsv.Tx = new bsv.Tx();
        // Add NFT Output
        /*F
626e7331 ada084074f9a305be43e3366455db062d6d36697 42a46196fbd71ee92fa0e08143942c924bb62130 ae82b8084c059b696514c86519d31a6560e1a404 16 ff OP_8 OP_PICK OP_NOTIF OP_OVER 54 OP_LESSTHANOREQUAL OP_VERIFY OP_3DUP OP_DROP 14 OP_NUMEQUAL OP_IF OP_DUP OP_15 OP_PICK 68 OP_SPLIT OP_DROP 44 OP_SPLIT OP_NIP OP_CAT OP_NIP OP_ENDIF OP_13 OP_PICK OP_4 OP_CAT OP_7 OP_PICK OP_CAT 14 OP_CAT OP_6 OP_PICK OP_CAT 14 OP_CAT OP_5 OP_PICK OP_CAT 14 OP_CAT OP_OVER OP_16 OP_PICK b300 OP_SPLIT OP_DROP b200 OP_SPLIT OP_NIP OP_CAT OP_RIPEMD160 OP_CAT OP_1 OP_CAT OP_3 OP_PICK OP_1ADD OP_1 OP_NUM2BIN OP_CAT OP_1 OP_CAT OP_15 OP_PICK 6b 11 OP_PICK 6b OP_SPLIT OP_DROP 69 OP_SPLIT OP_NIP 00 OP_CAT OP_BIN2NUM OP_ADD OP_SPLIT OP_DROP b300 OP_SPLIT OP_NIP OP_6 OP_PICK OP_15 OP_PICK OP_RIPEMD160 OP_EQUALVERIFY OP_14 OP_PICK OP_2 OP_PICK OP_CAT 2d OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 5f OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 30 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 31 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 32 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 33 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 34 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 35 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 36 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 37 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 38 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 39 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 61 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 62 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 63 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 64 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 65 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 66 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 67 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 68 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 69 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6a OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6b OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6c OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6d OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6e OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6f OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 70 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 71 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 72 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 73 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 74 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 75 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 76 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 77 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 78 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 79 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 7a OP_CAT OP_OVER OP_CAT OP_13 OP_PICK OP_CAT 1976a914 OP_CAT OP_14 OP_PICK OP_CAT 88ac OP_CAT OP_HASH256 11 OP_PICK 12 OP_PICK OP_SIZE OP_NIP OP_8 OP_SUB OP_SPLIT OP_DROP 12 OP_PICK OP_SIZE OP_NIP 28 OP_SUB OP_SPLIT OP_NIP OP_EQUALVERIFY OP_2DROP OP_DROP OP_ELSE OP_6 OP_PICK OP_HASH160 OP_5 OP_PICK OP_EQUALVERIFY OP_7 OP_PICK OP_7 OP_PICK OP_CHECKSIGVERIFY OP_ENDIF OP_13 OP_PICK OP_HASH256 OP_1 OP_SPLIT OP_SWAP OP_BIN2NUM OP_1ADD OP_SWAP OP_CAT 3044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817980220 OP_SWAP OP_CAT 193 OP_CAT 02b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0 OP_CHECKSIG OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP
        */
        console.log('scryptBns', scryptBns);
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
