# 🚀 AndeChain Frontend - Deployment Guide

## 📋 Overview

This guide covers deploying the AndeChain frontend to production, exposing it to the world alongside your running AndeChain node.

---

## 🌍 Deployment Options

### Option 1: Deploy with Your AndeChain Node (Recommended)

Deploy the frontend on the same server as your AndeChain sequencer for best performance and simplicity.

**Requirements:**
- Same server running AndeChain (IP: 189.28.81.202)
- Node.js 18+ installed
- Nginx configured (see below)
- Domain name (optional but recommended)

### Option 2: Deploy to Vercel/Netlify

Deploy the frontend to a CDN for global distribution while connecting to your AndeChain RPC.

**Requirements:**
- Vercel or Netlify account
- AndeChain RPC exposed publicly
- Domain configured

---

## 🔧 Environment Configuration

### Step 1: Create Production Environment File

Create `.env.production` in the frontend root:

```bash
# AndeChain Frontend - Production Environment
# Copy this to .env.production

# ==========================================
# DEPLOYMENT ENVIRONMENT
# ==========================================
NEXT_PUBLIC_ENV=production

# ==========================================
# BLOCKCHAIN CONFIGURATION
# ==========================================

# Chain ID (6174 for AndeChain Testnet)
NEXT_PUBLIC_CHAIN_ID=6174

# Public RPC URLs
# Option 1: Direct IP access
NEXT_PUBLIC_RPC_HTTP=http://189.28.81.202:8545
NEXT_PUBLIC_RPC_WS=ws://189.28.81.202:8546

# Option 2: Domain-based (recommended after DNS setup)
# NEXT_PUBLIC_RPC_HTTP=https://rpc.andelabs.io
# NEXT_PUBLIC_RPC_WS=wss://rpc.andelabs.io

# Network Name
NEXT_PUBLIC_NETWORK_NAME=AndeChain Testnet

# ==========================================
# PUBLIC SERVICES
# ==========================================

# Faucet Service
NEXT_PUBLIC_FAUCET_URL=http://189.28.81.202:3001
# Or with domain: https://faucet.andelabs.io

# Block Explorer
NEXT_PUBLIC_EXPLORER_URL=http://189.28.81.202:4000
# Or with domain: https://explorer.andelabs.io

# Monitoring URLs
NEXT_PUBLIC_GRAFANA_URL=http://189.28.81.202:3000
NEXT_PUBLIC_PROMETHEUS_URL=http://189.28.81.202:9090

# Celestia DA Explorer
NEXT_PUBLIC_CELESTIA_EXPLORER=https://mocha-4.celenium.io

# Documentation & Support
NEXT_PUBLIC_DOCS_URL=https://docs.andelabs.io
NEXT_PUBLIC_SUPPORT_URL=https://discord.gg/andelabs

# ==========================================
# DEPLOYED CONTRACTS
# ==========================================

# ANDE Token Address
NEXT_PUBLIC_ANDE_TOKEN_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Add other contract addresses as you deploy them
# NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x...
# NEXT_PUBLIC_STAKING_ADDRESS=0x...
```

---

## 📦 Building for Production

### Step 1: Install Dependencies

```bash
cd /path/to/andefrontend
npm install
```

### Step 2: Build the Application

```bash
# Build with production environment
npm run build

# Output will be in .next/ folder
```

### Step 3: Test Production Build Locally

```bash
# Start production server
npm start

# Visit http://localhost:3000
# Test all features before deploying
```

---

## 🌐 Deployment Methods

## Method 1: Self-Hosted with PM2 (Same Server as AndeChain)

### Install PM2

```bash
sudo npm install -g pm2
```

### Create PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'andechain-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/andefrontend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 9002,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
    },
  ],
};
```

### Start with PM2

```bash
# Start the app
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 to start on system boot
pm2 startup

# Monitor the app
pm2 monit

