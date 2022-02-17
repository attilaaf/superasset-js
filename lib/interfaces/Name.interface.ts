
import { BitcoinAddress } from "..";
import { NameInfo } from "./NameInfo.interface";
import { OpResult } from "./OpResult.interface";
import { Record } from "./Record.interface.ts";

export interface NameInterface { 
    // The current owner of the name UTXO
    getOwner: () => BitcoinAddress | null;
    // Set the new owner of the name UTXO (transfer)
    setOwner: (address: BitcoinAddress) => Promise<OpResult>;
    // Enumerate all records
    getNameInfo: () => NameInfo | null;
    // Update a record
    setRecord: (type: string, name: string, value: string, ttl?: number) => Promise<OpResult>;
    // Delete a record
    deleteRecord: (type: string, name: string) => Promise<OpResult>;
    // The root of this name tree
    getRoot: () => string;
    // Whether there was a spend of the claim tx
    isClaimSpent: () => boolean;
    // The root of this name tree
    getNameString: () => string;
    // Helpers that use getRecords and setRecord underneath...
    // Get address for a specific coin if it is set (Uses getRecords underneath)
    getAddress: (coinId: string) => Promise<string>;
    // Set an address for a specific coin (uses setRecord underneath)
    setAddress: (coinId: string, address: string) => Promise<OpResult>;
    // Is Testnet
    isTestnet: () => boolean;
}
 