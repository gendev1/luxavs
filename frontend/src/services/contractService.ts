import { ethers } from 'ethers';
import NFCLuxuryMarketplaceABI from '../data/abi/NFCLuxuryMarketplaceABI.json';
import NFCCardFactoryABI from '../data/abi/NFCCardFactoryABI.json';
import { ContractResponse, AuthenticatedItem, NFCCard } from '../types';

// Contract addresses - these would typically come from environment variables
// For development, we'll hardcode them here
const MARKETPLACE_CONTRACT_ADDRESS = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || '0x123456789...'; // Replace with actual address
const FACTORY_CONTRACT_ADDRESS = import.meta.env.VITE_FACTORY_CONTRACT_ADDRESS || '0x987654321...'; // Replace with actual address

// Declare interface to add _ensSupported property to Web3Provider
interface EnhancedWeb3Provider extends ethers.providers.Web3Provider {
    _ensSupported?: boolean;
}

// Types for contract interactions
export interface MintNFCCardResult {
    success: boolean;
    tokenId?: string;
    txHash?: string;
    error?: string;
}

export interface ListItemResult {
    success: boolean;
    txHash?: string;
    error?: string;
}

// Get provider and signer
const getProviderAndSigner = async () => {
    if (!window.ethereum) {
        throw new Error('MetaMask (or other Web3 provider) is not installed');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum) as EnhancedWeb3Provider;

    // Check if the current network supports ENS
    try {
        // Get the network
        const network = await provider.getNetwork();

        // Add this property to the provider to cache the ENS support status
        provider._ensSupported = false;

        // Only attempt to check ENS support on networks that might support it
        // Mainnet, Goerli, and Sepolia support ENS - Holesky and others may not
        if (network.chainId === 1 || network.chainId === 5 || network.chainId === 11155111) {
            try {
                // Test if ENS is supported by trying to resolve a known ENS name
                await provider.resolveName('resolver.eth');
                provider._ensSupported = true;
            } catch (e) {
                console.log('ENS not supported on this network');
                provider._ensSupported = false;
            }
        }
    } catch (e) {
        console.warn('Error checking ENS support:', e);
        // Continue without ENS support
    }

    const signer = provider.getSigner();
    return { provider, signer };
};

// Helper function to safely resolve an address (handles ENS or regular addresses)
export const safeResolveAddress = async (addressOrName: string): Promise<string> => {
    if (addressOrName.endsWith('.eth')) {
        try {
            const providerAndSigner = await getProviderAndSigner();
            const provider = providerAndSigner.provider;

            // If we've determined ENS is not supported, don't try to resolve
            if (provider._ensSupported === false) {
                throw new Error('ENS not supported on this network');
            }

            const address = await provider.resolveName(addressOrName);
            if (!address) {
                throw new Error(`Could not resolve ENS name: ${addressOrName}`);
            }
            return address;
        } catch (error) {
            console.error('Error resolving ENS name:', error);
            throw new Error(`Failed to resolve ENS name ${addressOrName}. Your current network may not support ENS.`);
        }
    }

    // Not an ENS name, return as is
    return addressOrName;
};

// Initialize contract instances
export const getMarketplaceContract = async (withSigner = true) => {
    try {
        const { provider, signer } = await getProviderAndSigner();
        return new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, NFCLuxuryMarketplaceABI, withSigner ? signer : provider);
    } catch (error) {
        console.error('Error initializing marketplace contract:', error);
        throw error;
    }
};

export const getFactoryContract = async (withSigner = true) => {
    try {
        const { provider, signer } = await getProviderAndSigner();
        return new ethers.Contract(FACTORY_CONTRACT_ADDRESS, NFCCardFactoryABI, withSigner ? signer : provider);
    } catch (error) {
        console.error('Error initializing factory contract:', error);
        throw error;
    }
};

// Mock function to simulate blockchain interaction for registering an NFC card
export const registerNFCCard = async (nfcUrl: string, owner: string, tokenId?: string): Promise<ContractResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
        // In a real application, this would call a smart contract method
        console.log(`Registering NFC card: ${nfcUrl} for owner: ${owner}`);

        // Simulate success (or random failure)
        const isSuccess = Math.random() > 0.2; // 80% success rate

        if (isSuccess) {
            return { success: true };
        } else {
            return {
                success: false,
                error: 'Failed to register NFC card. The transaction was reverted by the blockchain.',
            };
        }
    } catch (error) {
        console.error('Error registering NFC card:', error);
        return {
            success: false,
            error: 'An unexpected error occurred while registering the NFC card.',
        };
    }
};

