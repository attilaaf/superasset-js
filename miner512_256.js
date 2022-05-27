'use strict';

//var SHA256 = require("crypto-js/sha256");
var boost = require('boostpow-js');
var bsv2 = require('bsv2');
var bsv = require('bsv');
const stringify = require('json-stable-stringify');

var jsShaLib = require('js-sha512');

console.log('jsShaLib', jsShaLib);
var f = require("fast-sha256");

const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const { exit } = require('process');

console.log('f', f.hash('s').toString());
function getSha256Sha256Hex(rawdata) {
    const hashDigest = bsv2.Hash.sha256Sha256(Buffer.from(rawdata, 'hex'));
    return Buffer.from(hashDigest).reverse().toString('hex');
}

const intToLE = (i) => {
    const buf = Buffer.allocUnsafe(4);
    buf.writeInt32LE(i);
    return buf.toString('hex');
}

 
function getSha256Sha256Hex2(rawdata) {
    return CryptoJS.SHA256(CryptoJS.SHA256(CryptoJS.enc.Hex.parse(rawdata))).toString(CryptoJS.enc.Hex)
}

function getTimeHex() {
    let time = Math.floor((new Date).getTime() / 1000);
    return intToLE(time);
}
console.log('About to start mining...');



let found = false;
 
let diff = 1;
let targetDiffBits = boost.BoostUtilsHelper.difficulty2bits(diff);

// 1d00ffff
let decoded = boost.BoostUtilsHelper.difficulty2bits(diff);
const targetHex = intToLE(targetDiffBits);
console.log('Data', decoded, targetDiffBits, targetHex);
 
let counter = 0;
/*

hash 37fe4b14129ab077679fc94f72614828dc7b7c98a7ccdf8022560e3212b00000 517758 0100000000000000000000000000000000000000000000000000000000000000000000006cd862370395dedf1da2841ccda0fc489e3039de5f1ccddef0e834991a65600e251a81621d00ffff7ee60700
Starts with zeroes... check POW 1652628005521
POW is valid BoostPowStringModel {
  _blockheader: BlockHeader {
    version: 1,
    prevHash: <Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00>,
    merkleRoot: <Buffer 6c d8 62 37 03 95 de df 1d a2 84 1c cd a0 fc 48 9e 30 39 de 5f 1c cd de f0 e8 34 99 1a 65 60 0e>,
    time: 1652628005,
    timestamp: 1652628005,
    bits: 4294901789,
    nonce: 517758,
    _id: '0000b012320e562280dfcca7987c7bdc284861724fc99f6777b09a12144bfe37'
  }
}

*/


/*
    Construct the initial coinbase transaction
    // That will form the merkleroot
*/

const originalTx = new bsv.Transaction('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff4d04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac00000000');

console.log('originalTx', originalTx);

console.log('after input')
const textPushPrefix = '04ffff001d010445';
const txt  = Buffer.from('The New York Times 12/May/2022 The Milky Way\'s Black Hole Comes to Light', 'utf8');
const txtHex = txt.toString('hex');
const opCheckSig = 'ac';



const initialCoinbase = new bsv.Transaction();

initialCoinbase.addInput(new bsv.Transaction.Input({
        prevTxId: '0000000000000000000000000000000000000000000000000000000000000000',
        outputIndex: 4294967295,
        script: new bsv.Script.fromASM('ffff001d' + ' 04 ' + txtHex), // placeholder
        output: {
            script: new bsv.Script(),
            satoshis: 500000000000
        }
    })
);

const addressStr = '18FuiFFQTVKU5W32EMzVHdBHcCFhZLUg1d'; // novo coins
const address = bsv2.Address.fromString(addressStr);
const hash160 = address.toHex().substring(2);


const addressStrSatoshi = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // novo coins
const addressSatoshi = bsv2.Address.fromString(addressStrSatoshi);
const hash160Satoshi = addressSatoshi.toHex().substring(2);

console.log('setup addresses', hash160, hash160Satoshi);
//        4f9ab47a237441c0dc61dcd39fd92709f281b033
// 76a914 fc0319ac35bd66511bae0015e937d159c6bf7ccd 88ac
                //76a914     4f9ab47a237441c0dc61dcd39fd92709f281b033     88ac
const newP2pkh = '76a914' + '4f9ab47a237441c0dc61dcd39fd92709f281b033' + '88ac';

const out = bsv.Script.fromString(newP2pkh);

console.log('out', out.toHex());
initialCoinbase.addOutput(
    new bsv.Transaction.Output({
        script: out,
        satoshis: 5000000000,
    })
)
 
console.log('coinbase tx EMULATED', initialCoinbase.hash, initialCoinbase.toString(), initialCoinbase);

 
if (initialCoinbase.hash !== 'b82162c615e4c25cbb41816be4794528ec812a2dc0bcf3e771c7869bcb4a5f38') {
    //throw new Error('mismatch hash b82162c615e4c25cbb41816be4794528ec812a2dc0bcf3e771c7869bcb4a5f38');
}

