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
var { bsv, toHex } = require('scryptlib');
 
describe('Resolver', () => {
 
   it('#getName should fail incorrect root', async () => {
      const resolver = index.Resolver.create({
         root: 'abcd',
         processGetNameTransactions: function(name, cfg) {
            return {
               result: 'success',
                  rawtxs: [
                  rootTx, rootTxExtend, rootTxExtendA
               ]
            };
         }
      });
      expect(resolver.getName('b')).to.eventually.be.rejectedWith(index.ParameterExpectedRootEmptyError)
   });

   it('#getName should succeed matched root', async () => {
      const tx = new bsv.Transaction(rootTx);
      const expectedRoot = tx.hash;
      const resolver = index.Resolver.create({
         root: expectedRoot,
         processGetNameTransactions: function(name, cfg) {
            return {
               result: 'success',
               rawtxs: [
                  rootTx, rootTxExtend, rootTxExtendA
               ]
            };
         },
         // Todo implement SPV fetching
         processGetSPV: function(txid, cfg) {
            return {
               result: 'success'
            };
         }
      });
      const name = await resolver.getName('b');
      expect(name.getNameString()).to.eql('b');
   });

   it('#getName should succeed matched default root', async () => {
      const tx = new bsv.Transaction(rootTx);
      const resolver = index.Resolver.create({
         processGetNameTransactions: function(name, cfg) {
            return {
               result: 'success',
               rawtxs: [
                  rootTx, rootTxExtend, rootTxExtendA
               ]
            };
         }
      });
      const name = await resolver.getName('b');
      expect(name.getNameString()).to.eql('b');
   });

   it('#getName should fail invalid transactions due to invalid different name', async () => {
      const tx = new bsv.Transaction(baRoot);
      const root = tx.hash;
      const resolver = index.Resolver.create({
         processGetNameTransactions: function(name, cfg) {
            return {
               result: 'success',
               rawtxs: [
                  baRoot, baRootExtend, baRootExtendB
               ]
            };
         },
         root
      });
      try {
         await resolver.getName('ca')
      } catch (err){
         expect(err instanceof index.InvalidNameTransactionsError).to.be.true;
         return;
      }
      expect(false).to.be.true;
   });

   it('#getName should fail due to insufficient characters', async () => {
      const tx = new bsv.Transaction(baRoot);
      const root = tx.hash;
      const resolver = index.Resolver.create({
         processGetNameTransactions: function(name, cfg) {
            return {
               result: 'success',
               rawtxs: [
                  baRoot, baRootExtend
               ]
            };
         },
         root
      });
      try {
         await resolver.getName('')
      } catch (err){
         expect(err instanceof index.ParameterMissingError).to.be.true;
         return;
      }
      expect(false).to.be.true;
   });

   it('#getName should fail default root', async () => {
      const resolver = index.Resolver.create({
         processGetNameTransactions: function(name, cfg) {
            return {
               result: 'success',
               rawtxs: [
                  // Use the 'wrong' root for this test
                  baRoot, baRootExtend, baRootExtendB, baRootExtendBA
               ]
            };
         }
      });
      expect(resolver.getName('ba')).to.eventually.be.rejectedWith(index.ParameterExpectedRootEmptyError)
   });

   it('#getName should fail FETCH_ERROR', async () => {
      const resolver = index.Resolver.create({
         processGetNameTransactions: function(name, cfg) {
            return {
               result: index.GetNameTransactionsResultEnum.FETCH_ERROR,
               rawtxs: [
                  rootTx, rootTxExtend, rootTxExtendA
               ]
            };
         }
      });
      try {
         await resolver.getName('ba')
      } catch (err){
         expect(err instanceof index.GetNameTransactionsError).to.be.true;
         return;
      }
      expect(false).to.be.true;
   });
  
   it('#getName should fail incomplete transactions due to incomplete', async () => {
      const tx = new bsv.Transaction(baRoot);
      const root = tx.hash;
      const resolver = index.Resolver.create({
         processGetNameTransactions: function(name, cfg) {
            return {
               result: 'success',
               rawtxs: [
                  baRoot, baRootExtend, baRootExtendB
               ]
            };
         },
         root
      });
      try {
         await resolver.getName('ba')
      } catch (err){
         expect(err instanceof index.MissingNextTransactionError).to.be.true;
         // Verify that the next transaction will be for the 'A' after the 'B'
         const partial = err.requiredTransactionPartialResult;
         expect(partial.fulfilledName).to.equal('b');
         expect(partial.expectedExtensionOutput.charHex).to.equal('61');
         expect(partial.expectedExtensionOutput.char).to.equal('a');

         console.log('partial', partial);
         expect(partial.expectedExtensionOutput.outputIndex).to.equal(13);
         expect(partial.lastExtensionOutput.char).to.equal('b');
         expect(partial.lastExtensionOutput.outputIndex).to.equal(14);
         return;
      };

      expect(false).to.be.true;
   });
   it('#BnsTx methods should succeed after #getName unsucessful due to incomplete', async () => {
      const publicKey = privateKey.publicKey;
      const publicKeyHash = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer())
      const claimPkh = toHex(publicKeyHash);;

      const tx = new bsv.Transaction(baRoot);
      const root = tx.hash;
      const resolver = index.Resolver.create({
         processGetNameTransactions: function(name, cfg) {
            return {
               result: 'success',
               rawtxs: [
                  baRoot, baRootExtend, baRootExtendB, baRootExtendBA
               ]
            };
         },
         root
      });
      try {
         await resolver.getName('bat')
      } catch (err){
         expect(err instanceof index.MissingNextTransactionError).to.be.true;
         // Verify that the next transaction will be for the 'A' after the 'B'
         const partial = err.requiredTransactionPartialResult;
         expect(partial.fulfilledName).to.equal('ba');
         expect(partial.expectedExtensionOutput.char).to.equal('t');
         let bnsTx = new index.BnsTx(partial.expectedExtensionOutput, claimPkh);
         const bitcoinAddress = new index.BitcoinAddress(privateKey.toAddress());
         const utxo = {
            txId: 'a906a157716c7c5007654204adf166dd9cffe87025b9c96a00af8730e1396020',
            outputIndex: 1,
            satoshis: 92904933,
            script: '76a914ada084074f9a305be43e3366455db062d6d3669788ac'
         };
         bnsTx.addFundingInput(utxo);
         bnsTx.addChangeOutput(bitcoinAddress);
         bnsTx.signFundingInput(privateKey);
         for (let i = 1; i < bnsTx.getTx().outputs.length - 1; i++) {
            expect(bnsTx.getTx().outputs[i].satoshis).to.eql(800);
         }
         const outputSats = 300 + 800 * 38;
         expect(bnsTx.getTotalSatoshisExcludingChange()).to.eql(outputSats);
         // expect(bnsTx.getFeeRate()).to.eql(0.5000173858618172);
         // expect(bnsTx.getFee()).to.eql(14380); 
         expect(bnsTx.getFeeRate()).to.eql(0.5);
         expect(bnsTx.getFee()).to.eql(14393); 
         return;
      }
      expect(false).to.be.true;
   });
});