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
  // ./bfgminer -S opencl:auto -o http://node.radiantone.org:7332 -u raduser -p radpass --generate-to 18vb6LoUF25wsC7ZFC5EQsH7V5P7N3Bfeq
  proc = spawn('./bfgminer', [`-S`, `opencl:auto`, '-o', process.env.RPCHOSTPORT, '-u', `${process.env.RPCUSER}`, `-p`, `${process.env.RPCPASS}`, `--generate-to=${addressStr}`], options);
  isRunning = true;
  let output = '';
  proc.stderr.on('data', (chunk) => {
    console.log('Line: ', chunk.toString())
    if (/Found\ block/i.test(chunk.toString())) {
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