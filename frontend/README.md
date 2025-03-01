# Web3 AI NFT Platform

A full-stack application for luxury goods authentication and NFT creation, using AI, blockchain, and IPFS technologies.

## Project Structure

This project consists of two main parts:

1. **Frontend**: React/TypeScript application in the `src` directory
2. **Backend**: Node.js/Express/TypeScript API in the `backend` directory

## Getting Started

### Prerequisites

-   Node.js v18+ and npm/yarn
-   MongoDB (or use a cloud MongoDB instance)
-   IPFS access (via Pinata)
-   Ethereum wallet and provider (Alchemy API key for a testnet like Sepolia is recommended for development)
-   Google OAuth credentials (for authentication)
-   ORA AI API key (for AI features)

### Setup and Installation

#### Backend Setup

1. Navigate to the backend directory:

    ```
    cd backend
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Copy the example environment file and update with your credentials:

    ```
    cp .env.example .env
    ```

4. Start the development server:
    ```
    npm run dev
    ```

Refer to the backend README for more detailed setup instructions.

#### Frontend Setup

1. From the root directory, install dependencies:

    ```
    npm install
    ```

2. Copy the example environment file and update if needed:

    ```
    cp .env.example .env
    ```

3. Start the development server:
    ```
    npm start
    ```

## Frontend-Backend Integration

The frontend communicates with the backend through a set of service modules:

-   **API Client**: Base configuration for API requests (`src/services/apiClient.ts`)
-   **Authentication Service**: Handles Google OAuth authentication (`src/services/authService.ts`)
-   **Blockchain Service**: Manages blockchain interactions (`src/services/blockchainService.ts`)
-   **IPFS Service**: Handles file storage on IPFS (`src/services/ipfsService.ts`)
-   **ORA AI Service**: Interfaces with AI capabilities (`src/services/oraService.ts`)
-   **Okto Web3 Service**: Provides Web3 wallet functionality (`src/services/oktoService.ts`)

## Available API Endpoints

The backend provides the following API endpoints:

### Authentication

-   `POST /api/auth/google`: Authenticate with Google OAuth
-   `POST /api/auth/refresh`: Refresh authentication token

### Blockchain

-   `GET /api/blockchain/health`: Check blockchain service health
-   `GET /api/blockchain/balance`: Get contract balance
-   `POST /api/blockchain/mint`: Mint a new NFT
-   `POST /api/blockchain/provenance`: Record provenance information
-   `GET /api/blockchain/provenance/:tokenId`: Get provenance history
-   `GET /api/blockchain/owner/:tokenId`: Get token owner

### IPFS

-   `GET /api/ipfs/health`: Check IPFS service health
-   `POST /api/ipfs/upload`: Upload file to IPFS
-   `POST /api/ipfs/metadata`: Upload metadata to IPFS
-   `POST /api/ipfs/nft-metadata`: Prepare and upload NFT metadata
-   `GET /api/ipfs/content/:hash`: Get content from IPFS

### ORA AI

-   `GET /api/ora/models`: Get available AI models
-   `POST /api/ora/generate`: Generate images
-   `POST /api/ora/analyze`: Analyze image

### Okto Web3

-   `POST /api/okto/wallet`: Create a new Okto wallet
-   `GET /api/okto/balance/:address`: Get wallet balance
-   `POST /api/okto/transaction`: Send a transaction
-   `GET /api/okto/transactions/:address`: Get transaction history

## Security Considerations

-   Never commit sensitive credentials to version control
-   Frontend never stores private keys
-   Authentication tokens are securely managed
-   Appropriate CORS settings are configured

## Development

The backend has a comprehensive test suite that can be run with:

```
cd backend
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# ProvenanceChain - Luxury Item Authentication Platform

ProvenanceChain is a blockchain-based platform for authenticating luxury items using NFC technology and Ethereum smart contracts. The platform allows users to verify the authenticity of luxury goods, track their provenance, and buy/sell authenticated items securely.

## Smart Contract Integration

This application integrates with two Ethereum smart contracts:

1. **NFCLuxuryMarketplace.sol** - An ERC721 contract for minting and managing NFT tokens that represent authenticated luxury items. Each token is linked to an NFC card and metadata storing the item's authenticity information.

2. **NFCCardFactory.sol** - A factory contract that manages the deployment of NFC cards, linking them to the marketplace contract.

## Setup and Configuration

### Environment Variables

Copy the `.env.example` file to `.env` and update the following variables:

```bash
# Smart Contract Addresses
VITE_MARKETPLACE_CONTRACT_ADDRESS=0x123456789abcdef123456789abcdef123456789a
VITE_FACTORY_CONTRACT_ADDRESS=0x987654321abcdef987654321abcdef987654321b

# IPFS Configuration
VITE_PINATA_JWT=your-pinata-jwt-here
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud
```

Replace the contract addresses with your deployed contract addresses and update the Pinata JWT with your actual token.

### Smart Contract Functionality

The contracts provide the following functionality:

#### NFCLuxuryMarketplace

-   Mint new NFC cards linked to luxury items
-   Create and update listings for items
-   Request to buy listed items
-   Approve sales
-   View item details and buy requests

#### NFCCardFactory

-   Register new NFC cards
-   Check if an NFC URL is already registered
-   Update the marketplace contract reference

## Using the Application

### Wallet Connection

The application requires a Web3 wallet (like MetaMask) to interact with the blockchain. Click the "Connect Wallet" button to connect your wallet.

### Authenticating an Item

1. Navigate to the "Authenticate Item" page
2. Upload an image of your item
3. Fill in the details
4. Submit the form to mint a new NFT representing your item

### Viewing Item Details

Click on any authenticated item to view its details, including:

-   Authentication status
-   Blockchain verification
-   Provenance information

### Making Offers and Approving Sales

If you own an item, you can view purchase offers and approve sales directly from the item details page.

If you want to make an offer on someone else's item, you can do so from the item details page when the item is listed for sale.

## Development

### Prerequisites

-   Node.js v14+
-   npm or yarn
-   A Web3 wallet (MetaMask recommended)
-   Access to Ethereum testnet or mainnet

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Testing

```bash
# Run tests
npm test
```

## Building for Production

```bash
# Build production version
npm run build
```

## Contract Addresses

For development and testing, you can use the following testnet contract addresses:

-   Marketplace (Sepolia): `0x123456789abcdef123456789abcdef123456789a`
-   Factory (Sepolia): `0x987654321abcdef987654321abcdef987654321b`

For production use, deploy your own contracts and update the `.env` file with the appropriate addresses.
