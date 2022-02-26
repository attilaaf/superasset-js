import * as bsv from 'bsv';
export class BitcoinAddress { 
    constructor(private address: bsv.Address){
    }
    toString(): string {
        return this.address.toString();
    }
    toP2PKH(): string {
        // Todo
        return this.address.toString();
    }
    toBuf(): Buffer {
        return this.address.toBuffer();
    }
} 