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
## Build and Test

```
npm install
npm run build
npm run test
```

-----------

## Any questions or ideas?

@attila2022 (Twitter)

