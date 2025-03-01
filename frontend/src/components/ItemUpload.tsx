import React, { useState, useRef } from 'react';
import { Camera, Upload, File, X, Loader2, Check, AlertTriangle } from 'lucide-react';
import { uploadToIPFS, uploadMetadataToIPFS, prepareNFTMetadata } from '../services/ipfsService';
import { mintNFT } from '../services/blockchainService';

interface ItemUploadProps {
    onUploadComplete: (data: { itemName: string; ipfsHash: string; imageUrl: string; tokenId?: string; txHash?: string }) => void;
    walletAddress?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'minting' | 'complete' | 'error';

const ItemUpload: React.FC<ItemUploadProps> = ({ onUploadComplete, walletAddress }) => {
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [year, setYear] = useState('');
    const [condition, setCondition] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const imageInputRef = useRef<HTMLInputElement>(null);
    const docsInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileList = Array.from(e.target.files);
            setSelectedDocs([...selectedDocs, ...fileList]);
        }
    };

    const removeDoc = (index: number) => {
        setSelectedDocs(selectedDocs.filter((_, i) => i !== index));
    };

    const clearImage = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedImage) {
            setErrorMessage('Please select an image of your collectible');
            return;
        }

        if (!itemName) {
            setErrorMessage('Please enter a name for your collectible');
            return;
        }

        if (!walletAddress) {
            setErrorMessage('Please connect your wallet first');
            return;
        }

        setStatus('uploading');
        setStatusMessage('Uploading image to IPFS...');
        setUploadProgress(10);
        setErrorMessage('');

        try {
            // Upload image to IPFS
            const imageResult = await uploadToIPFS(selectedImage);
            if (!imageResult.success || !imageResult.hash) {
                throw new Error(imageResult.error || 'Failed to upload image');
            }

            setUploadProgress(30);
            setStatusMessage('Uploading documentation...');

            // Upload documentation if available
            const docsResults = [];
            if (selectedDocs.length > 0) {
                for (const doc of selectedDocs) {
                    const docResult = await uploadToIPFS(doc);
                    if (docResult.success && docResult.hash) {
                        docsResults.push({
                            name: doc.name,
                            hash: docResult.hash,
                            url: docResult.url,
                        });
                    }
                }
            }

            setUploadProgress(50);
            setStatus('analyzing');
            setStatusMessage('Analyzing item authenticity...');

            // Simulate AI analysis delay (would be replaced with actual API call)
            await new Promise((resolve) => setTimeout(resolve, 2000));

            setUploadProgress(70);
            setStatusMessage('Preparing NFT metadata...');

            // Prepare NFT metadata
            const attributes = [
                { trait_type: 'Category', value: category || 'Uncategorized' },
                { trait_type: 'Year', value: year || 'Unknown' },
                { trait_type: 'Condition', value: condition || 'Unknown' },
            ];

            if (docsResults.length > 0) {
                attributes.push({
                    trait_type: 'Documentation',
                    value: docsResults.map((doc) => doc.hash).join(', '),
                });
            }

            const metadata = prepareNFTMetadata(itemName, description || `Authentic ${itemName}`, imageResult.hash, attributes);

            // Upload metadata to IPFS
            const metadataResult = await uploadMetadataToIPFS(metadata);
            if (!metadataResult.success || !metadataResult.hash) {
                throw new Error(metadataResult.error || 'Failed to upload metadata');
            }

            setUploadProgress(85);
            setStatus('minting');
            setStatusMessage('Minting NFT on blockchain...');

            // Mint NFT
            const mintResult = await mintNFT(walletAddress, metadataResult.url || `ipfs://${metadataResult.hash}`);
            if (!mintResult.success) {
                // Check specifically for ownership error
                if (mintResult.error?.includes('caller is not the owner')) {
                    throw new Error('You do not have permission to mint NFTs. Please contact the contract owner.');
                }
                throw new Error(mintResult.error || 'Failed to mint NFT');
            }

            setUploadProgress(100);
            setStatus('complete');
            setStatusMessage('Your collectible has been successfully authenticated and minted!');

            // Call the onUploadComplete callback with the result
            onUploadComplete({
                itemName,
                ipfsHash: imageResult.hash,
                imageUrl: imageResult.url || `ipfs://${imageResult.hash}`,
                tokenId: mintResult.tokenId,
                txHash: mintResult.txHash,
            });

            // Reset form after successful submission
            setTimeout(() => {
                setItemName('');
                setDescription('');
                setCategory('');
                setYear('');
                setCondition('');
                setSelectedImage(null);
                setPreviewUrl(null);
                setSelectedDocs([]);
                setStatus('idle');
                setUploadProgress(0);
                if (imageInputRef.current) imageInputRef.current.value = '';
                if (docsInputRef.current) docsInputRef.current.value = '';
            }, 3000);
        } catch (error) {
            console.error('Error processing item:', error);
            setStatus('error');
            setStatusMessage('There was an error processing your item');
            // Make the error message more user-friendly
            const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
            setErrorMessage(errorMsg.includes('caller is not the owner') ? 'You do not have permission to mint NFTs. Please contact the contract owner.' : errorMsg);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto elegant-card p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-medium text-[var(--color-navy)] mb-6">Authenticate Your Collectible</h2>

            {status === 'complete' ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-[var(--color-emerald-light)]/20 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-[var(--color-emerald)]" />
                    </div>
                    <h3 className="text-xl font-medium text-[var(--color-emerald)] mb-2">Authentication Complete!</h3>
                    <p className="text-[var(--color-text-secondary)] mb-6">{statusMessage}</p>
                    <button className="elegant-button-primary" onClick={() => setStatus('idle')}>
                        Authenticate Another Item
                    </button>
                </div>
            ) : status === 'error' ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-[var(--color-coral-light)]/20 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-[var(--color-coral)]" />
                    </div>
                    <h3 className="text-xl font-medium text-[var(--color-coral)] mb-2">Authentication Failed</h3>
                    <p className="text-[var(--color-text-secondary)] mb-2">{statusMessage}</p>
                    {errorMessage && <p className="text-[var(--color-coral)] text-sm mb-6">{errorMessage}</p>}
                    <button className="elegant-button-primary" onClick={() => setStatus('idle')}>
                        Try Again
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {(status === 'uploading' || status === 'analyzing' || status === 'minting') && (
                        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in">
                            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 border border-[var(--color-border)] shadow-subtle animate-slide-up text-center">
                                <Loader2 className="w-12 h-12 text-[var(--color-navy)] animate-spin mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-[var(--color-navy)] mb-4">{statusMessage}</h3>
                                <div className="h-2 bg-[var(--color-cream-dark)] rounded-full overflow-hidden mt-4">
                                    <div className="h-full bg-[var(--color-navy)]" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                                <p className="text-sm text-[var(--color-text-secondary)] mt-2">{uploadProgress}% complete</p>
                            </div>
                        </div>
                    )}

                    {/* Image Upload Section */}
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-1/2">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Item Image</label>
                            <div
                                className={`border-2 border-dashed rounded-lg overflow-hidden aspect-square flex items-center justify-center relative ${
                                    previewUrl ? 'border-0' : 'border-[var(--color-border-dark)] hover:border-[var(--color-navy-light)]'
                                }`}
                            >
                                {previewUrl ? (
                                    <div className="relative w-full h-full">
                                        <img src={previewUrl} alt="Item preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute top-2 right-2 bg-white/70 rounded-full p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-navy)]"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center p-8 cursor-pointer" onClick={() => imageInputRef.current?.click()}>
                                        <Camera className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-3" />
                                        <p className="text-[var(--color-text-secondary)]">Upload an image of your collectible</p>
                                        <p className="text-[var(--color-text-tertiary)] text-sm mt-1">Click or drag and drop</p>
                                    </div>
                                )}
                                <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 space-y-4">
                            <div>
                                <label htmlFor="itemName" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    Item Name
                                </label>
                                <input
                                    type="text"
                                    id="itemName"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    className="elegant-input w-full"
                                    placeholder="e.g. Rolex Submariner"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="elegant-input w-full resize-none"
                                    placeholder="Brief description of your collectible"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Category
                                    </label>
                                    <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="elegant-select w-full">
                                        <option value="">Select category</option>
                                        <option value="Watches">Watches</option>
                                        <option value="Comics">Comics</option>
                                        <option value="Cards">Cards</option>
                                        <option value="Coins">Coins</option>
                                        <option value="Art">Art</option>
                                        <option value="Memorabilia">Memorabilia</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="year" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Year
                                    </label>
                                    <input type="text" id="year" value={year} onChange={(e) => setYear(e.target.value)} className="elegant-input w-full" placeholder="e.g. 1990" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="condition" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    Condition
                                </label>
                                <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value)} className="elegant-select w-full">
                                    <option value="">Select condition</option>
                                    <option value="Mint">Mint</option>
                                    <option value="Near Mint">Near Mint</option>
                                    <option value="Excellent">Excellent</option>
                                    <option value="Very Good">Very Good</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Poor">Poor</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Documentation Upload Section */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">Supporting Documentation (Optional)</label>
                        <div className="border border-[var(--color-border)] rounded-lg p-5 bg-white">
                            <div
                                className="border-2 border-dashed border-[var(--color-border-dark)] rounded-lg p-6 text-center cursor-pointer hover:border-[var(--color-navy-light)]"
                                onClick={() => docsInputRef.current?.click()}
                            >
                                <Upload className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-2" />
                                <p className="text-[var(--color-text-secondary)]">Upload receipts, certificates, or other documentation</p>
                                <p className="text-[var(--color-text-tertiary)] text-sm mt-1">Click or drag and drop</p>
                            </div>
                            <input type="file" ref={docsInputRef} onChange={handleDocsChange} multiple className="hidden" />

                            {selectedDocs.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {selectedDocs.map((doc, index) => (
                                        <div key={index} className="flex items-center justify-between bg-[var(--color-cream)] p-3 rounded-lg">
                                            <div className="flex items-center">
                                                <File className="w-5 h-5 text-[var(--color-text-secondary)] mr-3" />
                                                <div>
                                                    <p className="text-sm text-[var(--color-text-primary)] truncate max-w-[200px] md:max-w-xs">{doc.name}</p>
                                                    <p className="text-xs text-[var(--color-text-tertiary)]">{(doc.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeDoc(index)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-coral)]">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="text-[var(--color-coral)] text-sm flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {errorMessage}
                        </div>
                    )}

                    <div className="pt-4">
                        <button type="submit" disabled={status !== 'idle'} className="elegant-button-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                            Authenticate & Create NFT
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ItemUpload;
