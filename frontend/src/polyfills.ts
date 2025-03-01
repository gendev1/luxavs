// Polyfills for Node.js globals in the browser
// This helps libraries designed for Node.js work in the browser

// Ensure window.global exists
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.global = window;
}

// Ensure process and process.env exist
if (typeof window.process === 'undefined') {
    // @ts-ignore
    window.process = { env: {} };
}

export {};
