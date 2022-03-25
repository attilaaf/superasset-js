export function SuperAssetFeeBurner(): any {
    return {
        "version": 8,
        "compilerVersion": "1.9.1+commit.aebe0f4",
        "contract": "SuperAssetFeeBurner",
        "md5": "0b4173b927e95743b6634477c5a0d19b",
        "structs": [],
        "library": [],
        "alias": [
            {
                "name": "PubKeyHash",
                "type": "Ripemd160"
            }
        ],
        "abi": [
            {
                "type": "function",
                "name": "unlock",
                "index": 0,
                "params": [
                    {
                        "name": "txPreimage",
                        "type": "SigHashPreimage"
                    },
                    {
                        "name": "reimburseAddress",
                        "type": "bytes"
                    }
                ]
            },
            {
                "type": "constructor",
                "params": []
            }
        ],
        "stateProps": [],
        "buildType": "release",
        "file": "",
        "asm": "e803 OP_8 OP_NUM2BIN 1976a914 OP_CAT OP_OVER OP_CAT 88ac OP_CAT OP_HASH256 OP_2 OP_PICK OP_3 OP_PICK OP_SIZE OP_NIP OP_8 OP_SUB OP_SPLIT OP_DROP OP_3 OP_PICK OP_SIZE OP_NIP 28 OP_SUB OP_SPLIT OP_NIP OP_EQUALVERIFY OP_OVER OP_HASH256 OP_1 OP_SPLIT OP_SWAP OP_BIN2NUM OP_1ADD OP_SWAP OP_CAT 3044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817980220 OP_SWAP OP_CAT $Tx.checkPreimageOpt_.sigHashType OP_CAT 02b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0 OP_CHECKSIG OP_NIP OP_NIP",
        "hex": "02e8035880041976a9147e787e0288ac7eaa52795379827758947f75537982770128947f778878aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e<Tx.checkPreimageOpt_.sigHashType>7e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac7777",
        "sources": [],
        "sourceMap": []
    }
};