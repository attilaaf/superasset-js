const Fee = require('./fee')
const Transaction = require('./transaction')
const Validate = require('./validate')
/***************************************
new Minercraft({
  url: "https://www.ddpurse.com/openapi",
  headers: {
    token: "561b756d12572020ea9a104c3441b71790acbbce95a6ddbf7e0630971af9424b"
  }
})
***************************************/
class Minercraft {
  constructor(o) {
    o.validate = Validate
    o.headers = Object.assign({ "Content-Type": "application/json" }, o.headers)
    this.fee = new Fee(o)
    this.tx = new Transaction(o)
    this.validate = Validate
  }
}
Minercraft.validate = Validate
module.exports = Minercraft
