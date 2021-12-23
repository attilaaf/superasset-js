'use strict';
var expect = require('chai').expect;
var index = require('../dist/index.js');
var bsv = require('bsv');
// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys
var { privateKey } = require('../privateKey');
const instance = index.instance({
   feeb: 0.50,
   verbose: true
});
describe('superasset.factory', () => {
   it('#createCollectionDraft', async () => {
      const issuerAddress = privateKey.toAddress().toHex().substring(2);
      const factory = instance.factory();
      const draftCollection = factory.createCollectionDraft({
         data: {
            title: 'Super Foxes'
         },
         issuerAddress: issuerAddress,
         editions: 100,
         sats: 300
      });
      expect(draftCollection.params).to.eql({ 
         data: {
            title: 'Super Foxes'
         },
         issuerAddress: issuerAddress,
         editions: 100,
         sats: 300
      });
      expect(draftCollection.satoshisNeeded()).to.eql(1000);
   });
   it('#prepareCollection insufficient fee', async () => {
      const issuerAddress = privateKey.toAddress().toHex().substring(2);
      const factory = instance.factory();
      const draftCollection = factory.createCollectionDraft({
         data: {
            title: 'Super Foxes'
         },
         issuerAddress: issuerAddress,
         editions: 100,
         sats: 300
      });
      const utxo = {};
      expect(factory.prepareCollection(draftCollection, utxo)).to.be.rejected;
      //const collection = await factory.prepareCollection(draftCollection, utxo);
   });
});