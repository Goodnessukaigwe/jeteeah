#!/bin/bash
set -e

echo "🌐 Starting Conway Testnet Setup for Jeteeah"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Project directory
PROJECT_DIR="/home/vahalla/Desktop/jeteeah"
cd "$PROJECT_DIR"

# Step 1: Check Prerequisites
echo -e "\n${BLUE}Step 1: Checking Prerequisites${NC}"
if ! command -v git >/dev/null 2>&1; then
    echo -e "${RED}❌ Git not found. Please install git first.${NC}"
    exit 1
fi

if ! command -v cargo >/dev/null 2>&1; then
    echo -e "${RED}❌ Cargo not found. Installing Rust...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

if ! command -v rustup >/dev/null 2>&1; then
    echo -e "${RED}❌ Rustup not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites installed${NC}"

# Step 2: Install Conway CLI
echo -e "\n${BLUE}Step 2: Installing Conway CLI${NC}"
if ! command -v linera &> /dev/null; then
    echo "Installing Linera CLI from Conway testnet branch..."
    cd /tmp
    if [ -d "linera-protocol" ]; then
        echo "Removing existing linera-protocol directory..."
        rm -rf linera-protocol
    fi
    
    echo "Cloning linera-protocol repository..."
    git clone https://github.com/linera-io/linera-protocol.git
    cd linera-protocol
    
    echo "Checking out testnet_conway branch..."
    git checkout testnet_conway
    
    echo "Installing Linera CLI with RocksDB support (this may take 10-15 minutes)..."
    cargo install --path linera-service --features rocksdb
    
    # Ensure linera is in PATH
    export PATH="$HOME/.cargo/bin:$PATH"
    
    echo -e "${GREEN}✅ Linera CLI installed${NC}"
else
    echo -e "${YELLOW}⚠️  Linera CLI already installed${NC}"
    INSTALLED_VERSION=$(linera --version 2>&1 || echo "unknown")
    echo "Installed version: $INSTALLED_VERSION"
    read -p "Do you want to reinstall Conway version? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd /tmp
        if [ -d "linera-protocol" ]; then
            rm -rf linera-protocol
        fi
        git clone https://github.com/linera-io/linera-protocol.git
        cd linera-protocol
        git checkout testnet_conway
        cargo install --path linera-service --features rocksdb --force
    fi
fi

# Verify installation
export PATH="$HOME/.cargo/bin:$PATH"
if ! command -v linera &> /dev/null; then
    echo -e "${RED}❌ Linera CLI installation failed${NC}"
    echo "Please add cargo bin to PATH: export PATH=\"\$HOME/.cargo/bin:\$PATH\""
    exit 1
fi

LINERA_VERSION=$(linera --version)
echo -e "${GREEN}✅ Conway CLI ready: $LINERA_VERSION${NC}"

# Step 3: Initialize Wallet
echo -e "\n${BLUE}Step 3: Initializing Wallet for Conway Testnet${NC}"
cd "$PROJECT_DIR"

# Check if wallet already exists
if [ -f "$HOME/.config/linera/wallet.json" ]; then
    echo -e "${YELLOW}⚠️  Wallet configuration already exists${NC}"
    read -p "Do you want to reinitialize wallet? This will overwrite existing config. (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Backing up existing wallet..."
        cp "$HOME/.config/linera/wallet.json" "$HOME/.config/linera/wallet.json.backup.$(date +%s)"
        echo "Initializing new wallet..."
        linera wallet init --faucet https://faucet.testnet-conway.linera.net --force
    else
        echo "Using existing wallet configuration"
    fi
else
    echo "Initializing wallet with Conway faucet..."
    linera wallet init --faucet https://faucet.testnet-conway.linera.net
fi

echo "Requesting chain from Conway faucet..."
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net --set-default

echo "Fetching wallet information..."
WALLET_INFO=$(linera wallet show)
echo "$WALLET_INFO"

# Extract Chain ID
CHAIN_ID=$(echo "$WALLET_INFO" | grep -oP 'Default chain: \K[a-f0-9]+' | head -n1)
if [ -z "$CHAIN_ID" ]; then
    # Try alternative pattern
    CHAIN_ID=$(echo "$WALLET_INFO" | grep -oP 'Chain.*: \K[a-f0-9]+' | head -n1)
fi

if [ -z "$CHAIN_ID" ]; then
    echo -e "${RED}❌ Failed to extract Chain ID${NC}"
    echo "Please check wallet output above and extract Chain ID manually"
    echo "You can run: linera wallet show"
    exit 1
fi

echo -e "${GREEN}✅ Wallet initialized${NC}"
echo -e "${YELLOW}📋 Chain ID: $CHAIN_ID${NC}"

