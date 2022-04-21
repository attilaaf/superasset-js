'use strict';
var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var index = require('../dist/index.js');
// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys
var { privateKey } = require('../privateKey');
var { bsv, toHex, num2bin } = require('scryptlib');
const { nftDeploy, nftTx1, nftMint, nftMelt } = require('./nft-sample.js');

describe('NFT', () => {
   it('#fromTransactions should throw invalid empty', async () => {
      const rawtxs = [];
      try {
         await index.NFT.fromTransactions(rawtxs);
         expect(true).to.be.false;
      }
      catch (err) {
 
         if (!(err instanceof index.InvalidArgumentError)) {
            console.log('Unexpected exception caught', err);
         }
         expect(err instanceof index.InvalidArgumentError).to.be.true;
      }
   });

   it('#fromTransactions should throw invalid mint tx', async () => {
      // The root tx extend is an NFT
      const rawtxs = [
         nftMelt
      ];
      try {
         await index.NFT.fromTransactions(rawtxs);
         expect(true).to.be.false;
      }
      catch (err) {
         if (!(err instanceof index.InvalidP2NFTPKHError)) {
            console.log('Unexpected exception caught', err);
         }
         expect(err instanceof index.InvalidP2NFTPKHError).to.be.true;
      }
   });
   it('#fromTransactions should fail ', async () => {
      // The root tx extend is an NFT
      const rawtxs = [
         nftTx1
      ];
      try {
         await index.NFT.fromTransactions(rawtxs);
         expect(true).to.be.false;
      }
      catch (err) {
         if (!(err instanceof index.InvalidArgumentError)) {
            console.log('Unexpected exception caught', err);
         }
         expect(err instanceof index.InvalidArgumentError).to.be.true;
      }
   });

   it('#fromTransactions should succeed full life cycle before melting', async () => {
      // The root tx extend is an NFT
      const rawtxs = [
         nftDeploy, nftMint, nftTx1
      ];
      const nft = await index.NFT.fromTransactions(rawtxs, 0, true);
      expect(nft.getOwner().toString()).to.eql('mwM1V4zKu99wc8hnNaN4VjwPci9TzDpyCh');
      expect(nft.getAssetId().toString()).to.eql('f0f4dfde3f763e59ff1843bce5b381bdfece3487601746bb654d0692bf7a0b9a00000000');
      expect(nft.getMintTxId().toString()).to.eql('9a0b7abf92064d65bb4617608734cefebd81b3e5bc4318ff593e763fdedff4f0');
   });
   it('#fromTransactions should fail because it was melted', async () => {
      // The root tx extend is an NFT
      const rawtxs = [
         nftDeploy, nftMint, nftTx1, nftMelt
      ];
      try {
         await index.NFT.fromTransactions(rawtxs);
         expect(true).to.be.false;
      }
      catch (err) {
         if (!(err instanceof index.InvalidP2NFTPKHError)) {
            console.log('Unexpected exception caught', err);
         }
         expect(err instanceof index.InvalidP2NFTPKHError).to.be.true;
      }
   });
});
