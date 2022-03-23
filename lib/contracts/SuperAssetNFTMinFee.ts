export function SuperAssetNFTMinFee(): any {
    return {
        "version": 8,
        "compilerVersion": "1.9.1+commit.aebe0f4",
        "contract": "SuperAssetNFTMinerFee",
        "md5": "8250e2faf011e9a548cd27155ce2b70c",
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
                        "name": "senderSig",
                        "type": "Sig"
                    },
                    {
                        "name": "unlockKey",
                        "type": "PubKey"
                    },
                    {
                        "name": "nameNFT",
                        "type": "bytes"
                    },
                    {
                        "name": "feeBurner",
                        "type": "bytes"
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
                    },
                    {
                        "name": "nameOutputHash160",
                        "type": "bytes"
                    },
                    {
                        "name": "feeOutputHash160",
                        "type": "bytes"
                    }
                ]
            }
        ],
        "stateProps": [],
        "buildType": "release",
        "file": "",
        "asm": "$assetid $pubKeyHash $nameOutputHash160 $feeOutputHash160 OP_6 OP_PICK OP_HASH160 OP_3 OP_PICK OP_EQUALVERIFY OP_7 OP_PICK OP_7 OP_PICK OP_CHECKSIGVERIFY OP_OVER OP_6 OP_PICK OP_RIPEMD160 OP_EQUALVERIFY OP_DUP OP_5 OP_PICK OP_RIPEMD160 OP_EQUALVERIFY OP_9 OP_PICK OP_4 OP_PICK OP_0 24 OP_NUM2BIN OP_EQUAL OP_IF OP_11 OP_PICK 68 OP_SPLIT OP_DROP 44 OP_SPLIT OP_NIP OP_ELSE OP_4 OP_PICK OP_ENDIF OP_CAT OP_9 OP_PICK OP_CAT OP_6 OP_PICK OP_CAT OP_5 OP_PICK OP_CAT OP_HASH256 OP_11 OP_PICK OP_12 OP_PICK OP_SIZE OP_NIP OP_8 OP_SUB OP_SPLIT OP_DROP OP_12 OP_PICK OP_SIZE OP_NIP 28 OP_SUB OP_SPLIT OP_NIP OP_EQUALVERIFY OP_10 OP_PICK OP_HASH256 OP_1 OP_SPLIT OP_SWAP OP_BIN2NUM OP_1ADD OP_SWAP OP_CAT 3044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817980220 OP_SWAP OP_CAT $Tx.checkPreimageOpt_.sigHashType OP_CAT 02b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0 OP_CHECKSIG OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP",
        "hex": "<assetid><pubKeyHash><nameOutputHash160><feeOutputHash160>5679a953798857795779ad785679a688765579a688597954790001248087635b7901687f7501447f77675479687e59797e56797e55797eaa5b795c79827758947f755c7982770128947f77885a79aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e<Tx.checkPreimageOpt_.sigHashType>7e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac7777777777777777777777",
        "sources": [],
        "sourceMap": []
    }
};