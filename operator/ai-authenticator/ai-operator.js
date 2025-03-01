// AI Operator for Collectible Authentication Platform
// This script monitors the LuxServiceManager for new tasks and processes them

const { ethers } = require('ethers');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check if we're using ethers v5 or v6
const isEthersV6 = ethers.version && parseInt(ethers.version.split('.')[0]) >= 6;
console.log(`Using ethers.js version: ${isEthersV6 ? 'v6+' : 'v5'}`);

// Helper function to safely convert big numbers from either ethers v5 or v6
function safeNumberConversion(value) {
    // If it's already a plain number
    if (typeof value === 'number') return value;

    // For strings that might be numbers
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);

    try {
        // For ethers v5 BigNumber
        if (typeof value.toNumber === 'function') return value.toNumber();

        // For ethers v6 or other BigInt-like
        if (typeof value === 'bigint' || typeof value.toBigInt === 'function') {
            const bigIntVal = typeof value === 'bigint' ? value : value.toBigInt();
            // Convert safely - check if in safe integer range
            if (bigIntVal <= BigInt(Number.MAX_SAFE_INTEGER)) {
                return Number(bigIntVal);
            }
            console.warn('BigInt value is too large for safe conversion to Number');
            return Number(bigIntVal); // Will lose precision but continue
        }

        // For plain objects that might be hexadecimal strings
        if (typeof value === 'object' && value.toString) {
            const strValue = value.toString();
            if (strValue.startsWith('0x')) {
                return parseInt(strValue, 16);
            }
            return Number(strValue);
        }
    } catch (e) {
        console.warn(`Error converting value to number: ${e.message}`, value);
    }

    // Last resort - try direct conversion
    return Number(value);
}

// Load deployment data and ABIs
let deploymentData;
const chainId = process.env.CHAIN_ID || 31337;

// Try to load deployment data - add more potential paths
try {
    // Try multiple possible locations for deployment data
    const deploymentPaths = [
        path.resolve(__dirname, `../../contracts/deployments/${chainId}.json`),
        path.resolve(__dirname, `../../deployments/${chainId}.json`),
        path.resolve(__dirname, `../../contracts/deployments/lux-protocol/${chainId}.json`),
        // Add more potential paths
        path.resolve(__dirname, `../../contracts/deployment/${chainId}.json`),
        path.resolve(__dirname, `../../deployment/${chainId}.json`),
        path.resolve(__dirname, `../../contracts/deployed-addresses.json`),
        path.resolve(__dirname, '../..', `addresses-${chainId}.json`),
    ];

    // Print all paths we're checking
    console.log('Checking the following paths for deployment data:');
    deploymentPaths.forEach((p) => console.log(`- ${p}`));

    let foundDeployment = false;
    for (const deploymentPath of deploymentPaths) {
        if (fs.existsSync(deploymentPath)) {
            console.log(`Loading deployment data from: ${deploymentPath}`);
            deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
            console.log('Deployment data structure:', Object.keys(deploymentData));
            foundDeployment = true;
            break;
        }
    }

    if (!foundDeployment) {
        console.log('No deployment file found, will try to use environment variables');
    }
} catch (error) {
    console.error('Error loading deployment data:', error);
    console.log('Will try to use environment variables instead');
}

// Try to load ABIs
function loadAbi(contractName) {
    const abiPaths = [
        path.resolve(__dirname, `../../abis/${contractName}.json`),
        path.resolve(__dirname, `../../contracts/out/${contractName}.sol/${contractName}.json`),
        path.resolve(__dirname, `../../contracts/artifacts/src/${contractName}.sol/${contractName}.json`),
        // Add forge-style artifact path
        path.resolve(__dirname, `../../contracts/out/${contractName}.sol/${contractName}.json`),
        // Add hardhat-style artifact path
        path.resolve(__dirname, `../../contracts/artifacts/contracts/src/${contractName}.sol/${contractName}.json`),
    ];

    for (const abiPath of abiPaths) {
        try {
            if (fs.existsSync(abiPath)) {
                console.log(`Loading ${contractName} ABI from: ${abiPath}`);
                const abiData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
                // Handle different ABI formats
                if (abiData.abi) return abiData.abi;
                return abiData;
            }
        } catch (e) {
            console.log(`Failed to load ABI from ${abiPath}: ${e.message}`);
        }
    }

    throw new Error(`Could not find ABI for ${contractName}`);
}

