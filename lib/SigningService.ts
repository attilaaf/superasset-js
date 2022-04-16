import * as bsv from 'bsv';
import { SigningServiceInterface } from "./interfaces/SigningService.interface";
import { privateKey } from '../privateKey';
import { Sig, signTx } from 'scryptlib';
import * as axios from 'axios';

export class SigningService implements SigningServiceInterface {
    constructor(private opts?: { testnet: boolean }) {
    }
    public async signTx(rawtx: string, lockScript, lockSatoshis, inputIndex, sighashType, remote = false): Promise<any> {
        console.log('------------------------signTx-------------------------------------------', rawtx);
        if (remote) {
           let sig1: any = null;
            try {
                console.log('signTx------------------------------------------- remote ');
                const res: any = await axios.default.post(`${process.env.API_SERVICE_URL}/api/sign`, {
                    rawtx,
                    lockScript: lockScript.toHex(),
                    lockSatoshis,
                    inputIndex,
                    sighashType
                });
                sig1 = new Sig(res.data.result.sig);
                return sig1; 
            } catch (error: any) {
                console.log('threw --------');
                throw error
            }
        } else {
            console.log('signTx------------------------------------------- local');
            const tx = new bsv.Transaction(rawtx);
            console.log('tx-------------------------------------------', tx, privateKey);
            let sig2 = await signTx(tx, privateKey, lockScript/*lockScript.toASM()*/, lockSatoshis, inputIndex, sighashType); 
            console.log('sig1', 'sig1', 'sig2', sig2);
            return sig2;
        }
    }
}
