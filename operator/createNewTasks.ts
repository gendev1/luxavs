import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

dotenv.config();

// Setup env variables
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 31337;

// Load contract data - fix path to deployment file
let avsDeploymentData;
try {
    // Try standard path first
    const deploymentPath = path.resolve(__dirname, `../contracts/deployments/${chainId}.json`);
    if (fs.existsSync(deploymentPath)) {
        avsDeploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    } else {
        // Try alternative path
        const altDeploymentPath = path.resolve(__dirname, `../deployments/${chainId}.json`);
        if (fs.existsSync(altDeploymentPath)) {
            avsDeploymentData = JSON.parse(fs.readFileSync(altDeploymentPath, 'utf8'));
        } else {
            throw new Error(`Deployment file not found for chain ID ${chainId}`);
        }
    }
} catch (error) {
    console.error('Error loading deployment data:', error);
    process.exit(1);
}

// Extract LuxServiceManager address from the deployment data
let luxServiceManagerAddress;
if (avsDeploymentData.luxServiceManager) {
    // Direct format
    luxServiceManagerAddress = avsDeploymentData.luxServiceManager;
} else if (avsDeploymentData.addresses && avsDeploymentData.addresses.luxServiceManager) {
    // Nested addresses format
    luxServiceManagerAddress = avsDeploymentData.addresses.luxServiceManager;
} else if (avsDeploymentData.deployment && avsDeploymentData.deployment.luxServiceManager) {
    // Nested deployment format
    luxServiceManagerAddress = avsDeploymentData.deployment.luxServiceManager;
} else {
    console.error('Could not find LuxServiceManager address in deployment data');
    process.exit(1);
}

console.log(`Using LuxServiceManager at address: ${luxServiceManagerAddress}`);

// Try to load ABI from multiple possible locations
let luxServiceManagerABI;
try {
    const abiPaths = [
        path.resolve(__dirname, '../abis/LuxServiceManager.json'),
        path.resolve(__dirname, '../contracts/out/LuxServiceManager.sol/LuxServiceManager.json'),
        path.resolve(__dirname, '../contracts/artifacts/src/LuxServiceManager.sol/LuxServiceManager.json'),
    ];

    for (const abiPath of abiPaths) {
        if (fs.existsSync(abiPath)) {
            const abiData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
            luxServiceManagerABI = abiData.abi || abiData;
            console.log(`Loaded ABI from: ${abiPath}`);
            break;
        }
    }

    if (!luxServiceManagerABI) {
        throw new Error('Could not find LuxServiceManager ABI');
    }
} catch (error) {
    console.error('Error loading ABI:', error);
    process.exit(1);
}

// Initialize contract
const luxServiceManager = new ethers.Contract(luxServiceManagerAddress, luxServiceManagerABI, wallet);

// Document types enum
enum DocumentType {
    RECEIPT = 0,
    INVOICE = 1,
    WARRANTY = 2,
    PRODUCT_IMAGE = 3,
}

// Mock image directory - ensure it exists
const MOCK_IMAGES_DIR = path.resolve(__dirname, '../mock-images');
if (!fs.existsSync(MOCK_IMAGES_DIR)) {
    console.log(`Creating mock images directory at: ${MOCK_IMAGES_DIR}`);
    fs.mkdirSync(MOCK_IMAGES_DIR, { recursive: true });

    // Create a simple text file that can be used as a fallback
    const mockImagePath = path.join(MOCK_IMAGES_DIR, 'mock.txt');
    fs.writeFileSync(mockImagePath, 'This is a mock image file for testing purposes.');
    console.log(`Created mock image file at: ${mockImagePath}`);
}

/**
 * Generates a hash from an image file
 * @param imagePath Path to the image file
 * @returns Promise with the keccak256 hash of the image
 */
async function hashImageFile(imagePath: string): Promise<string> {
    try {
        const imageBuffer = await fs.promises.readFile(imagePath);
        return ethers.keccak256(imageBuffer);
    } catch (error) {
        console.error('Error reading or hashing image:', error);
        // Return a mock hash for testing when file is not available
        return ethers.keccak256(ethers.toUtf8Bytes(`mock-image-${Date.now()}`));
    }
}

/**
 * Generates metadata for a document verification task
 * @param productId Unique product identifier
 * @param purchaseDate Date of purchase
 * @param storeLocation Store location information
 * @returns Object with metadata and its hash
 */
function generateMetadata(productId: string, purchaseDate: Date, storeLocation: string) {
    const metadata = {
        productId,
        purchaseDate: purchaseDate.toISOString(),
        storeLocation,
        verificationRequestTime: new Date().toISOString(),
    };

    const metadataString = JSON.stringify(metadata);
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataString));

    return { metadata, metadataHash };
}

