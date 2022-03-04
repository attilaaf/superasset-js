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
var { bsv, toHex, num2bin } = require('scryptlib');
 
describe('E2E: Create new root, extend and claim bat', () => {
   it('run', async () => {
      const publicKey = privateKey.publicKey;
      const publicKeyHash = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer())
      const issuerPkh = toHex(publicKeyHash);
      const claimNftScript = index.Resolver.buildNFTPublicKeyHashOut(num2bin(0, 36), issuerPkh);
      const claimNftScriptHex = claimNftScript.toHex();
      const rootOutput = index.Resolver.generateBnsRoot(issuerPkh, claimNftScriptHex, '3f');
      console.log('rootOutput', rootOutput);
      expect(rootOutput.toHex()).to.eq('04626e733114ada084074f9a305be43e3366455db062d6d366971442a46196fbd71ee92fa0e08143942c924bb62130140000000000000000000000000000000000000000011401ff587964780154a1696f7501149c63765f7901687f7501447f777e77685d79547e57797e01147e56797e01147e55797e01147e78607902b3007f7502b2007f777ea67e517e53798b51807e517e5f79016b011179016b7f7501697f7701007e81937f7502b3007f7756795f79a6885e7952797e012d7e787e52797e015f7e787e52797e01307e787e52797e01317e787e52797e01327e787e52797e01337e787e52797e01347e787e52797e01357e787e52797e01367e787e52797e01377e787e52797e01387e787e52797e01397e787e52797e01617e787e52797e01627e787e52797e01637e787e52797e01647e787e52797e01657e787e52797e01667e787e52797e01677e787e52797e01687e787e52797e01697e787e52797e016a7e787e52797e016b7e787e52797e016c7e787e52797e016d7e787e52797e016e7e787e52797e016f7e787e52797e01707e787e52797e01717e787e52797e01727e787e52797e01737e787e52797e01747e787e52797e01757e787e52797e01767e787e52797e01777e787e52797e01787e787e52797e01797e787e52797e017a7e787e5d797e041976a9147e5e797e0288ac7eaa011179011279827758947f7501127982770128947f77886d75675679a955798857795779ad685d79aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e01c17e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac7777777777777777777777777777')
      const tx = await index.Resolver.deployRoot(privateKey, rootOutput, 1000);

      console.log('Deployed tx: ', tx.toString(),  tx.hash);
   });
});