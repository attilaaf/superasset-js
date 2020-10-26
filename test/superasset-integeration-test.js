'use strict';
var expect = require('chai').expect;
var index = require('../dist/index.js');
var bsv = require('bsv');

// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys

// Generate your own private keys (Ex: https://console.matterpool.io/tools)
// And fund the addresses for them.
const privateKey1= new bsv.PrivateKey('KzPHJvzC2ZAvrVqmbfuvdbM1XbTWdVFkxEqDbGYwi2BVDcsWdKGc');
const publicKey1 = bsv.PublicKey.fromPrivateKey(privateKey1)
console.log('privateKey1', privateKey1, publicKey1, publicKey1.toAddress().toString());

const privateKey2 = new bsv.PrivateKey('Ky8ZrBsmN15cr8LVyRxuzT7gtfAdQLxYbq8jrZPc1YM9o33eHsdE')
const publicKey2 = bsv.PublicKey.fromPrivateKey(privateKey2)
console.log('privateKey2', privateKey2, publicKey2, publicKey2.toAddress().toString());

const privateKey3 = new bsv.PrivateKey('L3w7SNVzbJunxYSFHtt8sFtKmkqG9wmpK4A7TG1h8uSUZyZ9Zi1E');
const publicKey3 = bsv.PublicKey.fromPrivateKey(privateKey3)
console.log('privateKey3', privateKey3, publicKey3, publicKey3.toAddress().toString());

