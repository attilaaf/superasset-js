const axios = require('axios')
class Transaction {
  constructor(o) {
    if (o && o.url) {
      this.url = o.url
      this.headers = o.headers
      this.statusPath = "/mapi/tx"
      this.pushPath = "/mapi/tx"
    }
    this.validate = o.validate;
  }
  push(rawtx, options) {
    if (this.url) {
      let u = this.url + (this.pushPath ? this.pushPath : "")
      console.log('options', options);
      return axios.post(u, { rawtx: rawtx }, {
        headers: this.headers,
        ...options
      }).then((res) => {
        if (options && options.verbose) {
          res.data.payload = JSON.parse(res.data.payload)
          return res.data
        } else {
          return JSON.parse(res.data.payload)
        }
      })
    } else {
      throw new Error("Must instantiate with a miner merchant API root URL")
    }
  }
  status(id, options) {
    if (this.url) {
      let u = this.url + (this.statusPath ? this.statusPath : "") + "/" + id
      return axios.get(u, { headers: this.headers }).then((res) => {
        let isvalid;
        try {
          isvalid = this.validate(res.data)
        } catch (e) {
          isvalid = false;
        }
        if (options && options.verbose) {
          res.data.payload = JSON.parse(res.data.payload)
          res.data.valid = isvalid
          return res.data
        } else {
          let j = JSON.parse(res.data.payload)
          j.valid = isvalid
          return j
        }
      })
    } else {
      throw new Error("Must instantiate with a miner merchant API root URL")
    }
  }
}
module.exports = Transaction
