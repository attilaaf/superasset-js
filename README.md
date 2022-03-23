# BASED NAME SERVICE (BNS) Javascript Library
>
> The Based Organization, Inc.
 
Coming soon...

---
## Install

```
npm install based-js
```

# based.js

## Overview of the API

### Setup

```
import BNS, { getBnsAddress } from '@basednames/based-js'

const bns = new BNS({ provider, BitcoinAddress: getBnsAddress('1') })

bns.name('resolver.based').getAddress()  
```

### exports

```
default - BNS
getBnsAddress
getResolverContract
getBnsContract
namehash
labelhash
```

### BNS Interface

```
getName(name: String) => Name
```


### Name Interface

```ts
async getOwner() => Promise<BitcoinAddress>
```

Returns the owner/controller for the current BNS name.

```ts
async setOwner(address: BitcoinAddress) => Promise<OpResult>
```

Sets the owner/controller for the current BNS name.

```ts
async getResolver() => Promise<BitcoinAddress>
```

Returns the resolver for the current BNS name.

```ts
async setResolver(address: BitcoinAddress) => Promise<BitcoinAddress>
```

Sets the resolver for the current BNS name.

```ts
async getTTL() => Promise<Number>
```

Returns the TTL for the current BNS name.

```ts
async getAddress(coinId: String) => Promise<BitcoinAddress>
```

Returns the address for the current BNS name for the coinId provided.

```ts
async setAddress(coinId: String, address: BitcoinAddress) => Promise<BitcoinTxObject>
```

Sets the address for the current BNS name for the coinId provided.

```ts
async getContentHash() => Promise<ContentHash>
```

Returns the contentHash for the current BNS name.

```ts
async setContenthash(content: ContentHash) => Promise<BitcoinTxObject>
```

Sets the contentHash for the current BNS name.

```ts
async getText(key: String) => Promise<String>
```

Returns the text record for a given key for the current BNS name.

```ts
async setText(key: String, recordValue: String) => Promise<BitcoinTxObject>
```

Sets the text record for a given key for the current BNS name.

```ts
async setSubnodeOwner(label: String, newOwner: BitcoinAddress) => Promise<BitcoinTxObject>
```

Sets the subnode owner for a subdomain of the current BNS name.

```ts
async setSubnodeRecord(label: String, newOwner: BitcoinAddress, resolver: BitcoinAddress, ttl: ?Number) => Promise<BitcoinTxObject>
```

Sets the subnode owner, resolver, ttl for a subdomain of the current BNS name in one transaction.

```ts
 async createSubdomain(label: String) => Promise<BitcoinTxObject>
```

Creates a subdomain for the current BNS name. Automatically sets the owner to the signing account.

```ts
async deleteSubdomain(label: String) => Promise<BitcoinTxObject>
```

Deletes a subdomain for the current BNS name. Automatically sets the owner to "0x0..."

## Smart Contract Design

### Prefix Tree Initialization

The structure of the transactions is a prefix tree, anchored at the initial root output deployed to the blockchain:

```
root: ---- o

```

We say that the BNS tree is anchored at root (txid+outputIndex). This is the starting point for resolving a name, by traversing
the root, to each letter of a name, to the corresponding claim NFT leaf node. The root represents the canonical starting point for a BNS tree.  The root node represents the null character `ff`, the first extension off the root will produce a fan-out pattern of an initial claim NFT (described below) and an output for each of characters `-,_, 0-9,a-z`. 

Initialization fields:

`issuerPkh (hash 160 bytes)`: Issuer that has the ability to recycle character nodes. Can be set to all zeroes to prevent this ability. 

`claimHash (hash 160 bytes)`: The hash of the full output (including satoshis amount) that must be used for the 0'th output (Claim NFT). This is the mechanism by which the emitting of the initial Claim NFT is enforced.

`dupHash (hash 160 bytes)`: An internal hash used to prevent duplicating and/or merging of BNS trees with different ancestry history. Without a "duplicate hash" multiple BNS trees could be merged. This hash prevents that from being possible.

