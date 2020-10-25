/********************************************************************
*
* Verify a transaction confirm status from a miner
*
********************************************************************/
const Minercraft = require('../index');
const validexample = {
  payload: '{"apiVersion":"0.1.0","timestamp":"2020-04-30T12:34:00.001Z","returnResult":"success","resultDescription":"","blockHash":"000000000000000004a5686ff15cdb3950939bdc5725970d963e2b03d3d43d45","blockHeight":630700,"confirmations":2166,"minerId":"03e92d3e5c3f7bd945dfbf48e7a99393b1bfb3f11f380ae30d286e7ff2aec5a270","txSecondMempoolExpiry":0}',
  signature: '30450221009fbc3747e8bd826a4bef9b389c91986d5e2dd38e8952f98d389a111c6ea24c00022040c4379ff32435a7b4cf56a9f3a58c27570d9e5430b7af3ae7941a385d52af4c',
  publicKey: '03e92d3e5c3f7bd945dfbf48e7a99393b1bfb3f11f380ae30d286e7ff2aec5a270',
  encoding: 'UTF-8',
  mimetype: 'application/json'
}
const invalidexample = {
  payload: '{"apiVersion":"0.1.0","timestamp":"2020-04-30T12:34:00.001Z","returnResult":"success","resultDescription":"","blockHash":"100000000000000004a5686ff15cdb3950939bdc5725970d963e2b03d3d43d45","blockHeight":630700,"confirmations":2166,"minerId":"03e92d3e5c3f7bd945dfbf48e7a99393b1bfb3f11f380ae30d286e7ff2aec5a270","txSecondMempoolExpiry":0}',
  signature: '30450221009fbc3747e8bd826a4bef9b389c91986d5e2dd38e8952f98d389a111c6ea24c00022040c4379ff32435a7b4cf56a9f3a58c27570d9e5430b7af3ae7941a385d52af4c',
  publicKey: '03e92d3e5c3f7bd945dfbf48e7a99393b1bfb3f11f380ae30d286e7ff2aec5a270',
  encoding: 'UTF-8',
  mimetype: 'application/json'
}
let isvalid0 = Minercraft.validate(validexample)
console.log("isvalid ?", isvalid0)
let isvalid1 = Minercraft.validate(invalidexample)
console.log("isvalid ?", isvalid1)
