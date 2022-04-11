import * as bsv2 from 'bsv2';

export class BitcoinAddress {
    constructor(private address: bsv2.Address) {
    }

    static fromString(address: string, isTestnet = false): BitcoinAddress {
        if (isTestnet) {
            return new BitcoinAddress(bsv2.Address.Testnet.fromString(address));
        } else {
            return new BitcoinAddress(bsv2.Address.fromString(address));
        }
    }

    toString(): string {
        return this.address.toString();
    }

    toP2NFTPKH(asset: string) {
        const addressHash160 = this.address.toHex().substring(2);
        return `${asset} ${addressHash160} OP_NIP OP_OVER OP_HASH160 OP_EQUALVERIFY OP_CHECKSIG`;
    }

    toP2PKH(): string {
        const addressHash160 = this.address.toHex().substring(2);
        return `OP_DUP OP_HASH160 ${addressHash160} OP_EQUALVERIFY OP_CHECKSIG`;
    }

    toHash160Bytes(): string {
        return this.address.toHex().substring(2);
    }

    toBuf(): Buffer {
        return this.address.toBuffer();
    }
} 