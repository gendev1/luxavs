#!/bin/bash

# Grant Operator Role Script
# This script runs the GrantOperatorRole.s.sol Forge script to give OPERATOR_ROLE
# to a specified operator address for the Lux Protocol contracts

# Default to current directory if LUXAVS_ROOT not set
LUXAVS_ROOT=${LUXAVS_ROOT:-$(pwd)}
CONTRACTS_DIR="$LUXAVS_ROOT/contracts"

# Default RPC URL for local development
RPC_URL=${RPC_URL:-"http://localhost:8545"}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Print the banner
echo -e "${BOLD}============================================"
echo -e "  Grant OPERATOR_ROLE for Lux Protocol"
echo -e "============================================${NC}"

# Check if contracts directory exists
if [ ! -d "$CONTRACTS_DIR" ]; then
    echo -e "${RED}Error: Contracts directory not found at $CONTRACTS_DIR${NC}"
    echo "If your contracts are in a different location, please set LUXAVS_ROOT environment variable"
    exit 1
fi

# Check if operator address was provided
if [ -z "$1" ]; then
    # No address provided, use the default wallet
    echo -e "${YELLOW}No operator address provided as argument.${NC}"
    echo "Will use the default wallet address (owner) as the operator."
    OPERATOR_ARG=""
else
    # Validate the address format (basic check)
    if [[ ! "$1" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
        echo -e "${RED}Error: Invalid Ethereum address format. Address should start with '0x' followed by 40 hex characters.${NC}"
        exit 1
    fi
    
    OPERATOR_ADDRESS="$1"
    echo -e "${GREEN}Using operator address: $OPERATOR_ADDRESS${NC}"
    OPERATOR_ARG="--sig 'run()' OPERATOR_ADDRESS=$OPERATOR_ADDRESS"
fi

# Try to detect if Anvil/Hardhat node is running
if ! curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "$RPC_URL" > /dev/null; then
    echo -e "${YELLOW}Warning: Could not connect to Ethereum node at $RPC_URL${NC}"
    echo "Make sure your local blockchain node is running before continuing."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Navigate to contracts directory
cd "$CONTRACTS_DIR" || { echo -e "${RED}Failed to navigate to contracts directory${NC}"; exit 1; }

echo -e "${BOLD}Running GrantOperatorRole script...${NC}"

# Run Forge script
if [ -z "$OPERATOR_ARG" ]; then
    # No operator address specified, use default
    forge script script/GrantOperatorRole.s.sol --broadcast --rpc-url "$RPC_URL"
else
    # Use specified operator address
    forge script script/GrantOperatorRole.s.sol --broadcast --rpc-url "$RPC_URL" $OPERATOR_ARG
fi

# Check if the script execution was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}${BOLD}Success: OPERATOR_ROLE has been granted!${NC}"
    echo -e "Your AI operator should now be able to respond to tasks."
    echo
    echo -e "Next steps:"
    echo -e "1. Start your AI operator with: ${BOLD}node operator/ai-authenticator/simple-operator.js${NC}"
    echo -e "2. Create a test task with: ${BOLD}forge script script/CreateTestTask.s.sol --broadcast --rpc-url $RPC_URL${NC}"
else
    echo -e "${RED}Error: Failed to grant OPERATOR_ROLE.${NC}"
    echo "Please check the error message above for details."
fi 