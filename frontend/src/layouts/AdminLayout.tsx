import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Shield, ChevronLeft, Users, Package, Settings, CreditCard, Home, ShoppingBag } from 'lucide-react';

const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'NFC Cards', href: '/admin/nfc-cards', icon: CreditCard },
    { name: 'Luxury Authentication', href: '/admin/luxury-authentication', icon: ShoppingBag },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const AdminLayout = () => {
    const [activeSection, setActiveSection] = useState<string>('nfc-cards');
    const navigate = useNavigate();

    const handleSectionChange = (section: string) => {
        setActiveSection(section);
        navigate(`/admin/${section}`);
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Admin Header */}
            <header className="bg-[var(--color-navy)] text-white px-4 md:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    <Shield className="w-6 h-6 mr-2" />
                    <h1 className="text-xl font-medium">Admin Dashboard</h1>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-sm bg-[var(--color-navy-light)] px-3 py-1.5 rounded-md hover:bg-[var(--color-navy-dark)] transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to App
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-[var(--color-border)] hidden md:block overflow-y-auto">
                    <nav className="p-4">
                        <div className="mb-6">
                            <h2 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">NFC Management</h2>
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                            activeSection === 'nfc-cards'
                                                ? 'bg-[var(--color-sage-light)] text-[var(--color-navy)]'
                                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-cream)]'
                                        }`}
                                        onClick={() => handleSectionChange('nfc-cards')}
                                    >
                                        <CreditCard className="w-4 h-4 mr-3" />
                                        NFC Cards
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                            activeSection === 'luxury-authentication'
                                                ? 'bg-[var(--color-sage-light)] text-[var(--color-navy)]'
                                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-cream)]'
                                        }`}
                                        onClick={() => handleSectionChange('luxury-authentication')}
                                    >
                                        <ShoppingBag className="w-4 h-4 mr-3" />
                                        Luxury Authentication
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                            activeSection === 'items'
                                                ? 'bg-[var(--color-sage-light)] text-[var(--color-navy)]'
                                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-cream)]'
                                        }`}
                                        onClick={() => handleSectionChange('items')}
                                    >
                                        <Package className="w-4 h-4 mr-3" />
                                        Luxury Items
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">System</h2>
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                            activeSection === 'users'
                                                ? 'bg-[var(--color-sage-light)] text-[var(--color-navy)]'
                                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-cream)]'
                                        }`}
                                        onClick={() => handleSectionChange('users')}
                                    >
                                        <Users className="w-4 h-4 mr-3" />
                                        Users
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                            activeSection === 'settings'
                                                ? 'bg-[var(--color-sage-light)] text-[var(--color-navy)]'
                                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-cream)]'
                                        }`}
                                        onClick={() => handleSectionChange('settings')}
                                    >
                                        <Settings className="w-4 h-4 mr-3" />
                                        Settings
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </nav>
                </aside>

                {/* Mobile Nav */}
                <div className="md:hidden bg-white border-b border-[var(--color-border)] w-full px-4 py-2 flex items-center space-x-3 overflow-x-auto">
                    <button
                        className={`flex-shrink-0 px-3 py-1 text-sm rounded-full transition-colors ${
                            activeSection === 'nfc-cards' ? 'bg-[var(--color-sage-light)] text-[var(--color-navy)]' : 'bg-[var(--color-cream)] text-[var(--color-text-secondary)]'
                        }`}
                        onClick={() => handleSectionChange('nfc-cards')}
                    >
                        NFC Cards
                    </button>
                    <button
                        className={`flex-shrink-0 px-3 py-1 text-sm rounded-full transition-colors ${
                            activeSection === 'luxury-authentication'
                                ? 'bg-[var(--color-sage-light)] text-[var(--color-navy)]'
                                : 'bg-[var(--color-cream)] text-[var(--color-text-secondary)]'
                        }`}
                        onClick={() => handleSectionChange('luxury-authentication')}
                    >
                        Luxury Authentication
                    </button>
                    <button
                        className={`flex-shrink-0 px-3 py-1 text-sm rounded-full transition-colors ${
                            activeSection === 'items' ? 'bg-[var(--color-sage-light)] text-[var(--color-navy)]' : 'bg-[var(--color-cream)] text-[var(--color-text-secondary)]'
                        }`}
                        onClick={() => handleSectionChange('items')}
                    >
                        Luxury Items
                    </button>
                    <button
                        className={`flex-shrink-0 px-3 py-1 text-sm rounded-full transition-colors ${
                            activeSection === 'users' ? 'bg-[var(--color-sage-light)] text-[var(--color-navy)]' : 'bg-[var(--color-cream)] text-[var(--color-text-secondary)]'
                        }`}
                        onClick={() => handleSectionChange('users')}
                    >
                        Users
                    </button>
                    <button
                        className={`flex-shrink-0 px-3 py-1 text-sm rounded-full transition-colors ${
                            activeSection === 'settings' ? 'bg-[var(--color-sage-light)] text-[var(--color-navy)]' : 'bg-[var(--color-cream)] text-[var(--color-text-secondary)]'
                        }`}
                        onClick={() => handleSectionChange('settings')}
                    >
                        Settings
                    </button>
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-[var(--color-cream-light)] p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
