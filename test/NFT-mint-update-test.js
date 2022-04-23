'use strict';
var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');
const { intToLE } = require('../dist/Helpers.js');
chai.use(chaiAsPromised);
var index = require('../dist/index.js');
// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys
var { privateKey } = require('../privateKey');

describe('NFT Mint Update e2e', () => {
   it('#deploy should successfully mint', async () => {
      const mintAddress = privateKey.toAddress().toString();
      const datas = 
      [
         JSON.stringify({
            title: 'Sample deploy collection',
         }),
         JSON.stringify({
            title: 'Another',
         })
      ];
      const opts = {
         isTestnet: true,
         fundingPrivateKey: privateKey,   // Funding key used to mint the NFT
      };
      const { txid, nfts} = await index.NFT.deploy(opts, mintAddress, 1, 2, datas);
      const reverseTxid = Buffer.from(txid, 'hex').reverse().toString('hex');
      for (let i = 0; i < nfts.length; i++) {
         expect(nfts[i].getAssetId()).to.eql(reverseTxid + intToLE(i));
         expect(nfts[i].getOwner().toString()).to.eql(mintAddress);
         expect(nfts[i].getMintTxId()).to.eql(txid);
         expect(nfts[i].getDeployDatas('utf8')).to.eql(datas);
      }
      const nft = nfts[0];
      const firstOwner = mintAddress;
      console.log('nfts', nfts)
      const mintResult = await nft.mint(opts, firstOwner, 1, []);
      console.log('nfts', mintResult, nfts)
   });
});
