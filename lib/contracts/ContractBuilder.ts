import { buildContractClass, Bytes, num2bin, Ripemd160, toHex } from "scryptlib/dist";
import { sighashType2Hex } from "../Helpers";
import * as bsv from 'bsv';
import { SuperAssetNFT } from "./SuperAssetNFT";
 
const Signature = bsv.crypto.Signature;
const sighashTypeSingle = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_SINGLE | Signature.SIGHASH_FORKID;
const sighashTypeAll = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
 
export function getNFT(pkh: string, assetId = '000000000000000000000000000000000000000000000000000000000000000000000000') {
    // Attach the minimal fee contract to the BNS contract
    const SuperAssetNFTClass = buildContractClass(SuperAssetNFT());
    const superAssetNFT = new SuperAssetNFTClass(
        new Bytes(assetId),
        new Ripemd160(toHex(pkh)) 
    );

    const asmVarsMinFee = {
        'Tx.checkPreimageOpt_.sigHashType': sighashType2Hex(sighashTypeAll)
    };
    superAssetNFT.replaceAsmVars(asmVarsMinFee);
    return superAssetNFT;
} 

export function getNFTOutput(pkh: string, satoshis: number) {
    const nftScript = getNFT(pkh).lockingScript;
    const nftScriptHex = nftScript.toHex();
    const claimSatoshisWithFullOutput = num2bin(satoshis, 8) + num2bin(nftScriptHex.length / 2, 1) + nftScriptHex;
    return {
        hex: claimSatoshisWithFullOutput,
        satoshis,
        script: nftScript,
        hash: bsv.crypto.Hash.ripemd160(Buffer.from(claimSatoshisWithFullOutput, 'hex')).toString('hex')
    };
}
