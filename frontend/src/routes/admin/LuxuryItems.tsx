import { useState, useEffect } from 'react';
import { Loader, Search, Plus, Tag, ExternalLink, RefreshCw } from 'lucide-react';
import { createOrUpdateListing, getItemDetails } from '../../services/contractService';

interface LuxuryItemData {
    tokenId: string;
    metadataURI: string;
    price: string;
    isListed: boolean;
    owner: string;
}

const LuxuryItems = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState<LuxuryItemData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Listing form state
    const [showListingForm, setShowListingForm] = useState(false);
    const [selectedTokenId, setSelectedTokenId] = useState('');
    const [listingPrice, setListingPrice] = useState('');
    const [metadataURI, setMetadataURI] = useState('');

    // Mock loading of items - in a real app, you would fetch this from the blockchain
    useEffect(() => {
        const loadExampleItems = () => {
            setItems([
                {
                    tokenId: '1',
                    metadataURI: 'ipfs://Qmabcdef123456789/1',
                    price: '0.5',
                    isListed: true,
                    owner: '0x1234567890123456789012345678901234567890',
                },
                {
                    tokenId: '2',
                    metadataURI: 'ipfs://Qmabcdef123456789/2',
                    price: '1.2',
                    isListed: true,
                    owner: '0x2345678901234567890123456789012345678901',
                },
                {
                    tokenId: '3',
                    metadataURI: 'ipfs://Qmabcdef123456789/3',
                    price: '0',
                    isListed: false,
                    owner: '0x3456789012345678901234567890123456789012',
                },
            ]);
        };

        loadExampleItems();
    }, []);

    const handleUpdateListing = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTokenId || !metadataURI || !listingPrice) {
            setError('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Call the contract method to create or update listing
            const result = await createOrUpdateListing(selectedTokenId, metadataURI, listingPrice);

            if (result.success) {
                // Update the item in our list
                setItems((prevItems) => prevItems.map((item) => (item.tokenId === selectedTokenId ? { ...item, metadataURI, price: listingPrice, isListed: true } : item)));

                setSuccess(`Successfully updated listing for token ID ${selectedTokenId}`);

                // Close the form and reset fields
                setShowListingForm(false);
                setSelectedTokenId('');
                setMetadataURI('');
                setListingPrice('');
            } else {
                setError(result.error || 'Failed to update listing');
            }
        } catch (err) {
            console.error('Error updating listing:', err);
            setError('An error occurred while updating the listing');
        } finally {
            setIsLoading(false);
        }
    };

    const handleItemSelect = (item: LuxuryItemData) => {
        setSelectedTokenId(item.tokenId);
        setMetadataURI(item.metadataURI);
        setListingPrice(item.price);
        setShowListingForm(true);
    };

    // Filter items based on search term
    const filteredItems = items.filter(
        (item) =>
            item.tokenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.metadataURI.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-medium text-[var(--color-text-primary)]">Luxury Items Management</h1>

                <button
                    onClick={() => {
                        setSelectedTokenId('');
                        setMetadataURI('');
                        setListingPrice('');
                        setShowListingForm(true);
                    }}
                    className="elegant-button-primary flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Listing
                </button>
            </div>

            {/* Listing Form */}
            {showListingForm && (
                <div className="elegant-card p-6">
                    <h2 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
                        {selectedTokenId ? `Update Listing: Token #${selectedTokenId}` : 'Create New Listing'}
                    </h2>

                    <form onSubmit={handleUpdateListing} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Token ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={selectedTokenId}
                                    onChange={(e) => setSelectedTokenId(e.target.value)}
                                    placeholder="1"
                                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md"
                                    required
                                    disabled={!!selectedTokenId}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Price (ETH) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={listingPrice}
                                    onChange={(e) => setListingPrice(e.target.value)}
                                    placeholder="0.5"
                                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Metadata URI <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={metadataURI}
                                    onChange={(e) => setMetadataURI(e.target.value)}
                                    placeholder="ipfs://Qm..."
                                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md"
                                    required
                                />
                            </div>
                        </div>

                        {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md">{error}</div>}

                        {success && <div className="text-green-600 text-sm p-3 bg-green-50 rounded-md">{success}</div>}

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowListingForm(false)}
                                className="px-4 py-2 border border-[var(--color-border)] rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-cream)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button type="submit" disabled={isLoading} className={`elegant-button-primary flex items-center ${isLoading ? 'opacity-70' : ''}`}>
                                {isLoading ? (
                                    <>
                                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Listing'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Items List */}
            <div className="elegant-card p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-[var(--color-text-primary)]">Registered Luxury Items</h2>

                    <div className="flex space-x-2">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search items..."
                                className="pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-md text-sm"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] w-4 h-4" />
                        </div>

                        <button className="p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-cream)] transition-colors">
                            <RefreshCw className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--color-border)]">
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Token ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Metadata</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Price</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Owner</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr key={item.tokenId} className="hover:bg-[var(--color-cream-light)]">
                                        <td className="px-4 py-4 text-sm">{item.tokenId}</td>
                                        <td className="px-4 py-4 text-sm overflow-hidden text-ellipsis max-w-xs">
                                            <div className="flex items-center">
                                                <span className="truncate">{item.metadataURI}</span>
                                                <a
                                                    href={item.metadataURI.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-2 text-[var(--color-navy)]"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">{item.isListed ? `${item.price} ETH` : '-'}</td>
                                        <td className="px-4 py-4 text-sm font-mono">
                                            {item.owner.substring(0, 6)}...{item.owner.substring(item.owner.length - 4)}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            {item.isListed ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Listed</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Not Listed</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-center">
                                            <button onClick={() => handleItemSelect(item)} className="elegant-button-small">
                                                <Tag className="w-3 h-3 mr-1" />
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-sm text-center text-[var(--color-text-tertiary)]">
                                        {searchTerm ? 'No items match your search criteria' : 'No luxury items registered yet'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LuxuryItems;
