'use strict';
var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');
const { buildContractClass, Bytes, Ripemd160 } = require('scryptlib');
const sighashType2Hex = s => s.toString(16)
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
const Signature = bsv.crypto.Signature;

describe('Create new root, extend and claim bat', () => {
   it('e2e run', async () => {
      const publicKey = privateKey.publicKey;
      const publicKeyHash = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer())
      const issuerPkh = toHex(publicKeyHash);
      const claimPkh = toHex(publicKeyHash);;
      const rootOutput = index.Resolver.generateBnsRoot(issuerPkh, claimPkh);
      console.log('About to deploy...', rootOutput.toASM(), rootOutput.toHex());
      const tx = await index.Resolver.deployRoot(privateKey, rootOutput, 10000);
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
               bnsOutputRipemd160,
               testnet: true,
            });
            try {
               const name = await resolver.getName('a');
               console.log('name', name);
               // Now that we have the name, claim it.
               expect(!name.isClaimed).to.be.true;
               // const bitcoinAddress = new index.BitcoinAddress(privateKey.toAddress());
               const result = await name.claim(privateKey, true); // By default
               // Expect the rawtx signed to be returned. Backend also broadcasts it
               console.log('result', result);

               // Add crypto currency addresses
               await name.update([
                  { type: 'address', name: 'btc', value: 'myaddress1', op: 0 } // op is optional. 0 means set and 1 means delete
               ]);

               await name.update([
                  { type: 'address', name: 'btc', value: 'myaddressupdated', op: 0 },
                  { type: 'address', name: 'bsv', value: 'bsvaddress', op: 0 },
                  { type: 'address', name: 'ltc', value: 'ltcaddress', op: 0 },
                  { type: 'cname', name: '', value: 'https://based.org', op: 0 }
               ]);

               await name.update([
                  { type: 'address', name: 'ltc', op: 1 },
               ]);

               break;
            } catch (err) {
               if (!(err instanceof index.MissingNextTransactionError)) {
                  console.log('err', err);
               }
               expect(err instanceof index.MissingNextTransactionError).to.be.true;
               const partial = err.requiredTransactionPartialResult;
               console.log('partial.expectedExtensionOutput', partial.expectedExtensionOutput) 
               let bnsTx = new index.BnsTx(partial.expectedExtensionOutput, claimPkh, true);
               const bitcoinAddress = new index.BitcoinAddress(privateKey.toAddress());
               const utxos = await index.Resolver.fetchUtxos(bitcoinAddress.toString());
               const utxo = utxos[0];
               bnsTx.addFundingInput(utxo);
               bnsTx.addChangeOutput(bitcoinAddress);
               bnsTx.signFundingInput(privateKey);
               const tx = bnsTx.getTx();
               console.log(counter + ' Broadcasting...', bitcoinAddress.toString(), utxo, tx.toString(), tx.outputs.length, tx, tx.hash)
               txChain.push(tx.toString());
               const result = await index.Resolver.sendTx(tx);
               console.log('Broadcasted tx...', partial, partial.fulfilledName, result, tx.hash) 
            }
            counter++;
            console.log('sleeping...') 
            await sleeper(5);
         } while (true);

      } catch (ex) {
         console.log('Exception Wrapper', ex);
         expect(false).to.be.true;
      }
   });
});