import { NFTCollection } from "./NFTCollection";
import { NFTCollectionDraft, NFTCollectionDraftParams } from "./NFTCollectionDraft";
import { UTXO } from "./UTXO.interface";

export class Factory {
    static createCollectionDraft(params: NFTCollectionDraftParams) {
        return new NFTCollectionDraft(params);
    }
    static async prepareCollection(collectionDraft: NFTCollection, utxo: UTXO, changeAddress: string): Promise<NFTCollection> {
        // Add funding input
        const utxo = await fetchUtxoLargeThan(privateKey.toAddress(), 300000);

        extendRootTx.addInput(createInputFromPrevTx(deployTx))
        .from(await fetchUtxos(privateKey.toAddress()))
        
        return new NFTCollection();
    }
}