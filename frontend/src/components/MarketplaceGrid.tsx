import React from 'react';
import type { MarketplaceItem } from '../types';
import VerificationBadge from './VerificationBadge';

interface MarketplaceGridProps {
    items: MarketplaceItem[];
    onVerificationClick: (item: MarketplaceItem) => void;
}

const MarketplaceGrid: React.FC<MarketplaceGridProps> = ({ items, onVerificationClick }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item, index) => (
                <div
                    key={item.id}
                    className="group bg-black/40 backdrop-blur-sm rounded-2xl border border-gold/20 overflow-hidden transform hover:scale-105 transition-all duration-500 hover:shadow-xl hover:shadow-gold/10 animate-fade-in relative"
                    style={{
                        animationDelay: `${index * 150}ms`,
                    }}
                >
                    {item.verification && (
                        <VerificationBadge
                            isVerified={item.verification.isAuthentic}
                            confidence={item.verification.confidence}
                            verificationId={item.verification.verificationId}
                            onClick={() => onVerificationClick(item)}
                        />
                    )}
                    <div className="aspect-square overflow-hidden">
                        <img src={item.image} alt={`Item ${item.id}`} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-medium text-gold">#{item.id}</span>
                            <span className="text-sm text-gray-400">
                                {new Date(item.timestamp).toLocaleDateString(undefined, {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>
                        {item.verification && (
                            <div className="mt-3 text-xs cursor-pointer" onClick={() => onVerificationClick(item)}>
                                <span
                                    className={`
                    inline-block px-2 py-1 rounded-full
                    ${item.verification.isAuthentic ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}
                  `}
                                >
                                    {item.verification.isAuthentic
                                        ? `Authentic (${Math.round(item.verification.confidence * 100)}%)`
                                        : `Not Verified (${Math.round(item.verification.confidence * 100)}%)`}
                                </span>
                                {item.verification.productMetadata?.brand && (
                                    <span className="ml-2 inline-block px-2 py-1 rounded-full bg-gray-800/50 text-gray-300">{item.verification.productMetadata.brand}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MarketplaceGrid;
