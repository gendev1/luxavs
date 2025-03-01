import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, QrCode, BookOpen, LogOut, ChevronRight, User } from 'lucide-react';
import { getWalletAddress } from '../../services/contractService';

const UserLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

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

    // Close sidebar on mobile when location changes
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);

    const navItems = [
        {
            name: 'Dashboard',
            path: '/user',
            icon: <Home className="w-5 h-5" />,
        },
        {
            name: 'Scan NFC',
            path: '/user/scan',
            icon: <QrCode className="w-5 h-5" />,
        },
        {
            name: 'Collections',
            path: '/user/collections',
            icon: <BookOpen className="w-5 h-5" />,
        },
    ];

    const handleLogout = () => {
        // In a real app, this would clear auth state/tokens
        navigate('/');
    };

    const formatWalletAddress = (address: string | null) => {
        if (!address) return 'Not Connected';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    return (
        <div className="flex h-full">
            {/* Sidebar - desktop */}
            <div className="hidden md:flex w-64 flex-col bg-[var(--color-card)] border-r border-[var(--color-border)]">
                {/* Sidebar Header */}
                <div className="px-6 py-5 border-b border-[var(--color-border)]">
                    <h2 className="text-xl font-medium text-[var(--color-text-primary)]">User Portal</h2>
                    <div className="flex items-center mt-2 text-sm">
                        <User className="w-4 h-4 mr-1.5 text-[var(--color-gold)]" />
                        <span className="text-[var(--color-text-secondary)]">{formatWalletAddress(walletAddress)}</span>
                    </div>
                </div>

                {/* Sidebar Nav */}
                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                                        location.pathname === item.path
                                            ? 'bg-[var(--color-card-accent)] text-[var(--color-gold)] border border-[var(--color-border-dark)]'
                                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] hover:bg-[var(--color-card-accent)]'
                                    }`}
                                >
                                    <div className={`mr-3 ${location.pathname === item.path ? 'text-[var(--color-gold)]' : ''}`}>{item.icon}</div>
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-3 border-t border-[var(--color-border)]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center py-2.5 px-4 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] hover:bg-[var(--color-card-accent)] transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                    </button>
                </div>
            </div>

            {/* Mobile sidebar */}
            <div className={`fixed inset-0 z-50 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/20" onClick={() => setIsSidebarOpen(false)}></div>

                {/* Sidebar */}
                <div className="fixed top-0 left-0 bottom-0 w-64 bg-[var(--color-card)] shadow-xl border-r border-[var(--color-border)]">
                    {/* Close button */}
                    <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                        <h2 className="text-lg font-medium text-[var(--color-text-primary)]">User Portal</h2>
                        <button onClick={() => setIsSidebarOpen(false)}>
                            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                        </button>
                    </div>

                    {/* Wallet address */}
                    <div className="px-4 py-3 border-b border-[var(--color-border)] text-sm">
                        <div className="flex items-center">
                            <User className="w-4 h-4 mr-1.5 text-[var(--color-gold)]" />
                            <span className="text-[var(--color-text-secondary)]">{formatWalletAddress(walletAddress)}</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="py-3">
                        <ul className="space-y-1 px-3">
                            {navItems.map((item) => (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                                            location.pathname === item.path
                                                ? 'bg-[var(--color-card-accent)] text-[var(--color-gold)] border border-[var(--color-border-dark)]'
                                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] hover:bg-[var(--color-card-accent)]'
                                        }`}
                                    >
                                        <div className={`mr-3 ${location.pathname === item.path ? 'text-[var(--color-gold)]' : ''}`}>{item.icon}</div>
                                        {item.name}
                                        <ChevronRight className="w-4 h-4 ml-auto" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Logout */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[var(--color-border)]">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center py-2.5 px-4 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] hover:bg-[var(--color-card-accent)] transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-card)]">
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="w-6 h-6 text-[var(--color-text-secondary)]" />
                    </button>
                    <h1 className="text-lg font-medium text-[var(--color-text-primary)]">User Portal</h1>
                    <div className="w-6"></div> {/* Empty div for centering */}
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto py-6 px-4 md:px-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default UserLayout;
