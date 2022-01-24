export class BitcoinAddress { 
    constructor(private address: string){
    }
    toString(): string {
        return this.address;
    }
} 