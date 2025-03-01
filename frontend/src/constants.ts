// Contract addresses from environment variables or fallback to defaults
export const MARKETPLACE_CONTRACT_ADDRESS = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || '0x123456789...';
export const FACTORY_CONTRACT_ADDRESS = import.meta.env.VITE_FACTORY_CONTRACT_ADDRESS || '0x987654321...';

// Network IDs
export const NETWORK_IDS = {
    MAINNET: 1,
    GOERLI: 5,
    SEPOLIA: 11155111,
    HOLESKY: 17000,
};

// Networks with ENS support
export const ENS_SUPPORTED_NETWORKS = [NETWORK_IDS.MAINNET, NETWORK_IDS.GOERLI, NETWORK_IDS.SEPOLIA];

// Network names
export const NETWORK_NAMES: Record<number, string> = {
    [NETWORK_IDS.MAINNET]: 'Ethereum Mainnet',
    [NETWORK_IDS.GOERLI]: 'Goerli Testnet',
    [NETWORK_IDS.SEPOLIA]: 'Sepolia Testnet',
    [NETWORK_IDS.HOLESKY]: 'Holesky Testnet',
};
