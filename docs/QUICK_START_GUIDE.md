# AndeChain Quick Start Guide

## 🚀 Get Connected in 3 Minutes

This guide will help you connect to AndeChain and start using the dApp.

## ⚠️ IMPORTANT: Network Configuration

Your blockchain is running on **chainId 2019** (AndeChain Mocha Testnet), not chainId 1234.

When MetaMask shows "Chain ID mismatch" error, it means you're trying to add the wrong network. Follow this guide to add the correct one.

---

## Step 1: Prerequisites

### ✅ Install MetaMask
- Download: https://metamask.io/download/
- Available for Chrome, Firefox, Brave, Edge

### ✅ Start AndeChain Node
```bash
cd andechain
make full-start
```

Wait until you see:
```
✅ EVOLVE Sequencer running
✅ Producing blocks (~2 second intervals)
✅ Current block: XXXX
```

---

## Step 2: Add AndeChain Network to MetaMask

### Option A: Automatic (Recommended) ✨

1. **Open the Setup Page**
   ```
   http://localhost:3000/setup
   ```

2. **Click "Add AndeChain Mocha" button**
   - MetaMask will prompt you to approve
   - Click "Approve" → "Switch Network"
   - Done! ✅

### Option B: Manual Configuration

1. **Open MetaMask**
2. **Click network selector** (top center)
3. **Click "Add Network"** → "Add network manually"
4. **Enter these EXACT values:**

   ```
   Network Name:    AndeChain Mocha
   RPC URL:         http://localhost:8545
   Chain ID:        2019
   Currency Symbol: ANDE
   Block Explorer:  http://localhost:4000
   ```

5. **Click "Save"**
6. **Select "AndeChain Mocha"** from network selector

### Option C: Chrome DevTools (Advanced)

1. **Open any page** on http://localhost:3000
2. **Press F12** (open DevTools)
3. **Go to Console tab**
4. **Paste and run:**

   ```javascript
   await window.ethereum.request({
     method: 'wallet_addEthereumChain',
     params: [{
       chainId: '0x7E3',
       chainName: 'AndeChain Mocha',
       nativeCurrency: {
         name: 'ANDE',
         symbol: 'ANDE',
         decimals: 18
       },
       rpcUrls: ['http://localhost:8545'],
       blockExplorerUrls: ['http://localhost:4000']
     }]
   })
   ```

5. **Approve in MetaMask popup**

---

## Step 3: Connect Your Wallet

1. **Open Dashboard**
   ```
   http://localhost:3000/dashboard
   ```

2. **Click "Connect Wallet"** (top right)

3. **Select MetaMask**

4. **In MetaMask popup:**
   - Select account to connect
   - Click "Next" → "Connect"

5. **✅ Success!** You should see:
   - Your address in the header
   - Your ANDE balance
   - No error messages

---

## Step 4: Get Test Tokens

1. **Go to Faucet**
   ```
   http://localhost:3000/faucet
   ```

2. **Click "Request 500,000 ANDE Tokens"**

3. **Wait ~2 seconds** for transaction to confirm

4. **✅ Balance updated!** Check your dashboard

---

## 🎯 Verify Everything Works

### Check 1: Network Connection ✅
- MetaMask shows: **AndeChain Mocha**
- Chain ID: **2019**
- No "Wrong Network" alerts

### Check 2: RPC Connection ✅
Open DevTools Console (F12) and run:
```javascript
await fetch('http://localhost:8545', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_chainId',
    params: [],
    id: 1
  })
}).then(r => r.json()).then(console.log)
```

Expected output:
```json
{ "jsonrpc": "2.0", "id": 1, "result": "0x7e3" }
```
(0x7e3 = 2019 in hex)

### Check 3: Balance Loading ✅
- Dashboard shows your ANDE balance
- No loading spinners stuck
- Faucet page works

### Check 4: Contract Addresses ✅
Open DevTools Console and run:
```javascript
window.__ANDECHAIN_CONTRACTS
```

Expected output:
```javascript
{
  currentChainId: 2019,
  addresses: {
    ANDEToken: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    AndeGovernor: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    AndeNativeStaking: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    // ...
  }
}
```

---

## 🐛 Troubleshooting

### Error: "Chain ID Mismatch" in MetaMask

**Problem**: You're trying to add the wrong network (1234 instead of 2019)

**Solution**:
1. Remove the wrong network from MetaMask:
   - Settings → Networks → Find "AndeChain Local" → Delete
2. Add the correct network (chainId 2019) using Step 2 above

---

### Error: "network changed: 1234 => 2019"

