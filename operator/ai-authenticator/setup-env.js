// Setup Environment Script for AI Operator
// This script helps to find and set up environment variables for the AI operator

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

console.log('============================================');
console.log('AI Operator Environment Setup Helper');
console.log('============================================');

// Load existing .env file if it exists
let envPath = path.resolve(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
    envPath = path.resolve(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
        envPath = path.resolve(__dirname, '.env');
    }
}

let existingEnv = {};
if (fs.existsSync(envPath)) {
    console.log(`Loading existing environment from ${envPath}`);
    existingEnv = dotenv.parse(fs.readFileSync(envPath));
} else {
    console.log('No existing .env file found, will create a new one');
    envPath = path.resolve(__dirname, '../../.env');
}

// Find chainId - check if running local node
let chainId = process.env.CHAIN_ID || existingEnv.CHAIN_ID || '31337';
console.log(`Using chain ID: ${chainId}`);

// Check for deployment files
const deploymentPaths = [
    path.resolve(__dirname, `../../contracts/deployments/${chainId}.json`),
    path.resolve(__dirname, `../../deployments/${chainId}.json`),
    path.resolve(__dirname, `../../contracts/deployment/${chainId}.json`),
    path.resolve(__dirname, `../../deployment/${chainId}.json`),
    path.resolve(__dirname, `../../contracts/deployed-addresses.json`),
    path.resolve(__dirname, '../../contracts/broadcast/Deploy.s.sol/31337/run-latest.json'),
    path.resolve(__dirname, '../../contracts/broadcast/deploylux.s.sol/31337/run-latest.json'),
];

let deploymentData = null;
let deploymentPath = null;

for (const p of deploymentPaths) {
    if (fs.existsSync(p)) {
        try {
            console.log(`Found deployment data at: ${p}`);
            deploymentData = JSON.parse(fs.readFileSync(p, 'utf8'));
            deploymentPath = p;
            break;
        } catch (e) {
            console.log(`Error reading deployment file ${p}: ${e.message}`);
        }
    }
}

// If no deployment file was found
if (!deploymentData) {
    console.log('No deployment files found. Checking if local node is running...');

    // Try to get contract addresses from logs
    try {
        const deployCommand = 'cd ' + path.resolve(__dirname, '../../contracts') + ' && forge script script/deploylux.s.sol --fork-url http://localhost:8545';
        console.log('Running deployment command to get logs...');
        console.log(deployCommand);

        const output = execSync(deployCommand, { encoding: 'utf8' });
        console.log(output);

        // Extract addresses from the logs using regex
        const luxServiceManagerMatch = output.match(/LuxServiceManager deployed at: (0x[a-fA-F0-9]{40})/);
        const authControllerMatch = output.match(/AuthenticationController deployed at: (0x[a-fA-F0-9]{40})/);

        if (luxServiceManagerMatch) {
            existingEnv.LUX_SERVICE_MANAGER_ADDRESS = luxServiceManagerMatch[1];
            console.log(`Found LuxServiceManager address: ${existingEnv.LUX_SERVICE_MANAGER_ADDRESS}`);
        }

        if (authControllerMatch) {
            existingEnv.AUTHENTICATION_CONTROLLER_ADDRESS = authControllerMatch[1];
            console.log(`Found AuthenticationController address: ${existingEnv.AUTHENTICATION_CONTROLLER_ADDRESS}`);
        }
    } catch (e) {
        console.log('Failed to run deployment or extract addresses:', e.message);
        console.log('You will need to manually set contract addresses in your .env file');
    }
}

