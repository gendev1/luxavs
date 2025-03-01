import { createAppKit } from '@reown/appkit/react';

import { WagmiProvider } from 'wagmi';
import { holesky, zksyncSepoliaTestnet, mainnet, AppKitNetwork } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId from https://cloud.reown.com
const projectId = '70dd2f5512b2b403ceab3b9dc3b8cfff';

// 2. Create a metadata object - optional
const metadata = {
    name: 'Providence',
    description: 'AppKit Example',
    url: 'https://reown.com/appkit', // origin must match your domain & subdomain
    icons: ['https://assets.reown.com/reown-profile-pic.png'],
};

// 3. Set the networks
const networks: AppKitNetwork[] = [holesky, zksyncSepoliaTestnet, mainnet];

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    ssr: true,
});

// 5. Create modal and export the appKit instance
// eslint-disable-next-line react-refresh/only-export-components
export const appKit = createAppKit({
    adapters: [wagmiAdapter],
    networks: networks as [AppKitNetwork, ...AppKitNetwork[]],
    projectId,
    metadata,
    features: {
        analytics: true, // Optional - defaults to your Cloud configuration
    },
});

export function AppKitProvider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    );
}
