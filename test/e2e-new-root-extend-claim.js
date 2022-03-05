'use strict';
var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var index = require('../dist/index.js');
var { baRoot, baRootExtend, baRootExtendB, baRootExtendBA } = require('./ba-sample-tx');
var { rootTx, rootTxExtend, rootTxExtendA } = require('./b-sample-tx');
// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys
var { privateKey } = require('../privateKey');
var { bsv, toHex, num2bin } = require('scryptlib');
const sleeper = async (seconds) => {
   return new Promise((resolve) => {
      setTimeout(() => {
         resolve();
      }, seconds * 1000);
   })
}
describe('Create new root, extend and claim bat', () => {
   it('e2e run', async () => {
 
      const publicKey = privateKey.publicKey;
      const publicKeyHash = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer())
 
      const issuerPkh = toHex(publicKeyHash);
 
      const claimNftScript = index.Resolver.buildNFTPublicKeyHashOut(num2bin(0, 36), issuerPkh);
 
      const claimNftScriptHex = claimNftScript.toHex();
 
      const rootOutput = index.Resolver.generateBnsRoot(issuerPkh, claimNftScriptHex, '3f');
 
      // b'2003000000000000fd850204626e733114ada084074f9a305be43e3366455db062d6d366971442a46196fbd71ee92fa0e08143942c924bb62130 14 4bbf3d0d3b6d4bd4bdc00af0ba2854e0ab4788fd 011501'
      // expect(rootOutput.toHex()).to.eq('04626e733114ada084074f9a305be43e3366455db062d6d366971442a46196fbd71ee92fa0e08143942c924bb62130140000000000000000000000000000000000000000011401ff587964780154a1696f7501149c63765f7901687f7501447f777e77685d79547e57797e01147e56797e01147e55797e01147e78607902b3007f7502b2007f777ea67e517e53798b51807e517e5f79016b011179016b7f7501697f7701007e81937f7502b3007f7756795f79a6885e7952797e012d7e787e52797e015f7e787e52797e01307e787e52797e01317e787e52797e01327e787e52797e01337e787e52797e01347e787e52797e01357e787e52797e01367e787e52797e01377e787e52797e01387e787e52797e01397e787e52797e01617e787e52797e01627e787e52797e01637e787e52797e01647e787e52797e01657e787e52797e01667e787e52797e01677e787e52797e01687e787e52797e01697e787e52797e016a7e787e52797e016b7e787e52797e016c7e787e52797e016d7e787e52797e016e7e787e52797e016f7e787e52797e01707e787e52797e01717e787e52797e01727e787e52797e01737e787e52797e01747e787e52797e01757e787e52797e01767e787e52797e01777e787e52797e01787e787e52797e01797e787e52797e017a7e787e5d797e041976a9147e5e797e0288ac7eaa011179011279827758947f7501127982770128947f77886d75675679a955798857795779ad685d79aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e01c17e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac7777777777777777777777777777')
      console.log('About to deploy...', rootOutput.toASM());
      const tx = await index.Resolver.deployRoot(privateKey, rootOutput, 1000);
      const testRoot = tx.hash;
      console.log('Deployed tx: ', tx, tx.toString(), testRoot);
      await sleeper(5);
      const txChain = [ tx.toString() ];
      let counter = 0;
      // Update the bnsOutputRipemd160 
      const bnsOutputRipemd160 = bsv.crypto.Hash.ripemd160(tx.outputs[0].script.toBuffer()).toString('hex');
      console.log('bnsOutputRipemd160 computed', bnsOutputRipemd160);
      try {
      do {
            console.log('Counter', counter);
            // Now try to resolve the name 'b' from the above and see what it returns
            const resolver = index.Resolver.create({
               processGetNameTransactions: function (name, cfg) {
                  return {
                     result: 'success',
                     rawtxs: txChain,
                  };
               },
               root: testRoot,
               debug: true,
               bnsOutputRipemd160
            });

            try {
               const name = await resolver.getName('alice');
               console.log('name', name);
               break;
            } catch (err) {
               console.log('err', err);
               expect(err instanceof index.MissingNextTransactionError).to.be.true;
               const partial = err.requiredTransactionPartialResult;
               const bitcoinAddress = new index.BitcoinAddress(privateKey.toAddress());
               /* const utxo = {
                  txid: '1a2c2f3d15b79b8c5c0c5db89b14452d451d4ca87c2cafa94392e821407e6a34',
                  outputIndex: 39,
                  satoshis: 98418179,
                  script: '76a91410bdcba3041b5e5517a58f2e405293c14a7c70c188ac'
               };*/
   
               const utxos = await index.Resolver.fetchUtxos(bitcoinAddress.toString());
               const utxo = utxos[0];
               console.log('utxo', utxo);
               const outputSats = 300 + 800 * 38;
               const changeSatoshis = partial.prevOutput.satoshis + utxo.satoshis - outputSats - partial.bnsContractConfig.miningFee;
   
               partial.requiredBnsTx.addFundingInput(utxo);
   
               partial.requiredBnsTx.addChangeOutput(bitcoinAddress, changeSatoshis);
   
               partial.requiredBnsTx.unlockBnsInput(bitcoinAddress, changeSatoshis);
   
               partial.requiredBnsTx.signFundingInput(privateKey)

               // b'2003000000000000fd850204626e733114ada084074f9a305be43e3366455db062d6d366971442a46196fbd71ee92fa0e08143942c924bb62130141297416e6c9e0dfe7204e237bebdf960bb2fa08e011501'
               const tx = partial.requiredBnsTx.getTx();
               console.log('tx hex', tx.outputs[1].script.toHex())
               console.log(counter + ' Broadcasting...', tx.toString(), tx.hash)
               txChain.push(tx.toString());
               const result = await index.Resolver.sendTx(tx);
               console.log('Broadcasted tx...', tx.hash) 
            }
            counter++;
            console.log('sleeping...') 
            await sleeper(5);
         } while (true);
      } catch (ex) {
         console.log('Exception Wrapper', ex);
         expect(false).to.be.true;
      }
     // done();
   });
});