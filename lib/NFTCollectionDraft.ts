
import { buildContractClass, toHex, signTx, Ripemd160, Sig, PubKey, bsv, Bool, Bytes, compile, num2bin, getPreimage } from 'scryptlib';
import { sighashType2Hex } from './Helpers';
import { Contracts } from './Contracts';

const Signature = bsv.crypto.Signature;
const sighashType = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_SINGLE | Signature.SIGHASH_FORKID;

export interface Metadata {
    title: string;
}
export interface NFTCollectionDraftParams {
    data: Metadata;
    issuerAddress: string;
    editions: number;
    sats: number;
    feeRate?: number;
}

export class NFTCollectionDraft {
    private tx: any;
    private baseSatsNeeded: number = 0;
    constructor(protected params: NFTCollectionDraftParams) {
        this.init();
    }

    private init() {
        const SuperAssetNFT = buildContractClass(Contracts.getSuperAssetNFT()); 
        const nft = new SuperAssetNFT(new Bytes('000000000000000000000000000000000000000000000000000000000000000000000000'), new Ripemd160(toHex(this.params.issuerAddress)));
        const asmVars = {
          'Tx.checkPreimageOpt_.sigHashType': 
          sighashType2Hex(sighashType)
        };  
        nft.replaceAsmVars(asmVars);
        this.tx = new bsv.Transaction();
        for (let i = 0; i < this.params.editions; i++) {
            this.tx.addOutput(new bsv.Transaction.Output({
                script: nft.lockingScript,
                satoshis: this.params.sats,
            }))
        }
        this.baseSatsNeeded = this.params.sats * this.params.editions;
    }

    public satoshisNeeded(): number {
        const effectiveFeeRate = (this.params.feeRate ? this.params.feeRate : 0.5);
        const txSize = this.tx.toString().length / 2;
        const txBufferExtraInputAndOutputSize = 150; // Add an additional 150 bytes worth of buffer for when input and output gets attached
        const txSizeSatsNeeded = Math.ceil((txSize + txBufferExtraInputAndOutputSize) * effectiveFeeRate);
        return txSizeSatsNeeded + this.baseSatsNeeded;
    }

    public getTx() {
        return this.tx;
    }
}