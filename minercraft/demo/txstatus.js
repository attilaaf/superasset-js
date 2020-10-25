/********************************************************************
*
* Verify a transaction confirm status from a miner
*
********************************************************************/
const Minercraft = require('../index');
const Miners = require('./miners.json');
(async () => {
  for(let name in Miners) {
    let config = Miners[name];
    const miner = new Minercraft(config)
    const txid = "177b4087cf6ef58e7a93a2791762688a848edbc5169166bc4fd128fba84ff8ba"
    let status = await miner.tx.status(txid)
    console.log("status for", txid, "from", name, ":", status)
  }
})()
