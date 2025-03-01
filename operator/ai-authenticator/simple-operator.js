// Simple AI Operator - Streamlined version
// This script monitors the LuxServiceManager for new tasks and processes them

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

console.log('============================================');
console.log('Simple AI Operator Starting');
console.log('============================================');

// Environment Configuration
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONFIDENCE_THRESHOLD = parseInt(process.env.CONFIDENCE_THRESHOLD || '80');
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL || '15000');
const LUX_SERVICE_MANAGER_ADDRESS = process.env.LUX_SERVICE_MANAGER_ADDRESS;
const AUTHENTICATION_CONTROLLER_ADDRESS = process.env.AUTHENTICATION_CONTROLLER_ADDRESS;
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '31337');

// Global state
let provider;
let wallet;
let luxServiceManager;
let authenticationController;
let operatorAddress;
const processedTasks = [];

// Helper function to safely convert various number types
function safeNumberConversion(value) {
    if (!value) return 0;

    // Handle BigNumber from ethers
    if (value._isBigNumber || value.toNumber) {
        try {
            return value.toNumber();
        } catch (e) {
            // If the number is too large for toNumber(), use toString()
            return Number(value.toString());
        }
    }

    // Handle ethers v6 BigInt
    if (typeof value === 'bigint') {
        return Number(value);
    }

    // If it's already a number, return as is
    if (typeof value === 'number') {
        return value;
    }

    // If it's a string, parse it
    if (typeof value === 'string') {
        return value.startsWith('0x') ? parseInt(value, 16) : parseInt(value, 10);
    }

    // Fallback
    return Number(value);
}

// Simulated authentication logic
function simulateAuthentication(task) {
    console.log('Simulating AI authentication for task:', {
        imageHash: task.imageHash.slice(0, 10) + '...',
        metadataHash: task.metadataHash.slice(0, 10) + '...',
        documentType: task.documentType,
    });

    // Generate a random authentication result
    // In a real implementation, this would call your AI model
    const isAuthentic = Math.random() > 0.3; // 70% chance of being authentic
    const confidence = Math.floor(Math.random() * 20) + (isAuthentic ? 80 : 30); // Higher confidence for authentic items

    return { isAuthentic, confidence };
}

