import { ParameterExpectedRootEmptyError } from ".";
import { BitcoinAddress } from "./BitcoinAddress";
import { ParameterListEmptyError } from "./errors/ParameterListEmptyError";
import { ParameterMissingError } from "./errors/ParameterMissingError";
import { NameInterface } from "./Name.interface";
import { OpResult } from "./OpResult.interface";
import { Record } from "./Record.interface.ts";
import { bsv } from 'bsv';
import { ParameterExpectedRootMismatchError } from "./errors/ParameterExpectedRootMismatchError";

export class Name implements NameInterface { 
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
        const tx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const calculatedRoot = (await tx.hash()).toString('hex');
        if (expectedRoot !== calculatedRoot) {
            throw new ParameterExpectedRootMismatchError();
        }
        for (const rawtx of rawtxs) {

        }
    }
    public async getOwner(): Promise<BitcoinAddress> {
        return new BitcoinAddress('11');
    }
    public async setOwner(address: BitcoinAddress): Promise<OpResult> {
        return {
            success: false
        }
    }
    public async getRecords(): Promise<Record[]> {
        return [
            {
                type: '',
                name: '',
                value: ''
            }
        ]
    }
    public async setRecord(type: string, name: string, value: string, ttl?: number): Promise<OpResult> {
        return {
            success: false
        }
    }
    public async deleteRecord(type: string, name: string): Promise<OpResult>{
        return {
            success: false
        }
    }
    public async getAddress(coinId: string): Promise<string> {
        return '';
    }
    public async setAddress(coinId: string, address: string): Promise<OpResult> {
        return {
            success: false
        }
    }
}
 