/**
 * Creates a new document verification task
 * @param imagePath Path to the document image
 * @param documentType Type of document being verified
 * @param productId Product identifier
 */
async function createDocumentVerificationTask(imagePath: string, documentType: DocumentType, productId: string) {
    try {
        // Generate random purchase details
        const purchaseDate = new Date();
        purchaseDate.setDate(purchaseDate.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days

        const storeLocations = ['Store #123 - NYC', 'Store #456 - LA', 'Store #789 - Chicago'];
        const storeLocation = storeLocations[Math.floor(Math.random() * storeLocations.length)];

        // Generate image hash and metadata
        const imageHash = await hashImageFile(imagePath);
        const { metadataHash } = generateMetadata(productId, purchaseDate, storeLocation);

        console.log(`Creating verification task for product: ${productId}`);
        console.log(`Document type: ${DocumentType[documentType]}`);
        console.log(`Image hash: ${imageHash}`);
        console.log(`Metadata hash: ${metadataHash}`);

        // Send transaction to create new task
        console.log('Submitting transaction to create task...');
        const tx = await luxServiceManager.createNewTask(imageHash, metadataHash, documentType);
        console.log(`Transaction submitted with hash: ${tx.hash}`);

        // Wait for transaction to be mined
        console.log('Waiting for transaction confirmation...');
        const receipt = await tx.wait();

        console.log(`Transaction successful with hash: ${receipt.hash}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
        return receipt;
    } catch (error: any) {
        console.error('Error creating verification task:', error);
        // Log more details about the error
        if (error.code) {
            console.error(`Error code: ${error.code}`);
        }
        if (error.reason) {
            console.error(`Error reason: ${error.reason}`);
        }
        throw error;
    }
}

/**
 * Generates a random product ID
 * @returns Random product ID string
 */
function generateRandomProductId(): string {
    const brands = ['LUX', 'EIGEN', 'CRYPTO', 'BLOCK', 'WEB3'];
    const categories = ['SHOE', 'BAG', 'WATCH', 'WALLET', 'JEWELRY'];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const serialNumber = Math.floor(10000 + Math.random() * 90000);

    return `${brand}-${category}-${serialNumber}`;
}

/**
 * Gets a random image path from the mock images directory
 * @returns Path to a random image
 */
function getRandomImagePath(): string {
    try {
        const files = fs.readdirSync(MOCK_IMAGES_DIR);
        // Accept any file as an "image" for hashing purposes
        const imageFiles = files.filter((file) => !fs.statSync(path.join(MOCK_IMAGES_DIR, file)).isDirectory());

        if (imageFiles.length === 0) {
            // If no files found, create and return mock file
            const mockPath = path.join(MOCK_IMAGES_DIR, `mock-${Date.now()}.txt`);
            fs.writeFileSync(mockPath, `Mock content generated at ${new Date().toISOString()}`);
            return mockPath;
        }

        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        return path.join(MOCK_IMAGES_DIR, randomImage);
    } catch (error) {
        console.error('Error accessing mock images directory:', error);
        // Create and return a mock file in case of error
        const mockPath = path.join(MOCK_IMAGES_DIR, `mock-error-${Date.now()}.txt`);
        fs.writeFileSync(mockPath, `Mock content generated after error at ${new Date().toISOString()}`);
        return mockPath;
    }
}

/**
 * Starts creating verification tasks at regular intervals
 */
function startCreatingVerificationTasks() {
    console.log('Starting document verification task creation...');
    console.log(`Connected to chain ID: ${chainId}`);
    console.log(`Using wallet address: ${wallet.address}`);

    // Create one task immediately
    const productId = generateRandomProductId();
    const documentType = Math.floor(Math.random() * 4) as DocumentType;
    const imagePath = getRandomImagePath();

    createDocumentVerificationTask(imagePath, documentType, productId)
        .then(() => console.log('Initial task created successfully'))
        .catch((err) => console.error('Failed to create initial task:', err));

    // Then set up interval for additional tasks
    setInterval(() => {
        const productId = generateRandomProductId();
        const documentType = Math.floor(Math.random() * 4) as DocumentType;
        const imagePath = getRandomImagePath();

        createDocumentVerificationTask(imagePath, documentType, productId)
            .then(() => console.log('Task created successfully'))
            .catch((err) => console.error('Failed to create task:', err));
    }, 24000); // Create a new task every 24 seconds
}

// Start the process
startCreatingVerificationTasks();
