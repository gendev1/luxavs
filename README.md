# Lux Protocol AI Operator

A decentralized authentication system for luxury collectibles using AI and blockchain technology. This project leverages Eigenlayer's AVS (Actively Validated Service) architecture to provide secure, decentralized authentication for high-value items.

![Architecture Diagram](architecture.svg)

## Overview

The Lux Protocol AI Operator uses decentralized AI authentication to verify the authenticity of luxury goods. When a user submits an item for authentication, the system:

1. Creates a task in the LuxServiceManager smart contract
2. AI Operators detect the new task and process it using AI-based verification techniques
3. Operators submit their authentication responses on-chain
4. The item's provenance is recorded in the Collectible Registry
5. Authentication results can be used by the NFT marketplace and NFC tag integration

## Key Components

### Smart Contracts

-   **LuxServiceManager**: Manages authentication tasks and operator responses
-   **AuthenticationController**: Handles authentication logic and verification rules
-   **CollectibleRegistry**: Stores provenance records for authenticated items
-   **NFCLuxuryMarketplace**: Marketplace for trading authenticated luxury NFTs
-   **NFCCardFactory**: Creates digital representations linked to physical items

### AI Operator

The AI Operator is a Node.js application that:

-   Monitors the blockchain for new authentication tasks
-   Simulates (or implements) AI-based authentication
-   Submits signed authentication responses to the LuxServiceManager

## Setup and Installation

### Prerequisites

-   Node.js (v16+)
-   Access to a local or remote Ethereum node (Anvil/Hardhat for local development)
-   The Lux Protocol contracts deployed

### Quick Start

1. Clone the repository and install dependencies:

    ```bash
    git clone <repository-url>
    cd luxavs
    npm install
    ```

2. Start a local blockchain (for development):

    ```bash
    npm run start:anvil
    ```

3. In a new terminal, deploy the contracts:

    ```bash
    npm run deploy:core
    npm run deploy:lux-service-manager
    ```

4. Set up the environment for the AI operator:

    ```bash
    node operator/ai-authenticator/setup-env.js
    ```

5. Grant the OPERATOR_ROLE to your wallet:

    ```bash
    ./operator/grant-operator-role.sh
    ```

6. Start the AI operator:

    ```bash
    node operator/ai-authenticator/simple-operator.js
    ```

7. Create a test task (in another terminal):
    ```bash
    cd contracts
    forge script script/CreateTestTask.s.sol --broadcast --rpc-url http://localhost:8545
    ```

## Running the AI Operator

The project includes two operator implementations:

### Simple Operator

The recommended implementation for most users:

```bash
node operator/ai-authenticator/simple-operator.js
```

### Full Operator

A more complex implementation with additional features:

```bash
node operator/ai-authenticator/ai-operator.js
```

## Configuration

The operators use these environment variables (stored in `.env`):

| Variable                          | Description                                      | Default                               |
| --------------------------------- | ------------------------------------------------ | ------------------------------------- |
| RPC_URL                           | URL of the Ethereum node                         | http://localhost:8545                 |
| PRIVATE_KEY                       | Private key for the operator wallet              | (For local chains: Anvil default key) |
| LUX_SERVICE_MANAGER_ADDRESS       | Address of the LuxServiceManager contract        | (From deployment)                     |
| AUTHENTICATION_CONTROLLER_ADDRESS | Address of the AuthenticationController contract | (From deployment)                     |
| CONFIDENCE_THRESHOLD              | Threshold for authentication confidence          | 80                                    |
| POLLING_INTERVAL                  | Milliseconds between polls for new tasks         | 15000                                 |
| CHAIN_ID                          | Chain ID of the network                          | 31337                                 |

## Troubleshooting

If you encounter issues:

1. Check your contract addresses:

    ```bash
    node operator/ai-authenticator/check-addresses.js
    ```

2. Ensure your wallet has the OPERATOR_ROLE:

    ```bash
    ./operator/grant-operator-role.sh <your-wallet-address>
    ```

3. Make sure required ABIs are in `operator/ai-authenticator/abis/`:

    - LuxServiceManager.json
    - AuthenticationController.json

4. For signature verification issues:
    - Check that the message hash creation matches the contract's implementation
    - Verify the wallet has enough gas for transactions

## Architecture Details

The Lux Protocol uses a layered architecture:

1. **Authentication Layer**: Verifies item authenticity using AI operators
2. **Collectible Registry**: Stores provenance records and metadata
3. **NFT and Marketplace**: Manages digital ownership and trading
4. **Physical World**: Connects physical items through NFC tags
5. **User Interaction**: Apps and interfaces for collectors and authenticators

The AI operators provide the trust layer by verifying item authenticity through image analysis and metadata validation, with their responses secured by the Eigenlayer staking mechanism.

## Development Guide

To extend or modify the AI operator:

1. Customize the authentication logic in `simulateAuthentication()` function
2. Implement real AI verification by integrating with services like Google Vision API
3. Enhance the response data with more detailed features and confidence metrics
4. Update the error handling to fit your specific requirements

## License

MIT

## Additional Resources

