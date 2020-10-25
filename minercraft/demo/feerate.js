/********************************************************************
*
* Get fee quotes from miners
*
********************************************************************/
const Minercraft = require('../index');
const Miners = require('./miners.json');
(async () => {
  for(let name in Miners) {
    let config = Miners[name];
    const miner = new Minercraft(config)
    const rate = await miner.fee.rate()
    console.log("rate for", name, rate)
  }
})()