**Problem**: Old bug - this is now FIXED ✅

**Solution**:
1. Clear browser cache:
   ```javascript
   localStorage.clear()
   location.reload()
   ```
2. Reconnect wallet

---

### Error: "RPC Not Available"

**Problem**: Blockchain node is not running

**Solution**:
```bash
cd andechain
make full-start
```

Verify it's running:
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

### Balance Not Loading

**Possible Causes:**
1. Wrong network selected
2. Contracts not deployed
3. RPC connection issue

**Solutions:**

1. **Check Network**:
   - MetaMask should show "AndeChain Mocha"
   - Chain ID should be 2019

2. **Check Contract Deployment**:
   ```bash
   cd andechain
   cat deployments/testnet-2019.json
   ```

3. **Check RPC**:
   ```bash
   curl http://localhost:8545
   ```

4. **Refresh Balance**:
   - Disconnect wallet
   - Clear cache: `localStorage.clear()`
   - Reload page
   - Reconnect wallet

---

### MetaMask Shows "Unable to Connect"

**Solution**:
1. Disconnect from all sites:
   - MetaMask → Settings → Connected Sites → Disconnect All
2. Refresh page
3. Connect again

---

## 📍 Available Pages

| Page | URL | Description |
|------|-----|-------------|
| **Home** | http://localhost:3000 | Landing page |
| **Setup** | http://localhost:3000/setup | Network setup guide (use this first!) |
| **Dashboard** | http://localhost:3000/dashboard | Overview & balance |
| **Faucet** | http://localhost:3000/faucet | Get test ANDE tokens |
| **Staking** | http://localhost:3000/staking | Stake ANDE for rewards |
| **Governance** | http://localhost:3000/governance | Create & vote on proposals |
| **Network** | http://localhost:3000/network | Network statistics |
| **Transactions** | http://localhost:3000/transactions | Transaction history |
| **Developer** | http://localhost:3000/developer | Developer tools |

---

## 🔐 Security Notes

### ⚠️ This is a TESTNET
- All tokens are for testing only (no real value)
- Private keys are for testing only
- Do NOT send real ETH or tokens to these addresses

### ✅ Safe Practices
- Never share your seed phrase
- Verify network before transactions
- Check contract addresses match documentation
- Use separate MetaMask account for testing

---

## 🎓 Next Steps

Once connected, try these features:

### 1. Staking
```
http://localhost:3000/staking
```
- Stake ANDE tokens
- Earn rewards
- Vote in governance

### 2. Governance
```
http://localhost:3000/governance
```
- Create proposals
- Vote on changes
- Queue & execute proposals

### 3. Network Info
```
http://localhost:3000/network
```
- View current block
- See network stats
- Monitor performance

---

## 📚 Additional Resources

### Documentation
- Architecture: `docs/NETWORK_CONFIGURATION.md`
- Fix Summary: `docs/NETWORK_FIX_SUMMARY.md`
- Contract Addresses: `andechain/deployments/testnet-2019.json`

### Commands
```bash
# Start blockchain
cd andechain && make full-start

# Start frontend
cd andefrontend && npm run dev

# Check status
cd andechain && make health

# View logs
cd andechain && docker compose logs -f
```

### Support
- Check browser console (F12) for errors
- Review `NETWORK_FIX_SUMMARY.md` for detailed troubleshooting
- Ensure blockchain is producing blocks before connecting

---

## ✅ Success Checklist

- [ ] MetaMask installed
- [ ] AndeChain node running (`make full-start`)
- [ ] Network added to MetaMask (chainId **2019**)
- [ ] Wallet connected to dApp
- [ ] Balance visible in dashboard
- [ ] No "Wrong Network" errors
- [ ] Faucet working (received test tokens)
- [ ] No console errors

**All checked?** You're ready to explore AndeChain! 🎉

---

## 🆘 Quick Commands Reference

### Check if Node is Running
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Check Current Chain ID
```javascript
// In browser console (F12)
window.ethereum.request({ method: 'eth_chainId' })
  .then(id => console.log('ChainId:', parseInt(id, 16)))
```

### Add Network via Console
```javascript
// In browser console (F12)
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{ chainId: '0x7E3', chainName: 'AndeChain Mocha', nativeCurrency: { name: 'ANDE', symbol: 'ANDE', decimals: 18 }, rpcUrls: ['http://localhost:8545'], blockExplorerUrls: ['http://localhost:4000'] }]
})
```

### Clear Cache
```javascript
// In browser console (F12)
localStorage.clear()
location.reload()
```

---

**Happy Building on AndeChain! 🚀**