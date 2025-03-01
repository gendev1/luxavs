import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface VerificationBadgeProps {
    isVerified: boolean;
    confidence: number;
    verificationId: string;
    onClick: () => void;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ isVerified, confidence, verificationId, onClick }) => {
    return (
        <div className="absolute top-3 right-3 z-10 cursor-pointer" onClick={onClick}>
            <div
                className={`
        flex items-center space-x-1 px-3 py-1.5 rounded-full 
        backdrop-blur-md shadow-lg transition-all duration-300
        ${isVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}
      `}
            >
                {isVerified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span className="text-xs font-medium">{isVerified ? 'Verified' : 'Unverified'}</span>
            </div>
        </div>
    );
};

export default VerificationBadge;
