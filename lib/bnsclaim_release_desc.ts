export function bnsclaim(): any {
    return {
        "version": 8,
        "compilerVersion": "1.8.4+commit.247b31f",
        "contract": "BNS",
        "md5": "8fc872457ec369f630b6f9e40ec7f534",
        "structs": [],
        "library": [
            {
                "name": "OpCode",
                "params": [],
                "properties": [],
                "genericTypes": []
            },
            {
                "name": "Utils",
                "params": [],
                "properties": [],
                "genericTypes": []
            },
            {
                "name": "SigHash",
                "params": [],
                "properties": [],
                "genericTypes": []
            },
            {
                "name": "Tx",
                "params": [],
                "properties": [],
                "genericTypes": []
            },
            {
                "name": "VarIntReader",
                "params": [
                    {
                        "name": "ctor.buf",
                        "type": "bytes"
                    }
                ],
                "properties": [
                    {
                        "name": "buf",
                        "type": "bytes"
                    },
                    {
                        "name": "pos",
                        "type": "int"
                    }
                ],
                "genericTypes": []
            },
            {
                "name": "HashedMap",
                "params": [
                    {
                        "name": "_data",
                        "type": "bytes"
                    }
                ],
                "properties": [
                    {
                        "name": "_data",
                        "type": "bytes"
                    }
                ],
                "genericTypes": [
                    "K",
                    "V"
                ]
            },
            {
                "name": "HashedSet",
                "params": [
                    {
                        "name": "_data",
                        "type": "bytes"
                    }
                ],
                "properties": [
                    {
                        "name": "_data",
                        "type": "bytes"
                    }
                ],
                "genericTypes": [
                    "E"
                ]
            },
            {
                "name": "VarIntWriter",
                "params": [],
                "properties": [],
                "genericTypes": []
            },
            {
                "name": "Constants",
                "params": [],
                "properties": [],
                "genericTypes": []
            }
        ],
        "alias": [
            {
                "name": "PubKeyHash",
                "type": "Ripemd160"
            }
        ],
        "abi": [
            {
                "type": "function",
                "name": "extend",
                "index": 0,
                "params": [
                    {
                        "name": "txPreimage",
                        "type": "SigHashPreimage"
                    },
                    {
                        "name": "dividedSatoshisBytesWithSize",
                        "type": "bytes"
                    },
                    {
                        "name": "claimNFT",
                        "type": "bytes"
                    },
                    {
                        "name": "changeAddress",
                        "type": "bytes"
                    },
                    {
                        "name": "changeSatoshis",
                        "type": "bytes"
                    },
                    {
                        "name": "isTransform",
                        "type": "bool"
                    },
                    {
                        "name": "issuerSig",
                        "type": "bytes"
                    },
                    {
                        "name": "issuerPubKey",
                        "type": "bytes"
                    }
                ]
            },
            {
                "type": "constructor",
                "params": [
                    {
                        "name": "bnsConstant",
                        "type": "bytes"
                    },
                    {
                        "name": "issuerPkh",
                        "type": "Ripemd160"
                    },
                    {
                        "name": "claimHash",
                        "type": "Ripemd160"
                    },
                    {
                        "name": "dupHash",
                        "type": "Ripemd160"
                    },
                    {
                        "name": "currentDimension",
                        "type": "int"
                    },
                    {
                        "name": "char",
                        "type": "bytes"
                    }
                ]
            }
        ],
        "stateProps": [],
        "buildType": "release",
        "file": "",
        "asm": "$bnsConstant $issuerPkh $claimHash $dupHash $currentDimension $char OP_8 OP_PICK OP_NOTIF OP_OVER 54 OP_LESSTHANOREQUAL OP_VERIFY OP_3DUP OP_DROP 14 OP_NUMEQUAL OP_IF OP_DUP OP_15 OP_PICK 68 OP_SPLIT OP_DROP 44 OP_SPLIT OP_NIP OP_CAT OP_NIP OP_ENDIF OP_13 OP_PICK OP_4 OP_CAT OP_7 OP_PICK OP_CAT 14 OP_CAT OP_6 OP_PICK OP_CAT 14 OP_CAT OP_5 OP_PICK OP_CAT 14 OP_CAT OP_OVER OP_16 OP_PICK b300 OP_SPLIT OP_DROP b200 OP_SPLIT OP_NIP OP_CAT OP_RIPEMD160 OP_CAT OP_1 OP_CAT OP_3 OP_PICK OP_1ADD OP_1 OP_NUM2BIN OP_CAT OP_1 OP_CAT OP_15 OP_PICK 6b 11 OP_PICK 6b OP_SPLIT OP_DROP 69 OP_SPLIT OP_NIP 00 OP_CAT OP_BIN2NUM OP_ADD OP_SPLIT OP_DROP b300 OP_SPLIT OP_NIP OP_6 OP_PICK OP_15 OP_PICK OP_RIPEMD160 OP_EQUALVERIFY OP_14 OP_PICK OP_2 OP_PICK OP_CAT 2d OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 5f OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 30 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 31 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 32 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 33 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 34 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 35 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 36 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 37 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 38 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 39 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 61 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 62 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 63 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 64 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 65 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 66 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 67 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 68 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 69 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6a OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6b OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6c OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6d OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6e OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 6f OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 70 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 71 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 72 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 73 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 74 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 75 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 76 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 77 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 78 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 79 OP_CAT OP_OVER OP_CAT OP_2 OP_PICK OP_CAT 7a OP_CAT OP_OVER OP_CAT OP_13 OP_PICK OP_CAT 1976a914 OP_CAT OP_14 OP_PICK OP_CAT 88ac OP_CAT OP_HASH256 11 OP_PICK 12 OP_PICK OP_SIZE OP_NIP OP_8 OP_SUB OP_SPLIT OP_DROP 12 OP_PICK OP_SIZE OP_NIP 28 OP_SUB OP_SPLIT OP_NIP OP_EQUALVERIFY OP_2DROP OP_DROP OP_ELSE OP_6 OP_PICK OP_HASH160 OP_5 OP_PICK OP_EQUALVERIFY OP_7 OP_PICK OP_7 OP_PICK OP_CHECKSIGVERIFY OP_ENDIF OP_13 OP_PICK OP_HASH256 OP_1 OP_SPLIT OP_SWAP OP_BIN2NUM OP_1ADD OP_SWAP OP_CAT 3044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817980220 OP_SWAP OP_CAT $Tx.checkPreimageOpt_.sigHashType OP_CAT 02b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0 OP_CHECKSIG OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP",
        "hex": "<bnsConstant><issuerPkh><claimHash><dupHash><currentDimension><char>587964780154a1696f7501149c63765f7901687f7501447f777e77685d79547e57797e01147e56797e01147e55797e01147e78607902b3007f7502b2007f777ea67e517e53798b51807e517e5f79016b011179016b7f7501697f7701007e81937f7502b3007f7756795f79a6885e7952797e012d7e787e52797e015f7e787e52797e01307e787e52797e01317e787e52797e01327e787e52797e01337e787e52797e01347e787e52797e01357e787e52797e01367e787e52797e01377e787e52797e01387e787e52797e01397e787e52797e01617e787e52797e01627e787e52797e01637e787e52797e01647e787e52797e01657e787e52797e01667e787e52797e01677e787e52797e01687e787e52797e01697e787e52797e016a7e787e52797e016b7e787e52797e016c7e787e52797e016d7e787e52797e016e7e787e52797e016f7e787e52797e01707e787e52797e01717e787e52797e01727e787e52797e01737e787e52797e01747e787e52797e01757e787e52797e01767e787e52797e01777e787e52797e01787e787e52797e01797e787e52797e017a7e787e5d797e041976a9147e5e797e0288ac7eaa011179011279827758947f7501127982770128947f77886d75675679a955798857795779ad685d79aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e<Tx.checkPreimageOpt_.sigHashType>7e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac7777777777777777777777777777",
        "sources": [],
        "sourceMap": []
    }
};