function genOriginalBlock0Hash(merkle, timeInt, nonceInt) {
    const v = '01000000';
    const prevHash =   '0000000000000000000000000000000000000000000000000000000000000000';// 6cd862370395dedf1da2841ccda0fc489e3039de5f1ccddef0e834991a65600ea6c8cb4db3936a1ae3143991';
    //const merkleRoot = merkle;
    const bits = targetHex;
    const nonce = intToLE(nonceInt);
    const time = intToLE(timeInt);
    const merkleReversed = Buffer.from(merkle, 'hex').reverse().toString('hex');

    // const boostStrHeader = '0100000000000000000000000000000000000000000000000000000000000000000000006cd862370395dedf1da2841ccda0fc489e3039de5f1ccddef0e834991a65600ea6c8cb4db3936a1ae3143991';
    // const boostStrHeader = '010000009500c43a25c624520b5100adf82cb9f9da72fd2447a496bc600b0000000000006cd862370395dedf1da2841ccda0fc489e3039de5f1ccddef0e834991a65600ea6c8cb4db3936a1ae3143991';
    const boostStrHeader = v + prevHash + merkleReversed + time + bits + nonce;
    //console.log('boostStrHeader.length', v.length, prevHash.length, merkleRoot.length, time.length, bits.length, nonce.length, boostStrHeader.length);
    return getSha256Sha256Hex2(boostStrHeader);
}

const h = Buffer.from(initialCoinbase.hash, 'hex').reverse().toString('hex');
const blockhash = genOriginalBlock0Hash(originalTx.hash, 1231006505, 2083236893);

console.log('blockhash', blockhash);
let time = getTimeHex();
while (!found) {

   // const sampleTx = '0100000002f327e86da3e66bd20e1129b1fb36d07056f0b9a117199e759396526b8f3a20780000000049483045022100fce442ec52aa2792efc27fd3ad0eaf7fa69f097fdcefab017ea56d1799b10b2102207a6ae3eb61e11ffaba0453f173d1792f1b7bb8e7422ea945101d68535c4b474801fffffffff0ede03d75050f20801d50358829ae02c058e8677d2cc74df51f738285013c26000000006b483045022100b77f935ff366a6f3c2fdeb83589c790265d43b3d2cf5e5f0047da56c36de75f40220707ceda75d8dcf2ccaebc506f7293c3dcb910554560763d7659fb202f8ec324b012102240d7d3c7aad57b68aa0178f4c56f997d1bfab2ded3c2f9427686017c603a6d6ffffffff02f028d6dc010000001976a914ffb035781c3c69e076d48b60c3d38592e7ce06a788ac00ca9a3b000000001976a914fa5139067622fd7e1e722a05c17c2bb7d5fd6df088ac00000000';
  //  const str = '0100000000000000000000000000000000000000000000000000000000000000000000006cd862370395dedf1da2841ccda0fc489e3039de5f1ccddef0e834991a65600ece238062ffff001d6c2b7d06';
    const v = '01000000';
    const prevHash =   '0000000000000000000000000000000000000000000000000000000000000000';// 6cd862370395dedf1da2841ccda0fc489e3039de5f1ccddef0e834991a65600ea6c8cb4db3936a1ae3143991';
    const merkleRoot = h; // a6c8cb4db3936a1ae3143991';
    const bits = targetHex;
    const nonce = intToLE(counter);
    
    // const boostStrHeader = '0100000000000000000000000000000000000000000000000000000000000000000000006cd862370395dedf1da2841ccda0fc489e3039de5f1ccddef0e834991a65600ea6c8cb4db3936a1ae3143991';
    // const boostStrHeader = '010000009500c43a25c624520b5100adf82cb9f9da72fd2447a496bc600b0000000000006cd862370395dedf1da2841ccda0fc489e3039de5f1ccddef0e834991a65600ea6c8cb4db3936a1ae3143991';
    const boostStrHeader = v + prevHash + merkleRoot + time + bits + nonce;
    const boostStrHeaderBuf = Buffer.from(boostStrHeader, 'hex')
    const hash = jsShaLib.sha512_256(boostStrHeaderBuf);
    console.log('boostStrHeader.length', boostStrHeader, hash, hash.length);
    if (hash.endsWith('000000')) {
        console.log('Starts with zeroes... check POW', (new Date()).getTime());

        if (boost.BoostPowString.validProofOfWorkFromString(boostStrHeader)) {
            const obj = boost.BoostPowString.fromString(boostStrHeader);
            const boostString = obj.toString();
            console.log('boostString', boostString, boostStrHeader, obj);

            console.log('POW is valid', obj);
            found = true;
        }
    }
    if (counter % 100000 == 0) {
        console.log('counter', counter);
        time = getTimeHex();
    }
    counter++;
}


console.log('Done');
 