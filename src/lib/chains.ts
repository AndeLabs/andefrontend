import { defineChain } from 'viem'

export const andechanTestnet = defineChain({
  id: 8086,
  name: 'AndeChain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'AND',
    symbol: 'AND',
  },
  rpcUrls: {
    default: { http: ['https://testnet.andechain.com/rpc'] },
  },
  blockExplorers: {
    default: { name: 'AndeScan', url: 'https://testnet.andescan.com' },
  },
  testnet: true,
})
