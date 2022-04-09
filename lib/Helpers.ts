import * as bsv from 'bsv';
import { toHex } from 'scryptlib/dist';
import { ExtensionOutputData } from './interfaces/ExtensionOutputData.interface';
import { getPreimage } from 'scryptlib';

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


export const parseExtensionOutputData = async (tx: bsv.Transaction, outputIndex: number): Promise<ExtensionOutputData | null> => {
    const script = tx.outputs[outputIndex].script;
    const satoshis = tx.outputs[outputIndex].satoshis;
    const txId = tx.hash

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
        txIdBuf: Buffer.from(txId, 'hex'),
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
        txIdBuf: Buffer.from(txId, 'hex'),
        script,
        outputIndex,
        satoshis,
        tx
    };
    return outputData;
};

