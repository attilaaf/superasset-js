
export interface Metadata {
    title: string;
}
export interface CollectionDraftParams {
    data: Metadata;
    issuerAddress: string;
    editions: Number;
    sats: Number
}

export class CollectionDraft {

    constructor(protected params: CollectionDraftParams) {
        this.init();
    }

    private init() {

    }

    public satoshisNeeded() {
        return 1000;
    }
}