import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SimpleWalletButton from '../components/SimpleWalletButton';
import { NETWORK_NAMES } from '../constants';
import LuxuryBackground from '../components/LuxuryBackground';
import { Shield, Menu, X, Activity, Hexagon, ExternalLink } from 'lucide-react';

const MainLayout = () => {
    const [accounts, setAccounts] = useState<string[]>([]);
    const [connected, setConnected] = useState<boolean>(false);
    const [balance, setBalance] = useState<string>('0 ETH');
    const [networkId, setNetworkId] = useState<number | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if window.ethereum is available (MetaMask or other Web3 provider)
        const checkConnection = async () => {
            if (window.ethereum) {
                try {
                    // Get current accounts
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        setAccounts(accounts);
                        setConnected(true);

                        // Get balance
                        const balance = await window.ethereum.request({
                            method: 'eth_getBalance',
                            params: [accounts[0], 'latest'],
                        });
                        setBalance(formatBalance(balance));

                        // Get network
                        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                        setNetworkId(parseInt(chainId, 16));
                    }
                } catch (error) {
                    console.error('Error checking connection:', error);
                }
            }
        };

        checkConnection();

        // Set up event listeners
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        // Add scroll listener
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            // Cleanup listeners
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
            // User disconnected
            setConnected(false);
            setAccounts([]);
            setBalance('0 ETH');
        } else {
            // User switched accounts
            setAccounts(accounts);
            setConnected(true);

            // Update balance
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [accounts[0], 'latest'],
            });
            setBalance(formatBalance(balance));
        }
    };

    const handleChainChanged = (chainIdHex: string) => {
        // Network changed, reload page (as recommended by MetaMask)
        setNetworkId(parseInt(chainIdHex, 16));
    };

    const formatBalance = (balanceHex: string): string => {
        const wei = parseInt(balanceHex, 16);
        const eth = wei / 1e18;
        return `${eth.toFixed(4)} ETH`;
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask or another Web3 wallet to connect.');
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccounts(accounts);
            setConnected(true);

            // Get balance
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [accounts[0], 'latest'],
            });
            setBalance(formatBalance(balance));

            // Get network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            setNetworkId(parseInt(chainId, 16));
        } catch (error) {
            console.error('Error connecting wallet:', error);
        }
    };

    const handleDisconnect = async () => {
        // Note: true wallet disconnection is not fully supported in all wallets
        // This is more of a UI disconnect
        setAccounts([]);
        setConnected(false);
        setBalance('0 ETH');
    };

    const getNetworkName = () => {
        if (!networkId) return 'Unknown Network';
        return NETWORK_NAMES[networkId] || `Chain ID: ${networkId}`;
    };

    return (
        <>
            <LuxuryBackground />
            <div className="min-h-screen flex flex-col">
                {/* Header */}
                <header
                    className={`py-4 px-6 backdrop-blur-md fixed w-full top-0 z-20 transition-all duration-300 ${
                        isScrolled ? 'bg-[var(--color-panel)]/95 shadow-glow-primary' : 'bg-[var(--color-panel)]/60'
                    }`}
                >
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        {/* Logo */}
                        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                            <Shield className="h-8 w-8 text-[var(--color-primary)] animate-glow" />
                            <span className="ml-2 text-xl font-bold">
                                <span className="text-gradient text-glow">Provenance</span>
                                <span className="text-[var(--color-text-primary)]">Chain</span>
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-6">
                            <nav className="flex items-center space-x-8 mr-4">
                                <button
                                    onClick={() => navigate('/user')}
                                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-2"
                                >
                                    <Activity className="w-4 h-4" /> Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/scan')}
                                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-highlight)] transition-colors flex items-center gap-2"
                                >
                                    <Hexagon className="w-4 h-4" /> Scan NFC
                                </button>
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-secondary)] transition-colors flex items-center gap-2"
                                >
                                    <Shield className="w-4 h-4" /> Admin
                                </button>
                            </nav>
                            <SimpleWalletButton
                                isConnected={connected}
                                address={accounts[0] || null}
                                balance={balance}
                                network={getNetworkName()}
                                onConnect={connectWallet}
                                onDisconnect={handleDisconnect}
                            />
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <SimpleWalletButton
                                isConnected={connected}
                                address={accounts[0] || null}
                                balance={balance}
                                network={getNetworkName()}
                                onConnect={connectWallet}
                                onDisconnect={handleDisconnect}
                            />
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="ml-4 p-2 rounded-md hover:bg-[var(--color-border)] transition-colors bg-glass"
                            >
                                {isMobileMenuOpen ? <X className="h-6 w-6 text-[var(--color-text-primary)]" /> : <Menu className="h-6 w-6 text-[var(--color-text-primary)]" />}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed top-[72px] left-0 right-0 z-10 bg-glass backdrop-blur-md animate-fade-in border-b border-[var(--color-border-light)]">
                        <nav className="px-6 py-4">
                            <div className="flex flex-col space-y-4">
                                <button
                                    onClick={() => {
                                        navigate('/user');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors py-3 px-4 rounded-lg hover:bg-[rgba(212,175,55,0.1)] flex items-center gap-2"
                                >
                                    <Activity className="w-5 h-5" /> Dashboard
                                </button>
                                <button
                                    onClick={() => {
                                        navigate('/scan');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-highlight)] transition-colors py-3 px-4 rounded-lg hover:bg-[rgba(29,168,252,0.1)] flex items-center gap-2"
                                >
                                    <Hexagon className="w-5 h-5" /> Scan NFC
                                </button>
                                <button
                                    onClick={() => {
                                        navigate('/admin');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-secondary)] transition-colors py-3 px-4 rounded-lg hover:bg-[rgba(138,94,216,0.1)] flex items-center gap-2"
                                >
                                    <Shield className="w-5 h-5" /> Admin
                                </button>
                            </div>
                        </nav>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 pt-24 pb-16 px-4 bg-[var(--color-background)]">
                    <div className="max-w-7xl mx-auto z-10 relative animate-fade-in">
                        <Outlet />
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-8 px-4 backdrop-blur-md bg-glass z-10 border-t border-[var(--color-border-light)]">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Brand */}
                            <div className="flex flex-col space-y-4">
                                <div className="flex items-center">
                                    <Shield className="h-7 w-7 text-[var(--color-primary)]" />
                                    <span className="ml-2 text-lg font-bold">
                                        <span className="text-gradient">Provenance</span>
                                        <span className="text-[var(--color-text-primary)]">Chain</span>
                                    </span>
                                </div>
                                <p className="text-[var(--color-text-tertiary)] text-sm max-w-xs">
                                    Securing luxury item authenticity through blockchain verification and NFC technology.
                                </p>
                                <div className="flex space-x-3 pt-2">
                                    <a
                                        href="#"
                                        className="w-8 h-8 rounded-full bg-[var(--color-panel)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition-all"
                                    >
                                        <i className="fab fa-twitter text-sm"></i>
                                    </a>
                                    <a
                                        href="#"
                                        className="w-8 h-8 rounded-full bg-[var(--color-panel)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition-all"
                                    >
                                        <i className="fab fa-discord text-sm"></i>
                                    </a>
                                    <a
                                        href="#"
                                        className="w-8 h-8 rounded-full bg-[var(--color-panel)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition-all"
                                    >
                                        <i className="fab fa-github text-sm"></i>
                                    </a>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="flex flex-col space-y-3">
                                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Quick Links</h3>
                                <a href="#" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors text-sm flex items-center">
                                    <ExternalLink className="w-3 h-3 mr-2" /> Dashboard
                                </a>
                                <a href="#" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors text-sm flex items-center">
                                    <ExternalLink className="w-3 h-3 mr-2" /> Scan NFC
                                </a>
                                <a href="#" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors text-sm flex items-center">
                                    <ExternalLink className="w-3 h-3 mr-2" /> Admin Panel
                                </a>
                                <a href="#" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors text-sm flex items-center">
                                    <ExternalLink className="w-3 h-3 mr-2" /> Documentation
                                </a>
                            </div>

                            {/* Legal */}
                            <div className="flex flex-col space-y-3">
                                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Legal</h3>
                                <a href="#" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors text-sm">
                                    Terms of Service
                                </a>
                                <a href="#" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors text-sm">
                                    Privacy Policy
                                </a>
                                <a href="#" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors text-sm">
                                    Cookie Policy
                                </a>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[var(--color-border-light)] flex flex-col md:flex-row justify-between items-center">
                            <p className="text-[var(--color-text-tertiary)] text-sm">© {new Date().getFullYear()} ProvenanceChain. All rights reserved.</p>
                            <div className="mt-4 md:mt-0 flex items-center">
                                <div className="w-3 h-3 rounded-full bg-[var(--color-success)] mr-2 animate-pulse"></div>
                                <span className="text-[var(--color-text-tertiary)] text-sm">Network: {getNetworkName()}</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default MainLayout;
