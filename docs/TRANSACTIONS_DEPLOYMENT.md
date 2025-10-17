# Transactions Feature - Production Deployment Guide

## 📋 Overview

This guide covers the complete production deployment of the enhanced Transactions feature, including block explorer integration, troubleshooting, and best practices.

## 🚀 Quick Start

### Prerequisites

1. **Blockchain Running**
   ```bash
   cd andechain
   make full-start
   ```

2. **Block Explorer Running** (Required for transaction links)
   ```bash
   cd andechain
   bash scripts/start-explorer.sh
   ```

3. **Frontend Running**
   ```bash
   cd andefrontend
   npm run dev
   ```

## 🔍 Block Explorer Setup

### Why Do We Need It?

The block explorer (Blockscout) provides:
- ✅ Visual transaction confirmation
- ✅ Block details and history
- ✅ Contract verification
- ✅ Address activity tracking
- ✅ Professional user experience

### Starting Blockscout

**Option 1: Using the startup script (Recommended)**
```bash
cd andechain
bash scripts/start-explorer.sh
```

**Option 2: Manual start**
```bash
cd andechain/infra/stacks/eth-explorer

# Create .env if it doesn't exist
cp .env.example .env  # Edit with your values

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Verify Explorer is Running

```bash
# Check containers
docker ps | grep blockscout

# Expected output:
# blockscout-frontend   (port 4000)
# blockscout-backend    (port 4001)
# blockscout-db         (postgres)
# stats                 (port 8051)

# Test frontend
curl http://localhost:4000

# Test backend API
curl http://localhost:4001/api/v2/stats
```

### Explorer URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:4000 | User-facing explorer |
| **Backend API** | http://localhost:4001 | API for transactions |
| **Stats API** | http://localhost:8051 | Network statistics |

## 🔧 Configuration

### Environment Variables

Create/update `.env.local` in `andefrontend/`:

```bash
# Blockchain
NEXT_PUBLIC_USE_LOCAL_CHAIN=true

# Block Explorer (optional - auto-detected)
NEXT_PUBLIC_EXPLORER_URL=http://localhost:4000

# RPC
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

### Chain Configuration

File: `andefrontend/src/lib/chains.ts`

```typescript
export const andechainLocal = defineChain({
  id: 1234,
  name: 'AndeChain Local',
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
  blockExplorers: {
    default: { 
      name: 'Blockscout', 
      url: 'http://localhost:4000',  // ← Explorer URL
    },
  },
  testnet: true,
})
```

## 🐛 Troubleshooting

### Issue 1: Transaction Receipt Error

**Error:**
```
TransactionReceiptNotFoundError: Transaction receipt with hash "0x..." could not be found.
```

**Cause:** Trying to get receipt before transaction is mined.

**Solution:** ✅ Already fixed with retry logic
- Automatic retry with exponential backoff
- Waits up to 5 attempts (10 seconds total)
- Keeps transaction as "pending" if not found

**Verify Fix:**
```typescript
// In use-transaction-history.ts
const updateTransactionStatus = async (hash, retries = 5) => {
  // Retries with 1s, 2s, 3s, 4s, 5s delays
}
```

### Issue 2: MetaMask "Cannot Include Data" Error

**Error:**
```
MetaMask - RPC Error: External transactions to internal accounts cannot include data
```

**Cause:** Sending empty `data` field (`0x`) to EOA (Externally Owned Account).

**Solution:** ✅ Already fixed
```typescript
// Only include data if non-empty
if (sendData && sendData.trim() !== '' && sendData !== '0x') {
  txParams.data = sendData;
}
```

### Issue 3: Explorer Link Not Showing

**Problem:** "View on Explorer" link doesn't appear.

**Diagnosis:**
```bash
# 1. Check if explorer is running
docker ps | grep blockscout-frontend

# 2. Test explorer URL
curl http://localhost:4000

# 3. Check chain config
# File: src/lib/chains.ts
# Verify blockExplorers.default.url
```

**Solutions:**

a) **Explorer not running:**
```bash
cd andechain
bash scripts/start-explorer.sh
```

b) **Wrong port:**
```typescript
// Update in src/lib/chains.ts
blockExplorers: {
  default: { 
    name: 'Blockscout', 
    url: 'http://localhost:4000',  // Check this port
  },
}
```

c) **Hard refresh frontend:**
```bash
# Clear cache and rebuild
cd andefrontend
rm -rf .next
npm run dev
```

### Issue 4: Transactions Not Appearing in History

**Problem:** Sent transactions don't show in transaction history.

**Diagnosis:**
```typescript
// Check localStorage
localStorage.getItem('ande_tx_history_' + address.toLowerCase())

// Check console for errors
// Open DevTools → Console → Look for errors in use-transaction-history.ts
```

**Solutions:**

a) **Clear and rescan:**
```javascript
// In browser console
localStorage.clear()
location.reload()
```

b) **Manual refresh:**
- Click "Refresh" button in Transaction History tab

c) **Check RPC connection:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Issue 5: Token Not Detected

**Problem:** ERC20 token doesn't appear in token selector.

**Diagnosis:**
```typescript
// Check if token has recent transfers
// File: use-wallet-tokens.ts
const BLOCKS_TO_SCAN = 100; // Scans last 100 blocks
```

**Solutions:**

a) **Add manually:**
1. Open token selector
2. Click "+ Add Token"
3. Paste contract address
4. Confirm

b) **Increase scan range** (if token is old):
```typescript
// In use-wallet-tokens.ts
const BLOCKS_TO_SCAN = 200; // Increase from 100
```

