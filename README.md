# SuperAsset Javascript Library
>
> Standard Bitcoin Smart Contracts for Assets.
> [SuperAsset Whitepaper](https://bitcoinfiles.org/t/e322358ca18564fc70d6af96d4fdc31aeedcd40168347b00c01d461cbbd4a2c9)
> https://matterpool.io

SuperAsset is a collection of Standard Bitcoin Smart Contract Templates.



![header](header.png)

## What's Included

### SimpleAsset10 (SA10)

Non-Fungible-Token (NFT) Smart Contract for Bitcoin. Used for any digital property, license, media, or state tracking.

Features:
* Mint, transfer, update, and melt tokens that retain their identity and satoshi balance until melted.
* Supports seperate funding inputs and change outputs with ANYONECANPAY
* Store arbitrary data payloads (HTML, JSON, Protobuf, PDFs, images, XML, etc)
* Infuse satoshis to be locked into the asset for life cycle
* Replay protection with globally unique ID passed on as an 'identity baton'
* Can destroy the token via "melt" and retrieve the satoshis
* Identical trust guarantees for the authenticity of this asset as a plain UTXO
* Users can trivially verify authenticity and title history by requesting it in it's entirety from the seller
* Wallets and indexers can proactively index these UTXO's via a blind pattern match for the minting pattern (see below)
* Simplfied Payment Verification (SPV) and 0-conf works as expected with all the properties afforded to the native satoshi

```
Contract Code and State Layout:
//  ==========================================================================
//                       |
//    SA10 STATIC CODE   | OP_RETURN tokenID(36B) ownerPublicKey(33B) [ payload(varlen) ]
//                       |
//  ==========================================================================
```

### SimpleAsset20 (SA20)

Fungible-Token (FT) Smart Contract for Bitcoin. Useful for creating entire classes of related data with an initial supply
that can be transferred just like regular p2pkh UTXOs.

Coming soon...


---
## Install

```
npm install superasset-js
```

## Preview

```javascript
// Import the library or include it in a <script/> tag
import * as simpleasset from 'simpleasset';
var simpleasset = require('simpleasset');
const sa10 = superasset.instance({
    feeb: 0.5,
}).SA10({ verbose: true });
// -----------------------------------------------------
// DEPLOYMENT
//
// Deploy NFT with initial owner and satoshis value of 7000 (Lower than this may hit dust limit)
const assetValue = 20000;
const initialOwnerPublicKey = publicKey1.toString();
const fundingPrivateKey = privateKey2.toString();
let assetState = await sa10.deploy(initialOwnerPublicKey, assetValue, fundingPrivateKey);

// -----------------------------------------------------
// TRANSFER (AND UPDATE)
//
// Transfer and update payload (JSON example)
// Note: The payload data must follow minimal push encoding rules.
// Reference: https://github.com/moneybutton/bsv/blob/bsv-legacy/lib/script/script.js#L1083
// Client can send NFT to a public key and keep funding input and change seperate
let payloadUpdate = Buffer.from(`{ "hello": "world" }`, 'utf8').toString('hex');
let currentOwnerPrivateKey = privateKey1.toString();
let nextOwnerPublicKey = publicKey2.toString();
assetState = await sa10.transfer(assetState, currentOwnerPrivateKey, nextOwnerPublicKey, fundingPrivateKey, payloadUpdate);

// -----------------------------------------------------
// TRANSFER (AND UPDATE)
//
// Transfer and update payload (hex data example)
// Note: The payload data must follow minimal push encoding rules.
// Reference: https://github.com/moneybutton/bsv/blob/bsv-legacy/lib/script/script.js#L1083
// Client can send NFT to a public key and keep funding input and change seperate
payloadUpdate = '012345';
currentOwnerPrivateKey = privateKey2.toString();
nextOwnerPublicKey = publicKey2.toString();
assetState = await sa10.transfer(assetState, currentOwnerPrivateKey, nextOwnerPublicKey, fundingPrivateKey, payloadUpdate);

// -----------------------------------------------------
// MELT
//
// Melt back to regular p2pkh satoshis
// Client can send back NFT value to another address and keep change seperate
payloadUpdate = null;
currentOwnerPrivateKey = privateKey2.toString();
let receiverPublicKey = publicKey2.toString();
assetState = await sa10.melt(assetState, currentOwnerPrivateKey, receiverPublicKey, fundingPrivateKey);

```
## Build and Test

```
npm install
npm run build
npm run test
```

-----------

## Any questions or ideas?

@mxtterpool

https://matterpool.io

