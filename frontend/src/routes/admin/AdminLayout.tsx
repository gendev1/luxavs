import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { CreditCard, ShoppingBag, Tag, LayoutDashboard, LogOut, Menu, X, ChevronRight } from 'lucide-react';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    // Navigation items for the admin sidebar
    const navItems = [
        {
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />,
            path: '/admin',
        },
        {
            label: 'NFC Cards',
            icon: <CreditCard className="w-5 h-5" />,
            path: '/admin/nfc-cards',
        },
        {
            label: 'Luxury Items',
            icon: <Tag className="w-5 h-5" />,
            path: '/admin/luxury-items',
        },
        {
            label: 'Purchases',
            icon: <ShoppingBag className="w-5 h-5" />,
            path: '/admin/purchases',
        },
    ];

    const handleLogout = () => {
        // Handle logout logic here
        // For now, just redirect to home
        navigate('/');
    };

    return (
        <div className="min-h-screen h-screen flex">
            {/* Mobile sidebar toggle */}
            <div className="lg:hidden fixed top-0 left-0 z-40 w-full p-4 bg-[var(--color-card)] border-b border-[var(--color-border)] shadow-md">
                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-[var(--color-card-accent)] transition-colors">
                    <Menu className="w-6 h-6 text-[var(--color-text-primary)]" />
                </button>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-medium text-[var(--color-text-primary)]">Admin Panel</div>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed lg:static top-0 left-0 z-50 h-full w-64 bg-[var(--color-card)] shadow-lg transform transition-transform duration-300 ease-in-out border-r border-[var(--color-border)] ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="h-full flex flex-col">
                    {/* Sidebar header */}
                    <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                        <h2 className="text-lg font-medium text-[var(--color-text-primary)]">Admin Panel</h2>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-[var(--color-card-accent)] transition-colors">
                            <X className="w-5 h-5 text-[var(--color-text-primary)]" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-4 overflow-y-auto">
                        <ul className="space-y-1 px-2">
                            {navItems.map((item, index) => (
                                <li key={index}>
                                    <NavLink
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2 rounded-md transition-colors ${
                                                isActive
                                                    ? 'bg-[var(--color-card-accent)] text-[var(--color-gold)] border border-[var(--color-border-dark)]'
                                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card-accent)] hover:text-[var(--color-gold-light)]'
                                            }`
                                        }
                                    >
                                        <span className={`mr-3 ${({ isActive }) => (isActive ? 'text-[var(--color-gold)]' : '')}`}>{item.icon}</span>
                                        <span>{item.label}</span>
                                        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Sidebar footer */}
                    <div className="p-4 border-t border-[var(--color-border)]">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-3 py-2 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-card-accent)] hover:text-[var(--color-gold-light)] transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

            {/* Main content - completely rebuilt */}
            <main className="flex-1 overflow-y-auto bg-[var(--color-background)]">
                <div className="lg:hidden h-14"></div>
                <div className="px-4 lg:px-6 pt-2 pb-6 max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
