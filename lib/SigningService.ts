import * as bsv from 'bsv';
import { SigningServiceInterface } from "./interfaces/SigningService.interface";
import { privateKey, privateKeyStr } from '../privateKey';
import { signTx } from 'scryptlib/dist';

export class SigningService implements SigningServiceInterface { 
    constructor(private opts?: { testnet: boolean }) {  
    }
    public async signTx(rawtx: string, lockScript, lockSatoshis, inputIndex, sighashType): Promise<any> {
        const tx = new bsv.Transaction(rawtx);
        return await signTx(tx, privateKey, lockScript, lockSatoshis, inputIndex, sighashType);
    }
}
 