import { useState, useRef, useEffect } from 'react';
import { Wallet, ChevronDown, ChevronUp, ExternalLink, LogOut, Copy, Check } from 'lucide-react';

interface SimpleWalletButtonProps {
    isConnected: boolean;
    address: string | null;
    balance: string;
    network: string;
    onConnect: () => void;
    onDisconnect: () => void;
}

const SimpleWalletButton = ({ isConnected, address, balance, network, onConnect, onDisconnect }: SimpleWalletButtonProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Format address for display
    const formatAddress = (address: string) => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    // Copy address to clipboard
    const copyToClipboard = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // View on block explorer
    const viewOnExplorer = () => {
        if (address) {
            // This would be updated based on the current network
            window.open(`https://etherscan.io/address/${address}`, '_blank');
        }
    };

    if (!isConnected) {
        return (
            <button onClick={onConnect} className="btn-web3-primary flex items-center space-x-2 animate-shimmer">
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-glass backdrop-blur-md border border-[var(--color-border-light)] text-[var(--color-text-primary)] px-3 py-2 rounded-lg hover:border-[var(--color-primary)] transition-all duration-300 flex items-center"
            >
                <div className="flex items-center">
                    <div className="relative w-8 h-8 flex items-center justify-center mr-2">
                        <div className="absolute inset-0 bg-[var(--gradient-gold)] opacity-20 rounded-full animate-pulse"></div>
                        <Wallet className="w-4 h-4 text-[var(--color-primary)]" />
                    </div>
                    <div className="flex flex-col items-start text-xs mr-2">
                        <span className="text-[var(--color-text-secondary)]">{formatAddress(address || '')}</span>
                        <span className="text-[var(--color-primary)] font-medium">{balance}</span>
                    </div>
                    {isDropdownOpen ? <ChevronUp className="w-4 h-4 text-[var(--color-text-tertiary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-tertiary)]" />}
                </div>
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg bg-glass backdrop-blur-md border border-[var(--color-border-light)] shadow-glow-primary z-50 animate-fade-in">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Wallet Details</h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-[rgba(29,168,252,0.1)] text-[var(--color-highlight)]">{network}</span>
                        </div>

                        <div className="mb-4">
                            <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Your Address</div>
                            <div className="flex items-center justify-between bg-[var(--color-panel)] rounded-md p-2">
                                <code className="text-xs truncate text-[var(--color-text-secondary)] max-w-[160px]">{address}</code>
                                <button
                                    onClick={copyToClipboard}
                                    className="ml-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] p-1 rounded-md transition-colors"
                                    title="Copy address"
                                >
                                    {copied ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Balance</div>
                            <div className="text-[var(--color-text-primary)] font-medium">{balance}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                                onClick={viewOnExplorer}
                                className="flex items-center justify-center space-x-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-highlight)] bg-[var(--color-panel)] hover:bg-[rgba(29,168,252,0.1)] rounded-md py-2 px-3 transition-colors"
                            >
                                <ExternalLink className="w-3 h-3" />
                                <span>View on Explorer</span>
                            </button>
                            <button
                                onClick={onDisconnect}
                                className="flex items-center justify-center space-x-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] bg-[var(--color-panel)] hover:bg-[rgba(251,78,120,0.1)] rounded-md py-2 px-3 transition-colors"
                            >
                                <LogOut className="w-3 h-3" />
                                <span>Disconnect</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleWalletButton;
