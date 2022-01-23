export class SuperAsset {
    public assetId;
    public deployTxId;
    public deployOutputIndex;
    public deployMetadata;
    public deployHashOfOutput;
    public mintTxId;
    public mintOutputIndex;
    public mintMetadata;
    public mintHashOfOutput;
    public currentTxId;
    public currentOutputIndex;
    public currentMetadata;

    constructor() { 
    }

    static fromTransactions(txs: string[]): SuperAsset {
        return new SuperAsset();
    }

}