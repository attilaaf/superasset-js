'use strict';
var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var index = require('../dist/index.js');
var { baRoot, baRootExtend, baRootExtendB, baRootExtendBA } = require('./ba-sample-tx');
var { rootTx, rootTxExtend, rootTxExtendA } = require('./b-sample-tx');
var bsv = require('bsv');
// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys
var { privateKey } = require('../privateKey');
 
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
      const tx = bsv.Tx.fromBuffer(Buffer.from(rootTx, 'hex'));
      const expectedRoot = (await tx.hash()).toString('hex');
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
      const tx = bsv.Tx.fromBuffer(Buffer.from(baRoot, 'hex'));
      const root = (await tx.hash()).toString('hex');
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
      const tx = bsv.Tx.fromBuffer(Buffer.from(baRoot, 'hex'));
      const root = (await tx.hash()).toString('hex');
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
      const tx = bsv.Tx.fromBuffer(Buffer.from(baRoot, 'hex'));
      const root = (await tx.hash()).toString('hex');
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
         const claimValueBn = new bsv.Bn(300);
         expect(partial.requiredBnsTx.getTx().txOuts[0].valueBn).to.eql(claimValueBn);
         expect(partial.requiredBnsTx.getTx().txOuts.length).to.equal(39);
         for (let i = 1; i < partial.requiredBnsTx.getTx().txOuts.length; i++) {
            const extValueBn = new bsv.Bn(800);
            expect(partial.requiredBnsTx.getTx().txOuts[i].valueBn).to.eql(extValueBn);
         }
         return;
      }
      expect(false).to.be.true;
   });
   it('#BnsTx methods should succeed after #getName unsucessful due to incomplete', async () => {
      const tx = bsv.Tx.fromBuffer(Buffer.from(baRoot, 'hex'));
      const root = (await tx.hash()).toString('hex');
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
         const claimValueBn = new bsv.Bn(300);
         expect(partial.requiredBnsTx.getTx().txOuts[0].valueBn).to.eql(claimValueBn);
         expect(partial.requiredBnsTx.getTx().txOuts.length).to.equal(39);
         for (let i = 1; i < partial.requiredBnsTx.getTx().txOuts.length; i++) {
            const extValueBn = new bsv.Bn(800);
            expect(partial.requiredBnsTx.getTx().txOuts[i].valueBn).to.eql(extValueBn);
         }
         const outputSats = 300 + 800 * 38;
         expect(partial.requiredBnsTx.getTotalSatoshisExcludingChange()).to.eql(outputSats);
         

         const bitcoinAddress = index.BitcoinAddress.fromString('mwM1V4zKu99wc8hnNaN4VjwPci9TzDpyCh', true);
         console.log('bitcoinAddress', bitcoinAddress);
 
         const utxo = {
            txid: '1a2c2f3d15b79b8c5c0c5db89b14452d451d4ca87c2cafa94392e821407e6a34',
            outputIndex: 39,
            satoshis: 98418179,
            script: '76a91410bdcba3041b5e5517a58f2e405293c14a7c70c188ac'
         };

         partial.requiredBnsTx.setFundingInput(utxo);
         partial.requiredBnsTx.setChangeOutput(bitcoinAddress);
         console.log('partial.requiredBnsTx', partial.requiredBnsTx);

         partial.requiredBnsTx.unlockBnsInput(bitcoinAddress);

         const key = 'cPiAuukeNemjVCx76Vf6Fn5oUn7z9dPCvgY3b3H9m5hKCfE4BWvS'
         const privKey = new bsv.PrivKey.Testnet();
         privKey.fromWif(key);

         console.log('partial.requiredBnsTx updated', privKey);
         partial.requiredBnsTx.unlockFundingInput(privKey);

         expect(partial.requiredBnsTx.getFeeRate() >= 0.5 && partial.requiredBnsTx.getFeeRate() <= 0.51).to.eql(true);
         expect(partial.requiredBnsTx.getFeeRate()).to.eql(0.5018723699957534);
         expect(partial.requiredBnsTx.getFee()).to.eql(13000);

         
         return;
      }
      expect(false).to.be.true;
   });
});