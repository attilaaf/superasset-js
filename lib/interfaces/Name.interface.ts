
import { BitcoinAddress } from "..";
import { NameInfo } from "./NameInfo.interface";
import { OpResult } from "./OpResult.interface";
import { Record } from "./Record.interface.ts";
import * as bsv from 'bsv';

export interface NameInterface {
    // The current owner of the name UTXO
    getOwner: () => BitcoinAddress | null;
    // Set the new owner of the name UTXO (transfer)
    setOwner: (address: BitcoinAddress, fundingKey: string | bsv.PrivateKey) => Promise<OpResult>;
    // Get all records
    getNameInfo: () => NameInfo | null;
    // Update records
    updateRecords: (records: Array<{ type: string, name: string, value: string, action?: 'set' | 'delete', ttl?: number }>) => Promise<OpResult>;
    // The root of this name tree
    getRoot: () => string;
    // If it is not claimed, then claim it for the private key
    claim: (
        key: string | bsv.PrivateKey,
        fundingKey: string | bsv.PrivateKey,
        opts: {
            maxClaimFee?: number,
            callback?: (prefixRawtxs: string[], rawtx: string, script: string, satoshis: number, inputIndex: number, sighashType: number) => any,
            isRemote?: boolean
        }
    ) => Promise<any>;
    // Whether there was a spend of the claim tx
    isClaimed: () => boolean;
    // The root of this name tree
    getNameString: () => string;
    // Helpers that use getRecords and setRecord underneath...
    // Get address for a specific coin if it is set (Uses getRecords underneath)
    getAddress: (coinSymbol: string) => Promise<string>;
    // Is Testnet
    isTestnet: () => boolean;
    // Get the original rawtxs
    getRawtxs: () => string[]
    // Get the claim tx
    getClaimTx: () => string
}