# Step 4: Build Backend
echo -e "\n${BLUE}Step 4: Building Backend${NC}"
cd "$PROJECT_DIR"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

echo "Building Jeteeah smart contract..."
npm run build:backend

if [ ! -f "backend/target/wasm32-unknown-unknown/release/jeteeah_contract.wasm" ]; then
    echo -e "${RED}❌ Backend build failed - contract WASM not found${NC}"
    exit 1
fi

if [ ! -f "backend/target/wasm32-unknown-unknown/release/jeteeah_service.wasm" ]; then
    echo -e "${RED}❌ Backend build failed - service WASM not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend built successfully${NC}"

# Step 5: Deploy to Conway
echo -e "\n${BLUE}Step 5: Deploying to Conway Testnet${NC}"

echo "Publishing and creating application..."
DEPLOY_OUTPUT=$(linera publish-and-create \
  backend/target/wasm32-unknown-unknown/release/jeteeah_contract.wasm \
  backend/target/wasm32-unknown-unknown/release/jeteeah_service.wasm 2>&1)

echo "$DEPLOY_OUTPUT"

# Extract Application ID - try multiple patterns
APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP '[Aa]pplication.*[ID|id].*:\s*\K[a-f0-9]{64}' | tail -n1)
if [ -z "$APP_ID" ]; then
    APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP 'e[a-f0-9]{63}' | tail -n1)
fi

if [ -z "$APP_ID" ]; then
    echo -e "${YELLOW}⚠️  Could not automatically extract Application ID${NC}"
    echo "Please find the Application ID in the output above"
    read -p "Enter Application ID manually: " APP_ID
    if [ -z "$APP_ID" ]; then
        echo -e "${RED}❌ Application ID is required${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Deployed successfully${NC}"
echo -e "${YELLOW}📋 Application ID: $APP_ID${NC}"

# Step 6: Configure Frontend
echo -e "\n${BLUE}Step 6: Configuring Frontend${NC}"

# Backup existing .env.local if it exists
if [ -f ".env.local" ]; then
    echo "Backing up existing .env.local..."
    cp .env.local ".env.local.backup.$(date +%s)"
fi

# Create new .env.local
cat > .env.local << EOF
# Linera Blockchain Configuration - Conway Testnet
# Generated on $(date)
NEXT_PUBLIC_LINERA_ENDPOINT=http://localhost:8080
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_APP_ID=$APP_ID

# Real blockchain mode
NEXT_PUBLIC_WALLET_MOCK=false
NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true
EOF

echo -e "${GREEN}✅ Frontend configured${NC}"
echo "Configuration saved to .env.local"

# Save deployment info
cat > conway-deployment.txt << EOF
Conway Testnet Deployment Information
Generated on $(date)
======================================

Chain ID: $CHAIN_ID
Application ID: $APP_ID
Endpoint: http://localhost:8080
Faucet: https://faucet.testnet-conway.linera.net

Linera CLI Version:
$LINERA_VERSION

Wallet Location: $HOME/.config/linera/wallet.json

To start the service:
  linera service --port 8080
  # or
  npm run conway:service

To start the frontend:
  npm run dev

To verify deployment:
  linera query-application $APP_ID
EOF

echo "Deployment information saved to conway-deployment.txt"

# Final Report
echo -e "\n${GREEN}=============================================="
echo "🎉 Conway Testnet Setup Complete!"
echo "==============================================\n${NC}"
echo -e "📋 ${BLUE}Configuration Summary:${NC}"
echo -e "   Chain ID:       ${YELLOW}$CHAIN_ID${NC}"
echo -e "   Application ID: ${YELLOW}$APP_ID${NC}"
echo -e "   Endpoint:       ${YELLOW}http://localhost:8080${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "   1. Start Linera service (in terminal 1):"
echo -e "      ${YELLOW}linera service --port 8080${NC}"
echo "      or"
echo -e "      ${YELLOW}npm run conway:service${NC}"
echo ""
echo "   2. Start frontend (in terminal 2):"
echo -e "      ${YELLOW}npm run dev${NC}"
echo ""
echo "   3. Open your browser:"
echo -e "      ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "   4. Verify connection:"
echo -e "      ${YELLOW}curl http://localhost:8080${NC}"
echo ""
echo -e "${GREEN}✅ Your Jeteeah game is ready for Conway testnet!${NC}"
echo ""
echo -e "${BLUE}📄 Deployment info saved to: conway-deployment.txt${NC}"
echo -e "${BLUE}📄 Setup guide: docs/CONWAY_SETUP.md${NC}"
