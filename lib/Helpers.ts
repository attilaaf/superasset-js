import * as bsv from 'bsv';
import { ExtensionOutputData } from './interfaces/ExtensionOutputData.interface';

export const sighashType2Hex = s => s.toString(16)
 
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

export const parseExtensionOutputData = async (tx: bsv.Transaction, outputIndex: number): Promise<ExtensionOutputData | null> =>  {
    const script = tx.outputs[outputIndex].script;
    const satoshis = tx.outputs[outputIndex].satoshis;
    const txId =tx.hash

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
    };
    return outputData;
};


export const parseExtensionOutputData2 = async (out: any, txId: string, outputIndex: number): Promise<ExtensionOutputData | null> =>  {
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
    };
    return outputData;
};

 