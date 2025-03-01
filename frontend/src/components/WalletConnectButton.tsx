import React from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { useReownWallet } from '../hooks/useReownWallet';

interface WalletConnectButtonProps {
    onConnect?: (address: string) => void;
    onDisconnect?: () => void;
    showAccount?: boolean;
    showBalance?: boolean;
    balance?: string;
    className?: string;
}

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ onConnect, onDisconnect, showAccount = true, showBalance = true, balance = '0.00 ETH', className = '' }) => {
    const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useReownWallet();

    const handleConnect = async () => {
        const success = await connectWallet();
        if (success && address && onConnect) {
            onConnect(address);
        }
    };

    const handleDisconnect = async () => {
        const success = await disconnectWallet();
        if (success && onDisconnect) {
            onDisconnect();
        }
    };

    if (isConnected && address) {
        return (
            <div className={`flex items-center ${className}`}>
                <div className="bg-[var(--color-cream)] rounded-full py-1 px-4 flex items-center border border-[var(--color-border)]">
                    <span className="inline-block w-2 h-2 bg-[var(--color-emerald)] rounded-full mr-2"></span>
                    {showAccount && (
                        <span className="text-sm font-medium mr-2 text-[var(--color-text-secondary)] hidden md:inline">
                            {address.slice(0, 6)}...{address.slice(-4)}
                        </span>
                    )}
                    {showBalance && <span className="text-xs font-medium text-[var(--color-emerald)]">{balance}</span>}
                </div>
                <button onClick={handleDisconnect} className="ml-2 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-navy)]">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`elegant-button-primary flex items-center ${className} ${isConnecting ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
            <Wallet className="w-4 h-4 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
    );
};

export default WalletConnectButton;
