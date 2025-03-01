# AI Operator Quick Start Guide

This guide will help you quickly set up and run the AI Operator for the Lux Protocol.

## Prerequisites

-   Node.js (v16+)
-   Local Ethereum node (Anvil/Hardhat) running at http://localhost:8545
-   Lux Protocol contracts deployed (LuxServiceManager and AuthenticationController)

## Setup

### 1. Set up your environment

Run the environment setup script to create your `.env` file with the correct contract addresses:

```bash
node setup-env.js
```

This will:

-   Look for deployed contract addresses from various locations
-   Create a `.env` file with the necessary configuration
-   Set up default values for local development

### 2. Create the ABI directory

Make sure the ABIs directory exists:

```bash
mkdir -p abis
```

The AI operator needs ABIs for:

-   LuxServiceManager.json
-   AuthenticationController.json

### 3. Grant OPERATOR_ROLE to your wallet

The operator needs the OPERATOR_ROLE permission to respond to tasks:

```bash
# From the project root
./operator/grant-operator-role.sh
```

This runs a Forge script to grant your wallet the OPERATOR_ROLE in both contracts.

## Running the Operator

### Simple Operator (Recommended)

For most users, the simple operator is easier to use and understand:

```bash
node simple-operator.js
```

### Full Operator

The full operator includes more advanced features and error handling:

```bash
node ai-operator.js
```

## Verifying Setup

You can check if your operator is properly configured with:

```bash
node check-addresses.js
```

This will verify:

-   Connection to the blockchain
-   Contract addresses are valid
-   ABI files exist
-   Operator role permissions
-   Environment variables

## Creating Test Tasks

To create a test task for your operator to respond to:

```bash
# From the contracts directory
forge script script/CreateTestTask.s.sol --broadcast --rpc-url http://localhost:8545
```

## Troubleshooting

### Common Issues and Solutions

1. **"Error: LuxServiceManager.getTask is not a function"**

    - The ABI lacks the getTask function. Make sure your ABIs are complete and up to date.

2. **"Transaction failed" or reverted transactions**

    - Check if your wallet has the OPERATOR_ROLE using the `check-addresses.js` script
    - Ensure you have enough ETH for gas
    - Verify the signature calculation matches the contract's expected format

3. **Cannot find contract addresses**

    - Run `setup-env.js` again
    - If it still fails, check your deployment files or manually add addresses to .env

4. **Tasks are not being detected**
    - Verify the LuxServiceManager contract is correctly deployed
    - Check if the taskCount/latestTaskNum function is accessible
    - Make sure your RPC connection is stable

## Extending the Operator

To customize the authentication:

1. Modify the `simulateAuthentication()` function to implement your AI logic
2. Update the response data structure to include specific features you're authenticating
3. Adjust confidence thresholds in the `.env` file

## Need Help?

-   Check the main README.md file for more detailed documentation
-   Review ARCHITECTURE.md to understand how components interact
-   Inspect the logs for specific error messages
