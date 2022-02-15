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

export const parseExtensionOutputData = (tx: bsv.Tx): ExtensionOutputData | null =>  {
    console.log('tx', tx);
    return null;
};
