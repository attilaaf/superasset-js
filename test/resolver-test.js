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
var { bsv } = require('scryptlib');
 
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
         expect(partial.success).to.be.false;
         expect(partial.fulfilledName).to.equal('b');
         expect(partial.nextMissingChar).to.equal('a');
         expect(!!partial.requiredBnsTx).to.equal(true);
         expect(partial.requiredBnsTx.getTx().outputs[0].satoshis).to.eql(300);
         expect(partial.requiredBnsTx.getTx().outputs.length).to.equal(39);
         for (let i = 1; i < partial.requiredBnsTx.getTx().outputs.length; i++) {
            expect(partial.requiredBnsTx.getTx().outputs[i].satoshis).to.eql(800);
         }
         return;
      }
      expect(false).to.be.true;
   });
   it('#BnsTx methods should succeed after #getName unsucessful due to incomplete', async () => {
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
         expect(partial.success).to.be.false;
         expect(partial.fulfilledName).to.equal('ba');
         expect(partial.nextMissingChar).to.equal('t');
         expect(!!partial.requiredBnsTx).to.equal(true);
         expect(partial.requiredBnsTx.getTx().outputs[0].satoshis).to.eql(300);
         expect(partial.requiredBnsTx.getTx().outputs.length).to.equal(39);
         for (let i = 1; i < partial.requiredBnsTx.getTx().outputs.length; i++) {
            expect(partial.requiredBnsTx.getTx().outputs[i].satoshis).to.eql(800);
         }
         const outputSats = 300 + 800 * 38;
         expect(partial.requiredBnsTx.getTotalSatoshisExcludingChange()).to.eql(outputSats);
         const bitcoinAddress = index.BitcoinAddress.fromString('mwM1V4zKu99wc8hnNaN4VjwPci9TzDpyCh', true);
         const utxo = {
            txid: '1a2c2f3d15b79b8c5c0c5db89b14452d451d4ca87c2cafa94392e821407e6a34',
            outputIndex: 39,
            satoshis: 98418179,
            script: '76a91410bdcba3041b5e5517a58f2e405293c14a7c70c188ac'
         };
         const changeSatoshis = partial.prevOutput.satoshis + utxo.satoshis - outputSats - partial.bnsContractConfig.miningFee;
         
         partial.requiredBnsTx.addFundingInput(utxo);
         partial.requiredBnsTx.addChangeOutput(bitcoinAddress, changeSatoshis);
         partial.requiredBnsTx.unlockBnsInput(bitcoinAddress, changeSatoshis);
   
         const key = 'cPiAuukeNemjVCx76Vf6Fn5oUn7z9dPCvgY3b3H9m5hKCfE4BWvS'
         const privKey = new bsv.PrivateKey.fromWIF(key);;
         partial.requiredBnsTx.signFundingInput(privKey)

         expect(partial.requiredBnsTx.getFeeRate()).to.eql(0.5370981355021868);
         expect(partial.requiredBnsTx.getFee()).to.eql(14000);
         return;
      }
      expect(false).to.be.true;
   });
});