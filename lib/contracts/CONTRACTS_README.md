# Contracts Information

This folder contains the standard contracts for SuperAsset.

Use the project at to edit and compile your updated contract: https://github.com/scrypt-sv/boilerplate/blob/master/contracts/util.scrypt

Once the contract is compiled, then copy the scrypt description file into superasset/lib/StandardContracts.ts
```javascript
/**
 * This is an implementation and sample usage of SuperAsset (SA10).
 *
 * Learn more:
 *  - SuperAsset white paper: https://bitcoinfiles.org/t/d6c18189966ea060452bcf59157235f2e15df3abf7383d9d450acff69cf29181
 *  - Github: https://github.com/SuperAsset/superasset-js
 *
 * Example transactions:
 *  - Deploy: https://whatsonchain.com/tx/afd702c8ccd5b3193f7be0afaace551430593b2e1af7264908e003f63bd5883f
 *  - Transfer (mint with JSON paylod update): https://whatsonchain.com/tx/9a731acb3ef5af7ec97a14725f481aa9cac69beba7567c596e155cd1993f2905
 *  - Transfer (Update with hex payload): https://whatsonchain.com/tx/b402d74aced39ef78489977b6dff0baadb0756f3f7a09de30af3fc9b7ff579a7
 *  - Transfer (Update with empty payload): https://whatsonchain.com/tx/e2253ec3f66f23b21726eae65f93d1a002e12413dceb7809ee7423a4794bc328
 *  - Melt: https://whatsonchain.com/tx/24e81130d115a67975c4558c3a617e0fdcb1def9126f8748b7c1072b0430e9b0
 */
```