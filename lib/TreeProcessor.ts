import { ParameterMissingError } from ".";
import { PrefixChainMismatchError } from "./errors/PrefixChainMismatchError";
import { PrefixParseResult } from "./interfaces/PrefixParseResult.interface";
import { parseExtensionOutputData, parseExtensionOutputData2, prevOutpointFromTxIn } from "./Helpers";
import { TreeProcessorInterface } from "./interfaces/TreeProcessor.interface";
import { RequiredTransactionPartialResult } from "./interfaces/RequiredTransactionPartialResult.interface";
import { InvalidBnsConstantError, InvalidCharError, InvalidCurrentDimensionError, InvalidDupHashError } from "./errors/OutputErrors";
import { bsv } from "scryptlib";
import { ExtensionOutputData } from "./interfaces/ExtensionOutputData.interface";
const Signature = bsv.crypto.Signature;
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
            return {
                rawtxIndexForClaim: -1,
                nameString,
                isClaimed: false,
            }
        }

        if (nameString === '') {
            //    throw new ParameterListInsufficientSpendError();
        }
        return {
            rawtxIndexForClaim: rawtxs.length - 1,
            nameString,
            isClaimed: false,
        }
    }

    public async getRequiredTransactionPartial(name: string, rawtxs: string[]): Promise<RequiredTransactionPartialResult> {
        if (!rawtxs || !rawtxs.length) {
            return {
                tx: null,
                fulfilledName: '',
                lastExtensionOutput: null,
                expectedExtensionOutput: null,

            }
        }

        if (rawtxs.length === 1) {
            const tx = new bsv.Transaction(rawtxs[0]);
            await this.validateRootTxFields(tx);
            const expectedExtensionOutput = await parseExtensionOutputData2(tx.outputs[0], tx.hash, 0, tx);
            if (!expectedExtensionOutput) {
                throw new PrefixChainMismatchError();
            }
            return {
                tx,
                fulfilledName: '',
                lastExtensionOutput: null,
                expectedExtensionOutput,

            }
        }

        const rootTx = new bsv.Transaction(rawtxs[0]);
        console.log('rawtxs', rawtxs.length);
        let prefixMap = {};
        prefixMap[`${rootTx.hash + '00000000'}`] = rootTx;
        let nameString = '';
        let currTx: bsv.Transaction | null = null;
        let lastExtensionOutput: ExtensionOutputData | null = null;
        for (let i = 0; i < rawtxs.length; i++) {
            currTx = new bsv.Transaction(rawtxs[i]);
            if (i === 0) {
                await this.validateRootTxFields(currTx);
            } else if (i >= 1) {
                const { prevOutpoint, outputIndex } = prevOutpointFromTxIn(currTx.inputs[0]);
                // Enforce that each spend in the chain spends something from before
                if (!prefixMap[prevOutpoint]) {
                    throw new PrefixChainMismatchError();
                }
                // It is the first spend of the root; bootstrapped
                await this.validateOutputs(currTx)
                lastExtensionOutput = await parseExtensionOutputData2(prefixMap[prevOutpoint].outputs[outputIndex], prefixMap[prevOutpoint].hash, outputIndex, currTx);
                if (!lastExtensionOutput) {
                    throw new PrefixChainMismatchError();
                }
                if (i > 1) {
                    nameString += lastExtensionOutput.char; // Add the current letter that was spent
                    console.log('nameString', nameString);
                }
                // Clear off the map to ensure a rawtx must spend something directly of it's parent
                prefixMap = {};
                for (let o = 1; o < 38; o++) {
                    const buf = Buffer.allocUnsafe(4);
                    buf.writeInt32LE(o);
                    const outNumString = buf.toString('hex');
                    prefixMap[currTx.hash + outNumString] = currTx;
                }
            }
        }

        let missingCharIndex = 0;
        if (nameString !== '') {
            missingCharIndex = name.indexOf(nameString);
            if (missingCharIndex === -1) {
                throw new ParameterMissingError();
            }
            missingCharIndex = missingCharIndex + nameString.length;
        }

        const nextMissingCharHex = name.charCodeAt(missingCharIndex).toString(16);
        let requiredLetterOutputIndex = letters.findIndex((value) => {
            return value === nextMissingCharHex
        });
        requiredLetterOutputIndex++;
        const expectedExtensionOutput = await parseExtensionOutputData2(currTx.outputs[requiredLetterOutputIndex], currTx.hash, requiredLetterOutputIndex, currTx);
        if (!expectedExtensionOutput) {
            throw new PrefixChainMismatchError();
        }
        const partialResult: RequiredTransactionPartialResult = {
            tx: currTx,
            fulfilledName: nameString,
            lastExtensionOutput,
            expectedExtensionOutput
        }
        return partialResult;
    }

    private async validateRootTxFields(rawtx: any) {
        const extensionData = await parseExtensionOutputData(rawtx, 0);
        if (Buffer.from(extensionData?.bnsConstant || '00', 'hex').toString('utf8') !== 'bns1') {
            throw new InvalidBnsConstantError('invalid root bnsConstant');
        }
        if (extensionData?.dupHash !== '0000000000000000000000000000000000000000') {
            throw new InvalidDupHashError('invalid root dupHash');
        }
        if (extensionData?.currentDimension !== 20) {
            throw new InvalidCurrentDimensionError('invalid root currentDimension');
        }
        if (extensionData?.charHex !== 'ff') {
            throw new InvalidCharError('invalid root charHex');
        }
    }

    private async validateOutputs(rawtx: any) {
        for (let o = 1; o < 38; o++) {
            const buf = Buffer.allocUnsafe(4);
            buf.writeInt32LE(o);
            // const outNumString = buf.toString('hex');
            const extensionData = await parseExtensionOutputData(rawtx, o);
            if (!extensionData) {
                throw new Error('invalid extension data');
            }
            if (Buffer.from(extensionData?.bnsConstant || '00', 'hex').toString('utf8') !== 'bns1') {
                throw new InvalidBnsConstantError('invalid bnsConstant');
            }
            if (extensionData?.dupHash === '0000000000000000000000000000000000000000') {
                throw new InvalidDupHashError('invalid dupHash');
            }
            if (extensionData?.currentDimension <= 20 || extensionData?.currentDimension > 85) {
                throw new InvalidCurrentDimensionError('invalid currentDimension');
            }
            if (extensionData?.charHex === 'ff') {
                throw new InvalidCharError('invalid charHex');
            }
        }
    }
}