// Load ABIs
let LuxServiceManagerABI, AuthenticationControllerABI;
try {
    LuxServiceManagerABI = loadAbi('LuxServiceManager');
    AuthenticationControllerABI = loadAbi('AuthenticationController');
} catch (error) {
    console.error('Error loading ABIs:', error);
    process.exit(1);
}

// Resolve contract addresses - improved with more formats and fallbacks
function resolveContractAddress(contractName) {
    console.log(`Attempting to resolve address for ${contractName}...`);

    // First check environment variables - try multiple formats
    const envVarName = `${contractName.toUpperCase()}_ADDRESS`;
    const altEnvVarName = contractName.toUpperCase();

    if (process.env[envVarName]) {
        console.log(`Using ${contractName} address from environment: ${process.env[envVarName]}`);
        return process.env[envVarName];
    }

    if (process.env[altEnvVarName]) {
        console.log(`Using ${contractName} address from environment variable ${altEnvVarName}: ${process.env[altEnvVarName]}`);
        return process.env[altEnvVarName];
    }

    // Then check deployment data with exhaustive format checking
    if (deploymentData) {
        console.log(`Checking deployment data for ${contractName} address...`);

        // Log the structure to help debug
        console.log('Deployment data structure:', Object.keys(deploymentData));

        // Common formats
        const formats = [
            // Direct property
            deploymentData[contractName],
            deploymentData[contractName.toLowerCase()],
            deploymentData[contractName.toUpperCase()],

            // Nested under addresses
            deploymentData.addresses && deploymentData.addresses[contractName],
            deploymentData.addresses && deploymentData.addresses[contractName.toLowerCase()],

            // Nested under deployment
            deploymentData.deployment && deploymentData.deployment[contractName],
            deploymentData.deployment && deploymentData.deployment[contractName.toLowerCase()],

            // Nested under contracts
            deploymentData.contracts && deploymentData.contracts[contractName],
            deploymentData.contracts && deploymentData.contracts[contractName.toLowerCase()],

            // Special cases for some deployment formats
            deploymentData[`${contractName}Address`],
            deploymentData[`${contractName.toLowerCase()}Address`],
        ];

        // Check all formats
        for (const address of formats) {
            if (address) {
                console.log(`Found ${contractName} address in deployment data: ${address}`);
                return address;
            }
        }

        // Last attempt - try to search recursively through the object
        console.log('Trying deep search for address...');
        const result = findAddressInObject(deploymentData, contractName);
        if (result) {
            console.log(`Found ${contractName} address through deep search: ${result}`);
            return result;
        }

        console.log(`Could not find ${contractName} address in deployment data`);
    }

    // Fallback for testing - if this is a test environment, use a default address
    if (chainId === 31337 || chainId === 1337) {
        // This is likely a local development environment
        console.warn(`⚠️ USING FALLBACK ADDRESS for ${contractName} in development environment!`);
        console.warn('This should only be used for testing purposes');

        // Check if we can read from the Anvil/Hardhat deployment
        try {
            // For hardhat/anvil test environments - attempt to read from a known location
            const testDeploymentPaths = [
                path.resolve(__dirname, '../../contracts/broadcast/Deploy.s.sol/31337/run-latest.json'),
                path.resolve(__dirname, '../../contracts/broadcast/deploylux.s.sol/31337/run-latest.json'),
                path.resolve(__dirname, '../../broadcast/Deploy.s.sol/31337/run-latest.json'),
            ];

            for (const testPath of testDeploymentPaths) {
                if (fs.existsSync(testPath)) {
                    console.log(`Found Anvil/Forge deployment at ${testPath}`);
                    const testDeployment = JSON.parse(fs.readFileSync(testPath, 'utf8'));

                    // Try to find the contract creation transaction
                    if (testDeployment.transactions) {
                        for (const tx of testDeployment.transactions) {
                            if (tx.contractName && tx.contractName.toLowerCase() === contractName.toLowerCase() && tx.contractAddress) {
                                console.log(`Found ${contractName} at ${tx.contractAddress} in test deployment`);
                                return tx.contractAddress;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Error reading test deployment:', e.message);
        }

        // If no deployment was found, use a dummy address for local testing only
        if (contractName.toLowerCase() === 'luxservicemanager') {
            return '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // First contract in Anvil/Hardhat
        } else if (contractName.toLowerCase() === 'authenticationcontroller') {
            return '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'; // Second contract in Anvil/Hardhat
        }
    }

    throw new Error(`Could not resolve address for ${contractName}`);
}

// Helper function to recursively search for addresses in a deployment object
function findAddressInObject(obj, contractName) {
    // Skip null or undefined
    if (!obj) return null;

    // For arrays, search each element
    if (Array.isArray(obj)) {
        for (const item of obj) {
            const result = findAddressInObject(item, contractName);
            if (result) return result;
        }
        return null;
    }

    // For objects, check each property
    if (typeof obj === 'object') {
        // Check if this property is related to our contract
        const keys = Object.keys(obj);
        for (const key of keys) {
            // If key contains the contract name and value looks like an address
            if (
                (key.toLowerCase().includes(contractName.toLowerCase()) || key.toLowerCase() === 'address') &&
                typeof obj[key] === 'string' &&
                obj[key].startsWith('0x') &&
                obj[key].length >= 42
            ) {
                return obj[key];
            }

            // Recursively check nested objects
            const result = findAddressInObject(obj[key], contractName);
            if (result) return result;
        }
    }

    return null;
}

// Configuration
const config = {
    rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
    privateKey: process.env.PRIVATE_KEY,
    ipfsGateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
    ipfsApiKey: process.env.IPFS_API_KEY,
    googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
    confidenceThreshold: parseInt(process.env.CONFIDENCE_THRESHOLD || '80'),
    pollingInterval: parseInt(process.env.POLLING_INTERVAL || '15000'), // 15 seconds
    retryDelay: parseInt(process.env.RETRY_DELAY || '30000'), // 30 seconds
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
};

// Resolve contract addresses
try {
    config.luxServiceManagerAddress = resolveContractAddress('luxServiceManager');
    config.authenticationControllerAddress = resolveContractAddress('authenticationController');
} catch (error) {
    console.error('Error resolving contract addresses:', error);
    process.exit(1);
}

// Initialize provider and signer
let provider, wallet, operatorAddress;

if (isEthersV6) {
    // ethers v6 syntax
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
    wallet = new ethers.Wallet(config.privateKey, provider);
} else {
    // ethers v5 syntax
    provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    wallet = new ethers.Wallet(config.privateKey, provider);
}

operatorAddress = wallet.address;
console.log(`Starting AI Operator with address: ${operatorAddress}`);

// Contract instances
let luxServiceManager, authenticationController;

if (isEthersV6) {
    // ethers v6 syntax
    luxServiceManager = new ethers.Contract(config.luxServiceManagerAddress, LuxServiceManagerABI, wallet);
    authenticationController = new ethers.Contract(config.authenticationControllerAddress, AuthenticationControllerABI, wallet);
} else {
    // ethers v5 syntax
    luxServiceManager = new ethers.Contract(config.luxServiceManagerAddress, LuxServiceManagerABI, wallet);
    authenticationController = new ethers.Contract(config.authenticationControllerAddress, AuthenticationControllerABI, wallet);
}

// Track the latest processed task
let lastProcessedTaskIndex = 0;

// Flag to track if we've determined we're not an operator
let isOperatorCheckFailed = false;

// Main function
async function start() {
    try {
        console.log('AI Operator started. Monitoring for new tasks...');
        console.log(`Connected to RPC: ${config.rpcUrl}`);
        console.log(`Chain ID: ${await provider.getNetwork().then((n) => (isEthersV6 ? n.chainId : n.chainId.toString()))}`);
        console.log(`LuxServiceManager address: ${config.luxServiceManagerAddress}`);
        console.log(`AuthenticationController address: ${config.authenticationControllerAddress}`);

        // Check if contracts are accessible
        try {
            // Test contract methods
            const currentTaskNum = await luxServiceManager.latestTaskNum();
            console.log(`Current task count raw:`, currentTaskNum);
            console.log(`Type of currentTaskNum: ${typeof currentTaskNum}`);

            // Use our safe conversion function instead of direct toNumber
            const currentTaskNumValue = safeNumberConversion(currentTaskNum);
            console.log(`Converted task count: ${currentTaskNumValue}`);

            // Initialize lastProcessedTaskIndex to the current task number
            // Subtract 1 to process the most recent task if it exists
            if (currentTaskNumValue > 0 && lastProcessedTaskIndex === 0) {
                lastProcessedTaskIndex = currentTaskNumValue - 1;
                console.log(`Setting last processed task to: ${lastProcessedTaskIndex}`);
            }
        } catch (contractError) {
            console.error('Failed to access contracts:', contractError);
            console.log('Please check your contract addresses and ABI files');
            throw contractError;
        }

        // Start monitoring loop
        monitorTasks();
    } catch (error) {
        console.error('Error starting operator:', error);
        console.log('Retrying in 30 seconds...');
        setTimeout(start, 30000);
    }
}

// Monitor tasks periodically
function monitorTasks() {
    console.log(`Starting to monitor tasks every ${config.pollingInterval}ms`);

    setInterval(async () => {
        try {
            // Get latestTaskNum
            console.log('Reading latestTaskNum from LuxServiceManager...');
            const currentTaskNum = await luxServiceManager.latestTaskNum();
            console.log('Raw latestTaskNum value:', currentTaskNum.toString ? currentTaskNum.toString() : currentTaskNum);

            // Convert to number safely using our helper function
            const currentTaskNumInt = safeNumberConversion(currentTaskNum);
            console.log('Current task count:', currentTaskNumInt);

            // If we've already determined we're not an operator, skip processing
            if (isOperatorCheckFailed) {
                console.log(`⚠️ Previously determined that this wallet is not a registered operator`);
                console.log(`Skipping task processing - please register ${operatorAddress} as an operator`);
                return;
            }

            // Process any new tasks
            for (let i = lastProcessedTaskIndex; i < currentTaskNumInt; i++) {
                console.log(`Checking task #${i}...`);

                try {
                    // Check if we've already responded to this task
                    const existingResponse = await luxServiceManager.allTaskResponses(operatorAddress, i);
                    console.log(`Response for task #${i}:`, existingResponse);

                    // More detailed check for already processed tasks
                    if (existingResponse && existingResponse.length > 0 && existingResponse !== '0x') {
                        console.log(`Already processed task #${i} - has response`);
                        lastProcessedTaskIndex = Math.max(lastProcessedTaskIndex, i + 1);
                        continue;
                    }

                    // Get task hash
                    const taskHash = await luxServiceManager.allTaskHashes(i);
                    console.log(`Task #${i} hash:`, taskHash);

                    if (!taskHash || taskHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                        console.log(`Skipping task #${i} - invalid hash`);
                        lastProcessedTaskIndex = Math.max(lastProcessedTaskIndex, i + 1);
                        continue;
                    }

                    // Get the task using getTask function
                    let task;
                    try {
                        // First try to get the task using getTask method
                        task = await luxServiceManager.getTask(i);
                        console.log(`Retrieved task #${i} details using getTask():`, task);
                    } catch (err) {
                        console.log(`getTask function failed: ${err.message}`);

                        // Don't try to use allTasks as it's not available
                        // Instead, try to reconstruct the task from other available information
                        try {
                            console.log(`Attempting to reconstruct task from available data...`);

                            // Get task hash - we already have this from above
                            // const taskHash = await luxServiceManager.allTaskHashes(i);

                            // Try to get other task details if methods are available
                            let imageHash, metadataHash, documentType, taskCreatedBlock;

                            try {
                                // Try methods that might exist on the contract
                                imageHash = await luxServiceManager.getTaskImageHash(i);
                                console.log(`Got image hash: ${imageHash}`);
                            } catch (e) {
                                // If method doesn't exist, use the task hash as a fallback
                                console.log(`getTaskImageHash not available: ${e.message}`);
                                imageHash = taskHash; // Use task hash as fallback
                            }

                            try {
                                metadataHash = await luxServiceManager.getTaskMetadataHash(i);
                                console.log(`Got metadata hash: ${metadataHash}`);
                            } catch (e) {
                                console.log(`getTaskMetadataHash not available: ${e.message}`);
                                // Generate a derived hash as fallback
                                metadataHash = taskHash; // Use task hash as fallback
                            }

                            try {
                                documentType = await luxServiceManager.getTaskDocumentType(i);
                                console.log(`Got document type: ${documentType}`);
                            } catch (e) {
                                console.log(`getTaskDocumentType not available: ${e.message}`);
                                documentType = 0; // Use a default value as fallback
                            }

                            try {
                                taskCreatedBlock = await luxServiceManager.getTaskCreatedBlock(i);
                                console.log(`Got task created block: ${taskCreatedBlock}`);
                            } catch (e) {
                                console.log(`getTaskCreatedBlock not available: ${e.message}`);
                                // Use current block number as fallback
                                taskCreatedBlock = await provider.getBlockNumber();
                                console.log(`Using current block as fallback: ${taskCreatedBlock}`);
                            }

                            // Create a task object with the available information
                            task = {
                                imageHash: imageHash,
                                metadataHash: metadataHash,
                                documentType: documentType,
                                taskCreatedBlock: taskCreatedBlock,
                            };

                            console.log(`Reconstructed task #${i}:`, task);
                        } catch (reconstructError) {
                            console.error(`Failed to reconstruct task: ${reconstructError.message}`);
                            lastProcessedTaskIndex = Math.max(lastProcessedTaskIndex, i + 1);
                            console.log(`Marking task #${i} as processed due to inability to retrieve details`);
                            continue;
                        }
                    }

                    // Convert task fields to expected format based on ethers version
                    const processedTask = {
                        imageHash: task.imageHash,
                        metadataHash: task.metadataHash,
                        documentType: safeNumberConversion(task.documentType),
                        taskCreatedBlock: safeNumberConversion(task.taskCreatedBlock),
                    };

                    // Process the task
                    console.log(`Starting to process task #${i}...`);
                    let result = false;
                    try {
                        result = await processTask(i, processedTask);
                    } catch (processError) {
                        console.error(`Error processing task #${i}:`, processError);

                        // Check if this is an operator registration issue
                        if (processError.message && (processError.message.includes('NotAuthorized') || processError.message.includes('not a registered operator'))) {
                            console.error(`⚠️ THIS WALLET IS NOT REGISTERED AS AN OPERATOR`);
                            console.error(`Please register ${operatorAddress} as an operator in the LuxServiceManager contract`);
                            console.error(`Marking all tasks as processed to avoid continuous retries`);

                            // Set the flag to avoid future processing attempts
                            isOperatorCheckFailed = true;

                            // Skip all remaining tasks since we're not a valid operator
                            lastProcessedTaskIndex = currentTaskNumInt;
                            break;
                        }

                        // Mark as processed to avoid infinite retries
                        lastProcessedTaskIndex = i + 1;
                    }

                    if (result) {
                        console.log(`Processed task #${i} (successfully or with negative response)`);
                        // Update last processed task
                        lastProcessedTaskIndex = i + 1;
                    } else {
                        console.log(`Failed to process task #${i}, but marking as processed anyway to avoid loops`);
                        // Even if processing failed, mark as processed to avoid infinite loop
                        lastProcessedTaskIndex = i + 1;
                    }
                } catch (taskError) {
                    console.error(`Error processing specific task #${i}:`, taskError);
                    // Mark as processed to avoid infinite retries
                    lastProcessedTaskIndex = i + 1;
                    console.log(`Marked task #${i} as processed despite errors to avoid infinite loop`);
                }
            }
        } catch (error) {
            console.error('Error monitoring tasks:', error);
        }
    }, config.pollingInterval);
}

// Process a single task
async function processTask(taskIndex, task) {
    console.log(`Processing task #${taskIndex}`, task);

    try {
        // 1. Fetch image and metadata from IPFS
        // In a real implementation, you would use the actual IPFS hashes from the task
        // For this demo, we'll simulate fetching and analyzing

        // Simulate AI authenticity check
        const { isAuthentic, confidence, analysisResults } = await simulateAIAuthentication(task);

        console.log(`Authentication result: ${isAuthentic ? 'Authentic' : 'Not authentic'} (${confidence}% confidence)`);

        // Convert task to the expected format for signing
        const taskObject = {
            imageHash: task.imageHash,
            metadataHash: task.metadataHash,
            documentType: safeNumberConversion(task.documentType),
            taskCreatedBlock: safeNumberConversion(task.taskCreatedBlock),
        };

        // Create a message to sign
        let message, messageHashBytes, signature;

        if (isEthersV6) {
            // ethers v6 approach
            message = ethers.solidityPackedKeccak256(['string', 'bytes32', 'bytes32', 'uint8'], ['TASK_VERIFICATION', task.imageHash, task.metadataHash, task.documentType]);
            messageHashBytes = ethers.getBytes(message);
        } else {
            // ethers v5 approach
            message = ethers.utils.solidityKeccak256(['string', 'bytes32', 'bytes32', 'uint8'], ['TASK_VERIFICATION', task.imageHash, task.metadataHash, task.documentType]);
            messageHashBytes = ethers.utils.arrayify(message);
        }

        try {
            // Sign the hash
            signature = await wallet.signMessage(messageHashBytes);
            console.log(`Generated signature:`, signature);
        } catch (signError) {
            console.error(`Error signing message: ${signError.message}`);
            return false;
        }

        // Try submitting directly to LuxServiceManager
        try {
            console.log(`Submitting response to LuxServiceManager...`);

            // The contract expects: Task object, reference task index, and signature
            const tx = await luxServiceManager.respondToTask(
                taskObject, // The full task object
                taskIndex, // The reference task index
                signature // The signature bytes
            );

            console.log(`Response submitted with transaction: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`Response transaction confirmed in block ${receipt.blockNumber}`);
            return true;
        } catch (err) {
            console.error(`Failed to submit to LuxServiceManager: ${err.message}`);

            // Try to submit through AuthenticationController instead
            console.log(`Trying to submit via AuthenticationController...`);

            try {
                const additionalData = JSON.stringify(analysisResults);

                const tx = await authenticationController.processAuthentication(taskIndex, taskObject, isAuthentic, confidence, additionalData);

                console.log(`Response submitted via controller with transaction: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`Controller response confirmed in block ${receipt.blockNumber}`);
                return true;
            } catch (controllerErr) {
                console.error(`Failed to submit via controller: ${controllerErr.message}`);
                return false;
            }
        }
    } catch (error) {
        console.error(`Error processing task #${taskIndex}:`, error);
        throw error; // Rethrow to let the caller handle it
    }
}

// Simulate AI Authentication
// In a real implementation, this would call Google Vision API
async function simulateAIAuthentication(task) {
    console.log('Simulating AI authentication...');

    // In a real implementation, you would:
    // 1. Fetch image from IPFS using task.imageHash
    // 2. Fetch metadata from IPFS using task.metadataHash
    // 3. Call Google Vision API to analyze the image
    // 4. Compare the analysis with the metadata

    // For demo purposes, we'll randomly generate a result
    const isAuthentic = Math.random() > 0.3; // 70% chance of being authentic
    const confidence = isAuthentic
        ? Math.floor(75 + Math.random() * 25) // 75-100% for authentic
        : Math.floor(20 + Math.random() * 55); // 20-75% for non-authentic

    // Simulate analysis results
    const analysisResults = {
        timestamp: Date.now(),
        documentType: task.documentType,
        features: {
            logo: isAuthentic ? 'detected' : 'unclear',
            serialNumber: isAuthentic ? 'matched' : 'mismatched',
            materials: isAuthentic ? 'verified' : 'suspicious',
        },
        confidence: confidence,
    };

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
        isAuthentic,
        confidence,
        analysisResults,
    };
}

// Retry helper function
async function retryOperation(operation, maxRetries = config.maxRetries, delay = config.retryDelay) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.log(`Attempt ${attempt} failed: ${error.message}`);
            lastError = error;

            if (attempt < maxRetries) {
                console.log(`Retrying in ${delay / 1000} seconds...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

// Start the operator
start().catch(console.error);
