import { NFTChainError, ParameterExpectedRootEmptyError } from ".";
import { BitcoinAddress } from "./BitcoinAddress";
import { ParameterListEmptyError } from "./errors/ParameterListEmptyError";
import { ParameterMissingError } from "./errors/ParameterMissingError";
import { NameInterface } from "./interfaces/Name.interface";
import { OpResult } from "./interfaces/OpResult.interface";
import * as bsv2 from 'bsv2';
import * as bsv from 'bsv';
import { ParameterExpectedRootMismatchError } from "./errors/ParameterExpectedRootMismatchError";
import { NotInitError } from "./errors/NotInitError";
import { RootOutputHashMismatchError } from "./errors/RootOutputHashMismatchError";
import { PrefixParseResult } from "./interfaces/PrefixParseResult.interface";
import { prevOutpointFromTxIn } from "./Helpers";
import { NameInfo } from "./interfaces/NameInfo.interface";
import { TreeProcessorInterface } from "./interfaces/TreeProcessor.interface";
import { TreeProcessor } from "./TreeProcessor";
import { Resolver } from "./Resolver";
 

export class Name implements NameInterface { 
    private initialized = false;                // Whether it is initialized
    private nameString = '';                    // Name string this name object represents
    private nameInfo: NameInfo | null = null;   // Name record information 
    private nftPtr: string | null = null;       // The NFT pointer
    private claimTx: string | null = null;      // Claim tx for the name token
    public isClaimNFTSpent = false;
    public ownerAddress: BitcoinAddress | null = null;
    public rawtxs: string[] = [];
    public expectedRoot: string = '';

    constructor(private opts?: { testnet: boolean }, private bnsOutputRipemd160?: string) {
        this.bnsOutputRipemd160 = this.bnsOutputRipemd160 ? this.bnsOutputRipemd160 : 'b3b582b4ae134d329c99ef665b7e31b226892a17';
    }

    async init(rawtxs: string[], expectedRoot?: string) {
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

        const rootTx = bsv2.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const calculatedRoot = (await rootTx.hash()).reverse().toString('hex');
        if (expectedRoot !== calculatedRoot) {
            throw new ParameterExpectedRootMismatchError();
        }
        // Make sure the first output is a BNS output of a known hash type
        const outputHash = bsv2.Hash.ripemd160(rootTx.txOuts[0].script.toBuffer()).toString('hex');
        if (this.bnsOutputRipemd160 !== outputHash) {
            throw new RootOutputHashMismatchError();
        }
        this.expectedRoot = calculatedRoot;
        const treeProcessor: TreeProcessorInterface = new TreeProcessor();
        const result: PrefixParseResult = await treeProcessor.validatePrefixTree(rawtxs);
        await this.validateBuildRecords(rawtxs.slice(result.rawtxIndexForClaim));
        this.nameString = result.nameString;
        this.initialized = true;
    }

    private async validateBuildRecords(rawtxs: string[]) {
        const mintTx = bsv2.Tx.fromBuffer(Buffer.from(rawtxs[0], 'hex'));
        const assetTxId = (await mintTx.hash()).toString('hex')
        const assetId = assetTxId + '00000000';
        let prefixMap = {};
        prefixMap[`${assetId}`] = mintTx;
        this.claimTx = mintTx;
        let prevTx = mintTx;
        let address;
        if (this.opts?.testnet) {
            address = new bsv2.Address.Testnet();
            address.versionByteNum = bsv2.Constants.Testnet.Address.pubKeyHash;
        } else {
            address = new bsv2.Address();
        }
        this.ownerAddress = new BitcoinAddress(address.fromPubKeyHashBuf(prevTx.txOuts[0].script.chunks[1].buf));
        for (let i = 1; i < rawtxs.length; i++) {  
            const tx = bsv2.Tx.fromBuffer(Buffer.from(rawtxs[i], 'hex'));
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
            this.isClaimNFTSpent = true; // There was at least one spend therefore it is claimed
            this.ownerAddress = new BitcoinAddress(address.fromPubKeyHashBuf(prevTx.txOuts[0].script.chunks[1].buf));
        }
    }

    private callbackSignClaimInput(tx: bsv.Transaction, inputIndex: number): boolean {
        
        return true;
    }

    public async claim(key: string, callback = this.callbackSignClaimInput): Promise<boolean> {
        this.ensureInit();
        if (this.isClaimed()) {
            throw new Error('Name already claimed')
        }
        const privateKey = new bsv.PrivateKey.fromWIF(key);
        // Get a UTXO to create the claim TX, require at least 10,000 satoshis.
        const bitcoinAddress = new BitcoinAddress(privateKey.toAddress());
        const utxos = await Resolver.fetchUtxos(bitcoinAddress.toString());
        
        // Construct the claim transaction which includes the name token and a fee burner token


        // Broadcast a spend of the fee burner token, paying back the reimbursement to the address

        return true;
    }

    public isClaimed(): boolean {
        this.ensureInit();
        return this.isClaimNFTSpent;
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

    public async updateRecords(records: Array<{type: string, name: string, value: string, ttl?: number}>): Promise<OpResult> {
        this.ensureInit();
        return {
            success: false
        }
    }
 
    public async getAddress(coinSymbol: string): Promise<string> {
        this.ensureInit();
        return '';
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
 