import { PinataSDK } from 'pinata-web3';

const pinata = new PinataSDK({
    pinataJwt: import.meta.env.VITE_PINATA_JWT || 'your-jwt-here',
    pinataGateway: import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud',
});

// Define interfaces for Pinata responses
interface PinataUploadResult {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
    isDuplicate?: boolean;
}

// Original functions
export const uploadFileToIpfs = async (file: File, metadata?: Record<string, unknown>): Promise<PinataUploadResult> => {
    const result = await pinata.upload.file(file, metadata);
    return result;
};

export const uploadJsonToIpfs = async (json: Record<string, unknown>): Promise<PinataUploadResult> => {
    const result = await pinata.upload.json(json);
    return result;
};

export const getFileFromIpfs = async (cid: string) => {
    const result = await pinata.gateways.get(cid);
    return result;
};

// Define interfaces for return types
interface IPFSResponse {
    success: boolean;
    hash?: string;
    url?: string;
    error?: string;
}

interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
    created_at: string;
}

// New functions needed by ItemUpload.tsx
export const uploadToIPFS = async (file: File): Promise<IPFSResponse> => {
    try {
        // Create metadata for the file
        const metadata = {
            pinataMetadata: {
                name: file.name,
            },
        };

        const result = await uploadFileToIpfs(file, metadata);

        return {
            success: true,
            hash: result.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        };
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upload file to IPFS',
        };
    }
};

export const prepareNFTMetadata = (name: string, description: string, imageHash: string, attributes: Array<{ trait_type: string; value: string }>): NFTMetadata => {
    return {
        name,
        description,
        image: `ipfs://${imageHash}`,
        attributes,
        created_at: new Date().toISOString(),
    };
};

export const uploadMetadataToIPFS = async (metadata: NFTMetadata): Promise<IPFSResponse> => {
    try {
        // Convert metadata to a plain object before passing to uploadJsonToIpfs
        const result = await uploadJsonToIpfs(metadata as unknown as Record<string, unknown>);

        return {
            success: true,
            hash: result.IpfsHash,
            url: `ipfs://${result.IpfsHash}`,
        };
    } catch (error) {
        console.error('Error uploading metadata to IPFS:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upload metadata to IPFS',
        };
    }
};
