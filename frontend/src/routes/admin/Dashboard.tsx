import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ShoppingBag, Tag, Users, ArrowUp, ArrowDown, Tag as TagIcon, BarChart4, RefreshCw } from 'lucide-react';

interface StatsData {
    registeredNFCCards: number;
    luxuryItems: number;
    purchaseRequests: number;
    pendingRequests: number;
    users: number;
    totalSales: number;
    salesChange: number;
    requestsChange: number;
}

const AdminDashboard = () => {
    const [stats, setStats] = useState<StatsData>({
        registeredNFCCards: 0,
        luxuryItems: 0,
        purchaseRequests: 0,
        pendingRequests: 0,
        users: 0,
        totalSales: 0,
        salesChange: 0,
        requestsChange: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Load mock data for the dashboard
    useEffect(() => {
        const loadStats = () => {
            // Simulate API delay
            setTimeout(() => {
                setStats({
                    registeredNFCCards: 124,
                    luxuryItems: 87,
                    purchaseRequests: 35,
                    pendingRequests: 12,
                    users: 56,
                    totalSales: 42,
                    salesChange: 15.4,
                    requestsChange: -5.2,
                });
                setIsLoading(false);
            }, 1000);
        };

        loadStats();
    }, []);

    // Quick action cards data
    const quickActions = [
        {
            title: 'Register NFC Card',
            description: 'Create a new NFC card and associate a token ID',
            icon: <CreditCard className="w-6 h-6" />,
            link: '/admin/nfc-cards',
            buttonText: 'Register',
        },
        {
            title: 'Create Listing',
            description: 'Add a new luxury item listing',
            icon: <Tag className="w-6 h-6" />,
            link: '/admin/luxury-items',
            buttonText: 'Create',
        },
        {
            title: 'Review Requests',
            description: 'Handle pending purchase requests',
            icon: <ShoppingBag className="w-6 h-6" />,
            link: '/admin/purchases',
            buttonText: 'Review',
        },
    ];

    return (
        <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center mb-1">
                <h1 className="text-2xl font-medium text-[var(--color-text-primary)] relative inline-block">
                    Admin Dashboard
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-gold)]"></span>
                </h1>

                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card-accent)] text-[var(--color-gold)] hover:bg-[var(--color-card)] transition-colors"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="elegant-card p-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-[var(--color-text-tertiary)]">Registered NFC Cards</p>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-[var(--color-card-accent)] animate-pulse rounded mt-1"></div>
                            ) : (
                                <h3 className="text-2xl font-semibold mt-1">{stats.registeredNFCCards}</h3>
                            )}
                        </div>
                        <div className="bg-[var(--color-card-accent)] p-2 rounded-md border border-[var(--color-border)]">
                            <CreditCard className="w-5 h-5 text-[var(--color-gold)]" />
                        </div>
                    </div>
                </div>

                <div className="elegant-card p-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-[var(--color-text-tertiary)]">Luxury Items</p>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-[var(--color-card-accent)] animate-pulse rounded mt-1"></div>
                            ) : (
                                <h3 className="text-2xl font-semibold mt-1">{stats.luxuryItems}</h3>
                            )}
                        </div>
                        <div className="bg-[var(--color-card-accent)] p-2 rounded-md border border-[var(--color-border)]">
                            <Tag className="w-5 h-5 text-[var(--color-gold)]" />
                        </div>
                    </div>
                </div>

                <div className="elegant-card p-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-[var(--color-text-tertiary)]">Purchase Requests</p>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-[var(--color-card-accent)] animate-pulse rounded mt-1"></div>
                            ) : (
                                <div>
                                    <h3 className="text-2xl font-semibold mt-1">{stats.purchaseRequests}</h3>
                                    <div className={`flex items-center text-xs mt-1 ${stats.requestsChange >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                                        {stats.requestsChange >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                        <span>{Math.abs(stats.requestsChange)}% from last month</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="bg-[var(--color-card-accent)] p-2 rounded-md border border-[var(--color-border)]">
                            <ShoppingBag className="w-5 h-5 text-[var(--color-gold)]" />
                        </div>
                    </div>
                </div>

                <div className="elegant-card p-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-[var(--color-text-tertiary)]">Total Sales</p>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-[var(--color-card-accent)] animate-pulse rounded mt-1"></div>
                            ) : (
                                <div>
                                    <h3 className="text-2xl font-semibold mt-1">{stats.totalSales}</h3>
                                    <div className={`flex items-center text-xs mt-1 ${stats.salesChange >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                                        {stats.salesChange >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                        <span>{Math.abs(stats.salesChange)}% from last month</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="bg-[var(--color-card-accent)] p-2 rounded-md border border-[var(--color-border)]">
                            <BarChart4 className="w-5 h-5 text-[var(--color-gold)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Alerts */}
            <div className="elegant-card p-3">
                <h2 className="text-lg font-medium mb-1.5 flex items-center">
                    <span className="w-1 h-5 bg-[var(--color-gold)] mr-2 rounded-full"></span>
                    Pending Alerts
                </h2>

                {isLoading ? (
                    <div className="space-y-1.5">
                        <div className="h-10 bg-[var(--color-card-accent)] animate-pulse rounded"></div>
                        <div className="h-10 bg-[var(--color-card-accent)] animate-pulse rounded"></div>
                    </div>
                ) : (
                    <div>
                        {stats.pendingRequests > 0 ? (
                            <div className="flex items-center justify-between p-2 bg-[rgba(249,203,78,0.1)] rounded-md border border-[rgba(249,203,78,0.2)] mb-2">
                                <div className="flex items-center">
                                    <ShoppingBag className="w-5 h-5 text-[var(--color-warning)] mr-2" />
                                    <span>
                                        You have <span className="font-medium text-[var(--color-warning)]">{stats.pendingRequests} pending</span> purchase requests to review
                                    </span>
                                </div>
                                <Link to="/admin/purchases" className="elegant-button-secondary text-sm px-3 py-1">
                                    Review
                                </Link>
                            </div>
                        ) : (
                            <div className="p-2 text-[var(--color-text-tertiary)] bg-[var(--color-card-accent)] rounded-md border border-[var(--color-border)]">
                                No pending alerts at this time
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-medium mb-1.5 flex items-center">
                    <span className="w-1 h-5 bg-[var(--color-gold)] mr-2 rounded-full"></span>
                    Quick Actions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {quickActions.map((action, index) => (
                        <div key={index} className="elegant-card p-3 hover:border-[var(--color-gold)] transition-colors">
                            <div className="flex flex-col h-full justify-between">
                                <div>
                                    <div className="bg-[var(--color-card-accent)] w-8 h-8 flex items-center justify-center rounded-md mb-2 border border-[var(--color-border)]">
                                        <span className="text-[var(--color-gold)]">{action.icon}</span>
                                    </div>
                                    <h3 className="font-medium text-[var(--color-text-primary)] mb-1">{action.title}</h3>
                                    <p className="text-sm text-[var(--color-text-tertiary)] mb-2">{action.description}</p>
                                </div>
                                <Link to={action.link} className="elegant-button-secondary w-full py-1.5 text-sm text-center">
                                    {action.buttonText}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity - Could be implemented with a list of recent transactions */}
        </div>
    );
};

export default AdminDashboard;
