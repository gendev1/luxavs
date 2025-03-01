export interface AuthenticatedItem {
    id: string;
    name: string;
    description: string;
    category: string;
    year: string;
    condition: string;
    thumbnail: string;
    details: ItemDetail[];
    provenance: ProvenanceEvent[];
    nfcTagId: string;
    tokenId: string;
    owner: string;
    timestamp: string;
}

export interface ItemDetail {
    label: string;
    value: string;
}

export interface ProvenanceEvent {
    date: string;
    event: string;
    location: string;
}

export interface ContractResponse {
    success: boolean;
    message: string;
    data?: any;
}

export interface NFCCard {
    nfcUrl: string;
    tokenId: string;
    owner: string;
    registered: boolean;
    timestamp?: string;
}

export interface LuxuryItem {
    tokenId: string;
    name: string;
    description: string;
    price: string;
    isListed: boolean;
    owner: string;
    metadata: {
        category: string;
        year: string;
        condition: string;
        material: string;
        serialNumber: string;
    };
}

export interface BuyRequest {
    id: string;
    requester: string;
    tokenId: string;
    itemName: string;
    price: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface DashboardStats {
    totalItems: number;
    totalValue: string;
    pendingRequests: number;
    recentActivity: ActivityEvent[];
}

export interface ActivityEvent {
    id: string;
    type: 'registration' | 'verification' | 'purchase_request' | 'sale';
    description: string;
    timestamp: string;
}

export interface LuxuryItemData {
    name: string;
    description: string;
    category: string;
    year: string;
    condition: string;
    details: ItemDetail[];
    price?: string;
    nfcUrl: string;
    metadata: string;
}
