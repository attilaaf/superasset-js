# Minercraft

> Interact with Bitcoin miner APIs

Minercraft is a JavaScript library for effortlessly interacting with Bitcoin Miner APIs. Currently supporting the [beta version of the Merchant API](https://bitcoinsv.io/2020/04/03/miner-id-and-merchant-api-beta-release/).

Minercraft works both **on the server** as well as **inside a browser.**

---

# What it does

Miner merchant APIs must follow the BRFC spec at https://github.com/bitcoin-sv/merchantapi-reference

1. **Get fee rates** from a miner
2. **Calculate fee** from a raw transaction
3. **Query the status of a single transaction**
4. **Push a transaction** to a miner

---

# Miners

The bitcoin miners currently providing the merchant API beta endpoints are:

- Matterpool: https://matterpool.io
- Mempool: https://mempool.com
- TAAL: https://taal.com
- YOU CAN TOO! (Please give a heads up to [@_unwriter](https://twitter.com/_unwriter) when you implement the API)

---

# install

## 1. In browser

```
<script src='https://unpkg.com/minercraft'></script>
```

Check out an in-browser demo here: [Minercraft Browser Demo](https://minercraft.network/demo/webdemo.html) (Source code [here](https://github.com/interplanaria/minercraft/blob/master/demo/webdemo.html))



## 2. In node.js

```
npm install --save minercraft
```
---

# API

## 0. Create a miner unit

Initialize with a miner API (must follow the miner merchant API spec: https://github.com/bitcoin-sv-specs/brfc-merchantapi)

Example:

```javascript
const miner = new Minercraft({
  url: "https://www.ddpurse.com/openapi",
  headers: {
    // The following token value is a "free trial" value. For more info visit https://developers.dotwallet.com/en/dev/api/merchant
    token: "561b756d12572020ea9a104c3441b71790acbbce95a6ddbf7e0630971af9424b"
  }
})
```

### a. TAAL.com

You can use the following config to connect to TAAL merchant API (Tentative):

```javascript
const miner = new Minercraft({
  "url": "https://merchantapi.taal.com"
})
```

### b. Mempool.com

You can use the following config to connect to Mempool.com merchant API (Tentative) using the beta token (free):

```javascript
const miner = new Minercraft({
  url: "https://www.ddpurse.com/openapi",
  headers: {
    // The following token value is a "free trial" value. For more info visit https://developers.dotwallet.com/en/dev/api/merchant
    token: "561b756d12572020ea9a104c3441b71790acbbce95a6ddbf7e0630971af9424b"
  }
})
```

### c. Matterpool.io

You can use the following config to connect to Matterpool.io merchant API:

```javascript
const miner = new Minercraft({
  url: "https://merchantapi.matterpool.io"
})
```

## 1. Get the fee rate

Query a miner's fee rate:

```javascript
let rate = await miner.fee.rate()
console.log("fee rate:", rate)
```

will print:

```json
fee rate: {
  "valid": true,
  "expires": "2020-04-30T13:05:16.925Z",
  "mine": { "standard": 0.5, "data": 0.5 },
  "relay": { "standard": 0.25, "data": 0.25 }
}
```

You can also pass in an additional parameter `verbose: true` to get the raw response from the API, which includes other metadata such as minerID and signature, which you can use to verify authenticity:

```javascript
let rate = await miner.fee.rate({ verbose: true })
console.log("verbose fee rate:", rate)
```

## 2. Calculate fee for a transaction

Calculate total fee, based on a fixed rate:

```javascript
let fee = miner.fee.get({
  rate: { data: 0.5, standard: 0.5 },
  tx: "0100000001648ed7d1c1a27ec923445c8d404e227145218c4ce01cf958a898c5a048e8f264020000006a47304402207dc1953455be091c8df18e7f7e1424bc4efdced3e400642f8316e3ef298c3f30022062d833b3f1b94593ec7c088b930e2987475c7d99bf19f5714b12a9facff100df41210273f105be3e7ca116e96c7c40f17267ae05ede7160eb099aa2146a88b6328f4ecffffffff030000000000000000fdc901006a223144535869386876786e36506434546176686d544b7855374255715337636e7868770c57544458565633505a4b474414e5ae89e5bebd2fe585ade5ae892fe99c8de982b119323032302d30342d30365430363a30303a30302b30383a30304c697b22617169223a223538222c22706d3235223a223332222c22706d3130223a223636222c22736f32223a2235222c226e6f32223a223235222c22636f223a22302e373530222c226f33223a223635222c22706f6c223a22504d3130222c22717561223a22e889af227d4cfb78da75d1c16a02311006e077c959964cb29944dfa1d07bf1209e0a6b57b137114aaf2d2d5e446d7b29d59e3c492f22f834d9ea5b3859e826bba4b73fc34cf898b999b0dee89675184ad662c3815094a5293370ca1a298f73415151ba2b9370cdfd9c124f34c55c563fe419c5eb2b9aa5b1fb1e3d7edf66c5cf93fdfa2ed6072a66ae2621d15203775d99fb070013c50da7cab45599c09b04062688999437993f53d91933ade6a7f5d16e37e7e5676842307553aa1b2685c19e02137a93a94c92c74c69dc54bc7f9c173bfbf21882745b379784a60e0a0f071ea4fce1a45f521a399cfae770f6f0605f67f6795f0381688010dd1da7dd0b690c97db22020000000000001976a914666675d887a7ae09835af934096d9fcbbb70eed288ac61290000000000001976a9149e7520bc258934a3d58704ab98ed0200e2c1bb9688ac00000000"
})
```

First query the fee rate from a miner, and then use it to calcluate the total fee for a transaction:

```javascript
let rate = await miner.fee.rate()
let fee = miner.fee.get({
  rate: rate.mine,  // use the mining rate
  tx: "0100000001648ed7d1c1a27ec923445c8d404e227145218c4ce01cf958a898c5a048e8f264020000006a47304402207dc1953455be091c8df18e7f7e1424bc4efdced3e400642f8316e3ef298c3f30022062d833b3f1b94593ec7c088b930e2987475c7d99bf19f5714b12a9facff100df41210273f105be3e7ca116e96c7c40f17267ae05ede7160eb099aa2146a88b6328f4ecffffffff030000000000000000fdc901006a223144535869386876786e36506434546176686d544b7855374255715337636e7868770c57544458565633505a4b474414e5ae89e5bebd2fe585ade5ae892fe99c8de982b119323032302d30342d30365430363a30303a30302b30383a30304c697b22617169223a223538222c22706d3235223a223332222c22706d3130223a223636222c22736f32223a2235222c226e6f32223a223235222c22636f223a22302e373530222c226f33223a223635222c22706f6c223a22504d3130222c22717561223a22e889af227d4cfb78da75d1c16a02311006e077c959964cb29944dfa1d07bf1209e0a6b57b137114aaf2d2d5e446d7b29d59e3c492f22f834d9ea5b3859e826bba4b73fc34cf898b999b0dee89675184ad662c3815094a5293370ca1a298f73415151ba2b9370cdfd9c124f34c55c563fe419c5eb2b9aa5b1fb1e3d7edf66c5cf93fdfa2ed6072a66ae2621d15203775d99fb070013c50da7cab45599c09b04062688999437993f53d91933ade6a7f5d16e37e7e5676842307553aa1b2685c19e02137a93a94c92c74c69dc54bc7f9c173bfbf21882745b379784a60e0a0f071ea4fce1a45f521a399cfae770f6f0605f67f6795f0381688010dd1da7dd0b690c97db22020000000000001976a914666675d887a7ae09835af934096d9fcbbb70eed288ac61290000000000001976a9149e7520bc258934a3d58704ab98ed0200e2c1bb9688ac00000000"
})
console.log("fee = ", fee)
```

will print:

```
fee = 348
```

## 3. Get transaction status

Query the miner to check what the status of a transaction is:

```javascript
let status = miner.tx.status("e4763d71925c2ac11a4de0b971164b099dbdb67221f03756fc79708d53b8800e")
console.log(status)
```

will print:

```json
{
  "apiVersion": "0.1.0",
  "timestamp": "2020-04-15T19:51:51.020Z",
  "returnResult": "success",
  "resultDescription": "",
  "blockHash": "000000000000000004a5686ff15cdb3950939bdc5725970d963e2b03d3d43d45",
  "blockHeight": 630700,
  "confirmations": 50,
  "minerId": "03c51d59a737a0ebc064344bf206b7140bf51a9ef8d6cb75dc2d726853d7c76758",
  "txSecondMempoolExpiry": 0,
  "valid": true
}
```

If you want to get a more detailed response, including the minerID and signature, you can call the method with `{verbose: true}`:

```javascript
let status = await miner.tx.status(txid, { verbose: true })
console.log(status)
```

will print something like:

```json
{
  "payload": {
    "apiVersion": "0.1.0",
    "timestamp": "2020-04-19T15:06:56.299Z",
    "returnResult": "success",
    "resultDescription": "",
    "blockHash": "000000000000000004a5686ff15cdb3950939bdc5725970d963e2b03d3d43d45",
    "blockHeight": 630700,
    "confirmations": 603,
    "minerId": "03e92d3e5c3f7bd945dfbf48e7a99393b1bfb3f11f380ae30d286e7ff2aec5a270",
    "txSecondMempoolExpiry": 0
  },
  "signature": "3044022032eb418ea68a0825767fa6bf038cca200acbbbabeadd7f7e3b203594e3ef3ee60220224fc0657a5c7c8b3b4a8b71de897655a990b975ae9e9f8d574eb806663bc839",
  "publicKey": "03e92d3e5c3f7bd945dfbf48e7a99393b1bfb3f11f380ae30d286e7ff2aec5a270",
  "encoding": "UTF-8",
  "mimetype": "application/json",
  "valid": true
}
```


## 4. Push transaction

Pass a raw transaction hex string into the `push()` function and it will send the transaction directly to the miner.

```javascript
let response = await miner.tx.push("0100000001648ed7d1c1a27ec923445c8d404e227145218c4ce01cf958a898c5a048e8f264020000006a47304402207dc1953455be091c8df18e7f7e1424bc4efdced3e400642f8316e3ef298c3f30022062d833b3f1b94593ec7c088b930e2987475c7d99bf19f5714b12a9facff100df41210273f105be3e7ca116e96c7c40f17267ae05ede7160eb099aa2146a88b6328f4ecffffffff030000000000000000fdc901006a223144535869386876786e36506434546176686d544b7855374255715337636e7868770c57544458565633505a4b474414e5ae89e5bebd2fe585ade5ae892fe99c8de982b119323032302d30342d30365430363a30303a30302b30383a30304c697b22617169223a223538222c22706d3235223a223332222c22706d3130223a223636222c22736f32223a2235222c226e6f32223a223235222c22636f223a22302e373530222c226f33223a223635222c22706f6c223a22504d3130222c22717561223a22e889af227d4cfb78da75d1c16a02311006e077c959964cb29944dfa1d07bf1209e0a6b57b137114aaf2d2d5e446d7b29d59e3c492f22f834d9ea5b3859e826bba4b73fc34cf898b999b0dee89675184ad662c3815094a5293370ca1a298f73415151ba2b9370cdfd9c124f34c55c563fe419c5eb2b9aa5b1fb1e3d7edf66c5cf93fdfa2ed6072a66ae2621d15203775d99fb070013c50da7cab45599c09b04062688999437993f53d91933ade6a7f5d16e37e7e5676842307553aa1b2685c19e02137a93a94c92c74c69dc54bc7f9c173bfbf21882745b379784a60e0a0f071ea4fce1a45f521a399cfae770f6f0605f67f6795f0381688010dd1da7dd0b690c97db22020000000000001976a914666675d887a7ae09835af934096d9fcbbb70eed288ac61290000000000001976a9149e7520bc258934a3d58704ab98ed0200e2c1bb9688ac00000000")
```

Again, to get more verbose response, you can pass in `{ verbose: true }`:

```javascript
let response = await miner.tx.push("0100000001648ed7d1c1a27ec923445c8d404e227145218c4ce01cf958a898c5a048e8f264020000006a47304402207dc1953455be091c8df18e7f7e1424bc4efdced3e400642f8316e3ef298c3f30022062d833b3f1b94593ec7c088b930e2987475c7d99bf19f5714b12a9facff100df41210273f105be3e7ca116e96c7c40f17267ae05ede7160eb099aa2146a88b6328f4ecffffffff030000000000000000fdc901006a223144535869386876786e36506434546176686d544b7855374255715337636e7868770c57544458565633505a4b474414e5ae89e5bebd2fe585ade5ae892fe99c8de982b119323032302d30342d30365430363a30303a30302b30383a30304c697b22617169223a223538222c22706d3235223a223332222c22706d3130223a223636222c22736f32223a2235222c226e6f32223a223235222c22636f223a22302e373530222c226f33223a223635222c22706f6c223a22504d3130222c22717561223a22e889af227d4cfb78da75d1c16a02311006e077c959964cb29944dfa1d07bf1209e0a6b57b137114aaf2d2d5e446d7b29d59e3c492f22f834d9ea5b3859e826bba4b73fc34cf898b999b0dee89675184ad662c3815094a5293370ca1a298f73415151ba2b9370cdfd9c124f34c55c563fe419c5eb2b9aa5b1fb1e3d7edf66c5cf93fdfa2ed6072a66ae2621d15203775d99fb070013c50da7cab45599c09b04062688999437993f53d91933ade6a7f5d16e37e7e5676842307553aa1b2685c19e02137a93a94c92c74c69dc54bc7f9c173bfbf21882745b379784a60e0a0f071ea4fce1a45f521a399cfae770f6f0605f67f6795f0381688010dd1da7dd0b690c97db22020000000000001976a914666675d887a7ae09835af934096d9fcbbb70eed288ac61290000000000001976a9149e7520bc258934a3d58704ab98ed0200e2c1bb9688ac00000000", {
  verbose: true
})
```

This will provide more information about the response.


## 5. Validate API responses

Minercraft takes care of all the cryptographic validation of the API responses automatically.

Note that every response contains a `"valid"` attribute which is either `true` or `false`.

It will be true if the signature matches the publickey and the content. Otherwise it will be false. This is the same for both the normal mode and the verbose mode. Here are some examples:

Normal Mode:

```json
{
  "valid": true,
  "expires": "2020-04-30T13:05:16.525Z",
  "mine": { "standard": 0.5, "data": 0.5 },
  "relay": { "standard": 0.25, "data": 0.25 }
}
```

Verbose Mode:

```json
{
  "payload": {
    "apiVersion": "0.1.0",
    "timestamp": "2020-04-30T12:55:26.581Z",
    "returnResult": "success",
    "resultDescription": "",
    "blockHash": "000000000000000004a5686ff15cdb3950939bdc5725970d963e2b03d3d43d45",
    "blockHeight": 630700,
    "confirmations": 2167,
    "minerId": "03c51d59a737a0ebc064344bf206b7140bf51a9ef8d6cb75dc2d726853d7c76758",
    "txSecondMempoolExpiry": 0
  },
  "signature": "304402206a15cc626cb8e959aeb53eb4224cdd7150c56ae662ed236d7042265f21cbc8f802200bf97202bc0c09aae1f3993d28d4175ae24dd53225321c64cb9492c81f2ede03",
  "publicKey": "03c51d59a737a0ebc064344bf206b7140bf51a9ef8d6cb75dc2d726853d7c76758",
  "encoding": "UTF-8",
  "mimetype": "applicaton/json",
  "valid": true
}
```

