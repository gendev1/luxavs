import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Check if the process.env object is empty
if (!Object.keys(process.env).length) {
    throw new Error('process.env object is empty');
}

// Setup env variables
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
/// TODO: Hack
let chainId = 31337;

// Load deployment data
const avsDeploymentData = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../contracts/deployments/lux-protocol/${chainId}.json`), 'utf8'));
const coreDeploymentData = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../contracts/deployments/core/${chainId}.json`), 'utf8'));

// Get contract addresses
const delegationManagerAddress = coreDeploymentData.addresses.delegation;
const avsDirectoryAddress = coreDeploymentData.addresses.avsDirectory;
const luxServiceManagerAddress = avsDeploymentData.addresses.luxServiceManager;
const ecdsaStakeRegistryAddress = avsDeploymentData.addresses.stakeRegistry;

// Load ABIs
const delegationManagerABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/IDelegationManager.json'), 'utf8'));
const ecdsaRegistryABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/ECDSAStakeRegistry.json'), 'utf8'));
const luxServiceManagerABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/LuxServiceManager.json'), 'utf8'));
const avsDirectoryABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/IAVSDirectory.json'), 'utf8'));

// Initialize contract objects from ABIs
const delegationManager = new ethers.Contract(delegationManagerAddress, delegationManagerABI, wallet);
const luxServiceManager = new ethers.Contract(luxServiceManagerAddress, luxServiceManagerABI, wallet);
const ecdsaRegistryContract = new ethers.Contract(ecdsaStakeRegistryAddress, ecdsaRegistryABI, wallet);
const avsDirectory = new ethers.Contract(avsDirectoryAddress, avsDirectoryABI, wallet);

/**
 * Signs and responds to a document verification task
 * @param taskIndex The index of the task to respond to
 * @param task The task data (imageHash, metadataHash, documentType, taskCreatedBlock)
 */
const signAndRespondToTask = async (taskIndex: number, task: any) => {
    // Create the message hash from task data
    const messageHash = ethers.solidityPackedKeccak256(['bytes32', 'bytes32', 'uint8'], [task.imageHash, task.metadataHash, task.documentType]);

    const messageBytes = ethers.getBytes(messageHash);
    const signature = await wallet.signMessage(messageBytes);

    console.log(`Signing and responding to task ${taskIndex}`);
    console.log(`Document type: ${task.documentType}`);
    console.log(`Image hash: ${task.imageHash}`);
    console.log(`Metadata hash: ${task.metadataHash}`);

    // Prepare operator signature data
    const operators = [await wallet.getAddress()];
    const signatures = [signature];
    const signedTask = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address[]', 'bytes[]', 'uint32'],
        [operators, signatures, ethers.toBigInt((await provider.getBlockNumber()) - 1)]
    );

    try {
        // Submit response to the task
        const tx = await luxServiceManager.respondToTask(
            {
                imageHash: task.imageHash,
                metadataHash: task.metadataHash,
                documentType: task.documentType,
                taskCreatedBlock: task.taskCreatedBlock,
            },
            taskIndex,
            signedTask
        );
        await tx.wait();
        console.log(`Document verification response submitted successfully.`);

        // Log verification decision (in a real system, this would be based on analyzing the document)
        const verificationResult = Math.random() > 0.2 ? 'VERIFIED' : 'REJECTED';
        console.log(`Document ${verificationResult}`);
    } catch (error) {
        console.error(`Error responding to task ${taskIndex}:`, error);
    }
};

/**
 * Registers the wallet as an operator in EigenLayer and the Lux AVS
 */
const registerOperator = async () => {
    // Register as an Operator in EigenLayer
    try {
        const tx1 = await delegationManager.registerAsOperator(
            {
                __deprecated_earningsReceiver: await wallet.address,
                delegationApprover: '0x0000000000000000000000000000000000000000',
                stakerOptOutWindowBlocks: 0,
            },
            ''
        );
        await tx1.wait();
        console.log('Operator registered to Core EigenLayer contracts');
    } catch (error) {
        console.error('Error in registering as operator:', error);
    }

    // Generate salt and expiry for registration
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    // Define the output structure
    let operatorSignatureWithSaltAndExpiry = {
        signature: '',
        salt: salt,
        expiry: expiry,
    };

    // Calculate the digest hash for AVS registration
    const operatorDigestHash = await avsDirectory.calculateOperatorAVSRegistrationDigestHash(wallet.address, await luxServiceManager.getAddress(), salt, expiry);
    console.log('Operator digest hash:', operatorDigestHash);

    // Sign the digest hash with the operator's private key
    console.log("Signing digest hash with operator's private key");
    const operatorSigningKey = new ethers.SigningKey(process.env.PRIVATE_KEY!);
    const operatorSignedDigestHash = operatorSigningKey.sign(operatorDigestHash);

    // Encode the signature in the required format
    operatorSignatureWithSaltAndExpiry.signature = ethers.Signature.from(operatorSignedDigestHash).serialized;

    console.log('Registering Operator to Lux AVS Registry contract');

    // Register Operator to AVS
    try {
        const tx2 = await ecdsaRegistryContract.registerOperatorWithSignature(operatorSignatureWithSaltAndExpiry, wallet.address);
        await tx2.wait();
        console.log('Operator registered on Lux AVS successfully');
    } catch (error) {
        console.error('Error registering with AVS:', error);
    }
};

/**
 * Monitors for new document verification tasks and responds to them
 */
const monitorDocumentVerificationTasks = async () => {
    // Listen for new tasks
    luxServiceManager.on('NewTaskCreated', async (taskIndex: number, task: any) => {
        console.log(`New document verification task detected (index: ${taskIndex})`);
        console.log(`Document type: ${task.documentType}`);

        // Add delay to simulate document analysis process
        const analysisTime = 3000 + Math.floor(Math.random() * 5000);
        console.log(`Analyzing document... (${analysisTime}ms)`);

        setTimeout(async () => {
            await signAndRespondToTask(taskIndex, task);
        }, analysisTime);
    });

    console.log('Monitoring for new document verification tasks...');

    // Log operator status
    const operatorAddress = await wallet.getAddress();
    try {
        const isRegistered = await ecdsaRegistryContract.operatorRegistered(operatorAddress);
        console.log(`Operator ${operatorAddress} registration status: ${isRegistered ? 'REGISTERED' : 'NOT REGISTERED'}`);
    } catch (error) {
        console.error('Error checking operator status:', error);
    }
};

/**
 * Main function to run the service
 */
const main = async () => {
    console.log('Starting Lux Protocol document verification operator service...');

    try {
        await registerOperator();
        await monitorDocumentVerificationTasks();
    } catch (error) {
        console.error('Error in main function:', error);
    }
};

// Run the main function
main().catch((error) => {
    console.error('Fatal error:', error);
});
