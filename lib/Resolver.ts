import { Name } from "./Name";
import { NameInterface } from "./interfaces/Name.interface";
import { ResolverInterface } from "./interfaces/Resolver.interface";
import { ResolverConfigInterface } from "./interfaces/ResolverConfig.interface";
import { GetNameTransactionsError } from "./errors/GetNameTransactionsError";
import { GetNameTransactionsResult, GetNameTransactionsResultEnum } from "./interfaces/GetNameTransactionsResult.interface";
import { InvalidNameTransactionsError, MissingNextTransactionError, ParameterMissingError } from ".";
import { TreeProcessorInterface } from "./interfaces/TreeProcessor.interface";
import { TreeProcessor } from "./TreeProcessor";
import { RequiredTransactionPartialResult } from "./interfaces/RequiredTransactionPartialResult.interface";
import { BnsContractConfig } from "./interfaces/BnsContractConfig.interface";
import { bsv } from 'scryptlib';
import * as axios from 'axios';
import { bnsclaim } from "./bnsclaim_release_desc";
const { buildContractClass, toHex, signTx, Ripemd160, Sig, PubKey, bsv, Bool, Bytes, compile, num2bin, getPreimage } = require('scryptlib');

const sighashType2Hex = s => s.toString(16)
const API_PREFIX = process.env.NETWORK === 'mainnet' ? 'https://api.whatsonchain.com/v1/bsv/main' : 'https://api.whatsonchain.com/v1/bsv/test';
const BNS_ROOT = 'b72470fb23eb5f90dceda5a376869702af2e6605824f3cb2e0cf588f0c559514';
const BNS_API_URL = 'https://resolver.based.org/api/v1';
const Signature = bsv.crypto.Signature;
const sighashTypeBns = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;

export class Resolver implements ResolverInterface {
    private nameTransactions = {};
    private resolverConfig: any = {
        testnet: false,
        root: BNS_ROOT,
        url: BNS_API_URL,
        debug: false,
        bnsOutputRipemd160: 'b3b582b4ae134d329c99ef665b7e31b226892a17'
    }

    private constructor(resolverConfig?: ResolverConfigInterface) {
        if (resolverConfig) {
            this.resolverConfig = Object.assign({}, this.resolverConfig, resolverConfig);
        }
    }

    static create(resolverConfig?: ResolverConfigInterface): ResolverInterface {
        return new Resolver(resolverConfig);
    }

    public async getName(name: string): Promise<NameInterface> {
        if (!name || !name.length) {
            throw new ParameterMissingError();
        }
        const txFetch = await this.getNameTransactions(name);
        if (txFetch.result === GetNameTransactionsResultEnum.FETCH_ERROR) {
            throw new GetNameTransactionsError();
        }
        this.nameTransactions[name] = txFetch.rawtxs;
        const nameObject = new Name({
            testnet: this.resolverConfig.testnet,
        }, this.resolverConfig.bnsOutputRipemd160);
        await nameObject.init(this.nameTransactions[name], this.resolverConfig.root);

        // Ensure that the instantiated name at least partially includes what was requested by the resolver
        if (!name.includes(nameObject.getNameString())) {
            throw new InvalidNameTransactionsError();
        }
        // If it partially includes the transaction but it is not equal to the name...
        // It means there are transactions missing (ex: need to potentially be created for that next letter(s) missing)
        if (nameObject.getNameString() != name) {
            // Identify the point at which we need the next letter transaction
            const treeProcessor: TreeProcessorInterface = new TreeProcessor();
            const partialResult: RequiredTransactionPartialResult = await treeProcessor.getRequiredTransactionPartial(name, txFetch.rawtxs);
            // We have the point at which the next letter transaction is required
            throw new MissingNextTransactionError(partialResult);
        }
        return nameObject;
    }

    public getResolverConfig(): ResolverConfigInterface {
        return this.resolverConfig;
    }

    static buildNFTPublicKeyHashOut(asset, pkh) {
        const script = bsv.Script.fromASM(`${asset} ${pkh} OP_NIP OP_OVER OP_HASH160 OP_EQUALVERIFY OP_CHECKSIG`);
        return script;
    }

    static generateBnsRoot(issuerPkh: string, claimNftScriptHex: string, outputSize = '3f') {
        const bnsConstant = Buffer.from('bns1', 'utf8').toString('hex');
        const claimSatoshisInt = 300;
        const claimSatoshisWithFullOutput = num2bin(claimSatoshisInt, 8) + outputSize + claimNftScriptHex;
        const claimNftHash = bsv.crypto.Hash.ripemd160(Buffer.from(claimSatoshisWithFullOutput, 'hex')).toString('hex');
        let prevDupHash = '0000000000000000000000000000000000000000';
        let currentDimension = 20;
        const BNS = buildContractClass(bnsclaim());
        const tree = new BNS(
            new Bytes(bnsConstant),
            new Ripemd160(issuerPkh),
            new Ripemd160(claimNftHash),
            new Ripemd160(prevDupHash),
            currentDimension,
            new Bytes('ff')
        );
        const asmVars = {
            'Tx.checkPreimageOpt_.sigHashType':
                sighashType2Hex(sighashTypeBns)
        };
        tree.replaceAsmVars(asmVars);
        return tree.lockingScript;
    }

    private async getNameTransactions(name: string): Promise<GetNameTransactionsResult> {
        if (this.resolverConfig.processGetNameTransactions) {
            return this.resolverConfig.processGetNameTransactions(name, this.resolverConfig);
        }
        // Provide a default implementation
        return {
            result: GetNameTransactionsResultEnum.NOT_IMPLEMENTED,
            rawtxs: []
        }
    }

    static async deployRoot(privateKey, contract, satoshis) {
        const address = privateKey.toAddress()
        const tx = new bsv.Transaction()

        tx.from(await Resolver.fetchUtxos(address))
            .addOutput(new bsv.Transaction.Output({
                script: contract,
                satoshis
            }))
            .change(address)
            .sign(privateKey)

        await Resolver.sendTx(tx)
        return tx
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
        if (!tx.checkFeeRate(500)) {
            throw new Error(`checkFeeRate fail, transaction fee is too low`)
        }
        try {
            const {
                data: txid
            } = await axios.default.post(`${API_PREFIX}/tx/raw`, {
                txhex: hex
            });

            return txid
        } catch (error: any) {
            if (error.response && error.response.data === '66: insufficient priority') {
                throw new Error(`Rejected by miner. Transaction with fee is too low. hex: ${hex}`)
            }
            throw error
        }
    }

}
