/**
 * Create Test Tasks Script
 *
 * This script creates test authentication tasks in the LuxServiceManager contract
 * for testing the AI operator workflow.
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration from environment variables
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const LUX_SERVICE_MANAGER_ADDRESS = process.env.LUX_SERVICE_MANAGER_ADDRESS;
const ACCESS_CONTROL_ADDRESS = process.env.ACCESS_CONTROL_ADDRESS;
const LuxServiceManagerABI = require('../../abis/LuxServiceManager.json');
const AccessControlABI = require('../../abis/AccessControl.json');

// Generate a pseudo-random bytes32 value
function generateRandomBytes32() {
    // Using ethers v5 syntax
    return ethers.utils.hexlify(ethers.utils.randomBytes(32));
}

// Create a test task
async function createTestTask(luxServiceManager) {
    try {
        // Generate random bytes for image and metadata hash
        const imageHash = generateRandomBytes32();
        const metadataHash = generateRandomBytes32();
        // Use a random document type (1-3)
        const documentType = Math.floor(Math.random() * 3) + 1;

        console.log(`Creating task with imageHash: ${imageHash}`);
        console.log(`Creating task with metadataHash: ${metadataHash}`);
        console.log(`Document type: ${documentType}`);

        // Submit transaction to create task
        const tx = await luxServiceManager.createNewTask(imageHash, metadataHash, documentType, {
            gasLimit: 500000, // Add explicit gas limit to avoid transaction failures
        });
        console.log(`Transaction submitted: ${tx.hash}`);

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

        return receipt;
    } catch (error) {
        console.error(`Error creating task: ${error.message}`);
        // If error is related to authorization, check for role
        if (error.message.includes('NotAuthorized') || error.message.includes('not a task creator')) {
            throw new Error('Account is not authorized to create tasks. Use the addTaskCreator function first.');
        }
        throw error;
    }
}

// Add account as task creator (for the updated contract)
async function addTaskCreator(accessControlContract, account) {
    try {
        console.log(`Attempting to add ${account} as task creator...`);

        // Check if contract has this function
        if (typeof accessControlContract.hasRole !== 'function') {
            console.log(`Access control contract doesn't have hasRole function, skipping role check`);
            return false;
        }

        // Get the task creator role hash - using ethers v5 syntax
        const TASK_CREATOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('TASK_CREATOR_ROLE'));

        // Check if account already has role
        const hasRole = await accessControlContract.hasRole(TASK_CREATOR_ROLE, account);
        if (hasRole) {
            console.log(`Account ${account} already has task creator role`);
            return true;
        }

        // Add role
        const tx = await accessControlContract.grantRole(TASK_CREATOR_ROLE, account, {
            gasLimit: 200000,
        });
        console.log(`Role grant transaction submitted: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`Role granted in block ${receipt.blockNumber}`);
        return true;
    } catch (error) {
        console.error(`Error adding task creator role: ${error.message}`);
        return false;
    }
}

// Create multiple test tasks
async function createMultipleTestTasks(luxServiceManager, count) {
    console.log(`Creating ${count} test tasks...`);

    let successCount = 0;
    for (let i = 0; i < count; i++) {
        console.log(`Creating task ${i + 1} of ${count}`);
        try {
            await createTestTask(luxServiceManager);
            successCount++;
            // Wait a moment between tasks to avoid nonce issues
            await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`Failed to create task ${i + 1}: ${error.message}`);
        }
    }

    console.log(`Created ${successCount} out of ${count} test tasks successfully`);
    return successCount;
}

// Main function
async function main() {
    try {
        // Configure ethers provider - using ethers v5 syntax
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

        // Setup wallet
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        // Network name access for ethers v5
        const network = await provider.getNetwork();
        console.log(`Connected to network: ${network.name}`);
        console.log(`Using wallet address: ${wallet.address}`);

        // Create contract instances
        const luxServiceManager = new ethers.Contract(LUX_SERVICE_MANAGER_ADDRESS, LuxServiceManagerABI, wallet);
        console.log(`LuxServiceManager address: ${luxServiceManager.address}`);

        // Try to connect to access control contract if available
        let accessControlContract = null;
        if (ACCESS_CONTROL_ADDRESS) {
            try {
                accessControlContract = new ethers.Contract(ACCESS_CONTROL_ADDRESS, AccessControlABI, wallet);
                console.log(`AccessControl address: ${accessControlContract.address}`);

                // Try to add this wallet as task creator
                await addTaskCreator(accessControlContract, wallet.address);
            } catch (error) {
                console.log(`Failed to connect to AccessControl contract: ${error.message}`);
                console.log(`Continuing without AccessControl contract`);
            }
        } else {
            console.log(`No AccessControl address provided, skipping role setup`);
        }

        // Get the current task count
        const currentTaskNum = await luxServiceManager.latestTaskNum();
        console.log(`Current task count raw: ${currentTaskNum}`);

        // Convert BigNumber to number safely - ethers v5 approach
        let taskNumValue = currentTaskNum.toNumber();
        console.log(`Current task count (converted): ${taskNumValue}`);

        // Create multiple test tasks
        const numberOfTasks = 3;
        console.log(`Creating ${numberOfTasks} test tasks...`);

        const successCount = await createMultipleTestTasks(luxServiceManager, numberOfTasks);

        // Check if tasks were created
        const newTaskNum = await luxServiceManager.latestTaskNum();

        // Convert to number safely - ethers v5 approach
        let newTaskNumValue = newTaskNum.toNumber();
        console.log(`New task count (converted): ${newTaskNumValue}`);

        if (newTaskNumValue > taskNumValue) {
            console.log(`✅ Successfully created ${newTaskNumValue - taskNumValue} new tasks! (${taskNumValue} → ${newTaskNumValue})`);
        } else {
            console.log(`❌ Failed to create new tasks. Task count unchanged.`);
        }
    } catch (error) {
        console.error(`Error in main function: ${error.message}`);
    }
}

// Run the script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
