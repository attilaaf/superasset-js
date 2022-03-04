import { ParameterListInsufficientSpendError, ParameterMissingError } from ".";
import { PrefixChainMismatchError } from "./errors/PrefixChainMismatchError";
import { PrefixParseResult } from "./interfaces/PrefixParseResult.interface";
import { parseExtensionOutputData, prevOutpointFromTxIn } from "./Helpers";
import { TreeProcessorInterface } from "./interfaces/TreeProcessor.interface";
import { RequiredTransactionPartialResult } from "./interfaces/RequiredTransactionPartialResult.interface";
import { InvalidBnsConstantError, InvalidCharError, InvalidCurrentDimensionError, InvalidDupHashError } from "./errors/OutputErrors";
import { buildContractClass, toHex, signTx, Ripemd160, Sig, PubKey, Bool, Bytes, bsv, compile, num2bin, getPreimage } from "scryptlib";
import { bnsclaim } from "./bnsclaim_release_desc";
import { ExtensionOutputData } from "./interfaces/ExtensionOutputData.interface";
import { BnsContractConfig } from "./interfaces/BnsContractConfig.interface";
import { BnsTx } from "./BnsTx";
import { BnsTxInterface } from "./interfaces/BnsTx.interface";

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
/**
 * Process the transaction tree
 */
export class TreeProcessor implements TreeProcessorInterface { 
    public async validatePrefixTree(rawtxs: string[]): Promise<PrefixParseResult> {
        const rootTx = new bsv.Transaction(rawtxs[0]);
        const calculatedRoot = rootTx.hash;
        let prefixMap = {};
        prefixMap[`${calculatedRoot + '00000000'}`] = rootTx;
        let nameString = '';
        let prevPotentialClaimNft = '';
        let prevTx = rootTx;

        // todo: We MUST validate that the root (first tx) is the actual root
        const rootExtOutputData: ExtensionOutputData | null = await parseExtensionOutputData(rootTx, 0);
        if (!rootExtOutputData || rootExtOutputData.charHex !== 'ff') {
            throw new Error('Expected first transaction to be root BNS tree');
        }
        for (let i = 1; i < rawtxs.length; i++) {  
            const tx = new bsv.Transaction(rawtxs[i]);
            const txid = tx.hash;
            const { prevOutpoint, outputIndex, prevTxId } = prevOutpointFromTxIn(tx.inputs[0]);
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
                    const prevTxOut = prevTx.outputs[outputIndex];
                    const letter = prevTxOut.script.chunks[5].buf.toString('ascii');
                    nameString += letter; // Add the current letter that was spent
                }
            }
            // Clear off the map to ensure a rawtx must spend something directly of it's parent
            prefixMap = {};
            prevPotentialClaimNft = txid + '00000000'; // Potential NFT is always at position 1
            for (let o = 1; o < 38; o++) {  
                const buf = Buffer.allocUnsafe(4);
                buf.writeInt32LE(o);
                const outNumString = buf.toString('hex');
                prefixMap[txid + outNumString] = tx.outputs[o];
            }
            prevTx = tx;
        }
       
        if (rawtxs.length === 1) {
            console.log('rawtxs length is 1')
            return {
                rawtxIndexForClaim: -1,
                nameString,
                isClaimed: false,
            }
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
        const rootTx = new bsv.Transaction(rawtxs[0]);
        const calculatedRoot = rootTx.hash;
        let prefixMap = {};
        prefixMap[`${calculatedRoot + '00000000'}`] = rootTx;
        let nameString = '';
        let prevPotentialClaimNft = '';
        let prevTx = rootTx;
        let prevOutput: ExtensionOutputData | null = null;
        
        if (rawtxs && rawtxs[0]) {
            prevOutput = await parseExtensionOutputData(rootTx, 0);
        }

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
            const tx = new bsv.Transaction(rawtxs[i]);
            const txId = tx.hash;
            const { prevOutpoint, outputIndex, prevTxId } = prevOutpointFromTxIn(tx.inputs[0]);
            // Enforce that each spend in the chain spends something from before
            if (!prefixMap[prevOutpoint]) {
                throw new PrefixChainMismatchError();
            } else {
                // Do not concat the root node, skip it
                if (i > 1) {
                    const prevTxOut = prevTx.outputs[outputIndex];
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
                prefixMap[txId + outNumString] = tx.outputs[o];
            }
            prevTx = tx;
        }
        let i = 0; // The position of the next letter to get
        if (nameString === '') {
            // do nothing because it means we have just the BNS root
            //  throw new ParameterListInsufficientSpendError();
        }  else {
            i = name.indexOf(nameString);
            if (i === -1) {
                throw new ParameterMissingError();
            }
            i = i + nameString.length;
        }
        if (prevOutput === null) {
            throw new ParameterMissingError();
        } 
        const nextMissingChar = name.charAt(i);
        const bnsContractConfig: BnsContractConfig = this.getBnsContractConfig(prevOutput.issuerPkh);
        const requiredBnsTx: BnsTxInterface = this.buildRequiredTx(bnsContractConfig, prevOutput, prevTx, nextMissingChar);
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
        const bnsConstant = Buffer.from('bns1', 'utf8').toString('hex');
        const claimNftScriptSCRIPT = buildNFTPublicKeyHashOut(num2bin(0, 36), issuerPkh);
        const claimNftScript = claimNftScriptSCRIPT.toHex();
        const claimOutputSatoshisInt = 300;
 
        const outputSize = num2bin(claimNftScript.length / 2, 1); // SANFT: 'f2' for release' and 'fc' for debug or P2NFTPKH: 3f (63 bytes)
        const claimOutput = num2bin(claimOutputSatoshisInt, 8) + outputSize + claimNftScript;
        const claimOutputHash160 = bsv.crypto.Hash.ripemd160(Buffer.from(claimOutput, 'hex')).toString('hex');  
        return {///Hash.sha256Ripemd160
            BNS,
            miningFee: 14000,
            bnsConstant,
            claimOutputHash160,
            claimOutput,
            claimNftScript,
            claimOutputSatoshisInt,
            letterOutputSatoshisInt,
            rootCharHex: 'ff',
        }
    }

    private buildRequiredTx(bnsContractConfig: BnsContractConfig, prevOutput: ExtensionOutputData, prevTx: bsv.Transaction, nextMissingChar: string): bsv.Tx {
        const tx = new bsv.Transaction();
        let bnsTx = new BnsTx(bnsContractConfig, prevOutput, tx, true);
        bnsTx.addBnsInput(prevTx);
        bnsTx.addClaimOutput();
        bnsTx.addExtensionOutputs();
        return bnsTx;
    }
}
