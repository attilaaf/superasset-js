import { ParameterExpectedRootEmptyError } from ".";
import { BitcoinAddress } from "./BitcoinAddress";
import { ParameterListEmptyError } from "./errors/ParameterListEmptyError";
import { ParameterMissingError } from "./errors/ParameterMissingError";
import { NameInterface } from "./Name.interface";
import { OpResult } from "./OpResult.interface";
import { Record } from "./Record.interface.ts";
import * as bsv from 'bsv';
import { ParameterExpectedRootMismatchError } from "./errors/ParameterExpectedRootMismatchError";
import { NotInitError } from "./errors/NotInitError";

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
        console.log('rawtxs', rawtxs);
        const tx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const calculatedRoot = (await tx.hash()).toString('hex');
        console.log('calc', expectedRoot, calculatedRoot);
        if (expectedRoot !== calculatedRoot) {
            throw new ParameterExpectedRootMismatchError();
        }

        this.expectedRoot = calculatedRoot;
        for (const rawtx of rawtxs) {

        }
        this.initialized = true;
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
 