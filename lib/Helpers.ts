import * as bsv from 'bsv';
import { num2bin, toHex } from 'scryptlib/dist';
import { getPreimage } from 'scryptlib';
 
export const sighashType2Hex = s => s.toString(16)

const Signature = bsv.crypto.Signature;
export const sighashTypeAll = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
export const sighashTypeSingle = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_SINGLE | Signature.SIGHASH_FORKID;
const MSB_THRESHOLD = 0x7e;
 
export const prevOutpointFromTxIn = (txIn) => {
    const prevTxId = txIn.prevTxId.toString('hex');
    console.log('prevTxId', prevTxId);
    const outputIndex = txIn.outputIndex;
    return {
        outputIndex,
        prevTxId,
        prevOutpoint: Buffer.from(prevTxId, 'hex').reverse().toString('hex') + intToLE(outputIndex)
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

export interface PrefixParseResult {    
    rawtxIndexForClaim: number;
    nameString: string;
    isClaimed: boolean;
}
 