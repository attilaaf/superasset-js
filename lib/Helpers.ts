import * as bsv from 'bsv';
import { num2bin, toHex } from 'scryptlib/dist';
import { ExtensionOutputData } from './interfaces/ExtensionOutputData.interface';
import { getPreimage } from 'scryptlib';
import { PrefixChainMismatchError } from './errors/PrefixChainMismatchError';

export const sighashType2Hex = s => s.toString(16)

const MSB_THRESHOLD = 0x7e;
export const prevOutpointFromTxIn = (txIn) => {
    const prevTxId = txIn.prevTxId.toString('hex');
    const outputIndex = txIn.outputIndex;
    return {
        outputIndex,
        prevTxId,
        prevOutpoint: prevTxId + intToLE(outputIndex)
    };
}
export const intToLE = (i) => {
    const buf = Buffer.allocUnsafe(4);
    buf.writeInt32LE(i);
    return buf.toString('hex');
}

export function buildNFTPublicKeyHashOut(asset, pkh) {
    const script = bsv.Script.fromASM(`${asset} ${pkh} OP_NIP OP_OVER OP_HASH160 OP_EQUALVERIFY OP_CHECKSIG`);
    return script;
}

export function generatePreimage(isOpt, txLegacy, lockingScriptASM, satValue, sighashType, idx = 0) {
    let preimage: any = null;
    if (isOpt) {
        for (let i = 0; ; i++) {
            // malleate tx and thus sighash to satisfy constraint
            txLegacy.nLockTime = i;
            const preimage_ = getPreimage(txLegacy, lockingScriptASM, satValue, idx, sighashType);
            let preimageHex = toHex(preimage_);
            preimage = preimage_;
            const h = bsv.crypto.Hash.sha256sha256(Buffer.from(preimageHex, 'hex'));
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

export const createOutputFromSatoshisAndHex = (satoshis: number, scriptHex: string): string => {
    const len = scriptHex.length / 2;
    let outputLen = '';
    if (len < 255) {
        outputLen = len.toString(16); // // num2bin(len, 2);
    } else if (len >= 255) {
        outputLen = 'fd' + num2bin(len, 2);
    }
    return num2bin(satoshis, 8) + outputLen + scriptHex;
}

export const parseExtensionOutputData = async (tx: bsv.Transaction, outputIndex: number): Promise<ExtensionOutputData | null> => {
    const script = tx.outputs[outputIndex].script;
    const satoshis = tx.outputs[outputIndex].satoshis;
    const txId = tx.hash;
    const outputData: ExtensionOutputData = {
        bnsConstant: script.chunks[0].buf.toString('hex'),
        issuerPkh: script.chunks[1].buf.toString('hex'),
        claimHash: script.chunks[2].buf.toString('hex'),
        dupHash: script.chunks[3].buf.toString('hex'),
        currentDimension: parseInt(script.chunks[4].buf.toString('hex'), 16),
        char: script.chunks[5].buf.toString('utf8'),
        charHex: script.chunks[5].buf.toString('hex'),
        outpointHex: Buffer.from(txId, 'hex').reverse().toString('hex') + intToLE(outputIndex),
        txId: txId,
        txIdBuf: Buffer.from(txId, 'hex').reverse(),
        script,
        outputIndex,
        satoshis,
        tx
    };
    return outputData;
};

export const parseExtensionOutputData2 = async (out: any, txId: string, outputIndex: number, tx: bsv.Transaction): Promise<ExtensionOutputData | null> => {
    const script = out.script;
    const satoshis = out.satoshis;
    const outputData: ExtensionOutputData = {
        bnsConstant: script.chunks[0].buf.toString('hex'),
        issuerPkh: script.chunks[1].buf.toString('hex'),
        claimHash: script.chunks[2].buf.toString('hex'),
        dupHash: script.chunks[3].buf.toString('hex'),
        currentDimension: parseInt(script.chunks[4].buf.toString('hex'), 16),
        char: script.chunks[5].buf.toString('utf8'),
        charHex: script.chunks[5].buf.toString('hex'),
        outpointHex: Buffer.from(txId, 'hex').reverse().toString('hex') + intToLE(outputIndex),
        txId: txId,
        txIdBuf: Buffer.from(txId, 'hex').reverse(),
        script,
        outputIndex,
        satoshis,
        tx
    };
    return outputData;
};

export interface PrefixParseResult {    
    rawtxIndexForClaim: number;
    nameString: string;
    isClaimed: boolean;
}

export async function validatePrefixTree(rawtxs: string[]): Promise<PrefixParseResult> {
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
    return {
        rawtxIndexForClaim: rawtxs.length - 1,
        nameString,
        isClaimed: false,
    }
}
