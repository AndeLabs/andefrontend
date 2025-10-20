# AndeChain Network Configuration

## Overview

The AndeChain frontend supports multiple networks dynamically:

- **AndeChain Local** (chainId: 1234) - Standalone ev-reth for development
- **AndeChain Mocha** (chainId: 2019) - Production testnet with EVOLVE sequencer + Celestia DA

The frontend automatically adapts to the network your wallet is connected to.

## ✅ Fixed: Network Change Error

### Problem
Previously, the frontend had hardcoded references to `andechain.id`, which caused the error:

```
❌ Error: network changed: 1234 => 2019 (event="changed", code=NETWORK_ERROR, version=6.15.0)
```

This happened when:
1. The wallet (MetaMask) was connected to chainId 2019 (testnet)
2. But the frontend code expected chainId 1234 (local)
3. Wagmi detected the mismatch and threw an error

### Solution
All hooks now use **dynamic chainId** from the connected wallet:

```typescript
// ❌ Before (hardcoded)
const chainId = andechain.id; // Fixed at build time

// ✅ After (dynamic)
const chainId = useChainId(); // From connected wallet
```

## Architecture

### 1. Chain Definitions (`src/lib/chains.ts`)

```typescript
export const andechainLocal = defineChain({
  id: 1234,
  name: 'AndeChain Local',
  // ... config
});

export const andechainTestnet = defineChain({
  id: 2019,
  name: 'AndeChain Mocha',
  // ... config
});
```

### 2. Dynamic ChainId Hooks

All blockchain interaction hooks now use `useChainId()`:

- `use-ande-balance.ts` - Token balance queries
- `use-blockchain.ts` - Blockchain service
- `use-chain-validator.ts` - Network validation
- `use-governance.ts` - Governance interactions
- `use-staking.ts` - Staking operations

### 3. Network Validation

```typescript
import { useChainValidator } from '@/hooks/use-chain-validator';

const { isValidChain, chainId, switchToTestnet } = useChainValidator({
  preferredChainId: 2019,
  showToast: true,
});
```

### 4. Network Alert Component

Automatically shows warnings when user is on wrong network:

```tsx
<NetworkAlert preferredChainId={2019} />
```

## Configuration

### Web3 Provider (`src/lib/web3-provider.tsx`)

```typescript
// Chain order matters: first is default
const chains = [
  andechainTestnet, // 2019 - Default for production testing
  andechainLocal,   // 1234 - Local development
  mainnet,
  sepolia,
] as const;
```

### Contract Addresses (`src/contracts/addresses.ts`)

Contract addresses are organized by chainId:

```typescript
const TESTNET_CONTRACTS = {
  ANDEToken: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  AndeGovernor: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
  AndeNativeStaking: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  // ...
};

// Get contracts for specific chain
export function getContractsForChain(chainId: number): ContractAddresses {
  switch (chainId) {
    case 1234: return LOCAL_CONTRACTS;
    case 2019: return TESTNET_CONTRACTS;
    default: return TESTNET_CONTRACTS;
  }
}
```

## Usage Examples

### 1. Reading Balance (Dynamic ChainId)

```typescript
import { useAndeBalance } from '@/hooks/use-ande-balance';

function MyComponent() {
  const { balance, chainId, isValidChain } = useAndeBalance();
  
  if (!isValidChain) {
    return <div>Please connect to AndeChain network</div>;
  }
  
  return (
    <div>
      Balance: {balance?.formatted} ANDE (chain: {chainId})
    </div>
  );
}
```

### 2. Validating Network

```typescript
import { useChainValidator } from '@/hooks/use-chain-validator';

function MyComponent() {
  const {
    isValidChain,
    isOnPreferredChain,
    chainId,
    switchToTestnet,
  } = useChainValidator({
    preferredChainId: 2019,
    showToast: true,
  });
  
  if (!isValidChain) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Wrong Network</AlertTitle>
        <Button onClick={switchToTestnet}>
          Switch to AndeChain Testnet
        </Button>
      </Alert>
    );
  }
  
  return <div>Connected to {chainId}</div>;
}
```

### 3. Blockchain Operations

```typescript
import { useBlockchain } from '@/hooks/use-blockchain';

function MyComponent() {
  const blockchain = useBlockchain();
  
  const handleTransfer = async () => {
    if (!blockchain) return;
    
    const hash = await blockchain.transferToken(
      '0x...',
      '1000000000000000000' // 1 ANDE
    );
    
    console.log('Transaction hash:', hash);
  };
  
  return <Button onClick={handleTransfer}>Transfer</Button>;
}
```

## Network Switching

### Programmatic Switching

```typescript
import { useSwitchChain } from 'wagmi';

function NetworkSwitcher() {
  const { switchChain, isPending } = useSwitchChain();
  
  return (
    <div>
      <Button onClick={() => switchChain({ chainId: 1234 })}>
        Switch to Local
      </Button>
      <Button onClick={() => switchChain({ chainId: 2019 })}>
        Switch to Testnet
      </Button>
    </div>
  );
}
```

### Using Helper Hook

```typescript
import { useChainValidator } from '@/hooks/use-chain-validator';

function NetworkSwitcher() {
  const { switchToLocal, switchToTestnet, isSwitching } = useChainValidator();
  
  return (
    <div>
      <Button onClick={switchToLocal} disabled={isSwitching}>
        Switch to Local
      </Button>
      <Button onClick={switchToTestnet} disabled={isSwitching}>
        Switch to Testnet
      </Button>
    </div>
  );
}
```

