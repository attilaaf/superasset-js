import { buildContractClass, Bytes, num2bin, Ripemd160, toHex } from "scryptlib/dist";
import { createOutputFromSatoshisAndHex, sighashType2Hex } from "../Helpers";
import * as bsv from 'bsv';
import { SuperAssetNFT } from "./SuperAssetNFT";
import { SuperAssetNFTMinFee } from "./SuperAssetNFTMinFee";
import { SuperAssetFeeBurner } from "./SuperAssetFeeBurner";
import { claimSatoshisInt, feeBurnerRefundAmount } from "../Constants";

const Signature = bsv.crypto.Signature;
const sighashTypeSingle = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_SINGLE | Signature.SIGHASH_FORKID;
const sighashTypeAll = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;

export function getNameNFT(claimPkh: string) {
    // Generate the regular nft contract
    // The nameOutputHash160 is for the part of the contract after the assetId and the p2pkh address
    const SuperAssetNFTClass = buildContractClass(SuperAssetNFT());
    const superAssetNFT = new SuperAssetNFTClass(
        new Bytes('000000000000000000000000000000000000000000000000000000000000000000000000'),
        new Ripemd160(toHex(claimPkh)),
    );
    const superAssetNFTAsmVars = {
        'Tx.checkPreimageOpt_.sigHashType': sighashType2Hex(sighashTypeSingle)
    };
    superAssetNFT.replaceAsmVars(superAssetNFTAsmVars);
    return superAssetNFT;
}

export function getClaimNFT(claimPkh: string) {
    const feeBurnerHex = getFeeBurner().lockingScript.toHex();
    const feeBurnerOutputHex = createOutputFromSatoshisAndHex(10000, feeBurnerHex);
    const feeOutputHash160 = bsv.crypto.Hash.ripemd160(Buffer.from(feeBurnerOutputHex, 'hex')).toString('hex');
    // Only hash the part after the parameters (last one is the pkh)
    const lockingScriptHashedPart = getNameNFT(claimPkh).lockingScript.toHex().substring((1 + 36 + 1 + 20) * 2);
    const nameOutputHash160 = bsv.crypto.Hash.ripemd160(Buffer.from(lockingScriptHashedPart, 'hex')).toString('hex');
    // Attach the minimal fee contract to the BNS contract
    const SuperAssetNFTMinFeeClass = buildContractClass(SuperAssetNFTMinFee());
    const superAssetNFTMinFee = new SuperAssetNFTMinFeeClass(
        new Bytes('000000000000000000000000000000000000000000000000000000000000000000000000'),
        new Ripemd160(toHex(claimPkh)),
        new Bytes(nameOutputHash160),
        new Bytes(feeOutputHash160)
    );

    const asmVarsMinFee = {
        'Tx.checkPreimageOpt_.sigHashType': sighashType2Hex(sighashTypeAll)
    };
    superAssetNFTMinFee.replaceAsmVars(asmVarsMinFee);
    return superAssetNFTMinFee;
}

export function getFeeBurner() {
    // Generate the fee burner contract
    // The feeOutputHash160 is for the entire script
    const SuperAssetFeeBurnerClass = buildContractClass(SuperAssetFeeBurner());
    const superAssetFeeBurner = new SuperAssetFeeBurnerClass(feeBurnerRefundAmount);
    const superAssetFeeBurnerAsmVars = {
        'Tx.checkPreimageOpt_.sigHashType': sighashType2Hex(sighashTypeAll)
    };
    superAssetFeeBurner.replaceAsmVars(superAssetFeeBurnerAsmVars);
    return superAssetFeeBurner;
}

export function getClaimNFTOutput(claimPkh: string) {
    const claimNftScript = getClaimNFT(claimPkh).lockingScript;
    const claimNftScriptHex = claimNftScript.toHex();
    const claimSatoshisWithFullOutput = num2bin(claimSatoshisInt, 8) + 'fd' + num2bin(claimNftScriptHex.length / 2, 2) + claimNftScriptHex;
    return {
        hex: claimSatoshisWithFullOutput,
        satoshis: claimSatoshisInt,
        script: claimNftScript,
        hash: bsv.crypto.Hash.ripemd160(Buffer.from(claimSatoshisWithFullOutput, 'hex')).toString('hex')
    };
}
