'use strict';
var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var index = require('../dist/index.js');
var Name = require('../dist/Name.js');
var { baRoot, baRootExtend, baRootExtendB, baRootExtendBA } = require('./ba-sample-tx');
var { rootTx, rootTxExtend, rootTxExtendA } = require('./b-sample-tx');
// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys
var { privateKey } = require('../privateKey');
var { bsv, toHex, num2bin } = require('scryptlib');
const { nftDeploy, nftTx1, nftMint, nftMelt } = require('./nft-sample.js');

describe('NFT', () => {
   it('#createNFT should throw invalid empty', async () => {
      const rawtxs = [];
      try {
         await index.NFT.createNFT(rawtxs);
         expect(true).to.be.false;
      }
      catch (err) {
         if (!(err instanceof index.InvalidNFTTxError)) {
            console.log('Unexpected exception caught', err);
         }
         expect(err instanceof index.InvalidNFTTxError).to.be.true;
      }
   });

   it('#createNFT should throw invalid mint tx', async () => {
      // The root tx extend is an NFT
      const rawtxs = [
         rootTx
      ];
      try {
         await index.NFT.createNFT(rawtxs);
         expect(true).to.be.false;
      }
      catch (err) {
         if (!(err instanceof index.InvalidNFTTxError)) {
            console.log('Unexpected exception caught', err);
         }
         expect(err instanceof index.InvalidNFTTxError).to.be.true;
      }
   });
   it('#createNFT should succeed deploy tx', async () => {
      // The root tx extend is an NFT
      const rawtxs = [
         rootTxExtendA
      ];
      const nft = await index.NFT.createNFT(rawtxs, true);
      console.log('nft', nft);

      expect(nft.getOwner().toString()).to.eql('mwM1V4zKu99wc8hnNaN4VjwPci9TzDpyCh');
      expect(nft.getAssetId().toString()).to.eql('b1f842b9dddd1c52fcb179cbe9ede1454d07e3738424e9539ea33dece45aa0a800000000');
      expect(nft.getMintTxId().toString()).to.eql('a8a05ae4ec3da39e53e9248473e3074d45e1ede9cb79b1fc521cddddb942f8b1');
   });
   it('#createNFT should succeed full life cycle to melt', async () => {
      // The root tx extend is an NFT
      const rawtxs = [
         nftDeploy, nftMint, nftTx1, nftMelt
      ];
      const nft = await index.NFT.createNFT(rawtxs, true);
      console.log('nft', nft);

      expect(nft.getOwner().toString()).to.eql('mwM1V4zKu99wc8hnNaN4VjwPci9TzDpyCh');
      expect(nft.getAssetId().toString()).to.eql('b1f842b9dddd1c52fcb179cbe9ede1454d07e3738424e9539ea33dece45aa0a800000000');
      expect(nft.getMintTxId().toString()).to.eql('a8a05ae4ec3da39e53e9248473e3074d45e1ede9cb79b1fc521cddddb942f8b1');
      /*
// The current owner of the name UTXO
    getOwner: () => BitcoinAddress | null;
    // Set the new owner of the name UTXO (transfer)
    setOwner: (address: BitcoinAddress, fundingKey: string | bsv.PrivateKey) => Promise<OpResult>;
    // Get all mint info
    getMintInfo: () => MintInfo | null;
    // Update records
    update: (records: Array<{ type: string, name: string, value: string, action?: 'set' | 'delete' }>) => Promise<OpResult>;
    // Get the records
    getRecords: () => Records;
    // Asset ID
    getAssetId: () => string;
    // Get the original rawtxs
    getRawtxs: () => string[]
    // Get the latest UTXO 
    getUTXO: () => { txId: string, outputIndex: number, script: string, satoshis: number }
      */
   });
});
