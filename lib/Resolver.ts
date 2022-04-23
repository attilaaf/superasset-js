
import { bsv } from 'scryptlib';
import * as axios from 'axios';
import { API_PREFIX } from "./Constants";
import { ResolverInterface } from './interfaces/Resolver.interface';
import { ResolverConfigInterface } from './interfaces/ResolverConfig.interface';
import { NFTInterface } from './interfaces/NFT.interface';
import { NFT } from './NFT';
import { InvalidArgumentError } from './Errors';
import { intToLE } from './Helpers';
 
export class Resolver implements ResolverInterface {

    private resolverConfig: any = {
        testnet: false,
        debug: false,
        fetchTransactions: this.fetchTransactionsCallback
    }

    private constructor(resolverConfig?: ResolverConfigInterface) {
        if (resolverConfig) {
            this.resolverConfig = Object.assign({}, this.resolverConfig, resolverConfig);
        }
    }

    static create(resolverConfig?: ResolverConfigInterface): ResolverInterface {
        return new Resolver(resolverConfig);
    }

    public async getNFT(assetId: string): Promise<NFTInterface> {
        if (assetId.length < 72) {
            throw new InvalidArgumentError();
        }
        const txs = await this.resolverConfig.fetchTransactions(assetId, this.resolverConfig)
        console.log('Buffer.from(assetId.substring(64)', Buffer.from(assetId.substring(64)));
        const expectedOutputIndex = parseInt(Buffer.from(assetId.substring(64), 'hex').reverse().toString('hex'))
    
        console.log('expectedOutputIndex', expectedOutputIndex);
        return NFT.fromTransactions(txs.map((item) => item.rawtx), expectedOutputIndex, this.resolverConfig.testnet);
    }

    public async fetchTransactionsCallback(): Promise<Array<{rawtx: string}>[]>{
        
        return [];
    }

    public getResolverConfig(): ResolverConfigInterface {
        return this.resolverConfig;
    }

    static async fetchUtxos(address) {
        let {
            data: utxos
        } = await axios.default.get(`${API_PREFIX}/address/${address}/unspent`)

        return utxos.map((utxo) => ({
            txId: utxo.tx_hash,
            outputIndex: utxo.tx_pos,
            satoshis: utxo.value,
            script: bsv.Script.buildPublicKeyHashOut(address).toHex(),
        }))
    }

    static async fetchUtxoLargeThan(address, amount) {
        let {
            data: utxos
        } = await axios.default.get(`${API_PREFIX}/address/${address}/unspent`)

        utxos = utxos.filter((utxo) => { return utxo.value > amount }).map((utxo) => ({
            txId: utxo.tx_hash,
            outputIndex: utxo.tx_pos,
            satoshis: utxo.value,
            script: bsv.Script.buildPublicKeyHashOut(address).toHex(),
        }))
        return utxos[0];
    }

    static async sendTx(tx) {
        const hex = tx.toString();
        if (!tx.checkFeeRate(250)) {
            throw new Error(`checkFeeRate fail, transaction fee is too low`)
        }
        try {
            const { data } = await axios.default.post(`${API_PREFIX}/tx/raw`, {
                txhex: hex
            });
            return data;
        } catch (error: any) {
            if (error.response && error.response.data === '66: insufficient priority') {
                throw new Error(`Rejected by miner. Transaction with fee is too low. hex: ${hex}`)
            }
            if (error.response && /txn.mempool.conflict/.test(error.response.data)) {
                //throw new Error(`Mempool conflict. hex: ${hex}`)
                console.log('Mempol conflict detected, checking for tx...')
                if (await Resolver.isTxExist(tx.hash)) {
                    return tx.hash;
                }
            }
            if (error.response && /already/.test(error.response.data)) {
                if (await Resolver.isTxExist(tx.hash)) {
                    return tx.hash;
                }
            }
            if (error.response && /No.previous.output.information/.test(error.response.data)) {
                if (await Resolver.isTxExist(tx.hash)) {
                    return tx.hash;
                }
            }
            console.log('error', error);
            throw error
        }
    }

    static async getTx(txid: string) {
        try {
            const { data } = await axios.default.get(`${API_PREFIX}/tx/hash/${txid}`);
            return data;
        } catch (error: any) {
            if (error.response && /already/.test(error.response.data)) {
                throw new Error(error.response.data)
            }
            throw error
        }
    }

    static async isTxExist(txid: string) {
        try {
            await axios.default.get(`${API_PREFIX}/tx/hash/${txid}`);
            return true;
        } catch (error: any) {
            return false;
        }
    }
}
