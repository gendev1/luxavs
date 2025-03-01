import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <div className="elegant-card p-12 max-w-md w-full">
                <div className="mb-8">
                    <h1 className="text-6xl font-bold text-[var(--color-navy)] mb-2">404</h1>
                    <div className="w-16 h-1 bg-[var(--color-navy)] mx-auto mb-6"></div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">Page Not Found</h2>
                    <p className="text-[var(--color-text-secondary)]">We couldn't find the page you're looking for. It might have been moved or doesn't exist.</p>
                </div>

                <div className="space-y-4">
                    <button onClick={() => navigate(-1)} className="elegant-button-secondary w-full flex items-center justify-center py-3">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </button>

                    <button onClick={() => navigate('/')} className="elegant-button-primary w-full py-3">
                        Return to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
