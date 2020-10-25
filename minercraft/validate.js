const bsv = require('bsv')
module.exports = (status) => {
  const payloadHash = bsv.crypto.Hash.sha256(Buffer.from(status.payload))
  const signature = bsv.crypto.Signature.fromString(status.signature)
  const publicKey = bsv.PublicKey.fromString(status.publicKey)
  return bsv.crypto.ECDSA.verify(payloadHash, signature, publicKey)
}
