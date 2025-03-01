import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
    define: {
        // Define a global process.env for Node.js polyfilling
        'process.env': JSON.stringify({
            NODE_ENV: 'development',
        }),
        // Ensure global is defined for libraries that expect it
        global: 'window',
    },
});
