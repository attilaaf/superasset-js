import { Collection } from "./Collection";
import { CollectionDraft, CollectionDraftParams } from "./CollectionDraft";

 
export class Factory {

    static createCollectionDraft(params: CollectionDraftParams) {
        return new CollectionDraft(params);
    }
    static async prepareCollection(collectionDraft: CollectionDraft, utxo: any) {
        return new Collection();
    }
    static async syncCollection(collectionDraft: CollectionDraft, utxo: any) {
        return new Collection();
    }
}