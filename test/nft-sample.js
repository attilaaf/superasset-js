'use strict';
var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var index = require('../dist/index.js');
var Name = require('../dist/Name.js');
var bsv = require('bsv');
// DO NOT USE FOR REAL BITCOIN TRANSACTIONS. THE FUNDS WILL BE STOLEN.
// REPLACE with your own private keys
var { privateKey } = require('../privateKey');
 
module.exports = {
   nftDeploy: '01000000029847fec9cd37a22ea36adcaba2e713a43b4d9bdc1dc8480dc23f672c74288ac0010000006b483045022100d00ddf737d09a7056dff17755c06d8cea7b3769549e2e76c7b7bb77c488c84a802204a5df0734a69b7e80f7fad1892690673632607f9b9b172fff04c5e419e1ff1b1412103f7b098436ded4a04dfa8bb0069f4e4670d2202f726727f58f610d3b6292af449ffffffffc13dee46cec446885ec907f834e911c14196b8184f1d09305752023592cd2170000000006b483045022100baf753be8a5e1bf186d17cd6c098b37f1eafdb5c06445baee83330b187f62c0502201b9c2136631efe7980434a63f6e4ed12e49bf1b2ffa4caf6080b8f593b93a3a0412103f7b098436ded4a04dfa8bb0069f4e4670d2202f726727f58f610d3b6292af449ffffffff021027000000000000f22400000000000000000000000000000000000000000000000000000000000000000000000014ada084074f9a305be43e3366455db062d6d366975279a9788870ad54796456795279000124808763587901687f7501447f77675279687e56797e587901695a7901697f7501687f7701007e81937f7502a3007f777eaa58795979827758947f75597982770128947f7788685779aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e01c37e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac77777777777777775f0d9202000000001976a914ada084074f9a305be43e3366455db062d6d3669788ac00000000',
   nftMint: '0100000001f0f4dfde3f763e59ff1843bce5b381bdfece3487601746bb654d0692bf7a0b9a00000000fd1f024d8f010100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f0f4dfde3f763e59ff1843bce5b381bdfece3487601746bb654d0692bf7a0b9a00000000f22400000000000000000000000000000000000000000000000000000000000000000000000014ada084074f9a305be43e3366455db062d6d366975279a9788870ad54796456795279000124808763587901687f7501447f77675279687e56797e587901695a7901697f7501687f7701007e81937f7502a3007f777eaa58795979827758947f75597982770128947f7788685779aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e01c37e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac77777777777777771027000000000000ffffffffa977fd567c060125c7814655ebefd907fed9f00b6ac0f040c7eff7afbb3b015b00000000c30000000a2625000000000000f2241514ada084074f9a305be43e3366455db062d6d3669700483045022100b3e3733c821404fc64f63d36a533e5657eb1c3a46077a9e3eb1aca36c33609ff02201701620318e6be3c46c3ca2b131f02be293aeb895ede177b7bd3c913143308aec32103f7b098436ded4a04dfa8bb0069f4e4670d2202f726727f58f610d3b6292af449ffffffff022625000000000000f224f0f4dfde3f763e59ff1843bce5b381bdfece3487601746bb654d0692bf7a0b9a0000000014ada084074f9a305be43e3366455db062d6d366975279a9788870ad54796456795279000124808763587901687f7501447f77675279687e56797e587901695a7901697f7501687f7701007e81937f7502a3007f777eaa58795979827758947f75597982770128947f7788685779aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e01c37e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac7777777777777777000000000000000049006a46496d6167653a2068747470733a2f2f69312e736e6463646e2e636f6d2f617274776f726b732d3030303239393930313536372d6f69773874712d74353030783530302e6a706700000000',
   nftTx1: '0100000001c46c5238218651fb08a39aee843b07adf70b01f517c99e9cd15027c0df86700200000000fd1f024d8f010100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c46c5238218651fb08a39aee843b07adf70b01f517c99e9cd15027c0df86700200000000f224f0f4dfde3f763e59ff1843bce5b381bdfece3487601746bb654d0692bf7a0b9a0000000014ada084074f9a305be43e3366455db062d6d366975279a9788870ad54796456795279000124808763587901687f7501447f77675279687e56797e587901695a7901697f7501687f7701007e81937f7502a3007f777eaa58795979827758947f75597982770128947f7788685779aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e01c37e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac77777777777777772625000000000000ffffffffec14d0a072220c9060471904bb262fba0b7fa408993254eee8c6a4a2b469639301000000c30000000a5923000000000000f2241514ada084074f9a305be43e3366455db062d6d3669700483045022100d8a1da6561b4652ca7e2f6b68dd508bbdb9dbe92bdbe5c61a7a26e40871f40540220161b10b86a77f4bc03c0ffad48c6ec322f808c2a6b2bc97c65cb7ae1f368148ac32103f7b098436ded4a04dfa8bb0069f4e4670d2202f726727f58f610d3b6292af449ffffffff025923000000000000f224f0f4dfde3f763e59ff1843bce5b381bdfece3487601746bb654d0692bf7a0b9a0000000014ada084074f9a305be43e3366455db062d6d366975279a9788870ad54796456795279000124808763587901687f7501447f77675279687e56797e587901695a7901697f7501687f7701007e81937f7502a3007f777eaa58795979827758947f75597982770128947f7788685779aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e01c37e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac777777777777777700000000000000000e006a0b68656c6c6f20776f726c6401000000',
   nftMelt: '0100000001f1d51ec448d526f01454a999f156219fc1b829bdbfa8fbac431f5e7ab04e3e8400000000fd1f024d8f010100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f1d51ec448d526f01454a999f156219fc1b829bdbfa8fbac431f5e7ab04e3e8400000000f224f0f4dfde3f763e59ff1843bce5b381bdfece3487601746bb654d0692bf7a0b9a0000000014ada084074f9a305be43e3366455db062d6d366975279a9788870ad54796456795279000124808763587901687f7501447f77675279687e56797e587901695a7901697f7501687f7701007e81937f7502a3007f777eaa58795979827758947f75597982770128947f7788685779aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e01c37e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac77777777777777775923000000000000ffffffffa6fbbc1f457df4fe0a576e33da6e87a325faed41bbf37d4abb763508f17b490b02000000c30000000a0422000000000000f2241514ada084074f9a305be43e3366455db062d6d3669751483045022100eafade08cfe73c9e11be6c31b69ae6846f327040bd48f68b950232b3ac11006f022028c24d5fc34b2a992c6af38f25de2684d60449c8acbfd1c199bcea34487e5ca2c32103f7b098436ded4a04dfa8bb0069f4e4670d2202f726727f58f610d3b6292af449ffffffff0104220000000000001976a914ada084074f9a305be43e3366455db062d6d3669788ac02000000'
};
