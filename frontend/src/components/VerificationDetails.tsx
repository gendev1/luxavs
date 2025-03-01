import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, CheckCircle, Info, ExternalLink, Loader2 } from 'lucide-react';
import { AuthenticatedItem } from '../types';
import { getItemDetails, getBuyRequests, requestToBuy, approveSale } from '../services/contractService';
import { MARKETPLACE_CONTRACT_ADDRESS, NETWORK_NAMES } from '../constants';

interface VerificationDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    provenanceData: AuthenticatedItem;
}

interface BuyRequest {
    buyer: string;
    price: string;
}

interface BlockchainData {
    metadataURI: string;
    price: string;
    isListed: boolean;
    owner: string;
}

const VerificationDetails: React.FC<VerificationDetailsProps> = ({ isOpen, onClose, provenanceData }) => {
    const [isLoadingBlockchainData, setIsLoadingBlockchainData] = useState(false);
    const [blockchainData, setBlockchainData] = useState<BlockchainData | null>(null);
    const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
    const [offerPrice, setOfferPrice] = useState('');
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
    const [offerError, setOfferError] = useState('');
    const [offerSuccess, setOfferSuccess] = useState(false);
    const [selectedBuyer, setSelectedBuyer] = useState<string | null>(null);
    const [isApprovingSale, setIsApprovingSale] = useState(false);

    useEffect(() => {
        if (isOpen && provenanceData.nftTokenId && provenanceData.nftTokenId !== 'pending') {
            fetchBlockchainData();
        }
    }, [isOpen, provenanceData.nftTokenId]);

    const fetchBlockchainData = async () => {
        setIsLoadingBlockchainData(true);
        try {
            // Get item details from the blockchain
            const itemDetailsResult = await getItemDetails(provenanceData.nftTokenId);

            if (itemDetailsResult.success && itemDetailsResult.data) {
                const data = itemDetailsResult.data as unknown as BlockchainData;
                setBlockchainData(data);

                // If current user is the owner, fetch buy requests
                if (window.ethereum) {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts[0] && data.owner && accounts[0].toLowerCase() === data.owner.toLowerCase()) {
                        const buyRequestsResult = await getBuyRequests(provenanceData.nftTokenId);
                        if (buyRequestsResult.success && buyRequestsResult.data) {
                            // Cast the data to the correct type
                            const buyRequestsData = buyRequestsResult.data as unknown as BuyRequest[];
                            setBuyRequests(buyRequestsData);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching blockchain data:', error);
        } finally {
            setIsLoadingBlockchainData(false);
        }
    };

    const handleMakeOffer = async () => {
        if (!offerPrice || parseFloat(offerPrice) <= 0) {
            setOfferError('Please enter a valid offer price');
            return;
        }

        setIsSubmittingOffer(true);
        setOfferError('');
        setOfferSuccess(false);

        try {
            const result = await requestToBuy(provenanceData.nftTokenId, offerPrice);
            if (result.success) {
                setOfferSuccess(true);
                setOfferPrice('');
            } else {
                setOfferError(result.error || 'Failed to submit offer');
            }
        } catch (error) {
            setOfferError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setIsSubmittingOffer(false);
        }
    };

    const handleApproveSale = async (buyerAddress: string) => {
        setIsApprovingSale(true);
        try {
            const result = await approveSale(provenanceData.nftTokenId, buyerAddress);
            if (result.success) {
                // Refresh data after approval
                fetchBlockchainData();
                setSelectedBuyer(null);
            } else {
                console.error('Failed to approve sale:', result.error);
            }
        } catch (error) {
            console.error('Error approving sale:', error);
        } finally {
            setIsApprovingSale(false);
        }
    };

    if (!isOpen) return null;

    // Display the blockchain network based on chain ID
    const getNetworkName = () => {
        if (!window.ethereum) return 'Not Connected';

        try {
            // Get the network ID from the connected provider
            const chainIdHex = window.ethereum.chainId;

            if (typeof chainIdHex === 'string') {
                const chainId = parseInt(chainIdHex, 16);
                return NETWORK_NAMES[chainId] || `Unknown Network (Chain ID: ${chainId})`;
            }

            return 'Unknown Network';
        } catch (error) {
            console.error('Error getting network name:', error);
            return 'Unknown Network';
        }
    };

    // Format address for display
    const formatAddress = (address?: string) => {
        if (!address) return 'Unknown';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    return (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white border border-[var(--color-border)] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-subtle">
                <div className="sticky top-0 bg-white border-b border-[var(--color-border)] flex items-center justify-between p-4 z-10">
                    <div className="flex items-center">
                        <Shield className="w-5 h-5 text-[var(--color-navy)] mr-2" />
                        <h2 className="text-xl text-[var(--color-navy)]">Provenance Verification</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-[var(--color-cream)] rounded-full text-[var(--color-text-secondary)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    {/* Item Header */}
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                        <div className="w-full md:w-1/3">
                            <div className="aspect-square rounded-lg overflow-hidden border border-[var(--color-border)]">
                                <img src={provenanceData.thumbnail} alt={provenanceData.name} className="w-full h-full object-cover" />
                            </div>
                        </div>

                        <div className="w-full md:w-2/3">
                            <h1 className="text-2xl font-medium text-[var(--color-text-primary)] mb-2">{provenanceData.name}</h1>
                            <p className="text-[var(--color-text-secondary)] mb-6">{provenanceData.description}</p>

                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-6">
                                <div>
                                    <p className="text-sm text-[var(--color-text-tertiary)]">Category</p>
                                    <p className="font-medium">{provenanceData.category}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--color-text-tertiary)]">Year</p>
                                    <p className="font-medium">{provenanceData.year}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--color-text-tertiary)]">Condition</p>
                                    <p className="font-medium">{provenanceData.condition}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--color-text-tertiary)]">Verification ID</p>
                                    <p className="font-medium text-[var(--color-text-secondary)]">{provenanceData.verificationId}</p>
                                </div>
                            </div>

                            <div className="bg-[var(--color-cream)] rounded-lg p-4 mb-6 border border-[var(--color-border)]">
                                <div className="flex items-center mb-2">
                                    {provenanceData.isAuthentic ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-[var(--color-emerald)] mr-2" />
                                            <h3 className="font-medium text-[var(--color-emerald)]">Authenticated</h3>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-5 h-5 text-[var(--color-coral)] mr-2" />
                                            <h3 className="font-medium text-[var(--color-coral)]">Authentication Issues Detected</h3>
                                        </>
                                    )}
                                    <div className="ml-auto flex items-center">
                                        <div className="h-2 w-20 bg-[var(--color-cream-dark)] rounded-full overflow-hidden mr-2">
                                            <div
                                                className={`h-full ${provenanceData.isAuthentic ? 'bg-[var(--color-emerald)]' : 'bg-[var(--color-coral)]'}`}
                                                style={{ width: `${provenanceData.confidence * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm text-[var(--color-text-secondary)]">{Math.round(provenanceData.confidence * 100)}% confidence</span>
                                    </div>
                                </div>
                                <p className="text-sm text-[var(--color-text-secondary)]">{provenanceData.details}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <div className="elegant-badge">Minted on {provenanceData.mintingDate}</div>
                                <div className="elegant-badge flex items-center">
                                    <span className="mr-1">IPFS:</span>
                                    <a
                                        href={`https://ipfs.io/ipfs/${provenanceData.ipfsHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--color-navy)] hover:underline flex items-center"
                                    >
                                        {provenanceData.ipfsHash.substring(0, 6)}...{provenanceData.ipfsHash.substring(provenanceData.ipfsHash.length - 4)}
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                </div>
                                <div className="elegant-badge flex items-center">
                                    <span className="mr-1">Token ID:</span>
                                    {provenanceData.nftTokenId === 'pending' ? (
                                        <span className="text-[var(--color-text-tertiary)]">Pending</span>
                                    ) : (
                                        <a
                                            href={`https://etherscan.io/token/${MARKETPLACE_CONTRACT_ADDRESS}?a=${provenanceData.nftTokenId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[var(--color-navy)] hover:underline flex items-center"
                                        >
                                            {provenanceData.nftTokenId}
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Blockchain Data Section */}
                    <div className="border-t border-[var(--color-border)] pt-6 mt-6">
                        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">Blockchain Information</h3>

                        {isLoadingBlockchainData ? (
                            <div className="elegant-card p-6 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-[var(--color-navy)] animate-spin mr-3" />
                                <p>Loading blockchain data...</p>
                            </div>
                        ) : blockchainData ? (
                            <div className="space-y-6">
                                <div className="elegant-card p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm text-[var(--color-text-tertiary)] mb-1">Network</h4>
                                            <p className="font-medium">{getNetworkName()}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm text-[var(--color-text-tertiary)] mb-1">Current Owner</h4>
                                            <p className="font-medium">
                                                <a
                                                    href={`https://etherscan.io/address/${blockchainData.owner}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[var(--color-navy)] hover:underline flex items-center"
                                                >
                                                    {formatAddress(blockchainData.owner)}
                                                    <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm text-[var(--color-text-tertiary)] mb-1">Listing Status</h4>
                                            <p className="font-medium">
                                                {blockchainData.isListed ? (
                                                    <span className="text-[var(--color-emerald)]">Listed for Sale</span>
                                                ) : (
                                                    <span className="text-[var(--color-text-secondary)]">Not Listed</span>
                                                )}
                                            </p>
                                        </div>
                                        {blockchainData.isListed && (
                                            <div>
                                                <h4 className="text-sm text-[var(--color-text-tertiary)] mb-1">Price</h4>
                                                <p className="font-medium">{blockchainData.price} ETH</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Make an offer section - only show if listed and not owned by current user */}
                                    {blockchainData.isListed && window.ethereum && (
                                        <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                                            <h4 className="font-medium mb-3">Make an Offer</h4>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <input
                                                        type="number"
                                                        placeholder="Offer price in ETH"
                                                        value={offerPrice}
                                                        onChange={(e) => setOfferPrice(e.target.value)}
                                                        className="w-full p-2 border border-[var(--color-border)] rounded-md"
                                                        disabled={isSubmittingOffer}
                                                    />
                                                </div>
                                                <button onClick={handleMakeOffer} disabled={isSubmittingOffer} className="elegant-button-primary whitespace-nowrap">
                                                    {isSubmittingOffer ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        'Submit Offer'
                                                    )}
                                                </button>
                                            </div>
                                            {offerError && <p className="text-[var(--color-coral)] text-sm mt-2">{offerError}</p>}
                                            {offerSuccess && <p className="text-[var(--color-emerald)] text-sm mt-2">Your offer has been submitted successfully!</p>}
                                        </div>
                                    )}

                                    {/* Buy requests section - only show to owner */}
                                    {buyRequests.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                                            <h4 className="font-medium mb-3">Purchase Offers</h4>
                                            <div className="space-y-3">
                                                {buyRequests.map((request, index) => (
                                                    <div key={index} className="p-3 border border-[var(--color-border)] rounded-md flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm">
                                                                <a
                                                                    href={`https://etherscan.io/address/${request.buyer}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[var(--color-navy)] hover:underline"
                                                                >
                                                                    {formatAddress(request.buyer)}
                                                                </a>
                                                            </p>
                                                            <p className="font-medium">{request.price} ETH</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleApproveSale(request.buyer)}
                                                            disabled={isApprovingSale}
                                                            className="elegant-button-primary text-sm"
                                                        >
                                                            {isApprovingSale && selectedBuyer === request.buyer ? (
                                                                <>
                                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                'Accept Offer'
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Metadata from IPFS */}
                                <div className="elegant-card p-6">
                                    <h4 className="font-medium mb-3">Metadata URI</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)] break-all">
                                        <a
                                            href={blockchainData.metadataURI.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[var(--color-navy)] hover:underline flex items-center"
                                        >
                                            {blockchainData.metadataURI}
                                            <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                                        </a>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="elegant-card p-6 text-center">
                                <Info className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-3" />
                                <p className="text-[var(--color-text-secondary)]">
                                    {provenanceData.nftTokenId === 'pending'
                                        ? 'This item is still being minted on the blockchain. Please check back later.'
                                        : 'Blockchain data is not available for this item.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationDetails;
