import { X, CheckCircle, Calendar, MapPin, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import type { AuthenticatedItem } from '../types';

interface ItemVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: AuthenticatedItem;
}

const ItemVerificationModal = ({ isOpen, onClose, item }: ItemVerificationModalProps) => {
    const [expandedSection, setExpandedSection] = useState<'details' | 'provenance' | null>('details');

    if (!isOpen) return null;

    const toggleSection = (section: 'details' | 'provenance') => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Format date to a more readable format
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Format wallet address to be more readable
    const formatWalletAddress = (address: string) => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>

            {/* Modal */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-10 overflow-hidden">
                {/* Header */}
                <div className="border-b border-[var(--color-border)] flex justify-between items-center p-4">
                    <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Item Verification</h3>
                    <button onClick={onClose} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 pt-5 pb-3">
                    {/* Authentication Status */}
                    <div className="bg-[var(--color-sage-light)] rounded-lg p-4 mb-5 flex items-center">
                        <CheckCircle className="w-6 h-6 text-[var(--color-navy)] mr-3" />
                        <div>
                            <h4 className="font-medium text-[var(--color-navy)]">Authentic</h4>
                            <p className="text-sm text-[var(--color-text-secondary)]">This item has been verified on the blockchain</p>
                        </div>
                    </div>

                    {/* Item Info */}
                    <div className="mb-5">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{item.name}</h2>
                        <p className="text-[var(--color-text-secondary)] mb-3">{item.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-[var(--color-cream-light)] rounded-full text-[var(--color-text-secondary)]">{item.category}</span>
                            <span className="px-2 py-1 bg-[var(--color-cream-light)] rounded-full text-[var(--color-text-secondary)]">{item.year}</span>
                            <span className="px-2 py-1 bg-[var(--color-cream-light)] rounded-full text-[var(--color-text-secondary)]">{item.condition}</span>
                        </div>
                    </div>

                    {/* Ownership */}
                    <div className="bg-[var(--color-cream-light)] rounded-lg p-4 mb-5">
                        <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Current Owner</h4>
                        <p className="text-sm text-[var(--color-text-secondary)]">{formatWalletAddress(item.owner)}</p>
                        <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Token ID: {item.tokenId}</div>
                    </div>

                    {/* Collapsible Sections */}
                    {/* Item Details */}
                    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden mb-3">
                        <button
                            onClick={() => toggleSection('details')}
                            className="w-full flex justify-between items-center p-3 text-left font-medium text-[var(--color-text-primary)]"
                        >
                            Item Details
                            {expandedSection === 'details' ? (
                                <ChevronUp className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                            )}
                        </button>

                        {expandedSection === 'details' && (
                            <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-cream-light)] space-y-2">
                                {item.details.map((detail, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-[var(--color-text-secondary)]">{detail.label}</span>
                                        <span className="font-medium text-[var(--color-text-primary)]">{detail.value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--color-text-secondary)]">NFC Tag ID</span>
                                    <span className="font-medium text-[var(--color-text-primary)]">{item.nfcTagId}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Provenance History */}
                    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('provenance')}
                            className="w-full flex justify-between items-center p-3 text-left font-medium text-[var(--color-text-primary)]"
                        >
                            Provenance History
                            {expandedSection === 'provenance' ? (
                                <ChevronUp className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                            )}
                        </button>

                        {expandedSection === 'provenance' && (
                            <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-cream-light)]">
                                <div className="space-y-4">
                                    {item.provenance.map((event, index) => (
                                        <div key={index} className="relative pl-6 pb-4 border-l-2 border-[var(--color-navy)] last:border-transparent last:pb-0">
                                            <div className="absolute top-0 left-[-5px] w-8 h-8 bg-white rounded-full border-2 border-[var(--color-navy)] flex items-center justify-center">
                                                <div className="w-3 h-3 bg-[var(--color-navy)] rounded-full"></div>
                                            </div>
                                            <div className="ml-4">
                                                <h4 className="font-medium text-[var(--color-text-primary)]">{event.event}</h4>
                                                <div className="text-xs flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[var(--color-text-tertiary)]">
                                                    <span className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {formatDate(event.date)}
                                                    </span>
                                                    {event.location && (
                                                        <span className="flex items-center">
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {event.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[var(--color-cream-light)] p-4 border-t border-[var(--color-border)] flex justify-between items-center">
                    <div className="text-xs text-[var(--color-text-tertiary)]">Verified: {formatDate(item.timestamp)}</div>
                    <a
                        href={`https://etherscan.io/token/${item.tokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center text-[var(--color-navy)] hover:underline"
                    >
                        View on Blockchain
                        <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ItemVerificationModal;
