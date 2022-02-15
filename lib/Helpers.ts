import * as bsv from 'bsv';
import { ExtensionOutputData } from './interfaces/ExtensionOutputData.interface';

export const sighashType2Hex = s => s.toString(16)
 
export const prevOutpointFromTxIn = (txIn) => {
    const prevTxId = txIn.txHashBuf.toString('hex');
    const outputIndex = txIn.txOutNum;
    const buf = Buffer.allocUnsafe(4);
    buf.writeInt32LE(outputIndex);
    const txOutNumberString = buf.toString('hex');
    return {
        outputIndex,
        prevTxId,
        prevOutpoint: prevTxId + txOutNumberString
    };
}

export const parseExtensionOutputData = (tx: bsv.Tx, outputIndex: number): ExtensionOutputData | null =>  {
    const script = tx.txOuts[outputIndex].script;
    const outputData: ExtensionOutputData = {
        bnsConstant: script.chunks[0].buf.toString('utf8'),
        issuerPkh: script.chunks[1].buf.toString('hex'),
        claimHash: script.chunks[2].buf.toString('hex'),
        dupHash: script.chunks[3].buf.toString('hex'),
        currentDimension: parseInt(script.chunks[4].buf.toString('hex'), 16),
        char: script.chunks[5].buf.toString('utf8'),
        charHex: script.chunks[5].buf.toString('hex'),
    };
    return outputData;
};
