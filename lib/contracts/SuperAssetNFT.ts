export function SuperAssetNFT(): any {
    return {
        "version": 8,
        "compilerVersion": "1.9.1+commit.aebe0f4",
        "contract": "SuperAssetNFT",
        "md5": "b73b71b75acdd9c55011821837edf575",
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
                        "name": "outputSatsWithSize",
                        "type": "bytes"
                    },
                    {
                        "name": "receiveAddressWithSize",
                        "type": "bytes"
                    },
                    {
                        "name": "isTransform",
                        "type": "bool"
                    },
                    {
                        "name": "senderSig",
                        "type": "Sig"
                    },
                    {
                        "name": "unlockKey",
                        "type": "PubKey"
                    }
                ]
            },
            {
                "type": "constructor",
                "params": [
                    {
                        "name": "assetid",
                        "type": "bytes"
                    },
                    {
                        "name": "pubKeyHash",
                        "type": "Ripemd160"
                    }
                ]
            }
        ],
        "stateProps": [],
        "buildType": "release",
        "file": "",
        "asm": "$assetid $pubKeyHash OP_2 OP_PICK OP_HASH160 OP_OVER OP_EQUALVERIFY OP_2OVER OP_CHECKSIGVERIFY OP_4 OP_PICK OP_NOTIF OP_6 OP_PICK OP_2 OP_PICK OP_0 24 OP_NUM2BIN OP_EQUAL OP_IF OP_8 OP_PICK 68 OP_SPLIT OP_DROP 44 OP_SPLIT OP_NIP OP_ELSE OP_2 OP_PICK OP_ENDIF OP_CAT OP_6 OP_PICK OP_CAT OP_8 OP_PICK 69 OP_10 OP_PICK 69 OP_SPLIT OP_DROP 68 OP_SPLIT OP_NIP 00 OP_CAT OP_BIN2NUM OP_ADD OP_SPLIT OP_DROP a300 OP_SPLIT OP_NIP OP_CAT OP_HASH256 OP_8 OP_PICK OP_9 OP_PICK OP_SIZE OP_NIP OP_8 OP_SUB OP_SPLIT OP_DROP OP_9 OP_PICK OP_SIZE OP_NIP 28 OP_SUB OP_SPLIT OP_NIP OP_EQUALVERIFY OP_ENDIF OP_7 OP_PICK OP_HASH256 OP_1 OP_SPLIT OP_SWAP OP_BIN2NUM OP_1ADD OP_SWAP OP_CAT 3044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817980220 OP_SWAP OP_CAT $Tx.checkPreimageOpt_.sigHashType OP_CAT 02b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0 OP_CHECKSIG OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP",
        "hex": "<assetid><pubKeyHash>5279a9788870ad54796456795279000124808763587901687f7501447f77675279687e56797e587901695a7901697f7501687f7701007e81937f7502a3007f777eaa58795979827758947f75597982770128947f7788685779aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e<Tx.checkPreimageOpt_.sigHashType>7e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac7777777777777777",
        "sources": [],
        "sourceMap": []
    }
};