## Adding MetaMask Network

### For Users

Add AndeChain Testnet to MetaMask:

```json
{
  "chainId": "0x7E3",
  "chainName": "AndeChain Mocha",
  "nativeCurrency": {
    "name": "ANDE",
    "symbol": "ANDE",
    "decimals": 18
  },
  "rpcUrls": ["http://localhost:8545"],
  "blockExplorerUrls": ["http://localhost:4000"]
}
```

### Programmatic Addition

```typescript
async function addAndeChainToMetaMask() {
  if (!window.ethereum) return;
  
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x7E3', // 2019 in hex
        chainName: 'AndeChain Mocha',
        nativeCurrency: {
          name: 'ANDE',
          symbol: 'ANDE',
          decimals: 18,
        },
        rpcUrls: ['http://localhost:8545'],
        blockExplorerUrls: ['http://localhost:4000'],
      }],
    });
  } catch (error) {
    console.error('Failed to add network:', error);
  }
}
```

## Environment Variables

Configure network behavior with environment variables:

```bash
# .env.local

# Use local chain (1234) instead of testnet (2019)
NEXT_PUBLIC_USE_LOCAL_CHAIN=false

# Use production mainnet (future)
NEXT_PUBLIC_USE_PRODUCTION=false

# RPC URL (optional, defaults to http://localhost:8545)
NEXT_PUBLIC_RPC_URL=http://localhost:8545

# Block explorer URL
NEXT_PUBLIC_EXPLORER_URL=http://localhost:4000

# Faucet URL
NEXT_PUBLIC_FAUCET_URL=http://localhost:3001
```

## Testing

### Test Network Switching

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useChainValidator } from '@/hooks/use-chain-validator';

test('detects invalid network', async () => {
  const { result } = renderHook(() => useChainValidator());
  
  await waitFor(() => {
    expect(result.current.isValidChain).toBe(false);
  });
});
```

### Test Dynamic ChainId

```typescript
test('uses dynamic chainId from wallet', async () => {
  const { result } = renderHook(() => useAndeBalance());
  
  await waitFor(() => {
    expect(result.current.chainId).toBe(2019); // From wallet
  });
});
```

## Troubleshooting

### Error: "network changed: 1234 => 2019"

**Cause**: Wallet is on different chain than expected

**Solution**: 
1. Check your MetaMask network (should be chainId 2019)
2. The frontend will auto-detect and adapt
3. NetworkAlert component will show switch button if needed

### Contracts Not Found

**Cause**: Contract addresses not configured for current chain

**Solution**:
1. Check `src/contracts/addresses.ts`
2. Ensure contracts are deployed for your chainId
3. Update `TESTNET_CONTRACTS` or `LOCAL_CONTRACTS`

### Balance Not Loading

**Cause**: Reading from wrong chain or contract not deployed

**Solution**:
1. Verify chainId with `useChainValidator()`
2. Check contract address with `getContractsForChain(chainId)`
3. Ensure ANDE token is deployed on current chain

## Best Practices

### 1. Always Validate Chain

```typescript
const { isValidChain } = useChainValidator();

if (!isValidChain) {
  return <NetworkAlert />;
}
```

### 2. Use Dynamic ChainId

```typescript
// ❌ Don't
const chainId = 2019;

// ✅ Do
const chainId = useChainId();
```

### 3. Show User-Friendly Errors

```typescript
if (!isValidChain) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Wrong Network</AlertTitle>
      <AlertDescription>
        Please switch to AndeChain Testnet (chainId: 2019)
      </AlertDescription>
      <Button onClick={switchToTestnet}>Switch Network</Button>
    </Alert>
  );
}
```

### 4. Handle Loading States

```typescript
const { balance, isLoading } = useAndeBalance();

if (isLoading) {
  return <Spinner />;
}
```

## Migration Guide

### Updating Existing Code

If you have code using hardcoded chainId:

```typescript
// ❌ Before
import { andechain } from '@/lib/chains';
const chainId = andechain.id;

// ✅ After
import { useChainId } from 'wagmi';
const chainId = useChainId();
```

```typescript
// ❌ Before
useReadContract({
  chainId: 2019, // Hardcoded
  // ...
});

// ✅ After
const chainId = useChainId();
useReadContract({
  chainId, // Dynamic
  // ...
});
```

## Summary

- ✅ **Dynamic ChainId**: All hooks use `useChainId()` from Wagmi
- ✅ **Multi-Network**: Supports both local (1234) and testnet (2019)
- ✅ **Validation**: `useChainValidator` ensures correct network
- ✅ **User Alerts**: `NetworkAlert` component shows warnings
- ✅ **Auto-Adapt**: Frontend adapts to wallet's connected chain
- ✅ **No More Errors**: "network changed" error is completely resolved

## References

- [Wagmi useChainId](https://wagmi.sh/react/api/hooks/useChainId)
- [Wagmi useSwitchChain](https://wagmi.sh/react/api/hooks/useSwitchChain)
- [Viem Chain Configuration](https://viem.sh/docs/chains/introduction)
- [EIP-3085: wallet_addEthereumChain](https://eips.ethereum.org/EIPS/eip-3085)