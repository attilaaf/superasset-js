export function SuperAssetNFTMinFee(): any {
    return {
        "version": 8,
        "compilerVersion": "1.10.0+commit.c2b835a",
        "contract": "SuperAssetNFTMinFee",
        "md5": "6e6d4254919c8a49f5276b72653cc454",
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
                    },
                    {
                        "name": "changeOutput",
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
        "buildType": "debug",
        "file": "file:///Users/morgoth/git/based-js/lib/contracts/SuperAssetNFTMinFee.scrypt",
        "asm": "$assetid $pubKeyHash $nameOutputHash160 $feeOutputHash160 OP_7 OP_PICK OP_HASH160 OP_3 OP_PICK OP_EQUAL OP_VERIFY OP_8 OP_PICK OP_8 OP_PICK OP_CHECKSIG OP_VERIFY OP_1 OP_PICK OP_7 OP_PICK OP_RIPEMD160 OP_EQUAL OP_VERIFY OP_0 OP_PICK OP_6 OP_PICK OP_RIPEMD160 OP_EQUAL OP_VERIFY OP_10 OP_PICK OP_4 OP_PICK OP_0 24 OP_NUM2BIN OP_EQUAL OP_IF OP_12 OP_PICK 68 OP_SPLIT OP_DROP 44 OP_SPLIT OP_NIP OP_ELSE OP_4 OP_PICK OP_ENDIF OP_CAT OP_10 OP_PICK OP_CAT OP_7 OP_PICK OP_CAT OP_6 OP_PICK OP_CAT OP_5 OP_PICK OP_CAT OP_HASH256 OP_12 OP_PICK OP_13 OP_PICK OP_SIZE OP_NIP OP_8 OP_SUB OP_SPLIT OP_DROP OP_13 OP_PICK OP_SIZE OP_NIP 28 OP_SUB OP_SPLIT OP_NIP OP_EQUAL OP_VERIFY OP_11 OP_PICK OP_NOP OP_HASH256 OP_1 OP_SPLIT OP_SWAP OP_BIN2NUM OP_1ADD OP_SWAP OP_CAT 3044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817980220 OP_SWAP OP_CAT $Tx.checkPreimageOpt_.sigHashType OP_CAT 02b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0 OP_CHECKSIG OP_NOP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP OP_NIP",
        "hex": "<assetid><pubKeyHash><nameOutputHash160><feeOutputHash160>5779a95379876958795879ac6951795779a6876900795679a687695a7954790001248087635c7901687f7501447f77675479687e5a797e57797e56797e55797eaa5c795d79827758947f755d7982770128947f7787695b7961aa517f7c818b7c7e263044022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179802207c7e<Tx.checkPreimageOpt_.sigHashType>7e2102b405d7f0322a89d0f9f3a98e6f938fdc1c969a8d1382a2bf66a71ae74a1e83b0ac61777777777777777777777777",
        "sources": [
            "/Users/morgoth/git/based-js/lib/contracts/SuperAssetNFTMinFee.scrypt",
            "std"
        ],
        "sourceMap": [
            "0:63:5:63:18",
            "0:64:5:64:25",
            "0:65:5:65:28",
            "0:66:5:66:27",
            "0:84:25:84:34",
            "0:84:25:84:34",
            "0:84:17:84:35",
            "0:84:39:84:54",
            "0:84:39:84:54",
            "0:84:17:84:54",
            "0:84:9:84:56",
            "0:85:26:85:35",
            "0:85:26:85:35",
            "0:85:37:85:46",
            "0:85:37:85:46",
            "0:85:17:85:47",
            "0:85:9:85:49",
            "0:86:17:86:39",
            "0:86:17:86:39",
            "0:86:53:86:60",
            "0:86:53:86:60",
            "0:86:43:86:61",
            "0:86:17:86:61",
            "0:86:9:86:63",
            "0:87:17:87:38",
            "0:87:17:87:38",
            "0:87:52:87:61",
            "0:87:52:87:61",
            "0:87:42:87:62",
            "0:87:17:87:62",
            "0:87:9:87:64",
            "0:92:17:92:35",
            "0:92:17:92:35",
            "0:96:18:96:30",
            "0:96:18:96:30",
            "0:96:42:96:43",
            "0:96:45:96:47",
            "0:96:34:96:48",
            "0:96:18:96:48",
            "0:96:18:96:88",
            "0:96:51:96:61",
            "0:96:51:96:61",
            "0:96:68:96:71",
            "0:96:51:96:73",
            "0:96:51:96:73",
            "0:96:63:96:65",
            "0:96:51:96:73",
            "0:96:51:96:73",
            "0:96:18:96:88",
            "0:96:76:96:88",
            "0:96:76:96:88",
            "0:96:18:96:88",
            "0:92:17:96:89",
            "0:97:17:97:39",
            "0:97:17:97:39",
            "0:92:17:97:39",
            "0:98:17:98:24",
            "0:98:17:98:24",
            "0:92:17:98:24",
            "0:99:17:99:26",
            "0:99:17:99:26",
            "0:92:17:99:26",
            "0:100:17:100:29",
            "0:100:17:100:29",
            "0:92:17:100:29",
            "0:90:13:101:14",
            "0:103:13:103:23",
            "0:103:13:103:23",
            "0:103:51:103:61",
            "0:103:51:103:61",
            "0:103:47:103:62",
            "0:103:47:103:62",
            "0:103:65:103:66",
            "0:103:47:103:66",
            "0:103:13:103:67",
            "0:103:13:103:67",
            "0:103:28:103:38",
            "0:103:28:103:38",
            "0:103:24:103:39",
            "0:103:24:103:39",
            "0:103:42:103:44",
            "0:103:24:103:44",
            "0:103:13:103:67",
            "0:103:13:103:67",
            "0:90:13:103:67",
            "0:89:9:104:11",
            "0:106:38:106:48",
            "0:106:38:106:48",
            "0:106:17:106:49#Tx.checkPreimageOpt_:0#Tx",
            "1:391:13:391:23",
            "1:391:24:391:28",
            "1:391:29:391:37",
            "1:391:38:391:45",
            "1:391:46:391:56",
            "1:391:57:391:64",
            "1:391:65:391:72",
            "1:391:73:391:79",
            "1:392:13:392:89",
            "1:393:13:393:20",
            "1:393:21:393:27",
            "1:394:13:394:25",
            "1:395:13:395:19",
            "1:396:13:396:79",
            "1:397:13:397:24",
            "0:106:17:106:49#Tx.checkPreimageOpt_:1",
            "-1:1:1:1:1",
            "-1:1:1:1:1",
            "-1:1:1:1:1",
            "-1:1:1:1:1",
            "-1:1:1:1:1",
            "-1:1:1:1:1",
            "-1:1:1:1:1",
            "-1:1:1:1:1",
            "-1:1:1:1:1",
            "-1:1:1:1:1",
            "-1:1:1:1:1",
            "-1:1:1:1:1"
        ]
    }
};