-   [Eigenlayer Documentation](https://docs.eigenlayer.xyz/)
-   [Lux Protocol Contracts](./contracts/)

# Local Devnet Deployment

The following instructions explain how to manually deploy the AVS from scratch including EigenLayer and AVS specific contracts using Foundry (forge) to a local anvil chain, and start Typescript Operator application and tasks.

## Development Environment

This section describes the tooling required for local development.

### Non-Nix Environment

Install dependencies:

-   [Node](https://nodejs.org/en/download/)
-   [Typescript](https://www.typescriptlang.org/download)
-   [ts-node](https://www.npmjs.com/package/ts-node)
-   [tcs](https://www.npmjs.com/package/tcs#installation)
-   [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
-   [Foundry](https://getfoundry.sh/)
-   [ethers](https://www.npmjs.com/package/ethers)

### Nix Environment

On [Nix](https://nixos.org/) platforms, if you already have the proper Nix configuration, you can build the project's artifacts inside a `nix develop` shell

```sh
nix develop
```

Otherwise, please refer to [installed and configured](./docs/nix-setup-guide.md) section.

## Quick start

### Start Anvil Chain

In terminal window #1, execute the following commands:

```sh

# Install npm packages
npm install

# Start local anvil chain
npm run start:anvil
```

### Deploy Contracts and Start Operator

Open a separate terminal window #2, execute the following commands

```sh
# Setup .env file
cp .env.example .env
cp contracts/.env.example contracts/.env

# Updates dependencies if necessary and builds the contracts
npm run build:forge

# Deploy the EigenLayer contracts
npm run deploy:core

# Deploy the Hello World AVS contracts
npm run deploy:lux-service-manager

# (Optional) Update ABIs
npm run extract:abis

# Start the Operator application
npm run start:operator

```

### Create and Claim Payments

In a terminal, start a new instance of anvil and deploy the core and avs contracts

```sh
# Start anvil
npm run start:anvil-quick
# Deploy the EigenLayer contracts
npm run deploy:core

# Deploy the Hello World AVS contracts
npm run deploy:lux-service-manager

```

In another terminal, run:

```sh
# Create payment roots
npm run create-payments-root

# Claim created payment
npm run claim-payments
```

To run operator directed payments, run:

```sh
#Create payment roots
npm run create-operator-directed-payments-root

# Claim created payment
npm run claim-payments
```

In order to create and claim multiple payments (run the above two commands more than once), you must wait up to 5 minutes.

### Create Hello-World-AVS Tasks

Open a separate terminal window #3, execute the following commands

```sh
# Start the createNewTasks application
npm run start:traffic
```

### Help and Support

For help and support deploying and modifying this repo for your AVS, please:

1. Open a ticket via the intercom link at [support.eigenlayer.xyz](https://support.eigenlayer.xyz).
2. Include the necessary troubleshooting information for your environment:

-   Local anvil testing:
    -   Redeploy your local test using `--revert-strings debug` flag via the following commands and retest: `npm run deploy:core-debug && npm run deploy:hello-world-debug`
    -   Include the full stacktrace from your error as a .txt file attachment.
    -   Create a minimal repo that demonstrates the behavior (fork or otherwise)
    -   Steps require to reproduce issue (compile and cause the error)
-   Holesky testing:
    -   Ensure contracts are verified on Holesky. Eg `forge verify-contract --chain-id 17000 --num-of-optimizations 200 src/YourContract.sol:YourContract YOUR_CONTRACT_ADDRESS`
    -   Send us your transaction hash where your contract is failing. We will use Tenderly to debug (adjust gas limit) and/or cast to re-run the transaction (eg `cast call --trace "trace_replayTransaction(0xTransactionHash)"`).

### Contact Us

If you're planning to build an AVS and would like to speak with a member of the EigenLayer DevRel team to discuss your ideas or architecture, please fill out this form and we'll be in touch shortly: [EigenLayer AVS Intro Call](https://share.hsforms.com/1BksFoaPjSk2l3pQ5J4EVCAein6l)

### Disclaimers

-   This repo is meant currently intended for _local anvil development testing_. Holesky deployment support will be added shortly.
-   Users who wish to build an AVS for Production purposes will want to migrate from the `ECDSAServiceManagerBase` implementation in `HelloWorldServiceManager.sol` to a BLS style architecture using [RegistryCoordinator](https://github.com/Layr-Labs/eigenlayer-middleware/blob/dev/docs/RegistryCoordinator.md).

# Appendix (Future Capabilities In Progress)

## Adding a New Strategy

## Potential Enhancements to the AVS (for learning purposes)

The architecture can be further enhanced via:

-   the nature of the request is more sophisticated than generating a constant string
-   the operators might need to coordinate with each other
-   the type of signature is different based on the constraints of the service
-   the type and amount of security used to secure the AVS

## Rust Operator instructions

### Anvil Deployment

1. Start Anvil Chain

In terminal window #1, execute the following commands:

```sh
# Start local anvil chain
anvil
```

2. Deploy Contracts

Open a separate terminal window #2, execute the following commands

```sh
# Setup .env file
cp .env.example .env
cp contracts/.env.example contracts/.env

# Builds the contracts
make build-contracts

# Deploy the EigenLayer contracts
make deploy-eigenlayer-contracts

# Deploy the Lux Contracts
make deploy-lux-service-manager
```

3. Start Rust Operator

In terminal window #2, execute the following command

```sh
# Start the Operator
make start-rust-operator
```

4. Spam Tasks

Open a separate terminal window #3, execute the following command

```sh
# Start sending tasks
make spam-rust-tasks
```

### Testing

1. Start Anvil Chain

In terminal window #1, execute the following commands:

```sh
anvil
```

2. Deploy Contracts

Open a separate terminal window #2, execute the following commands

```
make deploy-eigenlayer-contracts

make deploy-lux-service-manager
```

3. Run this command

```
cargo test --workspace
```
