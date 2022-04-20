// Allowable letters for the prefix tree
export const letters = [
    '2d',
    '5f',
    // '2e', Exclude it (double check this next time with internet connection)
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '61',
    '62',
    '63',
    '64',
    '65',
    '66',
    '67',
    '68',
    '69',
    '6a',
    '6b',
    '6c',
    '6d',
    '6e',
    '6f',
    '70',
    '71',
    '72',
    '73',
    '74',
    '75',
    '76',
    '77',
    '78',
    '79',
    '7a'
];

export const feeBurnerRefundAmount = 1000;

export const claimSatoshisInt = 300;

export const letterOutputSatoshisInt = 800;

export const feeBurnerSatoshis = 10000;

export const bnsConstant = Buffer.from('bns1', 'utf8').toString('hex');

export const API_PREFIX = process.env.NETWORK === 'mainnet' ? 'https://api.whatsonchain.com/v1/bsv/main' : 'https://api.whatsonchain.com/v1/bsv/test';

export const BNS_ROOT = 'b72470fb23eb5f90dceda5a376869702af2e6605824f3cb2e0cf588f0c559514';

export const BNS_API_URL = 'http://localhost:4000/api';