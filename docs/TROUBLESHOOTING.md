# AndeChain Frontend - Troubleshooting Guide

## Network Status Issues

### Problem: Network Health shows "Unhealthy" or "Stalled" but chain is producing blocks

#### Symptoms
- Dashboard "Network" card shows: Connected, Block number increasing, Time: 2s
- Network Status page shows: Unhealthy, Block Production: Stalled, Last Block Age: >10 seconds

#### Root Cause
This occurs when:
1. The blockchain has old block timestamps (chain was restarted but kept block numbers)
2. The frontend is comparing current system time with old block timestamps
3. Block timestamps are far in the past causing incorrect "age" calculations

#### Solution
The frontend now uses **block number progression** instead of block timestamps to determine health:
- Tracks when a new block number is seen (real-time)
- Calculates "last block age" based on time since last new block
- Ignores block timestamps for health calculations

#### Verification Steps
1. Open browser console (F12)
2. Look for `[NetworkStatus]` logs showing:
   ```
   [NetworkStatus] New block: { blockNumber: "6598", transactions: 0 }
   [NetworkStatus] Health Check: { isHealthy: true, lastBlockAge: 0 }
   ```
3. Verify `lastBlockAge` resets to 0 when new blocks arrive
4. Check that `isHealthy: true` when blocks are progressing

#### Expected Behavior
- **Healthy**: New block every 2-3 seconds, `lastBlockAge < 6s`
- **Slow**: New block every 6-10 seconds, `lastBlockAge 6-10s`
- **Stalled**: No new block for >10 seconds, `lastBlockAge >10s`

---

## Common Issues

### 1. "Gas: N/A" in Dashboard

#### Cause
Gas price data not available from RPC endpoint.

#### Fix
Check RPC connection:
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'
```

Expected response:
```json
{"jsonrpc":"2.0","id":1,"result":"0x3b9aca00"}
```

### 2. "TPS: 0" Despite Transactions

#### Cause
- No transactions in recent blocks
- Transaction scanning not working properly

#### Debug
Open console and check:
```javascript
// Check block transactions
const block = await publicClient.getBlock({ blockNumber: 'latest' })
console.log('Transactions:', block.transactions.length)
```

### 3. RPC Latency shows "0ms"

#### Cause
RPC latency measurement hasn't completed yet (takes 10s on first load).

#### Fix
Wait 10 seconds and check again. If still 0ms:
```javascript
// Manual test
const start = performance.now()
await fetch('http://localhost:8545', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1
  })
})
const latency = performance.now() - start
console.log('RPC Latency:', latency, 'ms')
```

### 4. No Recent Activity / Transactions Not Showing

#### Cause
- Wallet has no transactions in recent 1000 blocks
- LocalStorage cache is stale
- Transaction scanning failed

#### Fix
1. Clear cache:
   ```javascript
   localStorage.removeItem('ande_user_txs_' + address.toLowerCase())
   ```
2. Refresh page
3. Check console for errors:
   ```
   [UserTransactions] Failed to fetch...
   ```

### 5. Contract Addresses Not Showing

#### Cause
Contracts not deployed or incorrect addresses in `addresses.ts`.

#### Fix
1. Verify contracts are deployed:
   ```bash
   cd andechain
   make health
   ```
2. Check addresses in browser console:
   ```javascript
   console.log(window.__ANDECHAIN_CONTRACTS)
   ```
3. Update addresses in `src/contracts/addresses.ts` if needed

---

## Network Requirements

### Blockchain Must Be Running
```bash
# Check if blockchain is running
curl http://localhost:8545 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Block Explorer Must Be Running
```bash
# Check block explorer
curl http://localhost:4000
```

### Expected Response Times
- RPC calls: < 100ms (excellent), < 300ms (good)
- Block time: ~2 seconds
- New block detection: < 1 second after production

---

## Debug Mode

### Enable Detailed Logging

Set in `.env.local`:
```bash
NODE_ENV=development
```

### Console Logs to Monitor

