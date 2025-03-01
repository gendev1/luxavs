import { useState, useEffect } from 'react';
import { Loader, Search, CheckCircle, XCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { getBuyRequests, approveSale } from '../../services/contractService';

interface BuyRequest {
    id: string;
    tokenId: string;
    itemName: string;
    buyerAddress: string;
    price: string;
    requestDate: string;
    status: 'pending' | 'approved' | 'rejected';
}

const Purchases = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Mock loading of buy requests - in a real app, you would fetch this from the blockchain
    useEffect(() => {
        const loadExampleRequests = () => {
            setBuyRequests([
                {
                    id: '1',
                    tokenId: '1',
                    itemName: 'Luxury Watch - Rolex Submariner',
                    buyerAddress: '0x1234567890123456789012345678901234567890',
                    price: '0.5',
                    requestDate: '2023-05-15T14:30:00Z',
                    status: 'pending',
                },
                {
                    id: '2',
                    tokenId: '2',
                    itemName: 'Vintage Handbag - Chanel Classic',
                    buyerAddress: '0x2345678901234567890123456789012345678901',
                    price: '1.2',
                    requestDate: '2023-05-14T10:15:00Z',
                    status: 'approved',
                },
                {
                    id: '3',
                    tokenId: '3',
                    itemName: 'Limited Edition Sneakers - Nike Air Jordan',
                    buyerAddress: '0x3456789012345678901234567890123456789012',
                    price: '0.3',
                    requestDate: '2023-05-16T09:45:00Z',
                    status: 'pending',
                },
                {
                    id: '4',
                    tokenId: '1',
                    itemName: 'Luxury Watch - Rolex Submariner',
                    buyerAddress: '0x4567890123456789012345678901234567890123',
                    price: '0.5',
                    requestDate: '2023-05-13T16:20:00Z',
                    status: 'rejected',
                },
            ]);
        };

        loadExampleRequests();
    }, []);

    const handleApproveSale = async (requestId: string, tokenId: string) => {
        setProcessingId(requestId);
        setError(null);
        setSuccess(null);

        try {
            // Call the contract method to approve the sale
            const result = await approveSale(tokenId, requestId);

            if (result.success) {
                // Update the request status in our list
                setBuyRequests((prevRequests) => prevRequests.map((request) => (request.id === requestId ? { ...request, status: 'approved' as const } : request)));

                setSuccess(`Successfully approved sale for request #${requestId}`);
            } else {
                setError(result.error || 'Failed to approve sale');
            }
        } catch (err) {
            console.error('Error approving sale:', err);
            setError('An error occurred while approving the sale');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectSale = async (requestId: string) => {
        setProcessingId(requestId);
        setError(null);
        setSuccess(null);

        try {
            // In a real application, you would call a contract method to reject the sale
            // For now, we'll just update the UI

            // Simulate API call delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Update the request status in our list
            setBuyRequests((prevRequests) => prevRequests.map((request) => (request.id === requestId ? { ...request, status: 'rejected' as const } : request)));

            setSuccess(`Successfully rejected sale for request #${requestId}`);
        } catch (err) {
            console.error('Error rejecting sale:', err);
            setError('An error occurred while rejecting the sale');
        } finally {
            setProcessingId(null);
        }
    };

    // Filter buy requests based on search term and status filter
    const filteredRequests = buyRequests.filter((request) => {
        const matchesSearch =
            request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.tokenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.buyerAddress.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Format date string
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-medium text-[var(--color-text-primary)]">Purchase Requests</h1>

                <button className="elegant-button-primary flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Requests
                </button>
            </div>

            {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md">{error}</div>}

            {success && <div className="text-green-600 text-sm p-3 bg-green-50 rounded-md">{success}</div>}

            {/* Purchases List */}
            <div className="elegant-card p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-lg font-medium text-[var(--color-text-primary)]">Item Purchase Requests</h2>

                    <div className="flex flex-col md:flex-row gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search requests..."
                                className="pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-md text-sm w-full md:w-auto"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] w-4 h-4" />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-[var(--color-border)] rounded-md text-sm bg-white"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--color-border)]">
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Request ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Token ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Item</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Buyer</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Price</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Request Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredRequests.length > 0 ? (
                                filteredRequests.map((request) => (
                                    <tr key={request.id} className="hover:bg-[var(--color-cream-light)]">
                                        <td className="px-4 py-4 text-sm">{request.id}</td>
                                        <td className="px-4 py-4 text-sm">{request.tokenId}</td>
                                        <td className="px-4 py-4 text-sm font-medium">{request.itemName}</td>
                                        <td className="px-4 py-4 text-sm font-mono">
                                            {request.buyerAddress.substring(0, 6)}...{request.buyerAddress.substring(request.buyerAddress.length - 4)}
                                        </td>
                                        <td className="px-4 py-4 text-sm">{request.price} ETH</td>
                                        <td className="px-4 py-4 text-sm">{formatDate(request.requestDate)}</td>
                                        <td className="px-4 py-4 text-sm">
                                            {request.status === 'pending' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>}
                                            {request.status === 'approved' && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Approved</span>}
                                            {request.status === 'rejected' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Rejected</span>}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-center">
                                            {request.status === 'pending' ? (
                                                <div className="flex space-x-2 justify-center">
                                                    <button
                                                        onClick={() => handleApproveSale(request.id, request.tokenId)}
                                                        disabled={!!processingId}
                                                        className={`elegant-button-small bg-green-50 text-green-600 hover:bg-green-100 ${
                                                            processingId === request.id ? 'opacity-70' : ''
                                                        }`}
                                                    >
                                                        {processingId === request.id ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectSale(request.id)}
                                                        disabled={!!processingId}
                                                        className={`elegant-button-small bg-red-50 text-red-600 hover:bg-red-100 ${
                                                            processingId === request.id ? 'opacity-70' : ''
                                                        }`}
                                                    >
                                                        {processingId === request.id ? <Loader className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-[var(--color-text-tertiary)] text-xs">
                                                    {request.status === 'approved' ? 'Sale completed' : 'Request rejected'}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-6 text-sm text-center text-[var(--color-text-tertiary)]">
                                        {searchTerm || statusFilter !== 'all' ? 'No requests match your search criteria' : 'No purchase requests found'}
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

export default Purchases;