c) **Trigger transfer:**
- Send or receive the token to trigger Transfer event
- Will be auto-detected on next scan

## 📊 Performance Optimization

### 1. Reduce Blockchain Scanning

**Current:** Scans 100 blocks for tokens, 100 blocks for transactions

**Optimization:**
```typescript
// For production with many tokens
const BLOCKS_TO_SCAN = 50; // Reduce if slow

// For fresh wallets
const BLOCKS_TO_SCAN = 200; // Increase for more history
```

### 2. Cache Strategy

**Token Metadata:**
```typescript
// Already cached in localStorage
localStorage['ande_known_tokens'] = [...tokenAddresses]
```

**Transaction History:**
```typescript
// Max 100 transactions per wallet
const MAX_STORED_TXS = 100;
```

### 3. API Rate Limiting

**Best Practice:**
- Don't call `refreshTokens()` too frequently
- Use built-in auto-refresh on block changes
- Manual refresh only when needed

## 🔒 Security Checklist

### Before Production Deploy

- [ ] **Input Validation**
  - ✅ Address validation with `isAddress()`
  - ✅ Amount validation (> 0, <= balance)
  - ✅ Data field sanitization

- [ ] **XSS Prevention**
  - ✅ No `dangerouslySetInnerHTML`
  - ✅ Proper React escaping
  - ✅ User inputs sanitized

- [ ] **Contract Verification**
  - ✅ ERC20 ABI validation
  - ✅ Function call verification
  - ✅ Error handling for failed calls

- [ ] **Storage Security**
  - ✅ No private keys in localStorage
  - ✅ Only public data stored
  - ✅ Proper JSON serialization

- [ ] **Network Security**
  - ✅ HTTPS in production
  - ✅ CORS properly configured
  - ✅ RPC endpoints whitelisted

## 📈 Monitoring

### Key Metrics to Track

1. **Transaction Success Rate**
   ```typescript
   const successRate = successTxs / totalTxs * 100
   ```

2. **Average Confirmation Time**
   ```typescript
   const avgTime = (confirmedTime - submittedTime) / 1000 // seconds
   ```

3. **Token Detection Rate**
   ```typescript
   const detectionRate = detectedTokens / totalTransfers * 100
   ```

4. **Error Rate**
   ```typescript
   const errorRate = failedTxs / totalTxs * 100
   ```

### Logging Strategy

**Production Logs:**
```typescript
// Important events only
console.log('Transaction submitted:', hash)
console.log('Transaction confirmed:', hash)
console.error('Transaction failed:', error)
```

**Development Logs:**
```typescript
// Verbose logging
console.log('Token detected:', token)
console.log('Scanning blocks:', startBlock, endBlock)
console.log('Balance updated:', balance)
```

## 🚢 Deployment Checklist

### Pre-Deployment

- [ ] Run type check: `npm run typecheck`
- [ ] Run build: `npm run build`
- [ ] Test on local blockchain
- [ ] Test all transaction types (native, ERC20)
- [ ] Test all filters and sorting
- [ ] Test on mobile viewport
- [ ] Clear localStorage and test fresh install
- [ ] Test with different wallets (MetaMask, WalletConnect)

### Production Environment

- [ ] Update chain config for production RPC
- [ ] Update explorer URL for production explorer
- [ ] Set proper CORS headers
- [ ] Enable rate limiting
- [ ] Setup monitoring/alerts
- [ ] Prepare rollback plan

### Post-Deployment

- [ ] Monitor error logs
- [ ] Check transaction success rate
- [ ] Verify explorer links work
- [ ] Test with real users
- [ ] Monitor performance metrics

## 🔄 Rollback Plan

### If Issues Occur

1. **Quick Fix:**
   ```bash
   # Revert to previous version
   git revert HEAD
   npm run build
   pm2 restart frontend
   ```

2. **Emergency Disable:**
   ```typescript
   // Temporarily disable transactions
   const MAINTENANCE_MODE = true;
   if (MAINTENANCE_MODE) return <MaintenanceMessage />;
   ```

3. **Partial Rollback:**
   ```typescript
   // Disable only problematic features
   const ENABLE_ERC20 = false;
   const ENABLE_AUTO_DETECTION = false;
   ```

## 📞 Support

### Common User Questions

**Q: Where can I see my transaction?**
A: Go to Transactions tab → Transaction History. Click the explorer link to see details.

**Q: Transaction is pending forever?**
A: 
1. Check if blockchain is producing blocks
2. Check gas price is sufficient
3. Click "Refresh" in Transaction History

**Q: Can't find my token?**
A:
1. Try manual add: Token Selector → "+ Add Token"
2. Check contract address is correct
3. Ensure token is ERC20 compliant

**Q: Explorer link doesn't work?**
A: Block explorer must be running on localhost:4000. Run: `bash andechain/scripts/start-explorer.sh`

### Debug Mode

**Enable verbose logging:**
```typescript
// Add to page.tsx
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Transaction state:', {
    hash, pendingTxHash, isConfirming, isConfirmed
  });
}
```

## 📚 Additional Resources

- **Viem Documentation:** https://viem.sh
- **Wagmi Documentation:** https://wagmi.sh
- **Blockscout Documentation:** https://docs.blockscout.com
- **ERC20 Standard:** https://eips.ethereum.org/EIPS/eip-20

---

**Last Updated:** 2024
**Version:** 2.0.0
**Status:** Production Ready ✅