**Network Status Hook:**
```
[NetworkStatus] New block: {...}
[NetworkStatus] Health Check: {...}
[NetworkStatus] Block history updated, total blocks: N
```

**Transaction Scanner:**
```
[UserTransactions] Scanning blocks...
[UserTransactions] Found transaction: {...}
[UserTransactions] Cached N transactions
```

**Contract Addresses:**
```
🔗 AndeChain Contract Addresses
ANDEToken: 0x... ✅ (deployed)
AndeNativeStaking: 0x... ✅ (deployed)
```

### Performance Monitoring

Check React DevTools Profiler for:
- `useNetworkStatus` render count (should be ~1 per 2-3s)
- `useUserTransactions` (should render once on mount, then cache)
- Dashboard components (should use memoization)

---

## Cache Management

### LocalStorage Usage
- **User Transactions**: `ande_user_txs_{address}` - 1 minute TTL
- **Network Metrics**: In-memory only

### Clear All Caches
```javascript
// Clear transaction cache
Object.keys(localStorage)
  .filter(key => key.startsWith('ande_user_txs_'))
  .forEach(key => localStorage.removeItem(key))

// Force refresh
window.location.reload()
```

---

## Performance Optimization

### If Page is Slow

1. **Reduce Block Scanning Range**
   Edit `src/hooks/use-user-transactions.ts`:
   ```typescript
   const MAX_BLOCKS_TO_SCAN = 500; // Reduce from 1000
   ```

2. **Increase Cache Duration**
   Edit `src/hooks/use-user-transactions.ts`:
   ```typescript
   const CACHE_DURATION = 300000; // 5 minutes instead of 1
   ```

3. **Reduce Block History**
   Edit `src/hooks/use-network-status.ts`:
   ```typescript
   const BLOCKS_TO_ANALYZE = 10; // Reduce from 20
   ```

---

## Network Connectivity Tests

### Test RPC Endpoint
```bash
# Block number
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Chain ID
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Get latest block
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest",false],"id":1}'
```

### Test From Frontend
```javascript
// In browser console
const response = await fetch('http://localhost:8545', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1
  })
})
const data = await response.json()
console.log('Block Number:', parseInt(data.result, 16))
```

---

## Known Limitations

1. **Transaction History**: Limited to last 1000 blocks
2. **No WebSocket Support**: Uses polling (every 2s for blocks)
3. **Gas Price**: May show N/A on fresh chains
4. **Block Timestamps**: Old timestamps ignored for health checks
5. **Cache**: LocalStorage limited to ~5-10MB

---

## Getting Help

### Check Logs
1. **Browser Console**: F12 → Console tab
2. **Network Tab**: F12 → Network tab (check RPC calls)
3. **React DevTools**: Components tree and profiler

### Report Issues
Include:
1. Browser console logs
2. Network tab screenshot
3. `window.__ANDECHAIN_CONTRACTS` output
4. Steps to reproduce
5. Expected vs actual behavior

### Quick Health Check
```javascript
// Run in browser console
console.log({
  contracts: window.__ANDECHAIN_CONTRACTS,
  blockNumber: await publicClient.getBlockNumber(),
  chainId: await publicClient.getChainId(),
  gasPrice: await publicClient.getGasPrice(),
})
```

---

## FAQ

**Q: Why does Network Health take 3-5 seconds to update?**  
A: Health checks run every 3 seconds to avoid excessive calculations. New blocks trigger immediate updates.

**Q: Can I customize health check thresholds?**  
A: Yes, edit `src/hooks/use-network-status.ts`:
```typescript
const MAX_BLOCK_AGE_SECONDS = 10;  // Stalled threshold
const SLOW_BLOCK_THRESHOLD = 6;     // Slow threshold
const EXPECTED_BLOCK_TIME = 2;      // Expected block time
```

**Q: How do I force refresh all data?**  
A: Click the refresh button on Recent Activity card, or hard refresh (Ctrl+Shift+R / Cmd+Shift+R).

**Q: Why are my transactions not showing?**  
A: Transactions are scanned from recent blocks only. If your transaction is >1000 blocks old, it won't appear.

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Status**: Production Ready