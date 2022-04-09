export function SuperAssetFeeBurner(): any {
    return {
        "version": 8,
        "compilerVersion": "1.10.0+commit.c2b835a",
        "contract": "SuperAssetFeeBurner",
        "md5": "0015c0c25d27cb34794a8f63eb3d4075",
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
                "params": [
                    {
                        "name": "refundAmount",
                        "type": "int"
                    }
                ]
            }
        ],
        "stateProps": [],
        "buildType": "release",
        "file": "",
        "asm": "$refundAmount OP_DUP OP_8 OP_NUM2BIN 1976a914 OP_CAT OP_2 OP_PICK OP_CAT 88ac OP_CAT OP_HASH256 OP_3 OP_PICK OP_4 OP_PICK OP_SIZE OP_NIP OP_8 OP_SUB OP_SPLIT OP_DROP OP_4 OP_PICK OP_SIZE OP_NIP 28 OP_SUB OP_SPLIT OP_NIP OP_EQUALVERIFY OP_2 OP_PICK OP_HASH256 OP_1 OP_SPLIT OP_SWAP OP_BIN2NUM OP_1ADD OP_SWAP OP_CAT 3044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817980220 OP_SWAP OP_CAT $Tx.checkPreimageOpt_.sigHashType OP_CAT 02b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0 OP_CHECKSIG OP_NIP OP_NIP OP_NIP",
        "hex": "<refundAmount>765880041976a9147e52797e0288ac7eaa53795479827758947f75547982770128947f77885279aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e<Tx.checkPreimageOpt_.sigHashType>7e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac777777",
        "sources": [],
        "sourceMap": []
    }
};