`currentDimension (integer)`:  set to `20 (0x14)` that will be incremented with each extension, up to a maximum value of `84 (0x55)` to limit the maximum length of a name (Which is 63 characters, the same as the DNS system).

`char (byte)`: The character represented by this output. Initialized to `ff`. It is also used to be concantenated with the `duphash` for subsequent spends. Every spend of a BNS transaction has exactly 38 character outputs, representing `-,_, 0-9,a-z`.

After the initial deployment of the root output, it can be spent according to the rules, which results in the following fan-out pattern:

```
             /----C
            /
root: ---- o -----L(a)
            \ 
             \----L(b)
              \   
               \--L(c)
                \ ...
                 \
               change
```

Where `C` represents the Claim NFT at the 0'th output. And `L` represents a character letter output. Only 2 are shown for brevity, however there are 38 in total, each representing characters `-,_, 0-9,a-z`. Recall that the `0'th` output of an Extension transaction is reserved for the Claim NFT. Then, for example, the letter "-" is located at the `1'th` position, the letter "3" is located at the `6'th` position and the letter "z" is located at the `39'th` position.   The `40'th` output is the change output and must be a p2pkh.


### Prefix Tree Extension

```
             /----C
            /
root: ---- o -----L(a)
            \ 
             \----L(b)
              \   
               \--L(c)
                \ ...
                 \
               change
```

The Claim NFT (represented by the leaf 'C') for the first extension represents an NFT for the entire BNS tree. This can be used by the issuer to signal anything they wish, and forms a convenient location to have the issuer communicate with any name holders.

To represent the name `ab`, the following extensions are needed to arrive at a Claim NFT for that name:

```
             /----C    /----C
            /         /
root: ---- o -----L(a)------L(a) /----C <------This Claim NFT represents "ab"
            \         \         /
             \----L(b) \----L(b)------L(a)
              \         \       \
               \--L(c)   \--L(c) \-----L(a)
                \ ...     \ ...   \ ...
                 \         \       \
               change    change   change
```

Notice in the above diagram that the third `C` represents the Claim NFT for the path `root - a - b` (The name "ab")

### Claim NFT Fee Burning

The Claim NFT is the 0'th output for each character extension transaction. The Claim NFT is designed so that a minimum number of
satoshis must be 'burned' on the initial spend as a donation to the miners. The purpose is to prevent attackers or squatters from 
buying up the namespace at little cost to them, and this imposes a non-trivial cost to them to claim names.

The only way to guarantee that the satoshis are given as a donation to the miner is to enforce that one of the outputs of the initial
spend must create a smart contract wherein the only way to spend that output it is to create a 0-valued OP_RETURN output and a secondary output as a 'broadcast reimbursement' for being a good blockchain citizen to recover some of the fee. 


Let us assume that C represents a name, and a user wants to claim it as theirs:

```
             /----C
            /
....  ---- o -----L(a)
            \ 
             \----L(b)
              \   
               \--L(c)
                \ ...
                 \
               change
```

The `claimHash` enforced that the output takes a special form that will subsequently require it's spend to produce a fee burning output.


```  
.... C --- Name Token (pkh set to the new owner)
      \
       \-- Fee Burner Token (10,000)
        \
         \
       change
```

In order for C to have been spent the first time, an additional output (1'st position) must be created called Fee Burner Token. The first spend of the Claim NFT will output the Name Token with the ownerPkh field set to the owner, but the Name Token no longer needs to burn a fee.

The Fee Burner token can only be spent exactly one way: to have exactly a single change output for 1,000 Satoshis, since the input satoshi value was 10,000 satoshis, then that means 9,000 satoshis are paid to the miners, with the 1,000 being given as a 'broadcast reimbursement' to whoever is so kind to send them to a miner to be processed.

## Name Token Operations

Features:

- Delegate management to another address
- Name ownership and updates are seperated (to not pollute history)

## Resolver Interface

```ts
address
```

Static property that returns current resolver address

```ts
name(name) => Name
```

Returns a Name Object that hardcodes the resolver
 
```
npm install
npm run build
npm run test
```

## Any questions or ideas?

@BasedOrg (Twitter)

