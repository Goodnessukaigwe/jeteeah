# 🚀 Quick Testnet Deployment Checklist

Follow these steps to deploy Jeteeah to Linera Testnet Conway.

## Prerequisites Check

- [ ] Linera CLI installed: `linera --version`
- [ ] Rust toolchain installed: `cargo --version`
- [ ] WASM target installed: `rustup target list | grep wasm32`

If any are missing:

```bash
# Install Linera CLI
curl https://install.linera.dev | bash

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown
```

## Deployment Steps

### Step 1: Deploy to Testnet

```bash
npm run deploy:testnet
```

This script will:

1. Build your smart contract
2. Initialize your wallet (if needed)
3. Request testnet tokens
4. Deploy to Testnet Conway
5. Display your Chain ID and Application ID

### Step 2: Save Your Configuration

The script will output something like:

```
Chain ID:       e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65
Application ID: 509ecb8d1745da6ab7a559548f05fde413f3f5c4010cfc948709f58cc0dedbbe
```

**IMPORTANT: Save these values!**

### Step 3: Create .env.local

Create `.env.local` file with your deployment details:

```bash
cat > .env.local << EOF
NEXT_PUBLIC_LINERA_ENDPOINT=https://testnet.linera.io
NEXT_PUBLIC_CHAIN_ID=YOUR_CHAIN_ID_HERE
NEXT_PUBLIC_APP_ID=YOUR_APP_ID_HERE
NEXT_PUBLIC_WALLET_MOCK=false
NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true
EOF
```

Replace `YOUR_CHAIN_ID_HERE` and `YOUR_APP_ID_HERE` with actual values from Step 2.

### Step 4: Restart Development Server

```bash
npm run dev
```

Visit http://localhost:3000 - you're now connected to Testnet Conway! 🎉

## Verification

### 1. Check Configuration in Browser Console

Press F12, then in Console tab:

```javascript
console.log("Endpoint:", process.env.NEXT_PUBLIC_LINERA_ENDPOINT);
console.log("Chain ID:", process.env.NEXT_PUBLIC_CHAIN_ID);
console.log("App ID:", process.env.NEXT_PUBLIC_APP_ID);
console.log("Mock Mode:", process.env.NEXT_PUBLIC_WALLET_MOCK);
```

Expected:

- Endpoint: `https://testnet.linera.io`
- Chain ID: 64-character hex string
- App ID: 64-character hex string
- Mock Mode: `false`

### 2. Check Network Badge

Look for the green "🌐 TESTNET Conway" badge in the top-right corner.

### 3. Test Wallet Connection

1. Click "Connect Wallet"
2. Should prompt for Linera wallet extension
3. If no extension, you'll see a warning

### 4. Test Gameplay

1. Start a game
2. Check browser console for blockchain operations
3. After game ends, verify transaction on blockchain

## Common Issues

### "Linera CLI not found"

```bash
curl https://install.linera.dev | bash
source ~/.bashrc
```

### "No wallet found"

```bash
linera wallet init --faucet https://faucet.testnet.linera.io
linera wallet request-chain --faucet https://faucet.testnet.linera.io --set-default
```

### "Insufficient funds"

```bash
linera wallet request-chain --faucet https://faucet.testnet.linera.io
```

### "Wallet extension not found"

- Install Linera wallet browser extension
- Or temporarily enable mock mode: `NEXT_PUBLIC_WALLET_MOCK=true`

### "Environment variables not loading"

1. Ensure `.env.local` exists in project root
2. Restart dev server: Stop with Ctrl+C, then `npm run dev`
3. Clear browser cache: Ctrl+Shift+R

### "Chain ID or App ID not working"

1. Verify IDs are 64 hexadecimal characters (0-9, a-f)
2. No spaces or quotes in `.env.local`
3. Check deployment output for correct values

## Production Deployment

### Deploy Frontend to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Configure for Testnet Conway"
git push

# Deploy on Vercel
# 1. Go to vercel.com
# 2. Import your repository
# 3. Add environment variables from .env.local
# 4. Deploy
```

Environment variables to add in Vercel:

- `NEXT_PUBLIC_LINERA_ENDPOINT` = `https://testnet.linera.io`
- `NEXT_PUBLIC_CHAIN_ID` = (your chain ID)
- `NEXT_PUBLIC_APP_ID` = (your app ID)
- `NEXT_PUBLIC_WALLET_MOCK` = `false`
- `NEXT_PUBLIC_ENABLE_BLOCKCHAIN` = `true`

## Useful Commands

```bash
# View wallet info
linera wallet show

# Check your chain
linera query-chain YOUR_CHAIN_ID

# Request more tokens (creates new chain)
linera wallet request-chain --faucet https://faucet.testnet.linera.io

# Query application state
curl https://testnet.linera.io/chains/CHAIN_ID/applications/APP_ID
```

## Support

- 📖 Full guide: [TESTNET_DEPLOYMENT.md](./docs/TESTNET_DEPLOYMENT.md)
- 💬 Linera Discord: https://discord.gg/linera
- 📚 Linera Docs: https://linera.dev

---

**Ready to deploy?**

```bash
npm run deploy:testnet
```
