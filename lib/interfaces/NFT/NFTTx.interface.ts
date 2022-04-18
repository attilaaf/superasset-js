export interface NFTTxInterface {
    txId: string;
    outputIndex: number;
    assetId: string;
    satoshis: number;
    script: string;
    ownerAddress: string;
    outputs?: any[];
}
