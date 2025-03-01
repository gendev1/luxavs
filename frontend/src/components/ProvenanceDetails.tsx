import React from 'react';
import VerificationDetails from './VerificationDetails';
import { AuthenticatedItem } from '../types';

interface ProvenanceDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    provenanceData: AuthenticatedItem;
}

const ProvenanceDetails: React.FC<ProvenanceDetailsProps> = ({ isOpen, onClose, provenanceData }) => {
    // The ProvenanceDetails component simply passes the data to VerificationDetails
    // In a more complex app, this could display additional provenance information,
    // blockchain history, etc.
    return <VerificationDetails isOpen={isOpen} onClose={onClose} verification={provenanceData} />;
};

export default ProvenanceDetails;
