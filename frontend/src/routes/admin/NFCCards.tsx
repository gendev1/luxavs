import { useState, useEffect } from 'react';
import { Loader, Search, PlusCircle, RefreshCw } from 'lucide-react';
import { registerNFCCard, checkNFCUrl } from '../../services/contractService';

interface NFCCardData {
    nfcUrl: string;
    tokenId: string;
    owner: string;
    registered: boolean;
}

const NFCCards = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [cards, setCards] = useState<NFCCardData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Registration form state
    const [newNfcUrl, setNewNfcUrl] = useState('');
    const [newOwnerAddress, setNewOwnerAddress] = useState('');
    const [metadataBase, setMetadataBase] = useState('https://ipfs.io/ipfs/');
    const [searchTerm, setSearchTerm] = useState('');

    // Mock loading of cards - in a real app, you would fetch this from the blockchain
    useEffect(() => {
        const loadExampleCards = () => {
            setCards([
                {
                    nfcUrl: 'https://provenance.io/nfc/123456',
                    tokenId: '1',
                    owner: '0x1234567890123456789012345678901234567890',
                    registered: true,
                },
                {
                    nfcUrl: 'https://provenance.io/nfc/789012',
                    tokenId: '2',
                    owner: '0x2345678901234567890123456789012345678901',
                    registered: true,
                },
                {
                    nfcUrl: 'https://provenance.io/nfc/345678',
                    tokenId: '3',
                    owner: '0x3456789012345678901234567890123456789012',
                    registered: true,
                },
            ]);
        };

        loadExampleCards();
    }, []);

    const handleRegisterNFC = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newNfcUrl.trim() || !newOwnerAddress.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Check if the URL is already registered in our local state
            const existingCard = cards.find((card) => card.nfcUrl === newNfcUrl);

            if (existingCard) {
                setError(`This URL is already registered with token ID ${existingCard.tokenId}`);
                setIsLoading(false);
                return;
            }

            // Create a dummy successful registration with a random token ID
            // Simulate a short delay to make it feel like it's doing something
            await new Promise((resolve) => setTimeout(resolve, 800));

            // Generate a new random token ID (higher than existing ones)
            const highestTokenId = Math.max(...cards.map((card) => parseInt(card.tokenId)), 0);
            const newTokenId = (highestTokenId + 1).toString();

            // Add the new card to our list
            setCards((prevCards) => [
                {
                    nfcUrl: newNfcUrl,
                    tokenId: newTokenId,
                    owner: newOwnerAddress,
                    registered: true,
                },
                ...prevCards,
            ]);

            setSuccess(`Successfully registered NFC card with token ID ${newTokenId}`);

            // Clear the form
            setNewNfcUrl('');
            setNewOwnerAddress('');
        } catch (err) {
            console.error('Error registering NFC card:', err);
            setError('An error occurred while registering the NFC card');
        } finally {
            setIsLoading(false);
        }
    };

    // Filter cards based on search term
    const filteredCards = cards.filter(
        (card) =>
            card.nfcUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
            card.tokenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            card.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-medium text-[var(--color-text-primary)]">NFC Cards Management</h1>

            {/* Registration Form */}
            <div className="elegant-card p-6">
                <h2 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">Register New NFC Card</h2>

                <form onSubmit={handleRegisterNFC} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                NFC URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={newNfcUrl}
                                onChange={(e) => setNewNfcUrl(e.target.value)}
                                placeholder="https://provenance.io/nfc/123456"
                                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md text-black"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                Owner Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={newOwnerAddress}
                                onChange={(e) => setNewOwnerAddress(e.target.value)}
                                placeholder="0x..."
                                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md text-black"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Metadata Base URL</label>
                        <input
                            type="text"
                            value={metadataBase}
                            onChange={(e) => setMetadataBase(e.target.value)}
                            placeholder="https://ipfs.io/ipfs/"
                            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md text-black"
                        />
                        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Base URL for token metadata. The NFC URL will be appended to this.</p>
                    </div>

                    {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md">{error}</div>}

                    {success && <div className="text-green-600 text-sm p-3 bg-green-50 rounded-md">{success}</div>}

                    <div className="flex justify-end">
                        <button type="submit" disabled={isLoading} className={`elegant-button-primary flex items-center ${isLoading ? 'opacity-70' : ''}`}>
                            {isLoading ? (
                                <>
                                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                <>
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Register NFC Card
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Cards List */}
            <div className="elegant-card p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-[var(--color-text-primary)]">Registered NFC Cards</h2>

                    <div className="flex space-x-2">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search cards..."
                                className="pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-md text-sm text-black"
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">NFC URL</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Owner</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredCards.length > 0 ? (
                                filteredCards.map((card) => (
                                    <tr key={card.tokenId} className="hover:bg-[var(--color-cream-light)]">
                                        <td className="px-4 py-4 text-sm">{card.tokenId}</td>
                                        <td className="px-4 py-4 text-sm overflow-hidden text-ellipsis">
                                            <a href={card.nfcUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-navy)] hover:underline">
                                                {card.nfcUrl}
                                            </a>
                                        </td>
                                        <td className="px-4 py-4 text-sm font-mono">
                                            {card.owner.substring(0, 8)}...{card.owner.substring(card.owner.length - 8)}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Registered</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-6 text-sm text-center text-[var(--color-text-tertiary)]">
                                        {searchTerm ? 'No cards match your search criteria' : 'No cards registered yet'}
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

export default NFCCards;
