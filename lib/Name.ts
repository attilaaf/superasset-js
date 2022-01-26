import { ParameterExpectedRootEmptyError } from ".";
import { BitcoinAddress } from "./BitcoinAddress";
import { ParameterListEmptyError } from "./errors/ParameterListEmptyError";
import { ParameterMissingError } from "./errors/ParameterMissingError";
import { NameInterface } from "./interfaces/Name.interface";
import { OpResult } from "./interfaces/OpResult.interface";
import { Record } from "./interfaces/Record.interface.ts";
import * as bsv from 'bsv';
import { ParameterExpectedRootMismatchError } from "./errors/ParameterExpectedRootMismatchError";
import { NotInitError } from "./errors/NotInitError";
import { RootOutputHashMismatchError } from "./errors/RootOutputHashMismatchError";
import { PrefixChainMismatchError } from "./errors/PrefixChainMismatchError";
import { PrefixParseResult } from "./interfaces/PrefixParseResult.interface";

const BNS_ROOT_OUTPUT_RIPEMD160 = 'b3b582b4ae134d329c99ef665b7e31b226892a17';

export class Name implements NameInterface { 
    private initialized = false;
    public rawtxs: string[] = [];
    public expectedRoot: string = '';

    constructor() {
    }
    async init(rawtxs?: string[], expectedRoot?: string) {
        this.rawtxs = rawtxs ? rawtxs : [];
        this.expectedRoot = expectedRoot ? expectedRoot : '';

        if (!rawtxs) {
            throw new ParameterMissingError();
        }
        if (rawtxs.length === 0) {
            throw new ParameterListEmptyError();
        }
        if (!expectedRoot) {
            throw new ParameterExpectedRootEmptyError();
        }
        const rootTx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const calculatedRoot = (await rootTx.hash()).toString('hex');
        if (expectedRoot !== calculatedRoot) {
            throw new ParameterExpectedRootMismatchError();
        }
        // Make sure the first output is a BNS output of a known hash type
        const outputHash = bsv.Hash.ripemd160(rootTx.txOuts[0].script.toBuffer()).toString('hex');
        if (BNS_ROOT_OUTPUT_RIPEMD160 !== outputHash) {
            throw new RootOutputHashMismatchError();
        }
        this.expectedRoot = calculatedRoot;
        const result: PrefixParseResult = await this.validatePrefixTree(rawtxs);
        await this.validateBuildRecords(rawtxs.slice(result.rawtxIndex));
        this.initialized = true;
    }

    private async validatePrefixTree(rawtxs: string[]): Promise<PrefixParseResult> {
        const rootTx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const calculatedRoot = (await rootTx.hash()).toString('hex');
        let prefix = '';
        let prefixMap = {};
        let potentialClaimMap = {};
        prefixMap[`${calculatedRoot + '00000000'}`] = rootTx;
        let nameAssetId = '';
        let nameString = '';
        let namePrefixTree: string[] = [];
        for (let i = 1; i < rawtxs.length; i++) {  
            const tx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[i], 'hex'));
            const txId = (await tx.hash()).toString('hex');
            const prevTxId = tx.txIns[0].txHashBuf.toString('hex');
            const txOutNum = tx.txIns[0].txOutNum;
            const buf = Buffer.allocUnsafe(4);
            buf.writeInt32LE(txOutNum);

            const txOutNumberString = buf.toString('hex');
            const prevOutpoint = prevTxId + txOutNumberString;

            console.log('txMap', prefixMap);
            console.log('txOutNumberString', txOutNumberString, prevOutpoint);
            // Enforce that each spend in the chain spends something from before
            if (!prefixMap[prevOutpoint]) {
                throw new PrefixChainMismatchError();
            }
            // Clear off the map to ensure a rawtx must spend something directly of it's parent
            prefixMap = {};
            for (let o = 1; o < 38; o++) {  
                const buf = Buffer.allocUnsafe(4);
                buf.writeInt32LE(o);
                const outNumString = buf.toString('hex');
                prefixMap[txId + outNumString] = tx.txOuts[o];
            }
        }
        // console.log('txMap', txMap);
        return {
            rawtxIndex: 0,
            nameString: ''
        }
    }

    private async validateBuildRecords(rawtxs: string[]): Promise<Record[]> {
        return [];
    }

    public getRoot(): string {
        this.ensureInit();
        return this.expectedRoot;
    }
    public getNameString(): string {
        this.ensureInit();
        return 'dd';
    }
    public async getOwner(): Promise<BitcoinAddress> {
        this.ensureInit();
        return new BitcoinAddress('11');
    }
    public async setOwner(address: BitcoinAddress): Promise<OpResult> {
        this.ensureInit();
        return {
            success: false
        }
    }
    public async getRecords(): Promise<Record[]> {
        this.ensureInit();
        return [
            {
                type: '',
                name: '',
                value: ''
            }
        ]
    }
    public async setRecord(type: string, name: string, value: string, ttl?: number): Promise<OpResult> {
        this.ensureInit();
        return {
            success: false
        }
    }
    public async deleteRecord(type: string, name: string): Promise<OpResult>{
        this.ensureInit();
        return {
            success: false
        }
    }
    public async getAddress(coinId: string): Promise<string> {
        this.ensureInit();
        return '';
    }
    public async setAddress(coinId: string, address: string): Promise<OpResult> {
        this.ensureInit();
        return {
            success: false
        }
    }
    private ensureInit() {
        if (!this.initialized) {
            throw new NotInitError();
        }
    }
}
 