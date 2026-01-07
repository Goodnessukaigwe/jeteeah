#!/bin/bash

# Start Linera Service for Conway Testnet
# This creates a local gateway that connects to Conway validators

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🌐 Starting Linera Service for Conway Testnet"
echo "=============================================="
echo ""

# Check if linera is installed
if ! command -v linera &> /dev/null; then
    echo -e "${RED}❌ Linera CLI not found${NC}"
    echo ""
    echo "Please install Linera CLI with Conway support:"
    echo "  git clone https://github.com/linera-io/linera-protocol.git"
    echo "  cd linera-protocol"
    echo "  git checkout -t origin/testnet_conway"
    echo "  cargo install --path linera-service --features rocksdb"
    exit 1
fi

echo -e "${GREEN}✓ Linera CLI found${NC}"

# Check if wallet is initialized
if [ ! -f "$HOME/.config/linera/wallet.json" ]; then
    echo -e "${YELLOW}⚠️  No wallet found${NC}"
    echo ""
    echo "Initialize your wallet for Conway testnet:"
    echo "  linera wallet init --faucet https://faucet.testnet-conway.linera.net"
    echo "  linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net"
    exit 1
fi

echo -e "${GREEN}✓ Wallet configured${NC}"
echo ""

# Get wallet info
echo "📋 Wallet Information:"
linera wallet show | head -10
echo ""

# Start the service
PORT=${1:-8080}
echo "🚀 Starting Linera service on port ${PORT}..."
echo "This service connects your frontend to Conway testnet validators"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""
echo "Your frontend should connect to: http://localhost:${PORT}"
echo ""

# Start the service
linera service --port ${PORT}
