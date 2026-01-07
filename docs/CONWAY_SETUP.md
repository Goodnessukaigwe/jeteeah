# 🌐 Conway Testnet Setup Guide

This guide shows you how to properly connect Jeteeah to the Conway Testnet.

## Prerequisites

- Git
- Rust toolchain (`rustup`)
- Basic command line knowledge

## Step 1: Install Conway-Compatible Linera CLI

The regular Linera CLI doesn't connect to Conway. You need the Conway branch:

```bash
# Clone the Linera protocol repository
git clone https://github.com/linera-io/linera-protocol.git
cd linera-protocol

# Checkout the Conway testnet branch
git checkout -t origin/testnet_conway

# Install with RocksDB support (required for Conway)
cargo install --path linera-service --features rocksdb

# Verify installation
linera --version
```

This may take 10-15 minutes to compile.

## Step 2: Initialize Wallet for Conway

```bash
# Initialize wallet connected to Conway
linera wallet init --faucet https://faucet.testnet-conway.linera.net

# Request your first microchain on Conway
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net --set-default

# Verify your wallet
linera wallet show
```

You should see output showing your chain ID on Conway testnet.

## Step 3: Build Jeteeah Smart Contract

```bash
cd /path/to/jeteeah

# Build the contract
npm run build:backend
```

This creates WASM files in `backend/target/wasm32-unknown-unknown/release/`

## Step 4: Deploy to Conway Testnet

```bash
# Deploy using the publish-and-create command
linera publish-and-create \
  backend/target/wasm32-unknown-unknown/release/jeteeah_contract.wasm \
  backend/target/wasm32-unknown-unknown/release/jeteeah_service.wasm
```

**SAVE THE OUTPUT!** You'll get:
- Chain ID
- Application ID

Example output:
```
Published bytecode with ID: 12345...
Created application with ID: e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65
```

## Step 5: Configure Frontend

Update `.env.local` with your Conway deployment:

```bash
# Local service endpoint (gateway to Conway)
NEXT_PUBLIC_LINERA_ENDPOINT=http://localhost:8080

# Your chain ID from deployment
NEXT_PUBLIC_CHAIN_ID=<your_chain_id>

# Your application ID from deployment
NEXT_PUBLIC_APP_ID=<your_application_id>

# Real blockchain mode
NEXT_PUBLIC_WALLET_MOCK=false
NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true
```

## Step 6: Start Linera Service

The service acts as a gateway between your browser and Conway validators:

```bash
# Start the service (in a separate terminal)
npm run conway:service

# Or manually:
linera service --port 8080
```

Leave this running! It's the bridge to Conway.

## Step 7: Start Frontend

```bash
# In another terminal
npm run dev
```

Open http://localhost:3000

## Verification Steps

### 1. Check Service is Running

```bash
curl http://localhost:8080
# Should return Linera service info
```

### 2. Check Wallet Connection in UI

- Open your app at http://localhost:3000
- Look for "🌐 TESTNET Conway" badge
- Try connecting wallet

### 3. Query Your Application

```bash
# Query your application state
linera query-application <your_app_id>
```

### 4. Check GraphQL Endpoint

Your frontend connects to:
```
http://localhost:8080/chains/<chain_id>/applications/<app_id>
```

## Troubleshooting

### "linera: command not found"

Make sure you ran `cargo install --path linera-service --features rocksdb` from the linera-protocol directory.

Check: `which linera` should show the binary path.

### "Faucet connection failed"

The Conway faucet URL is:
```
https://faucet.testnet-conway.linera.net
```

(Note: `.net` not `.io`)

### "Service won't start"

Make sure your wallet is initialized:
```bash
linera wallet show
```

If empty, run step 2 again.

### "Application not found"

Double-check your Application ID in `.env.local` matches the one from deployment.

### "Frontend shows errors"

1. Ensure `linera service` is running
2. Check console for specific errors
3. Verify `.env.local` has correct values
4. Restart dev server: `npm run dev`

## Player Wallet Integration

For players to use their own wallets:

### Option 1: Linera Chrome Extension (Recommended)

Players install the [Linera Wallet Extension](https://chrome.google.com/webstore) (when available) and connect to your app.

Your frontend will automatically detect the extension.

### Option 2: Faucet for New Players

In your frontend, add a "Get Started" button that:
1. Calls the Conway faucet API
2. Creates a new chain for the player
3. Returns the chain ID to use in-game

## Architecture Overview

```
Browser (Player)
      ↓
Frontend (localhost:3000)
      ↓
Linera Service (localhost:8080)
      ↓
Conway Validators Network
      ↓
Your Application on Conway
```

The `linera service` is essential - it's your gateway to Conway!

## Quick Reference

```bash
# Start Conway service
npm run conway:service

# Deploy to Conway
npm run deploy:conway

# Check wallet
linera wallet show

# Query application
linera query-application <app_id>

# View service logs
# (check terminal where service is running)
```

## Next Steps

Once deployed and connected:

1. Test all game features on Conway
2. Share your app URL with testers
3. Monitor for any blockchain errors
4. Implement proper sync mechanism (see docs)

## Resources

- [Linera Documentation](https://linera.dev)
- [Conway Testnet Info](https://linera.io/testnet)
- [Linera Discord](https://discord.gg/linera)

---

**Need Help?**

- Check [BLOCKCHAIN_STATUS.md](./BLOCKCHAIN_STATUS.md) for current status
- Join [Linera Discord](https://discord.gg/linera) for support
- Open an issue on GitHub

**Ready to deploy?** Follow steps 1-7 above!
