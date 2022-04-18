'use strict';
var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var index = require('../dist/index.js');
// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys
var { privateKey, privateKeyStr } = require('../privateKey');
var { bsv, toHex } = require('scryptlib');
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
      console.log('About to deploy BNS Root...', rootOutput.toHex());
      const tx = await index.Resolver.deployRoot(privateKey, rootOutput, 10000);
      const testRoot = tx.hash;
      console.log('Deployed BNS Root: ', tx.toString());
      await sleeper(5);
      const txChain = [tx.toString()];
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
               try {
                  // It should fail bcause the max claim fee is non zero (but insufficient)
                  await name.claim(privateKeyStr, privateKeyStr, {
                     maxClaimFee: 1,
                  }); // By default
                  expect(true).to.be.false;
               }
               catch (err) {
                  if (!(err instanceof index.MaxClaimFeeExceededError)) {
                     console.log('Unexpected exception caught', err);
                  }
                  expect(err instanceof index.MaxClaimFeeExceededError).to.be.true;
               }
               // It should reject when the backend says it needs more.
               const result = await name.claim(privateKeyStr, privateKeyStr, {
                  maxClaimFee: 0,
                  callback: name.callbackSignClaimInput,
                  isRemote: true
               }); // By default
               console.log('Claim Result', result);
               expect(name.getOwner()).to.eql('x');
               // Expect the rawtx signed to be returned. Backend also broadcasts it
               // Add crypto currency addresses
               await name.update([
                  { type: 'address', name: 'btc', value: 'myaddress1', op: 0 } // op is optional. 0 means set and 1 means delete
               ]);
               /*
               await name.update([
                  { type: 'address', name: 'btc', value: 'myaddressupdated', op: 0 },
                  { type: 'address', name: 'bsv', value: 'bsvaddress', op: 0 },
                  { type: 'address', name: 'ltc', value: 'ltcaddress', op: 0 },
                  { type: 'cname', name: '', value: 'https://based.org', op: 0 }
               ]);

               await name.update([
                  { type: 'address', name: 'ltc', op: 1 },
               ]);
               */
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
               console.log('Broadcasting...', counter, tx.toString(), tx.hash);
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