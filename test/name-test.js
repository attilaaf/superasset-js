'use strict';
var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var index = require('../dist/index.js');
var Name = require('../dist/Name.js');
var { baRoot, baRootExtend, baRootExtendB, baRootExtendBA } = require('./ba-sample-tx');
var { rootTx, rootTxExtend, rootTxExtendA } = require('./b-sample-tx');
var bsv = require('bsv');
// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys
var { privateKey } = require('../privateKey');
 
describe('Name', () => {

   it('#init should fail rawtx undefined', async () => {
      const name = new index.Name();
      expect(name.init()).to.eventually.be.rejectedWith(index.ParameterMissingError)
   });
   it('#init should fail rawtx list empty', async () => {
      const name = new index.Name();
      expect(name.init([])).to.eventually.be.rejectedWith(index.ParameterMissingError)
   });
    
   it('#init should fail expectedRoot undefined', async () => {
      const name = new index.Name();
      expect(name.init([rootTx])).to.eventually.be.rejectedWith(index.ParameterExpectedRootEmptyError)
   });
   it('#init should fail expectedRoot not match', async () => {
      const name = new index.Name();
      expect(name.init([rootTx], '48c9175736a7c47a4c740bd52f590ae806e8fc0dbbb653b81ea7d890f4acc969')).to.eventually.be.rejectedWith(index.ParameterExpectedRootEmptyError)
   });
   it('#init should succeed matched root', async () => {
      const tx = bsv.Tx.fromBuffer(Buffer.from(rootTx, 'hex'));
      const expectedRoot = (await tx.hash()).toString('hex');
      const name = new index.Name();
      await name.init([
         rootTx, rootTxExtend, rootTxExtendA
      ], expectedRoot);
      expect(name.getRoot()).to.eql(expectedRoot);
   });
   it('#init should fail root unexpected output hash', async () => {
      const name = new index.Name();
      const tx = bsv.Tx.fromBuffer(Buffer.from(rootTxExtend, 'hex'));
      const expectedRoot = (await tx.hash()).toString('hex');
      expect(name.init([rootTxExtend], expectedRoot)).to.eventually.be.rejectedWith(index.RootOutputHashMismatchError)
   });
   it('#init should fail with no spend of letter yet', async () => {
      const name = new index.Name();
      const tx = bsv.Tx.fromBuffer(Buffer.from(rootTx, 'hex'));
      const expectedRoot = (await tx.hash()).toString('hex');
      expect(name.init([rootTx, rootTxExtend], expectedRoot)).to.eventually.be.rejectedWith(index.ParameterListInsufficientError)
      try {
         await name.init([rootTx, rootTxExtend], expectedRoot)
      } catch (err) {
         expect(err.toString()).to.eql('ParameterListInsufficientError')
      }
   });

   it('#getNameString should succeed with unclaimed branch is set isClaimSpent as false', async () => {
      const tx = bsv.Tx.fromBuffer(Buffer.from(rootTx, 'hex'));
      const name = new index.Name();
      const expectedRoot = (await tx.hash()).toString('hex');
      await name.init([
         rootTx, rootTxExtend, rootTxExtendA
      ], expectedRoot);
      expect(name.getNameString()).to.eql('b');
      expect(name.isClaimSpent()).to.eql(false);
   });

   it('#getNameString should succeed with unclaimed branch is set isClaimSpent as false for BA', async () => {
      const tx = bsv.Tx.fromBuffer(Buffer.from(baRoot, 'hex'));
      const name = new index.Name();
      const expectedRoot = (await tx.hash()).toString('hex');
      await name.init([
         baRoot, baRootExtend, baRootExtendB, baRootExtendBA
      ], expectedRoot);
      expect(name.getNameString()).to.eql('ba');
      expect(name.isClaimSpent()).to.eql(false);
   });

   it('#getNameString should fail throw NotInitError', async () => {
      const name = new index.Name();
      try {
         name.getNameString();
      } catch (err){
         expect(err instanceof index.NotInitError).to.be.true;
         return;
      }
      expect(false).to.be.true;
   });

   it('#getOwner should succeed with the default unclaimed address', async () => {
      const tx = bsv.Tx.fromBuffer(Buffer.from(baRoot, 'hex'));
      const name = new index.Name({testnet: true});
      const expectedRoot = (await tx.hash()).toString('hex');
      await name.init([
         baRoot, baRootExtend, baRootExtendB, baRootExtendBA
      ], expectedRoot);
      expect(name.getNameString()).to.eql('ba');
      expect(name.isClaimSpent()).to.eql(false);
      expect(name.getOwner().toString()).to.eql('mwM1V4zKu99wc8hnNaN4VjwPci9TzDpyCh');
   });
});