// Main function to start monitoring
async function startMonitoring() {
    try {
        console.log('=== Lux Protocol AI Operator ===');
        console.log(`RPC URL: ${RPC_URL}`);

        // Connect to the blockchain
        provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        operatorAddress = wallet.address;

        console.log(`Connected to network: ${(await provider.getNetwork()).name}`);
        console.log(`Operator Address: ${operatorAddress}`);

        // Load ABI files
        let luxServiceManagerABI;
        try {
            luxServiceManagerABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'abis', 'LuxServiceManager.json')));
            console.log('Loaded LuxServiceManager ABI');
        } catch (error) {
            console.warn(`Could not load LuxServiceManager ABI: ${error.message}`);
            console.log('Using fallback ABI definition...');

            // Fallback ABI with key functions
            luxServiceManagerABI = [
                'function taskCount() view returns (uint256)',
                'function allTaskHashes(uint256) view returns (bytes32)',
                'function getTask(uint256) view returns (tuple(bytes32 imageHash, bytes32 metadataHash, uint8 documentType, uint256 taskCreatedBlock))',
                'function isTaskResponded(uint256) view returns (bool)',
                'function respondToTask(tuple(bytes32 imageHash, bytes32 metadataHash, uint8 documentType, uint256 taskCreatedBlock) task, uint256 taskIndex, bytes signature) returns (bool)',
            ];
        }

        // Check if getTask is defined in the ABI (needed for task retrieval)
        const hasGetTask = luxServiceManagerABI.some((item) => (typeof item === 'object' && item.name === 'getTask') || (typeof item === 'string' && item.includes('getTask')));

        if (!hasGetTask) {
            console.log('Adding getTask function to ABI...');
            luxServiceManagerABI.push('function getTask(uint256) view returns (tuple(bytes32 imageHash, bytes32 metadataHash, uint8 documentType, uint256 taskCreatedBlock))');
        }

        // Load Authentication Controller ABI
        let authenticationControllerABI;
        try {
            authenticationControllerABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'abis', 'AuthenticationController.json')));
            console.log('Loaded AuthenticationController ABI');
        } catch (error) {
            console.warn(`Could not load AuthenticationController ABI: ${error.message}`);
            console.log('Authentication Controller fallback will not be available');
        }

        // Initialize the contract instances
        if (LUX_SERVICE_MANAGER_ADDRESS) {
            luxServiceManager = new ethers.Contract(LUX_SERVICE_MANAGER_ADDRESS, luxServiceManagerABI, wallet);
            console.log(`Connected to LuxServiceManager at ${LUX_SERVICE_MANAGER_ADDRESS}`);

            // Check if we have the OPERATOR_ROLE
            try {
                const OPERATOR_ROLE = '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929';
                const hasRole = await luxServiceManager.hasRole(OPERATOR_ROLE, operatorAddress);
                console.log(`Operator is authorized in LuxServiceManager: ${hasRole}`);

                if (!hasRole) {
                    console.warn('\n⚠️ WARNING: This address does not have the OPERATOR_ROLE!');
                    console.warn('Tasks may fail if the operator is not authorized.');
                    console.warn('Use the grant-operator-role.sh script to grant this role.\n');
                }
            } catch (error) {
                console.warn(`Could not check OPERATOR_ROLE: ${error.message}`);
            }
        } else {
            console.error('ERROR: LUX_SERVICE_MANAGER_ADDRESS not provided in .env');
            process.exit(1);
        }

        // Initialize Authentication Controller if available
        if (AUTHENTICATION_CONTROLLER_ADDRESS && authenticationControllerABI) {
            authenticationController = new ethers.Contract(AUTHENTICATION_CONTROLLER_ADDRESS, authenticationControllerABI, wallet);
            console.log(`Connected to AuthenticationController at ${AUTHENTICATION_CONTROLLER_ADDRESS}`);

            // Check if we have the OPERATOR_ROLE in AuthenticationController
            try {
                const OPERATOR_ROLE = '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929';
                const hasRole = await authenticationController.hasRole(OPERATOR_ROLE, operatorAddress);
                console.log(`Operator is authorized in AuthenticationController: ${hasRole}`);
            } catch (error) {
                console.warn(`Could not check OPERATOR_ROLE in AuthenticationController: ${error.message}`);
            }
        } else {
            console.warn('AuthenticationController not configured, fallback will not be available');
        }

        console.log('\n=== Configuration ===');
        console.log(`Confidence Threshold: ${CONFIDENCE_THRESHOLD}%`);
        console.log(`Polling Interval: ${POLLING_INTERVAL}ms`);
        console.log(`Chain ID: ${CHAIN_ID}`);

        // Start polling for tasks
        console.log('\n=== Starting Task Monitor ===');
        console.log(`[${new Date().toISOString()}] Polling for new tasks...`);

        // Initial poll immediately
        await pollForTasks();

        // Continue polling at intervals
        setInterval(pollForTasks, POLLING_INTERVAL);
    } catch (error) {
        console.error('Error starting monitoring:', error?.reason || error?.message || error);
        process.exit(1);
    }
}

