import { defineChain } from 'viem'

export const andechainLocal = defineChain({
  id: 1234,
  name: 'AndeChain Local',
  nativeCurrency: {
    decimals: 18,
    name: 'ANDE',
    symbol: 'ANDE',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local Explorer', url: 'http://localhost:8545' },
  },
  testnet: true,
})

export const andechanTestnet = defineChain({
  id: 1234,
  name: 'AndeChain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ANDE',
    symbol: 'ANDE',
  },
  rpcUrls: {
    default: { http: ['https://testnet.andechain.com/rpc'] },
  },
  blockExplorers: {
    default: { name: 'AndeScan', url: 'https://testnet.andescan.com' },
  },
  testnet: true,
})

export const andechain = process.env.NEXT_PUBLIC_USE_LOCAL_CHAIN === 'true' 
  ? andechainLocal 
  : andechanTestnet