# View logs
pm2 logs andechain-frontend
```

### Configure Nginx Reverse Proxy

Add to your Nginx configuration (`/etc/nginx/sites-available/ande-production`):

```nginx
# Frontend - AndeChain Dashboard
server {
    listen 80;
    listen [::]:80;
    server_name andelabs.io www.andelabs.io;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$host$request_uri;

    location / {
        proxy_pass http://localhost:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:9002;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}

# HTTPS version (after Let's Encrypt setup)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name andelabs.io www.andelabs.io;

    ssl_certificate /etc/letsencrypt/live/andelabs.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/andelabs.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static {
        proxy_pass http://localhost:9002;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Method 2: Deploy to Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Configure Vercel

Create `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_ENV": "production",
    "NEXT_PUBLIC_CHAIN_ID": "6174",
    "NEXT_PUBLIC_RPC_HTTP": "http://189.28.81.202:8545",
    "NEXT_PUBLIC_RPC_WS": "ws://189.28.81.202:8546",
    "NEXT_PUBLIC_NETWORK_NAME": "AndeChain Testnet"
  }
}
```

### Step 3: Deploy

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts to configure
```

### Step 4: Configure Custom Domain (Optional)

```bash
vercel domains add andelabs.io
```

---

## Method 3: Deploy to Netlify

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Configure Netlify

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NEXT_PUBLIC_ENV = "production"
  NEXT_PUBLIC_CHAIN_ID = "6174"
  NEXT_PUBLIC_RPC_HTTP = "http://189.28.81.202:8545"
  NEXT_PUBLIC_RPC_WS = "ws://189.28.81.202:8546"
  NEXT_PUBLIC_NETWORK_NAME = "AndeChain Testnet"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 3: Deploy

```bash
# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

---

## 🔐 SSL/TLS Setup (Let's Encrypt)

### Install Certbot

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

### Generate SSL Certificate

```bash
sudo certbot --nginx -d andelabs.io -d www.andelabs.io
```

### Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up renewal cron job
# Verify with:
sudo systemctl status certbot.timer
```

---

## 🌐 DNS Configuration

### Configure DNS Records

Add these records to your domain registrar (e.g., Cloudflare, Namecheap):

```
Type    Name              Value               TTL
----    ----              -----               ---
A       @                 189.28.81.202       Auto
A       www               189.28.81.202       Auto
A       rpc               189.28.81.202       Auto
A       explorer          189.28.81.202       Auto
A       faucet            189.28.81.202       Auto
A       grafana           189.28.81.202       Auto
```

### Verify DNS Propagation

```bash
dig andelabs.io
dig rpc.andelabs.io
nslookup andelabs.io
```

---

## 🔍 Post-Deployment Checklist

- [ ] Frontend accessible at your domain/IP
- [ ] MetaMask can add AndeChain network
- [ ] RPC connection working
- [ ] Faucet accessible and functional
- [ ] Block explorer accessible
- [ ] Network status page showing live data
- [ ] Integration guide page loads
- [ ] Developer tools functional
- [ ] SSL/HTTPS working (if configured)
- [ ] All links working (docs, support, etc.)

---

## 🧪 Testing Your Deployment

### Test 1: Basic Accessibility

```bash
curl http://your-domain.com
# Should return HTML
```

### Test 2: RPC Connectivity

```bash
curl -X POST http://your-domain.com/api/health
# Or test RPC directly
curl -X POST http://189.28.81.202:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Test 3: MetaMask Integration

1. Visit your frontend
2. Click "Add to MetaMask" button
3. Verify network adds successfully
4. Request funds from faucet
5. Check balance in MetaMask

---

## 🐛 Troubleshooting

### Issue: Frontend Not Loading

```bash
# Check if app is running
pm2 status

# Check logs
pm2 logs andechain-frontend

# Restart app
pm2 restart andechain-frontend
```

### Issue: RPC Connection Failed

```bash
# Test RPC directly
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check firewall
sudo ufw status

# Allow RPC port if needed
sudo ufw allow 8545/tcp
```

### Issue: Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Issue: Environment Variables Not Working

```bash
# Verify .env.production exists
cat .env.production

# Rebuild after changing env vars
npm run build
pm2 restart andechain-frontend
```

---

## 📊 Monitoring & Maintenance

### Monitor with PM2

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs andechain-frontend --lines 100

# Check memory usage
pm2 show andechain-frontend
```

### Log Rotation

PM2 handles log rotation automatically, but you can configure it:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Update Deployment

```bash
cd /path/to/andefrontend

# Pull latest changes
git pull

# Install dependencies
npm install

# Build
npm run build

# Restart
pm2 restart andechain-frontend

# Or reload without downtime
pm2 reload andechain-frontend
```

---

## 🎯 Production Best Practices

1. **Use Environment Variables**: Never hardcode URLs or secrets
2. **Enable HTTPS**: Always use SSL/TLS in production
3. **Set Up Monitoring**: Use PM2, Grafana, or external services
4. **Configure Backups**: Backup your .env files and configurations
5. **Use CDN**: Consider Cloudflare for DDoS protection
6. **Optimize Images**: Use Next.js Image optimization
7. **Enable Caching**: Configure proper cache headers
8. **Monitor Logs**: Regularly check application logs
9. **Test Updates**: Always test in staging before production
10. **Document Changes**: Keep a changelog of deployments

---

## 🔗 Useful Links

- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Configuration**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/getting-started/
- **Vercel Deployment**: https://vercel.com/docs
- **Netlify Deployment**: https://docs.netlify.com/

---

## 📝 Support

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review application logs: `pm2 logs andechain-frontend`
3. Check AndeChain node status
4. Join our Discord: https://discord.gg/andelabs
5. Open an issue on GitHub

---

**Last Updated**: 2025-11-01  
**Version**: 1.0.0  
**Status**: Production Ready ✅
