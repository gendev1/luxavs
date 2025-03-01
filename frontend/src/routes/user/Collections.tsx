import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search, Grid, List, ArrowRight, Tag, Info } from 'lucide-react';
import { AuthenticatedItem } from '../../types';
import ItemVerificationModal from '../../components/ItemVerificationModal';
import { getWalletAddress } from '../../services/contractService';

const Collections = () => {
    const [collections, setCollections] = useState<{ [key: string]: AuthenticatedItem[] }>({});
    const [selectedItem, setSelectedItem] = useState<AuthenticatedItem | null>(null);
    const [isVerificationOpen, setIsVerificationOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    useEffect(() => {
        const fetchWalletAddress = async () => {
            try {
                const address = await getWalletAddress();
                setWalletAddress(address);
            } catch (error) {
                console.error('Error fetching wallet address:', error);
            }
        };

        fetchWalletAddress();
    }, []);

    useEffect(() => {
        const fetchCollections = async () => {
            setIsLoading(true);

            // Simulate API call to fetch collections
            setTimeout(() => {
                // Mock data
                const mockCollections = {
                    Watches: [
                        {
                            id: '1',
                            name: 'Rolex Submariner',
                            description: 'Luxury dive watch with date function',
                            category: 'Watches',
                            year: '2022',
                            condition: 'Excellent',
                            thumbnail: 'https://example.com/rolex.jpg',
                            details: [
                                { label: 'Reference', value: '126610LN' },
                                { label: 'Movement', value: 'Automatic' },
                                { label: 'Case Material', value: 'Stainless Steel' },
                                { label: 'Water Resistance', value: '300m' },
                            ],
                            provenance: [
                                { date: '2022-05-15', event: 'Manufactured', location: 'Switzerland' },
                                { date: '2022-06-20', event: 'Sold to Distributor', location: 'Geneva' },
                                { date: '2022-07-10', event: 'Purchased by Owner', location: 'New York' },
                            ],
                            nfcTagId: 'nfc:12345abcde',
                            tokenId: '123456',
                            owner: walletAddress || '0x1234567890abcdef',
                            timestamp: new Date().toISOString(),
                        },
                        {
                            id: '2',
                            name: 'Omega Speedmaster',
                            description: 'Moonwatch Professional Chronograph',
                            category: 'Watches',
                            year: '2021',
                            condition: 'Very Good',
                            thumbnail: 'https://example.com/omega.jpg',
                            details: [
                                { label: 'Reference', value: '310.30.42.50.01.001' },
                                { label: 'Movement', value: 'Manual' },
                                { label: 'Case Material', value: 'Stainless Steel' },
                                { label: 'Water Resistance', value: '50m' },
                            ],
                            provenance: [
                                { date: '2021-03-10', event: 'Manufactured', location: 'Switzerland' },
                                { date: '2021-04-05', event: 'Sold to Distributor', location: 'Zurich' },
                                { date: '2021-05-12', event: 'Purchased by Owner', location: 'London' },
                            ],
                            nfcTagId: 'nfc:67890fghij',
                            tokenId: '789012',
                            owner: walletAddress || '0x1234567890abcdef',
                            timestamp: new Date().toISOString(),
                        },
                    ],
                    Handbags: [
                        {
                            id: '3',
                            name: 'Hermes Birkin',
                            description: '35cm Black Togo Leather Gold Hardware',
                            category: 'Handbags',
                            year: '2020',
                            condition: 'Excellent',
                            thumbnail: 'https://example.com/birkin.jpg',
                            details: [
                                { label: 'Material', value: 'Togo Leather' },
                                { label: 'Size', value: '35cm' },
                                { label: 'Color', value: 'Black' },
                                { label: 'Hardware', value: 'Gold' },
                            ],
                            provenance: [
                                { date: '2020-02-18', event: 'Manufactured', location: 'France' },
                                { date: '2020-04-22', event: 'Sold at Boutique', location: 'Paris' },
                                { date: '2020-05-15', event: 'Purchased by Owner', location: 'Paris' },
                            ],
                            nfcTagId: 'nfc:abcde12345',
                            tokenId: '345678',
                            owner: walletAddress || '0x1234567890abcdef',
                            timestamp: new Date().toISOString(),
                        },
                    ],
                };

                setCollections(mockCollections);
                setIsLoading(false);
            }, 1500);
        };

        fetchCollections();
    }, [walletAddress]);

    const handleViewDetails = (item: AuthenticatedItem) => {
        setSelectedItem(item);
        setIsVerificationOpen(true);
    };

    const filteredCollections = () => {
        let result: { [key: string]: AuthenticatedItem[] } = {};

        // First apply category filter if selected
        const categoriesToInclude = selectedFilter ? [selectedFilter] : Object.keys(collections);

        categoriesToInclude.forEach((category) => {
            // Then apply search filter
            const filteredItems = collections[category]?.filter(
                (item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.year.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredItems && filteredItems.length > 0) {
                result[category] = filteredItems;
            }
        });

        return result;
    };

    const allCategories = Object.keys(collections);
    const filtered = filteredCollections();
    const hasItems = Object.values(filtered).some((arr) => arr.length > 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Your Collections</h1>
                    <p className="text-[var(--color-text-secondary)]">View and manage your authenticated luxury items</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search collections..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="elegant-input pl-9 w-full sm:w-60"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] w-4 h-4" />
                        <select value={selectedFilter || ''} onChange={(e) => setSelectedFilter(e.target.value || null)} className="elegant-select pl-9 w-full sm:w-40 pr-8">
                            <option value="">All Categories</option>
                            {allCategories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="elegant-card p-8 text-center">
                    <div className="animate-pulse">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-[var(--color-border)]"></div>
                        </div>
                        <div className="h-4 w-48 bg-[var(--color-border)] rounded mx-auto mb-2"></div>
                        <div className="h-3 w-32 bg-[var(--color-border)] rounded mx-auto"></div>
                    </div>
                </div>
            ) : hasItems ? (
                Object.entries(filtered).map(
                    ([category, items]) =>
                        items.length > 0 && (
                            <div key={category} className="space-y-4">
                                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center">
                                    <Tag className="w-5 h-5 mr-2 text-[var(--color-navy)]" />
                                    {category}
                                    <span className="ml-2 text-sm text-[var(--color-text-secondary)] font-normal">
                                        ({items.length} item{items.length !== 1 ? 's' : ''})
                                    </span>
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {items.map((item) => (
                                        <div key={item.id} className="elegant-card p-4 flex flex-col">
                                            <div className="aspect-square bg-[var(--color-cream-light)] rounded-lg mb-4 flex items-center justify-center">
                                                {/* Mock image placeholder */}
                                                <div className="text-[var(--color-text-tertiary)] text-sm">Item Image</div>
                                            </div>

                                            <h3 className="font-medium text-[var(--color-text-primary)] mb-1">{item.name}</h3>
                                            <p className="text-sm text-[var(--color-text-secondary)] mb-2">{item.description}</p>

                                            <div className="mt-auto pt-3 flex flex-wrap gap-2 text-xs text-[var(--color-text-tertiary)]">
                                                <span className="px-2 py-1 bg-[var(--color-cream-light)] rounded-full">{item.year}</span>
                                                <span className="px-2 py-1 bg-[var(--color-cream-light)] rounded-full">{item.condition}</span>
                                            </div>

                                            <button
                                                onClick={() => handleViewDetails(item)}
                                                className="mt-4 elegant-button-secondary w-full text-sm flex items-center justify-center py-2"
                                            >
                                                <Info className="w-4 h-4 mr-1" />
                                                View Provenance
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                )
            ) : (
                <div className="elegant-card p-8 text-center">
                    <Info className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
                    <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No Items Found</h3>
                    <p className="text-[var(--color-text-secondary)] mb-4">
                        {searchTerm || selectedFilter
                            ? 'No items match your search criteria. Try adjusting your filters.'
                            : "You don't have any authenticated items in your collection yet."}
                    </p>

                    {!searchTerm && !selectedFilter && (
                        <button onClick={() => (window.location.href = '/user/scan')} className="elegant-button-primary py-2 px-4 mx-auto">
                            Scan an NFC Tag
                        </button>
                    )}
                </div>
            )}

            {selectedItem && <ItemVerificationModal isOpen={isVerificationOpen} onClose={() => setIsVerificationOpen(false)} item={selectedItem} />}
        </div>
    );
};

export default Collections;
