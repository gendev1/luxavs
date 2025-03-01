# AI Operator for Lux Protocol

This directory contains scripts for running an AI operator to monitor the Lux Protocol and authenticate tasks.

## Overview

The AI operator watches for new tasks created in the LuxServiceManager contract and simulates authentication of luxury goods by providing responses to these tasks.

## Setup and Usage

### Prerequisites

Make sure you have:

-   Node.js installed
-   A running local blockchain node (Anvil/Hardhat) or connection to a testnet
-   The Lux Protocol contracts deployed

### Setup Instructions

1. First, run the setup script to configure your environment:

```bash
node setup-env.js
```

This will:

-   Search for deployment files to find contract addresses
-   Create a `.env` file with the necessary configuration
-   Set default values for local development

2. Run the AI operator:

**Option 1: Simple Operator** (Recommended for most users)

```bash
node simple-operator.js
```

**Option 2: Full Operator** (More features but more complex)

```bash
node ai-operator.js
```

### Troubleshooting

If you encounter issues:

1. Make sure your `.env` file contains:

    - `PRIVATE_KEY`: Your wallet's private key
    - `RPC_URL`: URL of the blockchain node (default: http://localhost:8545)
    - `LUX_SERVICE_MANAGER_ADDRESS`: Address of the LuxServiceManager contract
    - `AUTHENTICATION_CONTROLLER_ADDRESS`: Address of the AuthenticationController contract

2. Ensure the specified wallet has the OPERATOR_ROLE in the LuxServiceManager contract

3. Check that ABIs are available in the `abis/` directory:
    - `LuxServiceManager.json`
    - `AuthenticationController.json`

## Script Descriptions

-   **setup-env.js**: Sets up the environment variables
-   **simple-operator.js**: Lightweight operator with minimal dependencies
-   **ai-operator.js**: Full-featured operator with more advanced error handling

## Configuration Options

In your `.env` file, you can customize:

-   `POLLING_INTERVAL`: Time between checks for new tasks (default: 15000ms)
-   `CONFIDENCE_THRESHOLD`: Threshold for authentication confidence (default: 80%)
-   `CHAIN_ID`: ID of the blockchain network (default: 31337 for local development)

## License

MIT
