# 🌐 Deploying to Linera Testnet Conway

This guide explains how to deploy Jeteeah to Linera's Testnet Conway and connect your frontend to the live blockchain.

> ⚠️ **Important Note**: As of December 2025, the public Linera Testnet Conway may not be available. If you encounter DNS resolution errors for `testnet.linera.io` or `faucet.testnet.linera.io`, this is expected. Please use the local development setup instead, or check [Linera Discord](https://discord.gg/linera) for updates on testnet availability.

## Prerequisites

### Required Software

1. **Linera CLI** - Install the Linera command-line tool:

   ```bash
   curl https://install.linera.dev | bash
   ```

2. **Rust & Cargo** - Required for compiling the smart contract:

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

3. **Docker** (Optional) - Only needed for local development:

   ```bash
   # Ubuntu/Debian
   sudo apt-get install docker.io docker-compose

   # macOS
   brew install docker docker-compose
   ```

### Verify Installation

```bash
linera --version
cargo --version
rustc --version
```

## Deployment Options

### Option 1: Local Development Network (Currently Recommended)

Since the public testnet may not be available, use the local Linera node:

```bash
# Start local Linera node
npm run setup:local

# Build and deploy contract locally
npm run build:backend
npm run deploy:local

# Start frontend
npm run dev
```

Update `.env.local` with the Chain ID and App ID from the deployment output, keeping the local endpoint:

```bash
NEXT_PUBLIC_LINERA_ENDPOINT=http://localhost:8080
NEXT_PUBLIC_CHAIN_ID=<your_local_chain_id>
NEXT_PUBLIC_APP_ID=<your_local_app_id>
NEXT_PUBLIC_WALLET_MOCK=true
NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true
```

### Option 2: Testnet Deployment (When Available)

When the public testnet becomes available, use the automated script:

```bash
npm run deploy:testnet
```

This script will:

1. ✅ Build your smart contract
2. ✅ Initialize your Linera wallet (if needed)
3. ✅ Request testnet tokens from faucet
4. ✅ Deploy contract to Testnet Conway
5. ✅ Extract Chain ID and Application ID
6. ✅ Provide `.env.local` configuration

**Follow the on-screen instructions to complete setup.**

### Checking Testnet Availability

Before attempting testnet deployment, verify the testnet is accessible:

```bash
# Check if testnet RPC is accessible
curl -I https://testnet.linera.io

# Check if faucet is accessible
curl -I https://faucet.testnet.linera.io
```

If you get "Could not resolve host" errors, the testnet is not currently available. Use local development instead.

For testnet status updates:

- Check [Linera Discord](https://discord.gg/linera) #announcements
- Check [Linera Documentation](https://linera.dev)

### Option 3: Manual Testnet Deployment

If the testnet is available and you prefer manual control:

#### Step 1: Initialize Wallet

```bash
# Initialize wallet
linera wallet init --faucet https://faucet.testnet.linera.io

# Request a chain from testnet faucet
linera wallet request-chain --faucet https://faucet.testnet.linera.io --set-default
```

This creates a new wallet and requests a chain on Testnet Conway with initial tokens.

#### Step 2: Build the Smart Contract

```bash
cd backend
cargo build --release --target wasm32-unknown-unknown
cd ..
```

#### Step 3: Deploy to Testnet

```bash
linera project publish-and-create
```

**Save the output!** You'll see something like:

```
Created application:
  Chain ID: e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65
  Application ID: 509ecb8d1745da6ab7a559548f05fde413f3f5c4010cfc948709f58cc0dedbbe
```

#### Step 4: Configure Environment

Create `.env.local` with your deployment details:

```bash
cat > .env.local << EOF
NEXT_PUBLIC_LINERA_ENDPOINT=https://testnet.linera.io
NEXT_PUBLIC_CHAIN_ID=e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65
NEXT_PUBLIC_APP_ID=509ecb8d1745da6ab7a559548f05fde413f3f5c4010cfc948709f58cc0dedbbe
NEXT_PUBLIC_WALLET_MOCK=false
NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true
EOF
```

**Replace the Chain ID and App ID with your actual values from step 3.**

#### Step 5: Restart Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` - your app now connects to Testnet Conway! 🎉

## Verifying Testnet Connection

### Check Configuration

Run this to verify your environment variables are loaded:

```bash
# In your browser console (F12)
console.log('Endpoint:', process.env.NEXT_PUBLIC_LINERA_ENDPOINT);
console.log('Chain ID:', process.env.NEXT_PUBLIC_CHAIN_ID);
console.log('App ID:', process.env.NEXT_PUBLIC_APP_ID);
console.log('Mock Mode:', process.env.NEXT_PUBLIC_WALLET_MOCK);
```

Expected output:

```
Endpoint: https://testnet.linera.io
Chain ID: e476187f... (64 characters)
App ID: 509ecb8d... (64 characters)
Mock Mode: false
```

### Test Blockchain Queries

```bash
# Query your application state
curl "https://testnet.linera.io/chains/YOUR_CHAIN_ID/applications/YOUR_APP_ID"

# Or use the Linera CLI
linera query-application YOUR_APP_ID
```

### Check Wallet Connection

1. Install the [Linera Wallet Browser Extension](https://chrome.google.com/webstore) (if available)
2. Open Jeteeah in your browser
3. Click "Connect Wallet"
4. Approve the connection in the wallet extension
5. Check that the wallet address displays in the UI

### Monitor Transactions

```bash
# View your wallet chains
linera wallet show

# Check specific chain
linera query-chain YOUR_CHAIN_ID
```

## Configuration Details

### Environment Variables Explained

| Variable                        | Local Development       | Testnet Conway              | Required |
| ------------------------------- | ----------------------- | --------------------------- | -------- |
| `NEXT_PUBLIC_LINERA_ENDPOINT`   | `http://localhost:8080` | `https://testnet.linera.io` | ✅ Yes   |
| `NEXT_PUBLIC_CHAIN_ID`          | (from local deploy)     | (from testnet deploy)       | ✅ Yes   |
| `NEXT_PUBLIC_APP_ID`            | (from local deploy)     | (from testnet deploy)       | ✅ Yes   |
| `NEXT_PUBLIC_WALLET_MOCK`       | `true`                  | `false`                     | ✅ Yes   |
| `NEXT_PUBLIC_ENABLE_BLOCKCHAIN` | `true`                  | `true`                      | ✅ Yes   |

### Network Configuration (linera.toml)

```toml
[network.testnet]
rpc_url = "https://testnet.linera.io"
faucet_url = "https://faucet.testnet.linera.io"
```

This configuration is already set in your `linera.toml` file.

## Troubleshooting

### Error: "Linera CLI not found"

**Solution:**

```bash
curl https://install.linera.dev | bash
source ~/.bashrc  # or ~/.zshrc
linera --version
```

### Error: "No wallet found"

**Solution:**

```bash
linera wallet init --with-new-chain --faucet https://faucet.testnet.linera.io
```

### Error: "Insufficient funds"

**Solution:**

```bash
# Request a new chain with tokens from faucet
linera wallet request-chain --faucet https://faucet.testnet.linera.io

# Check your balance
linera wallet show
```

### Error: "Failed to connect to endpoint"

**Check 1:** Verify testnet is accessible:

```bash
curl https://testnet.linera.io
```

**Check 2:** Verify your `.env.local` settings:

```bash
cat .env.local
```

**Check 3:** Restart development server:

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Error: "Application not found"

This means the Chain ID or App ID is incorrect.

**Solution:**

1. Check deployment output for correct IDs
2. Verify `.env.local` has correct values
3. Ensure no typos (IDs are 64 hexadecimal characters)

### Error: "Wallet connection failed"

**For Mock Mode (Development):**

- Set `NEXT_PUBLIC_WALLET_MOCK=true` in `.env.local`
- Restart server

**For Real Wallet (Testnet):**

- Install Linera wallet browser extension
- Create/import wallet in extension
- Ensure wallet is connected to Testnet Conway
- Refresh the page and try connecting again

### Contract Build Fails

**Error: "wasm32-unknown-unknown not installed"**

**Solution:**

```bash
rustup target add wasm32-unknown-unknown
```

**Error: "cargo: command not found"**

**Solution:**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### GraphQL Query Errors

**Error: "Query failed" or "Network error"**

**Check 1:** Verify endpoint is correct:

```bash
echo $NEXT_PUBLIC_LINERA_ENDPOINT
```

**Check 2:** Test GraphQL endpoint directly:

```bash
curl -X POST https://testnet.linera.io/chains/YOUR_CHAIN_ID/applications/YOUR_APP_ID \
  -H "Content-Type: application/json" \
  -d '{"query": "{ gameState { score } }"}'
```

**Check 3:** Check browser console for detailed errors (F12 → Console)

### Mock Mode Still Active

If you've set `NEXT_PUBLIC_WALLET_MOCK=false` but mock mode is still active:

1. **Clear browser cache:**

   - Press `Ctrl+Shift+R` (force refresh)
   - Or clear localStorage: F12 → Application → Local Storage → Clear

2. **Verify environment variable:**

   ```bash
   grep WALLET_MOCK .env.local
   # Should show: NEXT_PUBLIC_WALLET_MOCK=false
   ```

3. **Restart dev server:**

   ```bash
   npm run dev
   ```

4. **Check in browser console:**
   ```javascript
   console.log("Mock:", process.env.NEXT_PUBLIC_WALLET_MOCK);
   // Should show: false
   ```

## Production Deployment

### Deploy Frontend to Vercel

1. **Push your code to GitHub:**

   ```bash
   git add .
   git commit -m "Configure for Testnet Conway"
   git push
   ```

2. **Connect to Vercel:**

   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables from `.env.local`

3. **Configure Environment Variables in Vercel:**

   - Navigate to: Project Settings → Environment Variables
   - Add each variable:
     - `NEXT_PUBLIC_LINERA_ENDPOINT` = `https://testnet.linera.io`
     - `NEXT_PUBLIC_CHAIN_ID` = (your chain ID)
     - `NEXT_PUBLIC_APP_ID` = (your app ID)
     - `NEXT_PUBLIC_WALLET_MOCK` = `false`
     - `NEXT_PUBLIC_ENABLE_BLOCKCHAIN` = `true`

4. **Deploy:**
   - Vercel will automatically build and deploy
   - Your app will be live at `https://your-app.vercel.app`

### Other Hosting Platforms

**Netlify:**

```bash
netlify deploy --prod
# Add environment variables in Netlify dashboard
```

**AWS Amplify, Cloudflare Pages, etc.:**

- Follow platform-specific deployment guides
- Always add the environment variables from `.env.local`

## Testing Checklist

Before considering your deployment complete:

- [ ] Contract deploys successfully to testnet
- [ ] Chain ID and App ID extracted correctly
- [ ] `.env.local` configured with testnet values
- [ ] Mock mode disabled (`NEXT_PUBLIC_WALLET_MOCK=false`)
- [ ] Frontend connects to `https://testnet.linera.io`
- [ ] Wallet extension installed (for non-mock mode)
- [ ] Wallet connection works in UI
- [ ] Game start operation submits to blockchain
- [ ] Game end operation submits to blockchain
- [ ] Points are recorded on-chain
- [ ] Leaderboard queries return data
- [ ] GraphQL queries work correctly
- [ ] No console errors related to blockchain
- [ ] Transactions appear in Linera wallet

## Useful Commands

```bash
# Show wallet information
linera wallet show

# Check chain state
linera query-chain YOUR_CHAIN_ID

# Query application
linera query-application YOUR_APP_ID

# Request testnet chain with tokens
linera wallet request-chain --faucet https://faucet.testnet.linera.io

# View recent blocks
linera query-chain YOUR_CHAIN_ID --blocks 10

# Check application state
curl https://testnet.linera.io/chains/CHAIN_ID/applications/APP_ID
```

## Resources

- **Linera Documentation**: [https://linera.dev](https://linera.dev)
- **Testnet Conway Explorer**: [https://explorer.testnet.linera.io](https://explorer.testnet.linera.io)
- **Linera Discord**: [https://discord.gg/linera](https://discord.gg/linera)
- **Faucet**: [https://faucet.testnet.linera.io](https://faucet.testnet.linera.io)

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide first
2. Review [SETUP.md](./SETUP.md) for general setup issues
3. Check Linera documentation at [linera.dev](https://linera.dev)
4. Ask in the [Linera Discord](https://discord.gg/linera)
5. Open an issue on GitHub

---

**Ready to deploy? Run:**

```bash
npm run deploy:testnet
```

🚀 **Good luck with your deployment to Testnet Conway!**
