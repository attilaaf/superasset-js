const { exit } = require('process')
const { bsv } = require('scryptlib');

// fill in private key on testnet in WIF here
const key = 'cPiAuukeNemjVCx76Vf6Fn5oUn7z9dPCvgY3b3H9m5hKCfE4BWvS'
const key2 = 'cPiAuukeNemjVCx76Vf6Fn5oUn7z9dPCvgY3b3H9m5hKCfE4BWvS'
const key3 = 'cPiAuukeNemjVCx76Vf6Fn5oUn7z9dPCvgY3b3H9m5hKCfE4BWvS'

if (!key) {
  genPrivKey()
}

function genPrivKey() {
  const newPrivKey = new bsv.PrivateKey.fromRandom('testnet')
  console.log(`Missing private key, generating a new one ...
Private key generated: '${newPrivKey.toWIF()}'
You can fund its address '${newPrivKey.toAddress()}' from some faucet and use it to complete the test
Example faucets are https://faucet.bitcoincloud.net and https://testnet.satoshisvision.network`)
  exit(0)
}

const privateKey = new bsv.PrivateKey.fromWIF(key)

const privateKey2 = new bsv.PrivateKey.fromWIF(key2)

const privateKey3 = new bsv.PrivateKey.fromWIF(key3)

module.exports = {
  privateKey,
  privateKeyStr: key,
  privateKey2,
  privateKey3,
  genPrivKey
}