describe('SA10', () => {

   const sleeper = async(seconds) => {
      return new Promise((resolve) => {
         setTimeout(() => {
            resolve();
         }, seconds * 1000);
      })
   }
   it('Deploy, Tranfer Multiple Times with Different Payloads (Same owner) and Melt', async () => {
      const sa10 = index.instance({
         feeb: 0.25,
      }).SA10({ verbose: true, });
      // -----------------------------------------------------
      // Step 1: Deploy NFT with initial owner and satoshis value of 2650 (Lower than this may hit dust limit)
      const assetValue = 20000;
      const initialOwnerPublicKey = publicKey1.toString();
      const fundingPrivateKey = privateKey2.toString();
      let assetState = null;
      let originalAssetState = null;
      try {
         assetState = await sa10.deploy(initialOwnerPublicKey, assetValue, fundingPrivateKey);
         console.log('Step 1. txid: ', assetState.txid);
         originalAssetState = Object.assign({}, assetState);
         let assetClone = Object.assign({}, assetState);
         delete assetClone.assetId;
         delete assetClone.txid;
         delete assetClone.index;
         delete assetClone.txoutpoint;
         delete assetClone.txoutpoint;
         delete assetClone.assetStaticCode;
         expect(assetClone).to.eql({
            // "assetId":"8ce65021eeaccc2d986b2503f6ea73640f7d95bbc007aaa1611934e3319c899500000000",
            "assetLockingScript":`OP_1 40 80 76 88 a9 ac OP_8 14 OP_9 OP_PICK 0 OP_EQUAL OP_IF OP_6 OP_PICK OP_9 OP_PICK OP_OR OP_8 OP_PICK OP_OR OP_NOP OP_14 OP_PICK OP_1 OP_PICK ea401e7cedf9c428fbf9b92b75c90dfdd354394e58195d58e82bf79a8de31d62 02773aca113a3217b67a95d5b78b69bb6386ed443ea5decf0ba92c00d179291921 08dc7dc8b865cafc4cb5ff38624ba4c5385a3b8d7381f5bb49ba4a55963f10a200 606bfc5df21a9603c63d49e178b0620c9953d37c7ddeddfc12580925da43fcf000 00f0fc43da25095812fcddde7d7cd353990c62b078e1493dc603961af25dfc6b60 OP_NOP OP_6 OP_PICK OP_5 OP_PICK OP_5 OP_PICK OP_5 OP_PICK OP_5 OP_PICK OP_5 OP_PICK OP_11 OP_PICK OP_6 OP_PICK OP_HASH256 OP_NOP OP_NOP 0 OP_PICK 0 OP_PICK OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_7 OP_PICK OP_6 OP_PICK OP_6 OP_PICK OP_6 OP_PICK OP_6 OP_PICK OP_3 OP_PICK OP_6 OP_PICK OP_4 OP_PICK OP_7 OP_PICK OP_MUL OP_ADD OP_MUL 414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff00 OP_NOP OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_PICK OP_MOD OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_1 OP_PICK 0 OP_LESSTHAN OP_IF OP_1 OP_PICK OP_1 OP_PICK OP_ADD OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ENDIF OP_1 OP_PICK OP_NIP OP_NIP OP_NOP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_1 OP_PICK OP_1 OP_PICK OP_2 OP_DIV OP_GREATERTHAN OP_IF 0 OP_PICK OP_2 OP_PICK OP_SUB OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ENDIF OP_3 OP_PICK OP_SIZE OP_NIP OP_2 OP_PICK OP_SIZE OP_NIP OP_4 OP_2 OP_PICK OP_ADD OP_1 OP_PICK OP_ADD 30 OP_1 OP_PICK OP_CAT OP_2 OP_CAT OP_3 OP_PICK OP_CAT OP_7 OP_PICK OP_CAT OP_2 OP_CAT OP_2 OP_PICK OP_CAT OP_5 OP_PICK OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_CAT OP_6 OP_PICK OP_CAT 0 OP_PICK OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP 0 OP_PICK OP_7 OP_PICK OP_CHECKSIG OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_VERIFY OP_NOP OP_14 OP_PICK OP_NOP 0 OP_PICK 68 OP_SPLIT OP_NIP 0 0 OP_2 OP_PICK 0 OP_SPLIT OP_NIP OP_1 OP_SPLIT OP_DROP 0 OP_PICK fd OP_EQUAL OP_IF OP_NOP OP_3 OP_PICK OP_3 OP_SPLIT OP_DROP OP_1 OP_SPLIT OP_NIP 0 OP_PICK 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_3 OP_ROLL OP_DROP OP_2 OP_ROLL OP_2 OP_ROLL OP_3 OP_PICK OP_3 OP_4 OP_PICK OP_ADD OP_SPLIT OP_DROP OP_3 OP_SPLIT OP_NIP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ELSE 0 OP_PICK fe OP_EQUAL OP_IF OP_NOP OP_3 OP_PICK OP_5 OP_SPLIT OP_DROP OP_1 OP_SPLIT OP_NIP 0 OP_PICK 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_3 OP_ROLL OP_DROP OP_2 OP_ROLL OP_2 OP_ROLL OP_3 OP_PICK OP_5 OP_4 OP_PICK OP_ADD OP_SPLIT OP_DROP OP_5 OP_SPLIT OP_NIP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ELSE 0 OP_PICK ff OP_EQUAL OP_IF OP_NOP OP_3 OP_PICK OP_9 OP_SPLIT OP_DROP OP_1 OP_SPLIT OP_NIP 0 OP_PICK 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_3 OP_ROLL OP_DROP OP_2 OP_ROLL OP_2 OP_ROLL OP_3 OP_PICK OP_9 OP_4 OP_PICK OP_ADD OP_SPLIT OP_DROP OP_9 OP_SPLIT OP_NIP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ELSE OP_NOP OP_3 OP_PICK OP_1 OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP 0 OP_PICK 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_3 OP_ROLL OP_DROP OP_2 OP_ROLL OP_2 OP_ROLL OP_3 OP_PICK OP_1 OP_4 OP_PICK OP_ADD OP_SPLIT OP_DROP OP_1 OP_SPLIT OP_NIP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ENDIF OP_ENDIF OP_ENDIF OP_1 OP_PICK OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_NIP OP_NOP 0 OP_PICK a70c OP_SPLIT OP_NIP 0 OP_PICK 24 OP_SPLIT OP_DROP 13 OP_PICK OP_2 OP_PICK 46 OP_SPLIT OP_DROP 25 OP_SPLIT OP_NIP OP_CHECKSIG OP_VERIFY 0 OP_PICK 0 24 OP_NUM2BIN OP_EQUAL OP_IF OP_NOP 11 OP_PICK 0 OP_PICK 68 OP_SPLIT OP_DROP 44 OP_SPLIT OP_NIP OP_NIP OP_NOP OP_1 OP_ROLL OP_DROP OP_ENDIF OP_NOP OP_2 OP_PICK a50c OP_SPLIT OP_DROP 6a24 OP_CAT OP_1 OP_PICK OP_CAT 21 OP_CAT 13 OP_PICK OP_CAT OP_NOP OP_15 OP_PICK 0 OP_PICK OP_SIZE OP_NIP 0 OP_1 OP_PICK 0 OP_NUMEQUAL OP_IF OP_ELSE OP_1 OP_PICK OP_1 OP_NUMEQUAL OP_IF OP_NOP OP_2 OP_PICK 0 OP_PICK 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP 0 OP_PICK OP_1 OP_GREATERTHANOREQUAL OP_1 OP_PICK OP_16 OP_LESSTHANOREQUAL OP_BOOLAND OP_IF OP_NOP 50 OP_1 OP_PICK OP_ADD OP_1 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ELSE OP_2 OP_PICK OP_1 OP_NUMEQUAL OP_1 OP_PICK 8100 OP_NUMEQUAL OP_BOOLAND OP_IF OP_NOP 4f OP_1 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ENDIF OP_ENDIF OP_DROP OP_ELSE OP_1 OP_PICK 4c OP_LESSTHAN OP_IF OP_NOP OP_1 OP_PICK OP_1 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_3 OP_PICK OP_CAT OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK ff00 OP_LESSTHANOREQUAL OP_IF 4c OP_NOP OP_2 OP_PICK OP_1 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_3 OP_PICK OP_CAT OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK ffff00 OP_LESSTHANOREQUAL OP_IF 4d OP_NOP OP_2 OP_PICK OP_2 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_3 OP_PICK OP_CAT OP_1 OP_ROLL OP_DROP OP_ELSE 4e OP_NOP OP_2 OP_PICK OP_4 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_3 OP_PICK OP_CAT OP_1 OP_ROLL OP_DROP OP_ENDIF OP_ENDIF OP_ENDIF OP_ENDIF OP_ENDIF 0 OP_PICK OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_NOP 12 OP_PICK OP_NOP OP_NOP 0 OP_PICK 0 OP_PICK OP_SIZE OP_NIP OP_1 OP_PICK OP_1 OP_PICK 2c OP_SUB OP_SPLIT OP_DROP OP_1 OP_PICK 34 OP_SUB OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NOP 0 OP_PICK 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_NIP OP_NOP 0 OP_PICK OP_8 OP_PICK OP_NUM2BIN OP_NOP OP_2 OP_PICK 0 OP_PICK OP_SIZE OP_NIP 0 OP_1 OP_PICK fd00 OP_LESSTHAN OP_IF OP_NOP OP_1 OP_PICK OP_1 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 000001 OP_LESSTHAN OP_IF fd OP_NOP OP_2 OP_PICK OP_2 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 0000000001 OP_LESSTHAN OP_IF fe OP_NOP OP_2 OP_PICK OP_4 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 000000000000000001 OP_LESSTHAN OP_IF ff OP_NOP OP_2 OP_PICK OP_8 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ENDIF OP_ENDIF OP_ENDIF OP_ENDIF 0 OP_PICK OP_3 OP_PICK OP_CAT OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_NIP OP_NIP OP_NOP OP_NOP OP_NOP 11 OP_PICK OP_11 OP_PICK OP_10 OP_PICK OP_CAT OP_7 OP_PICK OP_CAT OP_1 OP_PICK OP_CAT OP_11 OP_PICK OP_CAT OP_9 OP_PICK OP_CAT OP_NIP OP_NOP 11 OP_PICK 0 OP_PICK OP_9 OP_PICK OP_NUM2BIN OP_NOP OP_2 OP_PICK 0 OP_PICK OP_SIZE OP_NIP 0 OP_1 OP_PICK fd00 OP_LESSTHAN OP_IF OP_NOP OP_1 OP_PICK OP_1 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 000001 OP_LESSTHAN OP_IF fd OP_NOP OP_2 OP_PICK OP_2 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 0000000001 OP_LESSTHAN OP_IF fe OP_NOP OP_2 OP_PICK OP_4 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 000000000000000001 OP_LESSTHAN OP_IF ff OP_NOP OP_2 OP_PICK OP_8 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ENDIF OP_ENDIF OP_ENDIF OP_ENDIF 0 OP_PICK OP_3 OP_PICK OP_CAT OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_NIP OP_NIP OP_NOP OP_CAT OP_HASH256 OP_NOP 12 OP_PICK 0 OP_PICK OP_SIZE OP_NIP OP_1 OP_PICK OP_1 OP_PICK OP_8 OP_SUB OP_SPLIT OP_DROP OP_1 OP_PICK 28 OP_SUB OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NOP OP_EQUAL OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_ELSE OP_9 OP_PICK OP_1 OP_EQUAL OP_IF OP_6 OP_PICK OP_9 OP_PICK OP_OR OP_8 OP_PICK OP_OR OP_NOP OP_13 OP_PICK OP_1 OP_PICK ea401e7cedf9c428fbf9b92b75c90dfdd354394e58195d58e82bf79a8de31d62 02773aca113a3217b67a95d5b78b69bb6386ed443ea5decf0ba92c00d179291921 08dc7dc8b865cafc4cb5ff38624ba4c5385a3b8d7381f5bb49ba4a55963f10a200 606bfc5df21a9603c63d49e178b0620c9953d37c7ddeddfc12580925da43fcf000 00f0fc43da25095812fcddde7d7cd353990c62b078e1493dc603961af25dfc6b60 OP_NOP OP_6 OP_PICK OP_5 OP_PICK OP_5 OP_PICK OP_5 OP_PICK OP_5 OP_PICK OP_5 OP_PICK OP_11 OP_PICK OP_6 OP_PICK OP_HASH256 OP_NOP OP_NOP 0 OP_PICK 0 OP_PICK OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_7 OP_PICK OP_6 OP_PICK OP_6 OP_PICK OP_6 OP_PICK OP_6 OP_PICK OP_3 OP_PICK OP_6 OP_PICK OP_4 OP_PICK OP_7 OP_PICK OP_MUL OP_ADD OP_MUL 414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff00 OP_NOP OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_PICK OP_MOD OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_1 OP_PICK 0 OP_LESSTHAN OP_IF OP_1 OP_PICK OP_1 OP_PICK OP_ADD OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ENDIF OP_1 OP_PICK OP_NIP OP_NIP OP_NOP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_1 OP_PICK OP_1 OP_PICK OP_2 OP_DIV OP_GREATERTHAN OP_IF 0 OP_PICK OP_2 OP_PICK OP_SUB OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ENDIF OP_3 OP_PICK OP_SIZE OP_NIP OP_2 OP_PICK OP_SIZE OP_NIP OP_4 OP_2 OP_PICK OP_ADD OP_1 OP_PICK OP_ADD 30 OP_1 OP_PICK OP_CAT OP_2 OP_CAT OP_3 OP_PICK OP_CAT OP_7 OP_PICK OP_CAT OP_2 OP_CAT OP_2 OP_PICK OP_CAT OP_5 OP_PICK OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_1 OP_SPLIT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_CAT OP_6 OP_PICK OP_CAT 0 OP_PICK OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP 0 OP_PICK OP_7 OP_PICK OP_CHECKSIG OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_VERIFY OP_NOP OP_13 OP_PICK OP_NOP 0 OP_PICK 68 OP_SPLIT OP_NIP 0 0 OP_2 OP_PICK 0 OP_SPLIT OP_NIP OP_1 OP_SPLIT OP_DROP 0 OP_PICK fd OP_EQUAL OP_IF OP_NOP OP_3 OP_PICK OP_3 OP_SPLIT OP_DROP OP_1 OP_SPLIT OP_NIP 0 OP_PICK 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_3 OP_ROLL OP_DROP OP_2 OP_ROLL OP_2 OP_ROLL OP_3 OP_PICK OP_3 OP_4 OP_PICK OP_ADD OP_SPLIT OP_DROP OP_3 OP_SPLIT OP_NIP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ELSE 0 OP_PICK fe OP_EQUAL OP_IF OP_NOP OP_3 OP_PICK OP_5 OP_SPLIT OP_DROP OP_1 OP_SPLIT OP_NIP 0 OP_PICK 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_3 OP_ROLL OP_DROP OP_2 OP_ROLL OP_2 OP_ROLL OP_3 OP_PICK OP_5 OP_4 OP_PICK OP_ADD OP_SPLIT OP_DROP OP_5 OP_SPLIT OP_NIP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ELSE 0 OP_PICK ff OP_EQUAL OP_IF OP_NOP OP_3 OP_PICK OP_9 OP_SPLIT OP_DROP OP_1 OP_SPLIT OP_NIP 0 OP_PICK 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_3 OP_ROLL OP_DROP OP_2 OP_ROLL OP_2 OP_ROLL OP_3 OP_PICK OP_9 OP_4 OP_PICK OP_ADD OP_SPLIT OP_DROP OP_9 OP_SPLIT OP_NIP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ELSE OP_NOP OP_3 OP_PICK OP_1 OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP 0 OP_PICK 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_3 OP_ROLL OP_DROP OP_2 OP_ROLL OP_2 OP_ROLL OP_3 OP_PICK OP_1 OP_4 OP_PICK OP_ADD OP_SPLIT OP_DROP OP_1 OP_SPLIT OP_NIP OP_2 OP_ROLL OP_DROP OP_1 OP_ROLL OP_ENDIF OP_ENDIF OP_ENDIF OP_1 OP_PICK OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_NIP OP_NOP OP_16 OP_PICK OP_1 OP_PICK a70c OP_SPLIT OP_NIP 46 OP_SPLIT OP_DROP 25 OP_SPLIT OP_NIP OP_CHECKSIG OP_VERIFY OP_NOP OP_NOP OP_15 OP_PICK OP_8 OP_PICK OP_7 OP_PICK OP_CAT OP_4 OP_PICK OP_CAT OP_1 OP_PICK OP_CAT OP_8 OP_PICK OP_CAT OP_6 OP_PICK OP_CAT OP_NIP OP_NOP OP_NOP OP_15 OP_PICK OP_NOP OP_NOP 0 OP_PICK 0 OP_PICK OP_SIZE OP_NIP OP_1 OP_PICK OP_1 OP_PICK 2c OP_SUB OP_SPLIT OP_DROP OP_1 OP_PICK 34 OP_SUB OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NOP 0 OP_PICK 00 OP_CAT OP_BIN2NUM OP_NIP OP_NOP OP_NIP OP_NOP 0 OP_PICK OP_6 OP_PICK OP_NUM2BIN OP_NOP OP_2 OP_PICK 0 OP_PICK OP_SIZE OP_NIP 0 OP_1 OP_PICK fd00 OP_LESSTHAN OP_IF OP_NOP OP_1 OP_PICK OP_1 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 000001 OP_LESSTHAN OP_IF fd OP_NOP OP_2 OP_PICK OP_2 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 0000000001 OP_LESSTHAN OP_IF fe OP_NOP OP_2 OP_PICK OP_4 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 000000000000000001 OP_LESSTHAN OP_IF ff OP_NOP OP_2 OP_PICK OP_8 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ENDIF OP_ENDIF OP_ENDIF OP_ENDIF 0 OP_PICK OP_3 OP_PICK OP_CAT OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_NIP OP_NIP OP_NOP OP_NOP OP_NOP OP_14 OP_PICK OP_9 OP_PICK OP_8 OP_PICK OP_CAT OP_5 OP_PICK OP_CAT OP_1 OP_PICK OP_CAT OP_9 OP_PICK OP_CAT OP_7 OP_PICK OP_CAT OP_NIP OP_NOP OP_14 OP_PICK 0 OP_PICK OP_7 OP_PICK OP_NUM2BIN OP_NOP OP_2 OP_PICK 0 OP_PICK OP_SIZE OP_NIP 0 OP_1 OP_PICK fd00 OP_LESSTHAN OP_IF OP_NOP OP_1 OP_PICK OP_1 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 000001 OP_LESSTHAN OP_IF fd OP_NOP OP_2 OP_PICK OP_2 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 0000000001 OP_LESSTHAN OP_IF fe OP_NOP OP_2 OP_PICK OP_4 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ELSE OP_1 OP_PICK 000000000000000001 OP_LESSTHAN OP_IF ff OP_NOP OP_2 OP_PICK OP_8 OP_1 OP_PICK OP_1 OP_PICK OP_1 OP_ADD OP_NUM2BIN 0 OP_PICK OP_1 OP_PICK OP_SIZE OP_NIP OP_1 OP_SUB OP_SPLIT OP_DROP 0 OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_1 OP_ROLL OP_DROP OP_ENDIF OP_ENDIF OP_ENDIF OP_ENDIF 0 OP_PICK OP_3 OP_PICK OP_CAT OP_NIP OP_NIP OP_NIP OP_NOP OP_CAT OP_NIP OP_NIP OP_NOP OP_CAT OP_HASH256 OP_NOP OP_15 OP_PICK 0 OP_PICK OP_SIZE OP_NIP OP_1 OP_PICK OP_1 OP_PICK OP_8 OP_SUB OP_SPLIT OP_DROP OP_1 OP_PICK 28 OP_SUB OP_SPLIT OP_NIP OP_NIP OP_NIP OP_NOP OP_EQUAL OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_ELSE 0 OP_ENDIF OP_ENDIF OP_RETURN 000000000000000000000000000000000000000000000000000000000000000000000000 ${publicKey1.toString()}`,
            "assetSatoshis": assetValue,
            "assetPayload":null,
            "assetOwnerPublicKey": publicKey1.toString()
         });
      } catch (err) {
         console.log('err', JSON.stringify(err));
         throw err;
      }
      console.log("Sleeping...")
      await sleeper(10);
      // -----------------------------------------------------
      // Step 2: Update NFT with payload '
      let payloadUpdate = Buffer.from(`{ "hello": "world" }`, 'utf8').toString('hex');
      let currentOwnerPrivateKey = privateKey1.toString();
      let nextOwnerPublicKey = publicKey2.toString();
      console.log('payloadData', payloadUpdate);
      try {
         assetState = await sa10.transfer(assetState, currentOwnerPrivateKey, nextOwnerPublicKey, fundingPrivateKey, payloadUpdate);
         console.log('Step 2. txid: ', assetState.txid);
         console.log('assetId', assetState.assetId.toString(), assetState.assetId.toLE());
         let assetClone = Object.assign({}, assetState);
         delete assetClone.assetId;
         delete assetClone.txoutpoint;
         delete assetClone.txid;
         delete assetClone.index;
         delete assetClone.assetStaticCode;
         delete assetClone.assetLockingScript;
         expect(assetClone).to.eql({
            "assetOwnerPublicKey": nextOwnerPublicKey,
            "assetSatoshis": assetValue,
            "assetPayload": payloadUpdate
         });
      } catch (err) {
         console.log('err', JSON.stringify(err));
         throw err;
      }

      console.log("Sleeping...")
      await sleeper(10);
      // -----------------------------------------------------
      // Case 3: Larger payload on transfer
      payloadUpdate = '012345';
      currentOwnerPrivateKey = privateKey2.toString();
      nextOwnerPublicKey = publicKey2.toString();
      try {
         assetState = await sa10.transfer(assetState, currentOwnerPrivateKey, nextOwnerPublicKey, fundingPrivateKey, payloadUpdate);
         console.log('Step 3. txid: ', assetState.txid);
         console.log('assetId', assetState.assetId.toString(), assetState.assetId.toLE());
         let assetClone = Object.assign({}, assetState);
         delete assetClone.assetId;
         delete assetClone.txoutpoint;
         delete assetClone.txid;
         delete assetClone.index;
         delete assetClone.assetStaticCode;
         delete assetClone.assetLockingScript;
         expect(assetClone).to.eql({
            "assetOwnerPublicKey": nextOwnerPublicKey,
            "assetSatoshis": assetValue,
            "assetPayload": payloadUpdate
         });
      } catch (err) {
         console.log('err', JSON.stringify(err));
         throw err;
      }
      console.log("Sleeping...")
      await sleeper(10);

      // -----------------------------------------------------
      // Case 4. Empty payload on transfer
      payloadUpdate = '';
      currentOwnerPrivateKey = privateKey2.toString();
      nextOwnerPublicKey = publicKey2.toString();
      try {
         assetState = await sa10.transfer(assetState, currentOwnerPrivateKey, nextOwnerPublicKey, fundingPrivateKey, payloadUpdate);
         console.log('Step 4. txid: ', assetState.txid);
         console.log('assetId', assetState.assetId.toString(), assetState.assetId.toLE());
         let assetClone = Object.assign({}, assetState);
         delete assetClone.assetId;
         delete assetClone.txoutpoint;
         delete assetClone.txid;
         delete assetClone.index;
         delete assetClone.assetStaticCode;
         delete assetClone.assetLockingScript;
         expect(assetClone).to.eql({
            "assetOwnerPublicKey": nextOwnerPublicKey,
            "assetSatoshis": assetValue,
            "assetPayload": null
         });
      } catch (err) {
         console.log('err', JSON.stringify(err));
         throw err;
      }
      console.log("Sleeping...")
      await sleeper(10);

      // -----------------------------------------------------
      // Case 5: Melt back
      payloadUpdate = null;
      currentOwnerPrivateKey = privateKey2.toString();
      let receiverPublicKey = publicKey2.toString();
      try {
         assetState = await sa10.melt(assetState, currentOwnerPrivateKey, receiverPublicKey, fundingPrivateKey);
         console.log('Step 5. txid: ', assetState.txid);
         console.log('meltedAssetId', assetState.meltedAssetId.toString(), assetState.meltedAssetId.toLE());
         let assetClone = Object.assign({}, assetState);
         delete assetClone.meltedAssetId;
         delete assetClone.txoutpoint;
         delete assetClone.txid;
         delete assetClone.index;
         delete assetClone.meltedAssetStaticCode;

         expect(assetClone).to.eql({
            "meltedAssetOwnerPublicKey": receiverPublicKey,
            "meltedAssetSatoshis": assetValue
         });
      } catch (err) {
         console.log('err', JSON.stringify(err));
         throw err;
      }
   });

});