// Check if an NFC URL is registered
export const checkNFCUrl = async (
    nfcUrl: string
): Promise<{
    isRegistered: boolean;
    tokenId?: string;
}> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
        // In a real application, this would call a smart contract method
        console.log(`Checking NFC URL: ${nfcUrl}`);

        // Simulate a check - for demo purposes, consider URLs with "valid" to be registered
        const isRegistered = nfcUrl.includes('valid');

        return {
            isRegistered,
            tokenId: isRegistered ? Math.floor(Math.random() * 100).toString() : undefined,
        };
    } catch (error) {
        console.error('Error checking NFC URL:', error);
        return { isRegistered: false };
    }
};

// Create or update a listing for a luxury item
export const createOrUpdateListing = async (tokenId: string, metadataURI: string, price: string): Promise<ContractResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
        // In a real application, this would call a smart contract method
        console.log(`Creating/Updating listing for Token ID: ${tokenId} with price: ${price} ETH`);

        // Simulate success (or random failure)
        const isSuccess = Math.random() > 0.2; // 80% success rate

        if (isSuccess) {
            return { success: true };
        } else {
            return {
                success: false,
                error: 'Failed to update listing. The transaction was reverted by the blockchain.',
            };
        }
    } catch (error) {
        console.error('Error updating listing:', error);
        return {
            success: false,
            error: 'An unexpected error occurred while updating the listing.',
        };
    }
};

// Get item details from token ID
export const getItemDetails = async (tokenId: string): Promise<AuthenticatedItem | null> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
        // In a real application, this would call a smart contract method
        console.log(`Getting details for Token ID: ${tokenId}`);

        // For demo, return a mock item
        return {
            id: tokenId,
            name: 'Luxury Item #' + tokenId,
            description: 'A high-end luxury item with blockchain verification',
            category: 'Luxury Goods',
            year: new Date().getFullYear().toString(),
            condition: 'Excellent',
            thumbnail: 'https://example.com/item.jpg',
            details: {
                material: 'Premium Materials',
                serialNumber: 'LX' + Math.floor(Math.random() * 10000000),
                authenticity: {
                    isAuthentic: true,
                    verifiedBy: 'NFC Luxury Verification',
                    verificationDate: new Date().toISOString().split('T')[0],
                },
                provenance: [
                    { date: '2023-01-15', event: 'Manufactured' },
                    { date: '2023-02-20', event: 'Quality Control Check' },
                    { date: '2023-03-10', event: 'Listed on NFC Luxury Marketplace' },
                    { date: new Date().toISOString().split('T')[0], event: 'NFC Tagged and Verified' },
                ],
            },
        };
    } catch (error) {
        console.error('Error getting item details:', error);
        return null;
    }
};

// Get buy requests for a token
export const getBuyRequests = async (tokenId: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
        // In a real application, this would call a smart contract method
        console.log(`Getting buy requests for Token ID: ${tokenId}`);

        // For demo, return mock data
        return [
            {
                id: '1',
                tokenId,
                buyer: '0x1234567890123456789012345678901234567890',
                price: '0.5',
                status: 'pending',
                timestamp: new Date().toISOString(),
            },
            {
                id: '2',
                tokenId,
                buyer: '0x2345678901234567890123456789012345678901',
                price: '0.45',
                status: 'rejected',
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            },
        ];
    } catch (error) {
        console.error('Error getting buy requests:', error);
        return [];
    }
};

// Approve a sale request
export const approveSale = async (tokenId: string, requestId: string): Promise<ContractResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
        // In a real application, this would call a smart contract method
        console.log(`Approving sale for Token ID: ${tokenId}, Request ID: ${requestId}`);

        // Simulate success (or random failure)
        const isSuccess = Math.random() > 0.1; // 90% success rate

        if (isSuccess) {
            return { success: true };
        } else {
            return {
                success: false,
                error: 'Failed to approve sale. The transaction was reverted by the blockchain.',
            };
        }
    } catch (error) {
        console.error('Error approving sale:', error);
        return {
            success: false,
            error: 'An unexpected error occurred while approving the sale.',
        };
    }
};

// Request to buy an item
export const requestToBuy = async (tokenId: string, price: string): Promise<ContractResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
        // In a real application, this would call a smart contract method
        console.log(`Requesting to buy Token ID: ${tokenId} for ${price} ETH`);

        // Simulate success (or random failure)
        const isSuccess = Math.random() > 0.2; // 80% success rate

        if (isSuccess) {
            return { success: true };
        } else {
            return {
                success: false,
                error: 'Failed to submit buy request. The transaction was reverted by the blockchain.',
            };
        }
    } catch (error) {
        console.error('Error requesting to buy:', error);
        return {
            success: false,
            error: 'An unexpected error occurred while submitting the buy request.',
        };
    }
};

// Get the current user's wallet address (would use MetaMask or other wallet provider)
export const getWalletAddress = async (): Promise<string | null> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
        // In a real app, this would interact with the user's wallet
        // For demo purposes, return a mock address
        return '0x' + Math.random().toString(16).substr(2, 40);
    } catch (error) {
        console.error('Error getting wallet address:', error);
        return null;
    }
};
