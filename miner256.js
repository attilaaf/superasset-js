'use strict';
//var { radjs } = require('@radiantblockchain/radjs');
var radjs = require('@radiantblockchain/radjs');
var jsShaLib = require('js-sha512');

const intToLE = (i) => {
    const buf = Buffer.allocUnsafe(4);
    buf.writeInt32LE(i);
    return buf.toString('hex');
}

function getTimeHex() {
    let time = Math.floor((new Date).getTime() / 1000);
    return intToLE(time);
}
console.log('About to start mining...');

let found = false;
let counter = 0;
const h = Buffer.from('b82162c615e4c25cbb41816be4794528ec812a2dc0bcf3e771c7869bcb4a5f38', 'hex').reverse().toString('hex');
 
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
    //const boostStrHeader = '010000000000000000000000000000000000000000000000000000000000000000000000372CBAF89794AEED5E711B02E78EC4502AD8B315A987C2E2758A85E36A3F7C027DB78D62FFFF001D4DCA0A09';

    const header = new radjs.BlockHeader()
      .fromBuffer(Buffer.from(boostStrHeader, 'hex'));

   // const header = new radjs.BlockHeader().fromBr(Buffer.from(boostStrHeader, 'hex'));

    console.log('header', header, JSON.stringify(header));

    const hash = header.hashBuf();
    console.log('hash', hash);
   // const hash = jsShaLib.sha512_256(Buffer.from(jsShaLib.sha512_256(Buffer.from(boostStrHeader, 'hex')), 'hex'));
   // const hash512 = jsShaLib.sha512(boostStrHeaderBuf);
   //const hash256 = getSha256Sha256Hex2(boostStrHeader);
    // console.log('boostStrHeader', boostStrHeader);
    // console.log('hash512_256', hash);
    // console.log('hash512', hash512);
   // console.log('hash256', hash256);
    //console.log('hash512_256', hash);

    if (hash.startsWith('000000')) {
        console.log('Starts with zeroes... check POW', boostStrHeader, hash, (new Date()).getTime());

        if (boost.BoostPowString.validProofOfWorkFromString(boostStrHeader)) {
            const obj = boost.BoostPowString.fromString(boostStrHeader);
            const boostString = obj.toString();
            console.log('boostString', boostString, boostStrHeader, obj);

            console.log('POW is valid', obj);
            found = true;
        }

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
 