'use strict';
const spawn = require('child_process').spawn;
const minerPrivateKey = require('./minerPrivateKey.js');
require('dotenv').config();

const options = {
  stdio: [
    'inherit', // StdIn.
    'pipe',    // StdOut.
    'pipe'     // StdErr.
  ],
};

let proc = null;
let isRunning = false;
const spawnMiner = async (addressStr)  => {
  console.log('Spawning...', addressStr)
  // ./minerd --threads=9 --coinbase-addr=18FuiFFQTVKU5W32EMzVHdBHcCFhZLUg1d -o 127.0.0.1:8332 -O USER:PASSWORD --no-longpoll --no-getwork  --no-stratum --algo=sha256d --debug
  proc = spawn('./minerd', [`--coinbase-addr=${addressStr}`, '-o', process.env.RPCHOSTPORT, '-O', `${process.env.RPCUSER}:${process.env.RPCPASS}`, '--no-longpoll', '--no-getwork', '--no-stratum', '--algo=sha512_256d', '--debug'], options);
  isRunning = true;
  let output = '';
  proc.stderr.on('data', (chunk) => {
    console.log('Line: ', chunk.toString())
    if (/yay/i.test(chunk.toString())) {
      console.log('Found block: ', chunk.toString());
      minerPrivateKey.incrementAddressIndex();
      proc.kill('SIGINT');
    }
  });
  proc.on('exit', () => {
    console.log('Exit...');
    isRunning = false;
  });
}

setInterval(async () => {
  console.log('Checking if still alive', (new Date().toString()), '...');
  if (!isRunning) {
    spawnMiner(await minerPrivateKey.getNextAddressFromIndex());
  } else {
    console.log('...alive');
  }
}, 5000);

console.log('---', (new Date));