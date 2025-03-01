import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

dotenv.config();

// Setup env variables
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
/// TODO: Hack
let chainId = 31337;

// Load contract data
const avsDeploymentData = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../contracts/deployments/lux-protocol/${chainId}.json`), 'utf8'));
const luxServiceManagerAddress = avsDeploymentData.addresses.luxServiceManager;
const luxServiceManagerABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/LuxServiceManager.json'), 'utf8'));

// Initialize contract
const luxServiceManager = new ethers.Contract(luxServiceManagerAddress, luxServiceManagerABI, wallet);

// Document types enum
enum DocumentType {
    RECEIPT = 0,
    INVOICE = 1,
    WARRANTY = 2,
    PRODUCT_IMAGE = 3,
}

// Mock image directory - replace with actual image storage in production
const MOCK_IMAGES_DIR = path.resolve(__dirname, '../mock-images');

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
        const tx = await luxServiceManager.createNewTask(imageHash, metadataHash, documentType);

        // Wait for transaction to be mined
        const receipt = await tx.wait();

        console.log(`Transaction successful with hash: ${receipt.hash}`);
        return receipt;
    } catch (error) {
        console.error('Error creating verification task:', error);
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
        const imageFiles = files.filter((file) => ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase()));

        if (imageFiles.length === 0) {
            // Return mock path if no images found
            return path.join(MOCK_IMAGES_DIR, 'mock.jpg');
        }

        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        return path.join(MOCK_IMAGES_DIR, randomImage);
    } catch (error) {
        console.error('Error accessing mock images directory:', error);
        // Return mock path in case of error
        return path.join(MOCK_IMAGES_DIR, 'mock.jpg');
    }
}

/**
 * Starts creating verification tasks at regular intervals
 */
function startCreatingVerificationTasks() {
    console.log('Starting document verification task creation...');

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
