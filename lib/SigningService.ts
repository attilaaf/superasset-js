import * as bsv from 'bsv';
import { SigningServiceInterface } from "./interfaces/SigningService.interface";
import { privateKey } from '../privateKey';
import { Sig, signTx } from 'scryptlib';
import * as axios from 'axios';

export class SigningService implements SigningServiceInterface {
    constructor(private opts?: { testnet: boolean }) {
    }
    public async signTx(rawtx: string, lockScript, lockSatoshis, inputIndex, sighashType, remote = false): Promise<any> {
        if (remote) {
            try {
                const res: any = await axios.default.post(`${process.env.API_SERVICE_URL}/api/sign`, {
                    rawtx,
                    lockScript: lockScript.toHex(),
                    lockSatoshis,
                    inputIndex,
                    sighashType
                });
                return new Sig(res.data.result.sig);
            } catch (error: any) {
                throw error
            }
        } else {
            const tx = new bsv.Transaction(rawtx);
            const sig = await signTx(tx, privateKey, lockScript/*lockScript.toASM()*/, lockSatoshis, inputIndex, sighashType);
            return sig;
        }
    }
}
