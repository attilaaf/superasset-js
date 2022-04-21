'use strict';
var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var index = require('../dist/index.js');
// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys
var { privateKey } = require('../privateKey');

describe('NFT Mint Update', () => {
   it('#deploy should throw invalid empty', async () => {
      const mintAddress = privateKey.toAddress().toString();
      const data = JSON.stringify({
         title: 'Sample deploy collection',
      });
      const opts = {
         isTestnet: true,
         fundingPrivateKey: privateKey,   // Funding key used to mint the NFT
         satoshis: 300,                   // Satoshis to place into the NFT output
         editions: 3                      // Number of editions to create
      };
      const nfts = await index.NFT.deploy(opts, mintAddress, data);
      console.log('nfts', nfts)
   });
});