// Poll for new tasks
async function pollForTasks() {
    try {
        // Get current task count
        const taskCount = safeNumberConversion(await luxServiceManager.taskCount());
        console.log(`Current task count: ${taskCount}`);

        // Process tasks in order (oldest first)
        for (let taskIndex = 0; taskIndex < taskCount; taskIndex++) {
            console.log(`Checking task #${taskIndex}...`);

            // Skip tasks we've already processed
            if (processedTasks.includes(taskIndex)) {
                console.log(`Task #${taskIndex} already processed, skipping`);
                continue;
            }

            // Check if this task has already been responded to
            try {
                // Try different ways to check if a task has been responded to
                // Method 1: Use isTaskResponded if it exists
                let isTaskResponded = false;
                try {
                    if (typeof luxServiceManager.isTaskResponded === 'function') {
                        isTaskResponded = await luxServiceManager.isTaskResponded(taskIndex);
                        console.log(`Task #${taskIndex} responded status (from isTaskResponded): ${isTaskResponded}`);
                    }
                } catch (error) {
                    console.log(`Could not check isTaskResponded: ${error.message}`);
                }

                // Method 2: Use responseExists if it exists
                if (!isTaskResponded) {
                    try {
                        if (typeof luxServiceManager.responseExists === 'function') {
                            isTaskResponded = await luxServiceManager.responseExists(taskIndex);
                            console.log(`Task #${taskIndex} responded status (from responseExists): ${isTaskResponded}`);
                        }
                    } catch (error) {
                        console.log(`Could not check responseExists: ${error.message}`);
                    }
                }

                // Method 3: Use responses mapping if it exists
                if (!isTaskResponded) {
                    try {
                        if (typeof luxServiceManager.responses === 'function') {
                            const responder = await luxServiceManager.responses(taskIndex);
                            isTaskResponded = responder && responder !== '0x0000000000000000000000000000000000000000';
                            console.log(`Task #${taskIndex} responded status (from responses mapping): ${isTaskResponded}`);
                        }
                    } catch (error) {
                        console.log(`Could not check responses mapping: ${error.message}`);
                    }
                }

                if (isTaskResponded) {
                    console.log(`Task #${taskIndex} has already been responded to, skipping`);
                    processedTasks.push(taskIndex);
                    continue;
                }
            } catch (error) {
                console.warn(`Error checking if task #${taskIndex} has been responded to: ${error.message}`);
                // Continue processing even if we can't check response status
            }

            // Get task details
            let task = null;
            let errorMessage = '';

            // First, try calling getTask directly
            try {
                if (typeof luxServiceManager.getTask === 'function') {
                    task = await luxServiceManager.getTask(taskIndex);
                    console.log(`Retrieved task #${taskIndex} details:`, {
                        imageHash: task.imageHash,
                        metadataHash: task.metadataHash,
                        documentType: safeNumberConversion(task.documentType),
                        taskCreatedBlock: safeNumberConversion(task.taskCreatedBlock),
                    });
                } else {
                    errorMessage = 'luxServiceManager.getTask is not a function';
                    console.error(`Cannot get full task details: ${errorMessage}`);
                }
            } catch (error) {
                errorMessage = error.message;
                console.error(`Error getting task #${taskIndex} details: ${errorMessage}`);
            }

            // If we can't get the task directly, try to reconstruct it from individual getters
            if (!task || !task.imageHash || !task.metadataHash) {
                console.log(`Task #${taskIndex} not found or incomplete, attempting to reconstruct...`);

                // Initialize an empty task object
                task = {
                    imageHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                    metadataHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                    documentType: 0,
                    taskCreatedBlock: 0,
                };

                // Try to get individual task fields using specific getters
                try {
                    if (typeof luxServiceManager.getTaskImageHash === 'function') {
                        task.imageHash = await luxServiceManager.getTaskImageHash(taskIndex);
                        console.log(`Retrieved imageHash for task #${taskIndex}: ${task.imageHash}`);
                    } else if (typeof luxServiceManager.taskImageHashes === 'function') {
                        task.imageHash = await luxServiceManager.taskImageHashes(taskIndex);
                        console.log(`Retrieved imageHash from mapping for task #${taskIndex}: ${task.imageHash}`);
                    }
                } catch (error) {
                    console.warn(`Could not get imageHash for task #${taskIndex}: ${error.message}`);
                }

                try {
                    if (typeof luxServiceManager.getTaskMetadataHash === 'function') {
                        task.metadataHash = await luxServiceManager.getTaskMetadataHash(taskIndex);
                        console.log(`Retrieved metadataHash for task #${taskIndex}: ${task.metadataHash}`);
                    } else if (typeof luxServiceManager.taskMetadataHashes === 'function') {
                        task.metadataHash = await luxServiceManager.taskMetadataHashes(taskIndex);
                        console.log(`Retrieved metadataHash from mapping for task #${taskIndex}: ${task.metadataHash}`);
                    }
                } catch (error) {
                    console.warn(`Could not get metadataHash for task #${taskIndex}: ${error.message}`);
                }

                try {
                    if (typeof luxServiceManager.getTaskDocumentType === 'function') {
                        task.documentType = safeNumberConversion(await luxServiceManager.getTaskDocumentType(taskIndex));
                        console.log(`Retrieved documentType for task #${taskIndex}: ${task.documentType}`);
                    } else if (typeof luxServiceManager.taskDocumentTypes === 'function') {
                        task.documentType = safeNumberConversion(await luxServiceManager.taskDocumentTypes(taskIndex));
                        console.log(`Retrieved documentType from mapping for task #${taskIndex}: ${task.documentType}`);
                    }
                } catch (error) {
                    console.warn(`Could not get documentType for task #${taskIndex}: ${error.message}`);
                }

                try {
                    if (typeof luxServiceManager.getTaskCreatedBlock === 'function') {
                        task.taskCreatedBlock = safeNumberConversion(await luxServiceManager.getTaskCreatedBlock(taskIndex));
                        console.log(`Retrieved taskCreatedBlock for task #${taskIndex}: ${task.taskCreatedBlock}`);
                    } else if (typeof luxServiceManager.allTaskHashes === 'function') {
                        // If we have taskHash but not the block, we can use current block as fallback
                        const currentBlock = await provider.getBlockNumber();
                        task.taskCreatedBlock = currentBlock;
                        console.log(`Using current block ${currentBlock} as taskCreatedBlock for task #${taskIndex}`);
                    }
                } catch (error) {
                    console.warn(`Could not get taskCreatedBlock for task #${taskIndex}: ${error.message}`);
                }

                console.log(`Reconstructed task #${taskIndex}:`, task);
            }

            // Verify the task has the essential data
            if (!task.imageHash || task.imageHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                console.error(`Task #${taskIndex} has invalid imageHash, skipping`);
                processedTasks.push(taskIndex); // Mark as processed to avoid retrying
                continue;
            }

            if (!task.metadataHash || task.metadataHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                console.error(`Task #${taskIndex} has invalid metadataHash, skipping`);
                processedTasks.push(taskIndex); // Mark as processed to avoid retrying
                continue;
            }

            console.log(`Processing task #${taskIndex}`);

            // Simulate authentication
            const { isAuthentic, confidence } = simulateAuthentication(task);
            console.log(`Authentication result for task #${taskIndex}: ${isAuthentic ? 'Authentic' : 'Not authentic'} (${confidence}% confidence)`);

            // Respond to task
            try {
                await respondToTask(taskIndex, task, isAuthentic, confidence);
                console.log(`Successfully responded to task #${taskIndex}`);
                processedTasks.push(taskIndex);
            } catch (error) {
                console.error(`Failed to respond to task #${taskIndex}:`, error?.reason || error?.message || error);

                // Try to use the AuthenticationController directly as a fallback
                try {
                    if (authenticationController) {
                        console.log('Attempting to authenticate using AuthenticationController directly...');

                        // If this is an authentication task, we can use the AuthenticationController
                        const tx = await authenticationController.authenticateTask(task.imageHash, task.metadataHash, isAuthentic, confidence, { gasLimit: 1000000 });

                        console.log(`Authentication transaction submitted: ${tx.hash}`);
                        await tx.wait();
                        console.log(`Authentication transaction confirmed`);
                        processedTasks.push(taskIndex);
                    }
                } catch (fallbackError) {
                    console.error('Failed to authenticate using AuthenticationController:', fallbackError?.reason || fallbackError?.message || fallbackError);

                    // Mark as processed anyway to avoid getting stuck in a loop
                    processedTasks.push(taskIndex);
                }
            }
        }
    } catch (error) {
        console.error('Error polling for tasks:', error?.reason || error?.message || error);
    }
}

