// Type definitions for window.ethereum (MetaMask and other Web3 providers)
interface Window {
    ethereum?: {
        isMetaMask?: boolean;
        request: (request: { method: string; params?: any[] }) => Promise<any>;
        on: (event: string, callback: (...args: any[]) => void) => void;
        removeListener: (event: string, callback: (...args: any[]) => void) => void;
        selectedAddress?: string;
        chainId?: string;
    };
}
