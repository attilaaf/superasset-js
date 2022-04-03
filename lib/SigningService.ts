import * as bsv from 'bsv';
import { SigningServiceInterface } from "./interfaces/SigningService.interface";
import { privateKey, privateKeyStr } from '../privateKey';

export class SigningService implements SigningServiceInterface { 
    constructor(private opts?: { testnet: boolean }) {  
    }
    public async signTx(rawtx: string, lockScript, lockSatoshis, inputIndex, sighashType): Promise<any> {
        const tx = new bsv.Transaction(rawtx);
        const sig = await tx.signTx(tx.toString(), privateKey, lockScript, lockSatoshis, inputIndex, sighashType);
        return sig;
    }
}
 