// Try to extract contract addresses from deployment data
if (deploymentData) {
    console.log('Extracting contract addresses from deployment data...');

    // Check if deployment file is a Forge broadcast
    if (deploymentPath.includes('broadcast') && deploymentData.transactions) {
        console.log('Processing Forge broadcast file...');

        // For Forge broadcast files - find contract creation transactions
        for (const tx of deploymentData.transactions) {
            if (tx.contractName && tx.contractAddress) {
                const contractName = tx.contractName.toLowerCase();
                if (contractName === 'luxservicemanager') {
                    existingEnv.LUX_SERVICE_MANAGER_ADDRESS = tx.contractAddress;
                    console.log(`Found LuxServiceManager address: ${tx.contractAddress}`);
                } else if (contractName === 'authenticationcontroller') {
                    existingEnv.AUTHENTICATION_CONTROLLER_ADDRESS = tx.contractAddress;
                    console.log(`Found AuthenticationController address: ${tx.contractAddress}`);
                }
            }
        }
    } else {
        // Try to find addresses in different formats
        function findAddress(obj, contractName) {
            // Handle direct properties
            if (obj[contractName]) return obj[contractName];
            if (obj[contractName.toLowerCase()]) return obj[contractName.toLowerCase()];

            // Handle nested properties
            if (obj.addresses && obj.addresses[contractName.toLowerCase()]) return obj.addresses[contractName.toLowerCase()];

            if (obj.deployment && obj.deployment[contractName.toLowerCase()]) return obj.deployment[contractName.toLowerCase()];

            if (obj.contracts && obj.contracts[contractName.toLowerCase()]) return obj.contracts[contractName.toLowerCase()];

            // Try different naming conventions
            if (obj[`${contractName}Address`]) return obj[`${contractName}Address`];
            if (obj[`${contractName.toLowerCase()}Address`]) return obj[`${contractName.toLowerCase()}Address`];

            // Deep search in object
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    // If key contains the contract name, check if it's an address
                    if (key.toLowerCase().includes(contractName.toLowerCase())) {
                        if (typeof obj[key] === 'string' && obj[key].startsWith('0x')) {
                            return obj[key];
                        }
                        // If it's an object, it might contain an address property
                        if (typeof obj[key] === 'object' && obj[key].address) {
                            return obj[key].address;
                        }
                    }

                    // Recursively search nested object
                    const result = findAddress(obj[key], contractName);
                    if (result) return result;
                }
            }

            return null;
        }

        const luxServiceManagerAddress = findAddress(deploymentData, 'luxServiceManager');
        if (luxServiceManagerAddress) {
            existingEnv.LUX_SERVICE_MANAGER_ADDRESS = luxServiceManagerAddress;
            console.log(`Found LuxServiceManager address: ${luxServiceManagerAddress}`);
        }

        const authControllerAddress = findAddress(deploymentData, 'authenticationController');
        if (authControllerAddress) {
            existingEnv.AUTHENTICATION_CONTROLLER_ADDRESS = authControllerAddress;
            console.log(`Found AuthenticationController address: ${authControllerAddress}`);
        }
    }
}

// Set default values for other required environment variables
if (!existingEnv.RPC_URL) {
    existingEnv.RPC_URL = 'http://localhost:8545';
    console.log(`Set default RPC_URL: ${existingEnv.RPC_URL}`);
}

if (!existingEnv.PRIVATE_KEY) {
    // Use test private key for local development
    if (chainId === '31337' || chainId === '1337') {
        existingEnv.PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Anvil default key
        console.log('Set default PRIVATE_KEY (Anvil/Hardhat default account)');
    } else {
        console.log('WARNING: PRIVATE_KEY not set in .env file');
    }
}

if (!existingEnv.CHAIN_ID) {
    existingEnv.CHAIN_ID = chainId;
    console.log(`Set CHAIN_ID: ${chainId}`);
}

if (!existingEnv.POLLING_INTERVAL) {
    existingEnv.POLLING_INTERVAL = '15000';
    console.log(`Set default POLLING_INTERVAL: ${existingEnv.POLLING_INTERVAL}ms`);
}

// Check if we have the required addresses
if (!existingEnv.LUX_SERVICE_MANAGER_ADDRESS) {
    console.log('WARNING: LUX_SERVICE_MANAGER_ADDRESS not found or set');
    // Set a default for local testing
    if (chainId === '31337' || chainId === '1337') {
        existingEnv.LUX_SERVICE_MANAGER_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
        console.log(`Set default LUX_SERVICE_MANAGER_ADDRESS for local testing: ${existingEnv.LUX_SERVICE_MANAGER_ADDRESS}`);
    }
}

if (!existingEnv.AUTHENTICATION_CONTROLLER_ADDRESS) {
    console.log('WARNING: AUTHENTICATION_CONTROLLER_ADDRESS not found or set');
    // Set a default for local testing
    if (chainId === '31337' || chainId === '1337') {
        existingEnv.AUTHENTICATION_CONTROLLER_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
        console.log(`Set default AUTHENTICATION_CONTROLLER_ADDRESS for local testing: ${existingEnv.AUTHENTICATION_CONTROLLER_ADDRESS}`);
    }
}

// Generate .env file contents
const envContents = Object.entries(existingEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

// Write .env file
fs.writeFileSync(envPath, envContents);
console.log(`Wrote environment variables to ${envPath}`);

console.log('\nEnvironment setup complete!');
console.log('You can now run the AI operator with:');
console.log('node operator/ai-authenticator/ai-operator.js');

console.log('\nYour .env file contains:');
console.log('=========================');
console.log(envContents);
console.log('=========================');

if (!existingEnv.LUX_SERVICE_MANAGER_ADDRESS || !existingEnv.AUTHENTICATION_CONTROLLER_ADDRESS) {
    console.log('\n⚠️ WARNING: Some required contract addresses are missing.');
    console.log('Please manually add them to your .env file before running the operator.');
}
