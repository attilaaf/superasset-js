import * as bsv from 'bsv';
import { ExtensionOutputData } from './interfaces/ExtensionOutputData.interface';

export const sighashType2Hex = s => s.toString(16)
 
export const prevOutpointFromTxIn = (txIn) => {
    const prevTxId = txIn.txHashBuf.toString('hex');
    const outputIndex = txIn.txOutNum;
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

export const parseExtensionOutputData = async (tx: bsv.Tx, outputIndex: number): Promise<ExtensionOutputData | null> =>  {
    const script = tx.txOuts[outputIndex].script;
    const txId = await tx.hash();
    const outputData: ExtensionOutputData = {
        bnsConstant: script.chunks[0].buf.toString('utf8'),
        issuerPkh: script.chunks[1].buf.toString('hex'),
        claimHash: script.chunks[2].buf.toString('hex'),
        dupHash: script.chunks[3].buf.toString('hex'),
        currentDimension: parseInt(script.chunks[4].buf.toString('hex'), 16),
        char: script.chunks[5].buf.toString('utf8'),
        charHex: script.chunks[5].buf.toString('hex'),
        outpointHex: txId.toString() + intToLE(outputIndex),
        txId: txId.toString(),
        txIdBuf: txId,
        script,
        outputIndex
    };
    return outputData;
};
