import { useState, useEffect } from 'react';
import { ChevronRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedItem, CollectionItem } from '../../types';
import { mockItems } from '../../data/mockAuthenticatedItems';
import { mockCollections } from '../../data/mockCollection';
import ProvenanceDetails from '../../components/ProvenanceDetails';

const Dashboard = () => {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isVerificationOpen, setIsVerificationOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<AuthenticatedItem | null>(null);
    const [authenticatedItems, setAuthenticatedItems] = useState<AuthenticatedItem[]>(mockItems);
    const [collections] = useState<CollectionItem[]>(mockCollections);
    const navigate = useNavigate();

    // Get wallet address from ethereum provider
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum
                .request({ method: 'eth_accounts' })
                .then((accounts: string[]) => {
                    if (accounts.length > 0) {
                        setWalletAddress(accounts[0]);
                    }
                })
                .catch((err: Error) => console.error(err));
        }
    }, []);

    const handleItemClick = (item: AuthenticatedItem) => {
        setSelectedItem(item);
        setIsVerificationOpen(true);
    };

    return (
        <div className="space-y-8">
            <section>
                <div className="flex items-baseline justify-between mb-4">
                    <h2 className="text-xl font-medium text-[var(--color-text-primary)]">Your Authenticated Items</h2>
                    <button onClick={() => navigate('/scan')} className="text-sm text-[var(--color-gold)] flex items-center hover:text-[var(--color-gold-light)]">
                        Scan NFC
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                </div>

                {authenticatedItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {authenticatedItems.map((item) => (
                            <div
                                key={item.id}
                                className="elegant-card hover:shadow-md hover:border-[var(--color-border-dark)] overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                                onClick={() => handleItemClick(item)}
                            >
                                <div className="aspect-square relative">
                                    <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-2 right-2 bg-[var(--color-success)]/90 text-black px-2 py-1 rounded-md text-xs font-medium">Authentic</div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-medium text-[var(--color-text-primary)] mb-1">{item.name}</h3>
                                    <p className="text-[var(--color-text-tertiary)] text-sm mb-2">
                                        {item.category}, {item.year}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <div className="h-1.5 w-12 bg-[var(--color-card-accent)] rounded-full overflow-hidden">
                                                <div className="h-full bg-[var(--color-gold)]" style={{ width: '95%' }}></div>
                                            </div>
                                            <span className="text-xs text-[var(--color-text-tertiary)] ml-2">95%</span>
                                        </div>
                                        <div className="text-xs text-[var(--color-text-tertiary)]">{item.condition}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="elegant-card p-8 text-center">
                        <Shield className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No authenticated items yet</h3>
                        <p className="text-[var(--color-text-secondary)] mb-6">Start by scanning an NFC tag to see its details</p>
                        <button onClick={() => navigate('/scan')} className="elegant-button-primary">
                            Scan NFC
                        </button>
                    </div>
                )}
            </section>

            {collections.length > 0 && (
                <section>
                    <div className="flex items-baseline justify-between mb-4">
                        <h2 className="text-xl font-medium text-[var(--color-text-primary)]">Your Collections</h2>
                        <button onClick={() => navigate('/collections')} className="text-sm text-[var(--color-gold)] flex items-center hover:text-[var(--color-gold-light)]">
                            View All
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {collections.map((collection) => (
                            <div
                                key={collection.id}
                                className="elegant-card hover:shadow-md hover:border-[var(--color-border-dark)] overflow-hidden cursor-pointer transition-all"
                                onClick={() => navigate('/collections')}
                            >
                                <div className="p-5">
                                    <div className="flex items-center mb-4">
                                        <img src={collection.icon || collection.thumbnail} alt={collection.name} className="w-12 h-12 object-contain mr-3" />
                                        <div>
                                            <h3 className="font-medium text-[var(--color-text-primary)]">{collection.name}</h3>
                                            <p className="text-[var(--color-text-tertiary)] text-sm">
                                                {collection.itemCount} items • {typeof collection.value === 'number' ? '$' + collection.value.toLocaleString() : collection.value}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                                        {collection.previewImages ? (
                                            collection.previewImages.map((img, index) => (
                                                <img
                                                    key={index}
                                                    src={img}
                                                    alt={`${collection.name} preview ${index}`}
                                                    className="w-16 h-16 object-cover rounded-md flex-shrink-0 snap-start border border-[var(--color-card-accent)]"
                                                />
                                            ))
                                        ) : collection.thumbnail ? (
                                            <img
                                                src={collection.thumbnail}
                                                alt={`${collection.name} preview`}
                                                className="w-16 h-16 object-cover rounded-md flex-shrink-0 snap-start border border-[var(--color-card-accent)]"
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Verification modal (simplified) */}
            {isVerificationOpen && selectedItem && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--color-card)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="p-4 sm:p-6 md:p-8">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-xl font-medium text-[var(--color-text-primary)]">{selectedItem.name}</h2>
                                <button onClick={() => setIsVerificationOpen(false)} className="text-[var(--color-text-tertiary)] hover:text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <ProvenanceDetails item={selectedItem} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
