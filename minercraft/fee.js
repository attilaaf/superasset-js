const bsv = require('bsv')
const axios = require('axios')
class Fee {
  constructor(o) {
    if (o && o.url) {
      this.url = o.url
      this.headers = o.headers
      this.ratePath = "/mapi/feeQuote"
    }
    this.validate = o.validate;
  }
  rate(options) {
    if (this.url) {
      let u = this.url + (this.ratePath ? this.ratePath : "")
      return axios.get(u, { headers: this.headers }).then((res) => {
        let isvalid;
        try {
          isvalid = this.validate(res.data)
        } catch (e) {
          isvalid = false;
        }
        let response = JSON.parse(res.data.payload)
        if (options && options.verbose) {
          res.data.payload = response
          res.data.valid = isvalid
          return res.data;
        } else {
          let fees = { valid: isvalid, expires: response.expiryTime, mine: {}, relay: {} }
          response.fees.forEach((f) => {
            fees.mine[f.feeType] = f.miningFee.satoshis/f.miningFee.bytes
            fees.relay[f.feeType] = f.relayFee.satoshis/f.relayFee.bytes
          })
          return fees
        }
      })
    } else {
      throw new Error("Must instantiate with a miner merchant API root URL")
    }
  }
  get(t) {    
    /*****************************************************************************************
    *
    * calculate fee, using the same logic as in:
    * https://github.com/moneybutton/bsv/blob/master/lib/transaction/transaction.js#L925-L936
    *
    *****************************************************************************************/
    if (t.tx) {
      let rate = (t.rate ? t.rate : { data: 0.5, standard: 0.5 })
      let tx = new bsv.Transaction(t.tx)
      let fee = 0
      let staticItems = [
        { script: null, size: 4 },  // version
        { script: null, size: 4 },  // locktime
        { script: null, size: bsv.encoding.Varint(tx.inputs.length).toBuffer().length },
        { script: null, size: bsv.encoding.Varint(tx.outputs.length).toBuffer().length },
      ]
      let inputItems = tx.inputs.map((i) => {
        return { script: i, size: null, type: "input" }
      })
      let outputItems = tx.outputs.map((o) => {
        return { script: o, size: null, type: "output" }
      })
      let items = [].concat(staticItems).concat(inputItems).concat(outputItems)
      items.forEach((item) => {
        let type = this._type(item)
        let size = this._size(item)
        fee += Math.ceil(size * rate[type])
      })
      return fee
    } else {
      throw new Error("requires a 'tx' and a 'rate' attribute")
    }
  }
  _type(item) {
    // Currently OP_0 OP_RETURN are considered "data"
    return (item.data && item.data.chunks && item.data.chunks[0].opcodenum === 0 && item.data.chunks[1].opcodenum === 106 ? "data": "standard")
  }
  _size(item) {
    if (item.type === 'input') {
      return item.script._estimateSize()
    } else if (item.type === 'output') {
      return item.script.getSize()
    } else {
      return item.size
    }
  }
}
module.exports = Fee
