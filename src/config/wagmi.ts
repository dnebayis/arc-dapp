import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define ARC Testnet as a custom chain
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'ARC Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
});

// Configure Wagmi with RainbowKit
export const config = getDefaultConfig({
  appName: 'ArcHub',
  projectId: 'a73bfb978eaa6e8bcb033cd46c42121b', // Your WalletConnect Project ID
  chains: [arcTestnet],
  ssr: false, // We're not using server-side rendering
});