// Submit response via AuthenticationController
async function submitViaAuthController(taskIndex, task, isAuthentic, confidence) {
    if (!authenticationController) {
        throw new Error('AuthenticationController is not configured');
    }

    console.log(`Trying to submit via AuthenticationController...`);

    // Format task object for contract interaction
    const taskObject = {
        imageHash: task.imageHash,
        metadataHash: task.metadataHash,
        documentType: safeNumberConversion(task.documentType),
        taskCreatedBlock: safeNumberConversion(task.taskCreatedBlock),
    };

    // Create verification result
    const verificationResult = {
        timestamp: Date.now(),
        documentType: taskObject.documentType,
        features: {
            logo: 'detected',
            serialNumber: 'matched',
            materials: 'verified',
        },
        confidence: confidence,
    };

    const resultString = JSON.stringify(verificationResult);
    console.log(`Verification result: ${resultString}`);

    try {
        // Try to submit response to AuthenticationController
        const tx = await authenticationController.submitTaskResponse(taskIndex, task.imageHash, task.metadataHash, taskObject.documentType, isAuthentic, confidence, resultString);

        console.log(`Transaction submitted via AuthenticationController: ${tx.hash}`);
        await tx.wait();
        console.log(`Response confirmed via AuthenticationController`);
        return true;
    } catch (error) {
        console.error(`Failed to submit via controller: ${error.message}`);
        throw error;
    }
}

