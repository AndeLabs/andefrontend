# Vercel Configuration for AndeChain Frontend

## Required Environment Variables

Configure these environment variables in your Vercel project settings at:
https://vercel.com/dashboard/[YOUR-PROJECT]/settings/environment-variables

### Blockchain Configuration

```
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_CHAIN_ID=6174
NEXT_PUBLIC_RPC_HTTP=http://189.28.81.202:8545
NEXT_PUBLIC_RPC_WS=ws://189.28.81.202:8546
NEXT_PUBLIC_NETWORK_NAME=AndeChain Testnet
```

### Public Services

```
NEXT_PUBLIC_FAUCET_URL=http://189.28.81.202:3001
NEXT_PUBLIC_EXPLORER_URL=http://189.28.81.202:4000
NEXT_PUBLIC_GRAFANA_URL=http://189.28.81.202:3000
NEXT_PUBLIC_PROMETHEUS_URL=http://189.28.81.202:9090
```

### External Links

```
NEXT_PUBLIC_CELESTIA_EXPLORER=https://mocha-4.celenium.io
NEXT_PUBLIC_DOCS_URL=https://docs.ande.network
NEXT_PUBLIC_SUPPORT_URL=https://discord.gg/andelabs
```

### Smart Contracts

```
NEXT_PUBLIC_ANDE_TOKEN_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### Feature Flags

```
NEXT_PUBLIC_ENABLE_STAKING=false
NEXT_PUBLIC_ENABLE_GOVERNANCE=false
NEXT_PUBLIC_ENABLE_DEX=false
NEXT_PUBLIC_ENABLE_BRIDGE=false
NEXT_PUBLIC_DEBUG=false
```

## How to Set Variables in Vercel

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable with its value
4. **Important**: Set them for the **Production** environment
5. Click "Save"
6. Redeploy your project: Click "Deployments" → Right-click on latest deploy → "Redeploy"

## Verification

After deploying, verify the configuration by:

1. Opening your site in the browser
2. Opening the Integration page
3. Checking browser console for any errors
4. Clicking "Add to MetaMask"
5. MetaMask should show:
   - Chain ID: 6174
   - Network Name: AndeChain Testnet
   - RPC URL: http://189.28.81.202:8545
   - Block Explorer: http://189.28.81.202:4000

## Troubleshooting

### Issue: MetaMask shows Chain ID 2019 or localhost:8545

**Cause**: Environment variables not set in Vercel

**Solution**: 
1. Check that `NEXT_PUBLIC_RPC_HTTP` is set to `http://189.28.81.202:8545`
2. Check that `NEXT_PUBLIC_ENV` is set to `production`
3. Redeploy after setting variables

### Issue: RPC connection timeout

**Cause**: AndeChain node not responding or wrong endpoint

**Solution**:
1. Verify AndeChain is running on 189.28.81.202:8545
2. Test locally: `curl http://189.28.81.202:8545`
3. Check firewall/network access

### Issue: MetaMask error "Expected an array with at least one valid string HTTPS url"

**Cause**: RPC URL is incorrect or not a valid HTTP(S) URL

**Solution**:
1. Verify `NEXT_PUBLIC_RPC_HTTP` starts with `http://` or `https://`
2. Ensure it's not a relative path like `/api/rpc`
3. Test the URL directly in browser: `http://189.28.81.202:8545`

## Environment Detection

The application auto-detects production environment based on:
1. Explicit `NEXT_PUBLIC_ENV=production`
2. `NODE_ENV=production` (set by Vercel)
3. `VERCEL=true` or `VERCEL_ENV=production` (set by Vercel)

This ensures correct RPC endpoints are used automatically.
