
import { BitcoinAddress } from "..";
import { NameInfo } from "./NameInfo.interface";
import { OpResult } from "./OpResult.interface";
import { Record } from "./Record.interface.ts";

export interface NameInterface { 
    // The current owner of the name UTXO
    getOwner: () => BitcoinAddress | null;
    // Set the new owner of the name UTXO (transfer)
    setOwner: (address: BitcoinAddress) => Promise<OpResult>;
    // Get all records
    getNameInfo: () => NameInfo | null;
    // Update records
    updateRecords: (records: Array<{ type: string, name: string, value: string, op?: number, ttl?: number}>) => Promise<OpResult>;
    // The root of this name tree
    getRoot: () => string;
    // Whether there was a spend of the claim tx
    isClaimSpent: () => boolean;
    // The root of this name tree
    getNameString: () => string;
    // Helpers that use getRecords and setRecord underneath...
    // Get address for a specific coin if it is set (Uses getRecords underneath)
    getAddress: (coinSymbol: string) => Promise<string>;
    // Is Testnet
    isTestnet: () => boolean;
}
 