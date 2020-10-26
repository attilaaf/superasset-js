
import axios from 'axios';

import { StandardContracts } from './StandardContracts';
import * as Minercraft from 'minercraft';
const {
  bsv,
  buildContractClass,
  getPreimage,
  getPreimageOpt,
  toHex,
  num2bin,
  Bytes,
  signTx,
  PubKey,
  SigHashPreimage,
  Sig,
  Ripemd160,
  SigHash
} = require('scryptlib');

const defaultOptions: any = {
  mapi_base_url: 'https://public.txq-app.com',
  utxo_url: 'https://api.mattercloud.io/api/v3/main/address/ADDRESS_STR/utxo', // Use ADDRESS_STR as replacement
  feeb: 0.5,
  minfee: 1000,
  verbose: false,
}

export class AssetID {
  constructor(private assetId: string) {
  }

  toString(): string {
    return this.assetId;
  }

  toLE(): string {
    const txid = Buffer.from(this.assetId.substr(0, 64), 'hex').reverse().toString('hex');
    const reversed = Buffer.from(this.assetId.substr(64, 8), 'hex').reverse().toString('hex');
    console.log('toLE', this.assetId, txid, reversed);
    return txid + reversed;
  }
}

export interface AssetState {
  txid: string;
  index: string;
  txoutpoint: string;
  assetId: AssetID;
  assetStaticCode: string;
  assetLockingScript: string;
  assetOwnerPublicKey: string;
  assetSatoshis: number,
  assetPayload: string | null,
  meltedAssetId?: string,
  meltedAssetStaticCode?: string,
  meltedAssetOwnerPublicKey?: string,
  meltedAssetSatoshis?: number,
}

export class SA10 {
  options;
  constructor(providedOptions?: any) {
    this.options = Object.assign({}, defaultOptions, providedOptions);
  }

  setOptions(newOptions) {
    this.options = Object.assign({}, this.options, newOptions);
  }

  private getUtxoUrl(addresses: string): string {
    return this.options.utxo_url.replace('ADDRESS_STR', addresses);
  }

  private async createLockingTx(address: string, amountSatoshis: number, fee: number) {
    let {
      data: utxos
    } = await axios.get(this.getUtxoUrl(address))

    /**
    utxos = utxos.map((utxo) => ({
      txId: utxo.tx_hash,
      outputIndex: utxo.tx_pos,
      satoshis: utxo.value,
      script: bsv.Script.buildPublicKeyHashOut(address).toHex(),
    }))
    **/
    const tx = new bsv.Transaction().from(utxos)
    tx.addOutput(new bsv.Transaction.Output({
      script: new bsv.Script(),
      satoshis: amountSatoshis,
    }))

    tx.change(address).fee(fee || this.options.minfee)
    const hexCode = bsv.Script.fromASM(StandardContracts.getSuperAsset10().scryptDesc.asm);
    tx.outputs[0].setScript(hexCode);
    return tx;
  }

