// This service provides blockchain functionality for the application
// It now uses the contractService for real blockchain interactions when available

import { registerNFCCard, createOrUpdateListing } from './contractService';

interface MintResult {
    success: boolean;
    tokenId?: string;
    txHash?: string;
    error?: string;
}

/**
 * Mints an NFT with the provided metadata URI
 * @param address - Wallet address to mint the NFT to
 * @param metadataUri - IPFS URI pointing to the NFT metadata
 * @returns Promise with minting result
 */
export const mintNFT = async (address: string, metadataUri: string): Promise<MintResult> => {
    try {
        // Use the real contract if ethereum is available in the window
        if (window.ethereum) {
            console.log(`Minting NFT to address ${address} with metadata ${metadataUri}`);

            // Generate a unique NFC URL for this item
            const nfcUrl = `nfc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Call the registerNFCCard function from our contract service
            const result = await registerNFCCard(nfcUrl, address, metadataUri);

            if (result.success && result.tokenId) {
                // Create a listing for the item in the marketplace
                // Default price of 1 ETH for newly minted items
                const listingResult = await createOrUpdateListing(result.tokenId, metadataUri, '1.0');

                return {
                    success: true,
                    tokenId: result.tokenId,
                    txHash: result.txHash,
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Failed to mint NFT',
                };
            }
        } else {
            // Fallback to mock implementation if ethereum is not available
            console.log(`[Mock] Minting NFT to address ${address} with metadata ${metadataUri}`);

            // Simulate blockchain delay
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Generate mock transaction hash and token ID
            const mockTxHash =
                '0x' +
                Array(64)
                    .fill(0)
                    .map(() => Math.floor(Math.random() * 16).toString(16))
                    .join('');
            const mockTokenId = Math.floor(Math.random() * 10000).toString();

            return {
                success: true,
                tokenId: mockTokenId,
                txHash: mockTxHash,
            };
        }
    } catch (error) {
        console.error('Error minting NFT:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred during minting',
        };
    }
};
