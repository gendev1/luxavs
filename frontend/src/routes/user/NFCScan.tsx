import { useState } from 'react';
import { Loader, Search, QrCode } from 'lucide-react';
import ProvenanceDetails from '../../components/ProvenanceDetails';
import { AuthenticatedItem } from '../../types';
import { checkNFCUrl, getItemDetails } from '../../services/contractService';

const NFCScan = () => {
    const [scanUrl, setScanUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [scannedItem, setScannedItem] = useState<AuthenticatedItem | null>(null);
    const [isVerificationOpen, setIsVerificationOpen] = useState<boolean>(false);

    const handleScan = async () => {
        if (!scanUrl.trim()) {
            setError('Please enter an NFC URL to scan');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check if this NFC URL is registered
            const nfcResponse = await checkNFCUrl(scanUrl);

            if (!nfcResponse.success || !nfcResponse.data?.isRegistered) {
                setError('This NFC tag is not registered in our system');
                setIsLoading(false);
                return;
            }

            // Get item details using the token ID
            const tokenId = nfcResponse.data?.tokenId as string;
            const itemResponse = await getItemDetails(tokenId);

            if (!itemResponse.success) {
                setError('Failed to retrieve item details');
                setIsLoading(false);
                return;
            }

            // Convert contract data to our AuthenticatedItem type
            // In a real app, you'd fetch the metadata from IPFS using the URI
            const itemData = itemResponse.data;

            // Create a mock item with the data we have
            // In a real app, you would fetch all details from IPFS
            const item: AuthenticatedItem = {
                id: tokenId,
                name: `Item #${tokenId}`, // Would come from metadata
                description: 'Item details from blockchain', // Would come from metadata
                category: 'Luxury Item', // Would come from metadata
                year: new Date().getFullYear().toString(), // Would come from metadata
                condition: 'Excellent', // Would come from metadata
                thumbnail: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=300&h=300', // Would come from metadata
                tokenId: tokenId,
                ipfsHash: (itemData?.metadataURI as string) || '',
                blockchainTxHash: 'verified', // This would be the transaction hash
                nftTokenId: tokenId,
                mintingDate: new Date().toISOString().split('T')[0], // Would come from metadata
                isVerified: true,
                isAuthentic: true,
                confidence: 0.95, // Would come from metadata
                details: `This item is owned by ${itemData?.owner}. ${itemData?.isListed ? 'It is currently listed for sale.' : 'It is not currently listed for sale.'}`,
                verificationId: `ver_${Date.now().toString(36)}`,
                // Add additional fields as needed
            };

            setScannedItem(item);
            setIsVerificationOpen(true);
        } catch (err) {
            console.error('Error scanning NFC:', err);
            setError('An error occurred while scanning the NFC tag. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Function to simulate scanning a physical NFC tag
    const handleNFCScanSimulation = () => {
        // In a real application, this would use the Web NFC API
        // For demo purposes, we'll just set a sample URL
        setScanUrl('https://provenance.io/nfc/item12345');
    };

    return (
        <div className="max-w-lg mx-auto">
            <div className="elegant-card p-6">
                <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-6">Scan NFC Tag</h2>

                <div className="space-y-6">
                    <div className="bg-[var(--color-cream-light)] p-8 rounded-lg text-center">
                        <QrCode className="w-12 h-12 text-[var(--color-navy)] mx-auto mb-4" />
                        <p className="text-[var(--color-text-secondary)] mb-4">Scan an NFC tag using your device's NFC reader or enter the URL manually below</p>
                        <button onClick={handleNFCScanSimulation} className="elegant-button-primary w-full">
                            Simulate NFC Scan
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={scanUrl}
                                onChange={(e) => setScanUrl(e.target.value)}
                                placeholder="Enter NFC URL or tag identifier"
                                className="w-full px-4 py-2 pr-10 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-light)] transition-colors"
                            />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] w-5 h-5" />
                        </div>

                        {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">{error}</div>}

                        <button
                            onClick={handleScan}
                            disabled={isLoading || !scanUrl.trim()}
                            className={`elegant-button-primary w-full ${isLoading || !scanUrl.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin mr-2" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Item'
                            )}
                        </button>
                    </div>

                    <div className="text-sm text-[var(--color-text-tertiary)] text-center">
                        <p>Scanning an NFC tag will reveal the provenance, authenticity, and ownership details of the item.</p>
                    </div>
                </div>
            </div>

            {/* Verification Details Modal */}
            {scannedItem && (
                <ProvenanceDetails
                    isOpen={isVerificationOpen}
                    onClose={() => {
                        setIsVerificationOpen(false);
                    }}
                    provenanceData={scannedItem}
                />
            )}
        </div>
    );
};

export default NFCScan;
