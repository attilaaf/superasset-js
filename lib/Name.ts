import { NFTChainError, ParameterExpectedRootEmptyError, ParameterListInsufficientSpendError } from ".";
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
import { prevOutpointFromTxIn } from "./Helpers";
import { NameInfo } from "./interfaces/NameInfo.interface";

export class Name implements NameInterface { 
    private initialized = false;
    private nameString = '';
    private nameInfo: NameInfo | null = null;
    public isClaimed = false;
    public ownerAddress: BitcoinAddress | null = null;
    public rawtxs: string[] = [];
    public expectedRoot: string = '';

    constructor(private opts?: { testnet: boolean }, private bnsOutputRipemd160?: string) {
        this.bnsOutputRipemd160 = this.bnsOutputRipemd160 ? this.bnsOutputRipemd160 : 'b3b582b4ae134d329c99ef665b7e31b226892a17';
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
        if (this.bnsOutputRipemd160 !== outputHash) {
            throw new RootOutputHashMismatchError();
        }
        this.expectedRoot = calculatedRoot;
        const result: PrefixParseResult = await this.validatePrefixTree(rawtxs);
        await this.validateBuildRecords(rawtxs.slice(result.rawtxIndexForClaim));
        this.nameString = result.nameString;
        this.initialized = true;
    }

    private async validatePrefixTree(rawtxs: string[]): Promise<PrefixParseResult> {
        const rootTx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const calculatedRoot = (await rootTx.hash()).toString('hex');
        let prefixMap = {};
        prefixMap[`${calculatedRoot + '00000000'}`] = rootTx;
        let nameAssetId = '';
        let nameString = '';
        let prevPotentialClaimNft = '';
        let prevTx = rootTx;
        for (let i = 1; i < rawtxs.length; i++) {  
            const tx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[i], 'hex'));
            const txId = (await tx.hash()).toString('hex');
            const { prevOutpoint, outputIndex, prevTxId } = prevOutpointFromTxIn(tx.txIns[0]);
            // Enforce that each spend in the chain spends something from before
            if (!prefixMap[prevOutpoint]) {
                // Perhaps this is the claimNFT being spent?
                if (prevPotentialClaimNft === prevOutpoint) {
                    // Found a spend of a claim, return the position of the previous index then
                    // Return because we have successfully resolved the prefix tree to the location of the claim NFT that was spent.
                    return {
                        rawtxIndexForClaim: i - 1,
                        nameString,
                        isClaimed: true,
                    }
                } else {
                    throw new PrefixChainMismatchError();
                }
            } else {
                // Do not concat the root node, skip it
                if (i > 1) {
                    const prevTxOut = prevTx.txOuts[outputIndex];
                    const letter = prevTxOut.script.chunks[5].buf.toString('ascii');
                    nameString += letter; // Add the current letter that was spent
                }
            }
            // Clear off the map to ensure a rawtx must spend something directly of it's parent
            prefixMap = {};
            prevPotentialClaimNft = txId + '00000000'; // Potential NFT is always at position 1
            for (let o = 1; o < 38; o++) {  
                const buf = Buffer.allocUnsafe(4);
                buf.writeInt32LE(o);
                const outNumString = buf.toString('hex');
                prefixMap[txId + outNumString] = tx.txOuts[o];
            }
            prevTx = tx;
        }
        if (nameString === '') {
            throw new ParameterListInsufficientSpendError();
        }
        return {
            rawtxIndexForClaim: rawtxs.length - 1,
            nameString,
            isClaimed: false,
        }
    }

    private async validateBuildRecords(rawtxs: string[]) {
        const mintTx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const assetTxId = (await mintTx.hash()).toString('hex')
        const assetId = assetTxId + '00000000';
        let prefixMap = {};
        prefixMap[`${assetId}`] = mintTx;
        let prevTx = mintTx;
        let address;
        if (this.opts?.testnet) {
            address = new bsv.Address.Testnet();
            address.versionByteNum = bsv.Constants.Testnet.Address.pubKeyHash;
        } else {
            address = new bsv.Address();
        }
        this.ownerAddress = new BitcoinAddress(address.fromPubKeyHashBuf(prevTx.txOuts[0].script.chunks[1].buf));
        for (let i = 1; i < rawtxs.length; i++) {  
            const tx = bsv.Tx.fromBuffer(Buffer.from(rawtxs[i], 'hex'));
            const txId = (await tx.hash()).toString('hex');
            const { prevOutpoint, outputIndex, prevTxId } = prevOutpointFromTxIn(tx.txIns[0]);
            // Enforce that each spend in the chain spends something from before
            if (!prefixMap[prevOutpoint]) {
                throw new NFTChainError();
            }
            // Look for records for building the zone records

            // Clear off the map to ensure a rawtx must spend directly of it's parent NFT output
            prefixMap = {};
            prefixMap[txId + '00000000'] = true;
            prevTx = tx;
            this.isClaimed = true; // There was at least one spend therefore it is claimed
            this.ownerAddress = new BitcoinAddress(address.fromPubKeyHashBuf(prevTx.txOuts[0].script.chunks[1].buf));
        }
    }

    public isClaimSpent(): boolean {
        this.ensureInit();
        return this.isClaimed;
    }

    public getRoot(): string {
        this.ensureInit();
        return this.expectedRoot;
    }

    public getNameString(): string {
        this.ensureInit();
        return this.nameString;
    }

    public getOwner(): BitcoinAddress | null {
        this.ensureInit();
        return this.ownerAddress;
    }

    public async setOwner(address: BitcoinAddress): Promise<OpResult> {
        this.ensureInit();
        return {
            success: false
        }
    }

    public getNameInfo(): NameInfo | null {
        this.ensureInit();
        return this.nameInfo;
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

    public isTestnet(): boolean {
        return this.opts ? this.opts.testnet : false;
    }
}
 