// Respond to a task
async function respondToTask(taskIndex, task, isAuthentic, confidence) {
    console.log(`Responding to task #${taskIndex} with authentication result: ${isAuthentic ? 'Authentic' : 'Not authentic'} (${confidence}% confidence)`);

    try {
        // Ensure task has the correct structure
        if (!task || !task.imageHash || !task.metadataHash) {
            throw new Error('Invalid task object - missing required fields');
        }

        // Make sure image hash and metadata hash are proper bytes32 format
        if (!task.imageHash.startsWith('0x') || task.imageHash.length !== 66) {
            throw new Error(`Invalid imageHash format: ${task.imageHash}`);
        }
        if (!task.metadataHash.startsWith('0x') || task.metadataHash.length !== 66) {
            throw new Error(`Invalid metadataHash format: ${task.metadataHash}`);
        }

        // Format task according to the contract's expected Task struct
        // Make sure all fields are in the format the contract expects
        const taskStruct = {
            imageHash: task.imageHash,
            metadataHash: task.metadataHash,
            documentType: safeNumberConversion(task.documentType || 0),
            taskCreatedBlock: safeNumberConversion(task.taskCreatedBlock || 0),
        };

        console.log('Task struct being submitted:', taskStruct);

        // Create response data that will be attached to the event
        const responseData = {
            timestamp: Date.now(),
            documentType: taskStruct.documentType,
            features: isAuthentic
                ? {
                      logo: 'verified',
                      serialNumber: 'matched',
                      materials: 'authentic',
                  }
                : {
                      logo: 'unclear',
                      serialNumber: 'mismatched',
                      materials: 'suspicious',
                  },
            confidence: confidence,
            isAuthentic: isAuthentic,
        };

        // DEBUG: Get raw task hash from contract for this task index to compare
        try {
            const storedTaskHash = await luxServiceManager.allTaskHashes(taskIndex);
            console.log(`Stored task hash for index ${taskIndex}: ${storedTaskHash}`);

            // Calculate task hash to verify it matches what's stored
            // This follows _computeTaskHash in the contract
            const encodedTask = ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'bytes32', 'uint8', 'uint256'],
                [taskStruct.imageHash, taskStruct.metadataHash, taskStruct.documentType, taskStruct.taskCreatedBlock]
            );
            const calculatedTaskHash = ethers.utils.keccak256(encodedTask);
            console.log(`Calculated task hash: ${calculatedTaskHash}`);
            console.log(`Do the hashes match? ${storedTaskHash === calculatedTaskHash ? 'YES' : 'NO'}`);
        } catch (e) {
            console.log(`Could not verify task hash: ${e.message}`);
        }

        // Create the message hash EXACTLY as in the contract's _computeMessageHash function:
        // function _computeMessageHash(Task memory task) internal pure returns (bytes32) {
        //     return keccak256(abi.encodePacked(task.imageHash, task.metadataHash, task.documentType));
        // }
        console.log('Creating message from components:');
        console.log(`- Image Hash: ${taskStruct.imageHash}`);
        console.log(`- Metadata Hash: ${taskStruct.metadataHash}`);
        console.log(`- Document Type: ${taskStruct.documentType}`);

        // Pack the data exactly as the contract does
        const messageHash = ethers.utils.solidityKeccak256(['bytes32', 'bytes32', 'uint8'], [taskStruct.imageHash, taskStruct.metadataHash, taskStruct.documentType]);
        console.log(`Message hash: ${messageHash}`);

        // Convert to Ethereum signed message format - this is critically important
        // and must match exactly what the contract does with toEthSignedMessageHash()
        const ethSignedMessageHash = ethers.utils.hashMessage(ethers.utils.arrayify(messageHash));
        console.log(`Ethereum Signed Message Hash: ${ethSignedMessageHash}`);

        // Sign the message using the wallet
        const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
        console.log(`Signature: ${signature}`);

        // Try submitting to LuxServiceManager with proper gas settings
        try {
            console.log('Submitting to LuxServiceManager...');

            // Create transaction options with higher gas limit and price to ensure it goes through
            const txOptions = {
                gasLimit: 1000000, // Higher gas limit to ensure it goes through
            };

            // Match the exact parameter structure from the contract
            // function respondToTask(Task calldata task, uint32 referenceTaskIndex, bytes calldata signature)
            const tx = await luxServiceManager.respondToTask(taskStruct, taskIndex, signature, txOptions);

            console.log(`Transaction submitted: ${tx.hash}`);

            // Wait for confirmation with more details on errors
            let receipt;
            try {
                receipt = await tx.wait();
                console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
                console.log(`Gas used: ${receipt.gasUsed.toString()}`);
                if (receipt.events) {
                    console.log(`Events emitted: ${receipt.events.length}`);
                    receipt.events.forEach((event, i) => {
                        console.log(`Event ${i}: ${event.event || 'Unknown'}`);
                    });
                }

                // Transaction was successful
                console.log('Storing additional response data:', JSON.stringify(responseData));
                return true;
            } catch (waitError) {
                console.error(`Error waiting for transaction: ${waitError.message}`);
                if (waitError.receipt) {
                    console.error(`Transaction failed with status: ${waitError.receipt.status}`);
                    console.error(`Gas used: ${waitError.receipt.gasUsed.toString()}`);
                }
                throw waitError;
            }
        } catch (error) {
            console.error('Failed to submit to LuxServiceManager:', error?.reason || error?.message || error);
            // Log detailed error information for debugging
            if (error.transaction) {
                console.log('Transaction details:', {
                    to: error.transaction.to,
                    data: error.transaction.data.slice(0, 66) + '...',
                    gasLimit: error.transaction.gasLimit?.toString() || 'unknown',
                });
            }
            if (error.receipt) {
                console.log('Receipt details:', {
                    status: error.receipt.status,
                    gasUsed: error.receipt.gasUsed?.toString() || 'unknown',
                });
            }

            throw error;
        }
    } catch (error) {
        console.error('Error responding to task:', error?.reason || error?.message || error);
        throw error;
    }
}

// Start the monitoring
startMonitoring().catch((error) => {
    console.error('Fatal error:', error?.reason || error?.message || error);
    process.exit(1);
});
