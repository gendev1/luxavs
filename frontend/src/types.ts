export interface ProductMetadata {
    brand?: string;
    model?: string;
    serialNumber?: string;
    manufactureDate?: string;
    retailPrice?: string;
    materials?: string[];
    authenticityFeatures?: string[];
}

export interface ReceiptMetadata {
    storeName?: string;
    purchaseDate?: string;
    totalAmount?: string;
    paymentMethod?: string;
    itemsPurchased?: Array<{
        description: string;
        price: string;
        quantity?: string;
    }>;
}

export interface VerificationResult {
    isAuthentic: boolean;
    confidence: number;
    details: string;
    verificationId: string;
    authenticityMarkers?: string[];
    potentialIssues?: string[];
    recommendedActions?: string[];
    productMetadata?: {
        brand: string;
        model: string;
        serialNumber: string;
        manufactureDate: string;
        retailPrice: string;
        materials: string[];
        authenticityFeatures: string[];
    };
    receiptMetadata?: {
        storeName: string;
        purchaseDate: string;
        itemsPurchased: Array<{
            description: string;
            price: string;
            quantity: string;
        }>;
        totalAmount: string;
        paymentMethod: string;
    };
}

export interface GenerationRequest {
    prompt: string;
    negative_prompt?: string;
    model_name?: string;
    width?: number;
    height?: number;
    num_images?: number;
    guidance_scale?: number;
    steps?: number;
}

export interface GenerationResponse {
    success: boolean;
    images?: string[];
    error?: string;
}

export interface AnalysisRequest {
    image: File;
    analysis_type: 'authenticity' | 'attributes' | 'comprehensive';
}

export interface AnalysisResult {
    success: boolean;
    analysis?: {
        authenticity_score?: number;
        attributes?: Record<string, string | number>;
        brand?: string;
        model?: string;
        year?: string;
        condition?: string;
        unique_identifiers?: string[];
        description?: string;
    };
    error?: string;
}

export interface CollectionItem {
    id: string;
    name: string;
    itemCount: number;
    value: string;
    thumbnail: string;
}

export interface AuthenticatedItem extends VerificationResult {
    id: string;
    name: string;
    description: string;
    category: string;
    year: string;
    condition: string;
    thumbnail: string;
    tokenId: string;
    ipfsHash: string;
    blockchainTxHash: string;
    nftTokenId: string;
    mintingDate: string;
    isVerified: boolean;
}

export interface UploadResultData {
    itemName: string;
    ipfsHash: string;
    imageUrl: string;
    tokenId?: string;
    txHash?: string;
}
