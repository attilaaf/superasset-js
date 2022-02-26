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
         expect(!!partial.requiredTx).to.equal(true);
         const claimValueBn = new bsv.Bn(300);
         expect(partial.requiredTx.txOuts[0].valueBn).to.eql(claimValueBn);
         expect(partial.requiredTx.txOuts.length).to.equal(39);
         for (let i = 1; i < partial.requiredTx.txOuts.length; i++) {
            const extValueBn = new bsv.Bn(800);
            expect(partial.requiredTx.txOuts[i].valueBn).to.eql(extValueBn);
         }
         return;
      }
      expect(false).to.be.true;
   });
   it('#attachUnlockAndChangeOutput should succeed after #getName unsucessful due to incomplete', async () => {
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
         expect(!!partial.requiredTx).to.equal(true);
         const claimValueBn = new bsv.Bn(300);
         expect(partial.requiredTx.txOuts[0].valueBn).to.eql(claimValueBn);
         expect(partial.requiredTx.txOuts.length).to.equal(39);
         for (let i = 1; i < partial.requiredTx.txOuts.length; i++) {
            const extValueBn = new bsv.Bn(800);
            expect(partial.requiredTx.txOuts[i].valueBn).to.eql(extValueBn);
         }
         console.log('partial', partial);
 
         // Attach the change output
         // Generate and attach the unlocking script at same time since it is required for the preimage generation
         const valueBn = new bsv.Bn(bnsContractConfig.claimOutputSatoshisInt);
         const script = new bsv.Script().fromHex(bnsContractConfig.claimOutput);
         const scriptVi = bsv.VarInt.fromNumber(script.toBuffer().length);
         const txOut = new bsv.TxOut().fromObject({
               valueBn: valueBn,
               scriptVi: scriptVi,
               script: script
         });
         tx.addTxOut(txOut);
         index.TreeProcessor.attachUnlockAndChangeOutput(partial.prevOutput, partial.bnsContractConfig, tx, txOut);

         return;
      }
      expect(false).to.be.true;
   });
});