  public async deploy(initialOwnerPublicKey: string, satoshis: number, fundingPrivateKey: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const Token = buildContractClass(StandardContracts.getSuperAsset10().scryptDesc);
      const token = new Token();
      const fundingAddress = new bsv.PrivateKey(fundingPrivateKey).toAddress().toString();
      let fee = 0;
      // Simulate tx first
      {
        const lockingTx = await this.createLockingTx(fundingAddress, satoshis, 1000);
        const initialState =  `OP_RETURN 000000000000000000000000000000000000000000000000000000000000000000000000 ${initialOwnerPublicKey}`;
        const initialLockingScript = bsv.Script.fromASM(`${token.lockingScript.toASM()} ${initialState}`);
        lockingTx.outputs[0].setScript(initialLockingScript);
        lockingTx.sign(fundingPrivateKey);
        fee = Math.ceil((lockingTx.toString().length / 2) * this.options.feeb);
      }
      // Now actually create it.
      const lockingTx = await this.createLockingTx(fundingAddress, satoshis, fee);
      const initialState =  `OP_RETURN 000000000000000000000000000000000000000000000000000000000000000000000000 ${initialOwnerPublicKey}`;
      const initialLockingScript = bsv.Script.fromASM(`${token.lockingScript.toASM()} ${initialState}`);
      lockingTx.outputs[0].setScript(initialLockingScript);
      lockingTx.sign(fundingPrivateKey);
      if (this.options.verbose) {
        console.log('deploy::lockingTx', lockingTx);
      }
      // Publish initial deploy
      console.log('mapi api', this.options.mapi_base_url);
      const miner = new Minercraft({
        url: this.options.mapi_base_url,
        headers: { 'content-type': 'application/json'}
      });
      try {
        const response = await miner.tx.push(lockingTx.toString(), {});
        if (response && response.returnResult === 'success' && response.txid === lockingTx.hash) {
          return resolve({
            txid: lockingTx.hash,
            index: 0,
            assetId: new AssetID(`${lockingTx.hash}00000000`),
            assetStaticCode: StandardContracts.getSuperAsset10().scryptDesc.asm,
            assetLockingScript: initialLockingScript.toASM(),
            assetOwnerPublicKey: initialOwnerPublicKey,
            assetSatoshis: satoshis,
            assetPayload: null,
          });
        }
        reject(response);
      } catch (err) {
        reject(err);
      }
    })
  }

  public async fetchUtxoLargeThan(address: string, value: number) {
    let {
      data: utxos
    } = await axios.get(this.getUtxoUrl(address))

    /** utxos = utxos.map((utxo) => ({
      txId: utxo.tx_hash,
      outputIndex: utxo.tx_pos,
      satoshis: utxo.value,
      script: bsv.Script.buildPublicKeyHashOut(address).toHex(),
    }))**/

    for (const utxo of utxos) {
      if (utxo.satoshis > value) {
        return utxo;
      }
    }
    throw new Error('Insufficient funds for ' + address + ', largerThan: ' + value);
  }
  public unlockP2PKHInput(privateKey, tx, inputIndex, sigtype) {
    const sig = new bsv.Transaction.Signature({
      publicKey: privateKey.publicKey,
      prevTxId: tx.inputs[inputIndex].prevTxId,
      outputIndex: tx.inputs[inputIndex].outputIndex,
      inputIndex,
      signature: bsv.Transaction.Sighash.sign(tx, privateKey, sigtype,
        inputIndex,
        tx.inputs[inputIndex].output.script,
        tx.inputs[inputIndex].output.satoshisBN),
      sigtype,
    });

    tx.inputs[inputIndex].setScript(bsv.Script.buildPublicKeyHashIn(
      sig.publicKey,
      sig.signature.toDER(),
      sig.sigtype,
    ))
  }

  public async transfer(assetState: AssetState, currentOwnerPrivateKey, nextOwnerPublicKey, fundingPrivateKey, payloadUpdate?: string): Promise<any> {
    if (this.options.verbose) {
      //console.log('assetState', assetState);
      console.log('assetStateId', assetState.assetId.toString(), assetState.assetId.toLE());
      console.log('currentOwnerPrivateKey', currentOwnerPrivateKey);
      console.log('nextOwnerPublicKey', nextOwnerPublicKey);
      console.log('fundingPrivateKey', fundingPrivateKey);
      console.log('payloadUpdate', payloadUpdate);
    }

    return new Promise(async (resolve, reject) => {
      const HEX_REGEX = new RegExp('^[0-9a-fA-F]+$');
      if (payloadUpdate && payloadUpdate !== '' && (!HEX_REGEX.test(payloadUpdate) || (payloadUpdate.length % 2 !== 0))) {
        return reject(new Error('Invalid payload. Even length hex string required.'));
      }
      const Token = buildContractClass(StandardContracts.getSuperAsset10().scryptDesc);
      const token = new Token();
      const fundingPrivatePK = new bsv.PrivateKey(fundingPrivateKey);
      const fundingPublicKey = bsv.PublicKey.fromPrivateKey(fundingPrivatePK);
      const currentOwnerPK = new bsv.PrivateKey(currentOwnerPrivateKey);
      const payloadData = payloadUpdate && payloadUpdate !== '' ? payloadUpdate : null;
      // Note the usage of toLE(), this is because in bitcoin script the outpoint is in little endian and we save script size by doing it here in js land
      const newState = payloadData ? `${assetState.assetId.toLE()} ${nextOwnerPublicKey} ${payloadData}` : `${assetState.assetId.toLE()} ${nextOwnerPublicKey}`
      const newLockingScript = bsv.Script.fromASM(`${token.codePart.toASM()} ${newState}`)

      let estimatedFee = 0;
      {
        const tx = new bsv.Transaction()
        const utxo = await this.fetchUtxoLargeThan(fundingPrivatePK.toAddress(), 2000);
        if (this.options.verbose) {
          console.log('utxo', utxo);
        }
        token.setDataPart(newState);
        tx.addInput(new bsv.Transaction.Input({
          prevTxId: assetState.txid,
          outputIndex: assetState.index,
          script: ''
        }), bsv.Script.fromHex(assetState.assetLockingScript), assetState.assetSatoshis);
        // Add funding input
        tx.addInput(new bsv.Transaction.Input({
          prevTxId: utxo.txid,
          outputIndex: utxo.outputIndex,
          script: ''
        }), bsv.Script.fromHex(utxo.script), utxo.satoshis);
        const FEE = 10000; // Just a guess. It is used only for estimation
        const changeSatoshis = Math.floor(utxo.satoshis - FEE);
        tx.addOutput(new bsv.Transaction.Output({
          script: newLockingScript,
          satoshis: assetState.assetSatoshis
        }))
        const changeOutputScript = bsv.Script.buildPublicKeyHashOut(fundingPublicKey)
        tx.addOutput(new bsv.Transaction.Output({
          script: changeOutputScript,
          satoshis: changeSatoshis
        }))
        const Signature = bsv.crypto.Signature;
        const sighashType = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
        const preimage = getPreimage(tx, assetState.assetLockingScript, assetState.assetSatoshis, 0, sighashType)
        const sig = signTx(tx, currentOwnerPK, assetState.assetLockingScript, assetState.assetSatoshis, 0, sighashType)
        if (this.options.verbose) {
          console.log('---------------------------------------------------------------------------');
          console.log('preimage', preimage.toJSON(), preimage.toString(), 'signature', toHex(sig));
        }
        const pkh = bsv.crypto.Hash.sha256ripemd160(fundingPublicKey.toBuffer())
        const changeAddress = pkh.toString('hex'); // Needs to be unprefixed address
        const unlockingScript = token.transfer(
          new Sig(toHex(sig)),
          new PubKey(nextOwnerPublicKey),
          preimage,
          new Ripemd160(changeAddress),
          changeSatoshis,
          payloadData ? new Bytes(payloadData) : new Bytes('')
        ).toScript()

        tx.inputs[0].setScript(unlockingScript);
        this.unlockP2PKHInput(fundingPrivatePK, tx, 1, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID);
        estimatedFee = Math.ceil((tx.toString().length / 2) * this.options.feeb) + 1;
      }
      const tx = new bsv.Transaction()
      const utxo = await this.fetchUtxoLargeThan(fundingPrivatePK.toAddress(), 2000);
      if (this.options.verbose) {
        console.log('utxo', utxo);
      }
      token.setDataPart(newState);
      tx.addInput(new bsv.Transaction.Input({
        prevTxId: assetState.txid,
        outputIndex: assetState.index,
        script: ''
      }), bsv.Script.fromHex(assetState.assetLockingScript), assetState.assetSatoshis);
      // Add funding input
      tx.addInput(new bsv.Transaction.Input({
        prevTxId: utxo.txid,
        outputIndex: utxo.outputIndex,
        script: ''
      }), bsv.Script.fromHex(utxo.script), utxo.satoshis);
      const FEE = estimatedFee;
      const changeSatoshis = Math.floor(utxo.satoshis - FEE);
      tx.addOutput(new bsv.Transaction.Output({
        script: newLockingScript,
        satoshis: assetState.assetSatoshis
      }))
      const changeOutputScript = bsv.Script.buildPublicKeyHashOut(fundingPublicKey)
      tx.addOutput(new bsv.Transaction.Output({
        script: changeOutputScript,
        satoshis: changeSatoshis
      }))
      const Signature = bsv.crypto.Signature;
      const sighashType = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
      const preimage = getPreimage(tx, assetState.assetLockingScript, assetState.assetSatoshis, 0, sighashType)
      const sig = signTx(tx, currentOwnerPK, assetState.assetLockingScript, assetState.assetSatoshis, 0, sighashType)
      if (this.options.verbose) {
        console.log('---------------------------------------------------------------------------');
        console.log('preimage', preimage.toJSON(), preimage.toString(), 'signature', toHex(sig));
      }
      const pkh = bsv.crypto.Hash.sha256ripemd160(fundingPublicKey.toBuffer())
      const changeAddress = pkh.toString('hex'); // Needs to be unprefixed address
      const unlockingScript = token.transfer(
        new Sig(toHex(sig)),
        new PubKey(nextOwnerPublicKey),
        preimage,
        new Ripemd160(changeAddress),
        changeSatoshis,
        payloadData ? new Bytes(payloadData) : new Bytes('')
      ).toScript()

      tx.inputs[0].setScript(unlockingScript);
      this.unlockP2PKHInput(fundingPrivatePK, tx, 1, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID);


      // Publish initial deploy
      const miner = new Minercraft({
        url: this.options.mapi_base_url,
        headers: { 'content-type': 'application/json'}
      });
      if (this.options.verbose) {
        console.log('tx', tx.toString());
      }
      const response = await miner.tx.push(tx.toString(), {});
      if (response && response.returnResult === 'success' && response.txid === tx.hash) {
        return resolve({
          txid: tx.hash,
          index: 0, // Always to the 0th output
          txoutpoint: `${tx.hash}_o0`,
          assetId: assetState.assetId,
          assetStaticCode: StandardContracts.getSuperAsset10().scryptDesc.asm,
          assetLockingScript: newLockingScript.toASM(),
          assetOwnerPublicKey: nextOwnerPublicKey,
          assetSatoshis: assetState.assetSatoshis,
          assetPayload: payloadData,
        });
      }
      reject(response);
    });
  }
  public async melt(assetState: AssetState, currentOwnerPrivateKey, receiverPublicKey, fundingPrivateKey): Promise<any> {
    if (this.options.verbose) {
      //console.log('assetState', assetState);
      console.log('assetStateId', assetState.assetId.toString(), assetState.assetId.toLE());
      console.log('currentOwnerPrivateKey', currentOwnerPrivateKey);
      console.log('receiverPublicKey', receiverPublicKey);
      console.log('fundingPrivateKey', fundingPrivateKey);
    }

    return new Promise(async (resolve, reject) => {
      const Token = buildContractClass(StandardContracts.getSuperAsset10().scryptDesc);
      const token = new Token();
      const fundingPrivatePK = new bsv.PrivateKey(fundingPrivateKey);
      const fundingPublicKey = bsv.PublicKey.fromPrivateKey(fundingPrivatePK);
      const currentOwnerPK = new bsv.PrivateKey(currentOwnerPrivateKey);
      const receiverPublicKeyPK = new bsv.PublicKey(receiverPublicKey);
      // Note the usage of toLE(), this is because in bitcoin script the outpoint is in little endian and we save script size by doing it here in js land
      let estimatedFee = 0;
      {
        const tx = new bsv.Transaction()
        const utxo = await this.fetchUtxoLargeThan(fundingPrivatePK.toAddress(), 2000);
        if (this.options.verbose) {
          console.log('utxo', utxo);
        }
        tx.addInput(new bsv.Transaction.Input({
          prevTxId: assetState.txid,
          outputIndex: assetState.index,
          script: ''
        }), bsv.Script.fromHex(assetState.assetLockingScript), assetState.assetSatoshis);
        // Add funding input
        tx.addInput(new bsv.Transaction.Input({
          prevTxId: utxo.txid,
          outputIndex: utxo.outputIndex,
          script: ''
        }), bsv.Script.fromHex(utxo.script), utxo.satoshis);
        const FEE = 10000; // Just a guess. It is used only for estimation
        const changeSatoshis = Math.floor(utxo.satoshis - FEE);
        const receiverOutputScript = bsv.Script.buildPublicKeyHashOut(receiverPublicKeyPK)
        tx.addOutput(new bsv.Transaction.Output({
          script: receiverOutputScript,
          satoshis: assetState.assetSatoshis
        }))

        const changeOutputScript = bsv.Script.buildPublicKeyHashOut(fundingPublicKey)
        tx.addOutput(new bsv.Transaction.Output({
          script: changeOutputScript,
          satoshis: changeSatoshis
        }))
        const Signature = bsv.crypto.Signature;
        const sighashType = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
        const preimage = getPreimage(tx, assetState.assetLockingScript, assetState.assetSatoshis, 0, sighashType)
        const sig = signTx(tx, currentOwnerPK, assetState.assetLockingScript, assetState.assetSatoshis, 0, sighashType)
        if (this.options.verbose) {
          console.log('---------------------------------------------------------------------------');
          console.log('preimage', preimage.toJSON(), preimage.toString(), 'signature', toHex(sig));
        }
        const pkh = bsv.crypto.Hash.sha256ripemd160(fundingPublicKey.toBuffer())
        const changeAddress = pkh.toString('hex'); // Needs to be unprefixed address

        const recpkh = bsv.crypto.Hash.sha256ripemd160(receiverPublicKeyPK.toBuffer())
        const recAddress = recpkh.toString('hex'); // Needs to be unprefixed address

        const unlockingScript = token.melt(
          new Sig(toHex(sig)),
          new Ripemd160(recAddress),
          preimage,
          new Ripemd160(changeAddress),
          changeSatoshis
        ).toScript()

        tx.inputs[0].setScript(unlockingScript);
        this.unlockP2PKHInput(fundingPrivatePK, tx, 1, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID);
        estimatedFee = Math.ceil((tx.toString().length / 2) * this.options.feeb) + 1;
      }
      const tx = new bsv.Transaction()
      const utxo = await this.fetchUtxoLargeThan(fundingPrivatePK.toAddress(), 2000);
      if (this.options.verbose) {
        console.log('utxo', utxo);
      }
      tx.addInput(new bsv.Transaction.Input({
        prevTxId: assetState.txid,
        outputIndex: assetState.index,
        script: ''
      }), bsv.Script.fromHex(assetState.assetLockingScript), assetState.assetSatoshis);
      // Add funding input
      tx.addInput(new bsv.Transaction.Input({
        prevTxId: utxo.txid,
        outputIndex: utxo.outputIndex,
        script: ''
      }), bsv.Script.fromHex(utxo.script), utxo.satoshis);
      const FEE = estimatedFee;
      const changeSatoshis = Math.floor(utxo.satoshis - FEE);
      const receiverOutputScript = bsv.Script.buildPublicKeyHashOut(receiverPublicKeyPK)
      tx.addOutput(new bsv.Transaction.Output({
        script: receiverOutputScript,
        satoshis: assetState.assetSatoshis
      }))

      const changeOutputScript = bsv.Script.buildPublicKeyHashOut(fundingPublicKey)
      tx.addOutput(new bsv.Transaction.Output({
        script: changeOutputScript,
        satoshis: changeSatoshis
      }))
      const Signature = bsv.crypto.Signature;
      const sighashType = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;
      const preimage = getPreimage(tx, assetState.assetLockingScript, assetState.assetSatoshis, 0, sighashType)
      const sig = signTx(tx, currentOwnerPK, assetState.assetLockingScript, assetState.assetSatoshis, 0, sighashType)
      if (this.options.verbose) {
        console.log('---------------------------------------------------------------------------');
        console.log('preimage', preimage.toJSON(), preimage.toString(), 'signature', toHex(sig));
      }
      const pkh = bsv.crypto.Hash.sha256ripemd160(fundingPublicKey.toBuffer())
      const changeAddress = pkh.toString('hex'); // Needs to be unprefixed address

      const recpkh = bsv.crypto.Hash.sha256ripemd160(receiverPublicKeyPK.toBuffer())
      const recAddress = recpkh.toString('hex'); // Needs to be unprefixed address

      const unlockingScript = token.melt(
        new Sig(toHex(sig)),
        new Ripemd160(recAddress),
        preimage,
        new Ripemd160(changeAddress),
        changeSatoshis
      ).toScript()

      tx.inputs[0].setScript(unlockingScript);
      this.unlockP2PKHInput(fundingPrivatePK, tx, 1, Signature.SIGHASH_ALL | Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_FORKID);

      // Publish initial deploy
      const miner = new Minercraft({
        url: this.options.mapi_base_url,
        headers: { 'content-type': 'application/json'}
      });
      if (this.options.verbose) {
        console.log('tx', tx.toString());
      }
      const response = await miner.tx.push(tx.toString(), {});
      if (response && response.returnResult === 'success' && response.txid === tx.hash) {
        return resolve({
          txid: tx.hash,
          index: 0, // Always to the 0th output
          txoutpoint: `${tx.hash}_o0`,
          meltedAssetId: assetState.assetId,
          meltedAssetStaticCode: StandardContracts.getSuperAsset10().scryptDesc.asm,
          meltedAssetOwnerPublicKey: receiverPublicKey,
          meltedAssetSatoshis: assetState.assetSatoshis
        });
      }
      reject(response);
    });
  }
}

export class SuperAssetClient {
  options;
  constructor(providedOptions?: any) {
    this.options = Object.assign({}, defaultOptions, providedOptions);
  }

  setOptions(newOptions) {
    this.options = Object.assign({}, this.options, newOptions);
  }

  public getUtxoUrl(addresses: string): string {
    return this.options.utxo_url.replace('ADDRESS_STR', addresses);
  }

  public SA10(newOptions) {
    const mergedOptions = Object.assign({}, this.options, newOptions);
    return new SA10(mergedOptions);
  }

  instance(newOptions?: any): SuperAssetClient {
    const mergedOptions = Object.assign({}, defaultOptions, newOptions);
    return new SuperAssetClient(mergedOptions);
  }
}

export function instance(newOptions?: any): SuperAssetClient {
  const mergedOptions = Object.assign({}, defaultOptions, newOptions);
  return new SuperAssetClient(mergedOptions);
}

try {
  if (window) {
    window['superasset'] = {
      instance: instance
    };
  }
}
catch (ex) {
  // Window is not defined, must be running in windowless node env...
}

