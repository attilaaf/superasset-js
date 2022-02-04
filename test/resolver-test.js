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
            return [
               rootTx, rootTxExtend, rootTxExtendA
            ]
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
            return [
               rootTx, rootTxExtend, rootTxExtendA
            ]
         }
      });
      const name = await resolver.getName('b');
      expect(name.getNameString()).to.eql('b');
   });
    
});