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
var { privateKey, privateKeyStr } = require('../privateKey');
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
      process.env.API_SERVICE_URL = 'http://localhost:4000';
      const publicKey = privateKey.publicKey;
      const publicKeyHash = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer())
      const issuerPkh = toHex(publicKeyHash);
      const claimPkh = toHex(publicKeyHash);;
      const rootOutput = index.Resolver.generateBnsRoot(issuerPkh, claimPkh);
      console.log('About to deploy BNS Root...', rootOutput.toASM(), rootOutput.toHex());
      const tx = await index.Resolver.deployRoot(privateKey, rootOutput, 10000);
      const testRoot = tx.hash;
      console.log('Deployed tx: ', tx.toString());
      await sleeper(5);
      const txChain = [ tx.toString() ];
      let counter = 0;
      const bnsOutputRipemd160 = bsv.crypto.Hash.ripemd160(tx.outputs[0].script.toBuffer()).toString('hex');
      try {
         do {
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
               // Now that we have the name, claim it.
               expect(name.isClaimed()).to.be.false;
               const result = await name.claim(privateKeyStr, privateKeyStr); // By default
               console.log('result claim', result);
               // Expect the rawtx signed to be returned. Backend also broadcasts it
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
                  console.log('Unexpected exception caught', err);
               }
               expect(err instanceof index.MissingNextTransactionError).to.be.true;
               const partial = err.requiredTransactionPartialResult;
               let bnsTx = new index.BnsTx(partial.expectedExtensionOutput, claimPkh, true);
               const bitcoinAddress = new index.BitcoinAddress(privateKey.toAddress());
               const utxos = await index.Resolver.fetchUtxos(bitcoinAddress.toString());
               const utxo = utxos[0];
               bnsTx.addFundingInput(utxo);
               bnsTx.addChangeOutput(bitcoinAddress);
               bnsTx.signFundingInput(privateKey);
               const tx = bnsTx.getTx();
               console.log(counter + ' Broadcasting...', tx.toString(), tx.hash)
               txChain.push(tx.toString());
               await index.Resolver.sendTx(tx);
               console.log('Broadcasted tx...', tx.hash) 
            }
            counter++;
            console.log('sleeping 5 seconds ...') 
            await sleeper(5);
         } while (true);

      } catch (ex) {
         console.log('-----Exception Caught-----', ex);
         expect(false).to.be.true;
      }
   });
});