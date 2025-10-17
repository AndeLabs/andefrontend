# AndeChain Frontend - Production-Ready dApp

![AndeChain](https://img.shields.io/badge/AndeChain-L2_Blockchain-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Wagmi](https://img.shields.io/badge/Wagmi-2.10-purple)

Full-featured decentralized application for interacting with AndeChain blockchain. Built with modern web technologies and optimized for production.

## 🚀 Features

### Core Functionality
- ✅ **Wallet Connection** - MetaMask integration with session persistence
- ✅ **Network Status** - Real-time blockchain metrics and statistics
- ✅ **Transaction Management** - Send, explore, and track transactions
- ✅ **Token Operations** - ANDE token transfers and balance tracking
- ✅ **Smart Contract Interaction** - Deploy and interact with contracts
- ✅ **Developer Tools** - Contract deployment, encoding/decoding tools
- ✅ **Faucet** - Request test tokens for development
- ✅ **Staking** - Stake ANDE tokens and earn rewards
- ✅ **Governance** - Create and vote on proposals
- ✅ **Real-time Updates** - WebSocket-like polling for live data

### Technical Features
- 🔐 **Type Safety** - Full TypeScript with strict mode
- ⚡ **Performance** - Optimized with React Query caching
- 🎨 **UI/UX** - Modern interface with shadcn/ui components
- 📱 **Responsive** - Mobile-first design
- 🔄 **State Management** - React Query for server state
- 🎯 **Error Handling** - Comprehensive error boundaries
- 🔍 **Code Quality** - ESLint + Prettier configured
- 🧪 **Testing Ready** - Jest setup for unit/integration tests

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MetaMask or compatible Web3 wallet
- AndeChain local node running (or testnet access)

## 🛠️ Installation

### 1. Clone and Install

```bash
cd ande-labs/andefrontend
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Local development (default)
NEXT_PUBLIC_USE_LOCAL_CHAIN=true
NEXT_PUBLIC_LOCAL_RPC_URL=http://localhost:8545
NEXT_PUBLIC_FAUCET_URL=http://localhost:3001
NEXT_PUBLIC_EXPLORER_URL=http://localhost:4000

# Contract addresses (update after deployment)
NEXT_PUBLIC_ANDE_TOKEN_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_STAKING_ADDRESS=0x0000000000000000000000000000000000000000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:9002`

## 🏗️ Architecture

### Project Structure

```
andefrontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard routes
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── network/        # Network status
│   │   │   ├── transactions/   # Transaction manager
│   │   │   ├── developer/      # Developer tools
│   │   │   ├── faucet/         # Token faucet
│   │   │   ├── staking/        # Staking interface
│   │   │   └── governance/     # Governance voting
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── dashboard/          # Dashboard-specific components
│   ├── contracts/              # Smart contract ABIs & addresses
│   │   ├── abis/               # Contract ABIs
│   │   └── addresses.ts        # Contract addresses config
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-blockchain.ts   # Optimized blockchain hooks
│   │   ├── use-balance-refresh.ts
│   │   └── use-chain-stats.ts
│   ├── lib/                    # Utilities and services
│   │   ├── blockchain-service.ts  # Centralized blockchain service
│   │   ├── web3-provider.tsx   # Wagmi configuration
│   │   ├── chains.ts           # Chain definitions
│   │   └── utils.ts            # Helper functions
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── .env.example               # Environment variables template
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── package.json               # Dependencies
```

### Key Design Patterns

#### 1. Centralized Blockchain Service
All blockchain interactions go through `BlockchainService` class:

```typescript
import { useBlockchain } from '@/hooks/use-blockchain';

function MyComponent() {
  const service = useBlockchain();
  const { data: balance } = useTokenBalance(address);
}
```

#### 2. React Query for Caching
Prevents duplicate requests and optimizes performance:

```typescript
// Automatic caching and refetching
const { data, isLoading } = useBlockNumber({ watch: true });
```

#### 3. Type-Safe Contracts
All contract addresses and ABIs are typed:

```typescript
import { ANDECHAIN_CONTRACTS } from '@/contracts/addresses';
import ANDETokenABI from '@/contracts/abis/ANDEToken.json';
```

## 🎯 Usage Guide

### Connecting Wallet

1. Click "Connect Wallet" button
2. Select MetaMask from the list
3. Approve the connection
4. Switch to AndeChain network if prompted

### Sending Transactions

1. Navigate to **Transactions** page
2. Enter recipient address
3. Specify amount in ANDE
4. Click "Send Transaction"
5. Confirm in MetaMask

### Deploying Contracts

1. Go to **Developer** page
2. Select a contract template or upload custom bytecode
3. Provide constructor arguments (if needed)
4. Click "Deploy Contract"
5. Wait for confirmation

### Staking Tokens

1. Visit **Staking** page
2. Enter amount to stake
3. Review APR and lock period
4. Click "Stake Tokens"
5. Claim rewards anytime

### Participating in Governance

1. Navigate to **Governance** page
2. Review active proposals
3. Click "Vote For" or "Vote Against"
4. View your voting history

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run typecheck       # Run TypeScript compiler check

# Testing (when configured)
npm test                # Run test suite
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

### Adding New Features

#### 1. Create a New Page

```typescript
// src/app/(dashboard)/my-feature/page.tsx
'use client';

import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MyFeaturePage() {
  const { address, isConnected } = useAccount();

  return (
    <div className="space-y-6">
      <h1>My Feature</h1>
      <Card>
        <CardHeader>
          <CardTitle>Feature Content</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Your content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 2. Add to Navigation

Update `src/components/dashboard/sidebar.tsx`:

```typescript
const navItems = [
  // ... existing items
  { href: '/my-feature', icon: Star, label: 'My Feature' },
];
```

#### 3. Create Custom Hook (if needed)

```typescript
// src/hooks/use-my-feature.ts
import { useQuery } from '@tanstack/react-query';
import { useBlockchain } from './use-blockchain';

export function useMyFeature() {
  const service = useBlockchain();

  return useQuery({
    queryKey: ['myFeature'],
    queryFn: async () => {
      if (!service) throw new Error('Service not initialized');
      // Your logic here
    },
    enabled: !!service,
  });
}
```

## 🚀 Production Deployment

### Environment Setup

1. Set production environment variables:

```env
NODE_ENV=production
NEXT_PUBLIC_USE_LOCAL_CHAIN=false
NEXT_PUBLIC_TESTNET_RPC_URL=https://rpc.andechain.com
NEXT_PUBLIC_ANDE_TOKEN_ADDRESS=<deployed_address>
```

2. Update contract addresses after deployment

3. Enable analytics (optional):

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Build & Deploy

```bash
# Build optimized production bundle
npm run build

# Test production build locally
npm run start

# Deploy to hosting provider
# (Vercel, Netlify, AWS, etc.)
```

### Performance Optimization

- ✅ Code splitting enabled
- ✅ Image optimization with Next.js Image
- ✅ React Query caching configured
- ✅ CSS minification
- ✅ Tree shaking enabled
- ✅ Gzip compression

### Security Checklist

- [ ] Environment variables secured (never commit `.env.local`)
- [ ] API keys stored in secure vault
- [ ] Rate limiting configured
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] CORS properly configured
- [ ] Dependencies updated regularly
- [ ] Security audit completed

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Writing Tests

```typescript
// Example test
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## 🐛 Troubleshooting

### Common Issues

**Issue: MetaMask not connecting**
- Solution: Ensure MetaMask is installed and unlocked
- Check that you're on the correct network
- Clear browser cache and try again

**Issue: Transactions failing**
- Solution: Check gas settings
- Ensure sufficient ANDE balance
- Verify contract addresses are correct

**Issue: Data not updating**
- Solution: Check RPC endpoint is accessible
- Verify blockchain node is running
- Clear React Query cache

**Issue: Build errors**
- Solution: Delete `node_modules` and `.next`
- Run `npm install` again
- Check Node.js version (18+)

### Debug Mode

Enable debug logging:

```env
NEXT_PUBLIC_DEBUG=true
```

View debug info in browser console (F12).

## 📚 Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Wagmi Docs](https://wagmi.sh)
- [Viem Docs](https://viem.sh)
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com)

### AndeChain
- [AndeChain Docs](../docs/)
- [Smart Contracts](../andechain/contracts/)
- [Network Status](http://localhost:9090)
- [Grafana Dashboard](http://localhost:3000)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

### Code Style

- Use TypeScript with strict mode
- Follow ESLint rules
- Write descriptive commit messages
- Add tests for new features
- Update documentation

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- GitHub Issues: [Report Bug](https://github.com/andelabs/andechain/issues)
- Discord: [Join Community](https://discord.gg/andechain)
- Email: support@andechain.com

---

**Built with ❤️ by the AndeChain Team**