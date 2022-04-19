import { ParameterMissingError } from ".";
import { PrefixChainMismatchError } from "./errors/PrefixChainMismatchError";
import { parseExtensionOutputData, parseExtensionOutputData2, PrefixParseResult, prevOutpointFromTxIn, validatePrefixTree } from "./Helpers";
import { TreeProcessorInterface } from "./interfaces/TreeProcessor.interface";
import { RequiredTransactionPartialResult } from "./interfaces/RequiredTransactionPartialResult.interface";
import { InvalidBnsConstantError, InvalidCharError, InvalidCurrentDimensionError, InvalidDupHashError } from "./errors/OutputErrors";
import { bsv } from "scryptlib";
import { ExtensionOutputData } from "./interfaces/ExtensionOutputData.interface";
import { letters } from "./Constants";
import { MintInfo } from "./interfaces/NFT/MintInfo.interface";

export class TreeProcessor implements TreeProcessorInterface {

    public async validatePrefixTree(rawtxs: string[]): Promise<PrefixParseResult> {
         return validatePrefixTree(rawtxs);
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
        let prefixMap = {};
        prefixMap[`${Buffer.from(rootTx.hash, 'hex').reverse().toString('hex') + '00000000'}`] = rootTx;
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
        for (let o = 1; o < letters.length; o++) {
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
