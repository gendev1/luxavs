import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Tag, QrCode, ArrowRight, CreditCard, CheckCircle } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();
    const [isUserMode, setIsUserMode] = useState(true);

    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-12">
            {/* Hero Section */}
            <div className="py-12 md:py-20 text-center relative">
                {/* Background effects */}
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)]"></div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Verify Luxury Authenticity with Blockchain</h1>
                <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-10">
                    Secure and verify high-end items with advanced NFC technology and immutable blockchain records
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => navigate('/user')} className="elegant-button-primary flex items-center justify-center py-3 px-8 text-lg">
                        <ShieldCheck className="w-5 h-5 mr-2" />
                        Verify Items
                    </button>
                    <button onClick={() => navigate('/admin')} className="elegant-button-secondary flex items-center justify-center py-3 px-8 text-lg">
                        <Tag className="w-5 h-5 mr-2" />
                        Admin Panel
                    </button>
                </div>
            </div>

            {/* Mode Switch */}
            <div className="bg-[var(--color-card-accent)] rounded-xl p-4 flex">
                <button
                    onClick={() => setIsUserMode(true)}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                        isUserMode
                            ? 'bg-[var(--color-card)] border border-[var(--color-border)] shadow-md text-[var(--color-gold)]'
                            : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-panel)]/50'
                    }`}
                >
                    For Collectors & Users
                </button>
                <button
                    onClick={() => setIsUserMode(false)}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                        !isUserMode
                            ? 'bg-[var(--color-card)] border border-[var(--color-border)] shadow-md text-[var(--color-gold)]'
                            : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-panel)]/50'
                    }`}
                >
                    For Brands & Businesses
                </button>
            </div>

            {/* Features Section */}
            {isUserMode ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<QrCode className="w-10 h-10" />}
                        title="Scan NFC Tags"
                        description="Instantly verify authenticity of luxury items with a simple NFC scan"
                        linkText="Try Scanning"
                        linkUrl="/user/scan"
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="w-10 h-10" />}
                        title="View Provenance"
                        description="Access complete provenance history and verify item authenticity"
                        linkText="View Demo Item"
                        linkUrl="/user"
                    />
                    <FeatureCard
                        icon={<CreditCard className="w-10 h-10" />}
                        title="Manage Collection"
                        description="Build and view your authenticated collection of luxury items"
                        linkText="Explore Collections"
                        linkUrl="/user/collections"
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Tag className="w-10 h-10" />}
                        title="Register Items"
                        description="Register your luxury items on the blockchain with secure NFC tags"
                        linkText="Admin Dashboard"
                        linkUrl="/admin"
                    />
                    <FeatureCard
                        icon={<CheckCircle className="w-10 h-10" />}
                        title="Verify Authenticity"
                        description="Provide irrefutable proof of authenticity for your high-value products"
                        linkText="Learn More"
                        linkUrl="/admin/luxury-items"
                    />
                    <FeatureCard
                        icon={<CreditCard className="w-10 h-10" />}
                        title="Manage NFC Cards"
                        description="Issue and manage NFC cards linked to luxury items on the blockchain"
                        linkText="NFC Management"
                        linkUrl="/admin/nfc-cards"
                    />
                </div>
            )}

            {/* How It Works Section */}
            <div className="pt-10">
                <h2 className="text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12">How It Works</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StepCard step={1} title="Register Item" description="Register a luxury item with an NFC tag on the blockchain" />
                    <StepCard step={2} title="Link to Metadata" description="Add details, photos, and provenance information" />
                    <StepCard step={3} title="Scan NFC Tag" description="Use any smartphone to scan the NFC tag on the item" />
                    <StepCard step={4} title="Verify Authenticity" description="View complete provenance and authentication details" />
                </div>
            </div>

            {/* CTA Section */}
            <div className="elegant-card p-10 text-center mt-12 border border-[var(--color-border)] relative overflow-hidden">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)] opacity-70"></div>

                <h2 className="text-2xl md:text-3xl font-bold mb-4 relative z-10">Ready to get started?</h2>
                <p className="text-[var(--color-text-secondary)] mb-8 max-w-2xl mx-auto relative z-10">
                    Experience the future of luxury item authentication and provenance tracking with blockchain technology
                </p>
                <button
                    onClick={() => navigate(isUserMode ? '/user' : '/admin')}
                    className="elegant-button-primary flex items-center justify-center py-3 px-8 text-lg mx-auto relative z-10"
                >
                    {isUserMode ? 'Verify Your Items' : 'Register Your Brand'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                </button>
            </div>
        </div>
    );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description, linkText, linkUrl }: { icon: React.ReactNode; title: string; description: string; linkText: string; linkUrl: string }) => {
    const navigate = useNavigate();

    return (
        <div className="elegant-card p-6 flex flex-col h-full">
            <div className="bg-[var(--color-card-accent)] w-16 h-16 flex items-center justify-center rounded-lg mb-4 text-[var(--color-gold)]">{icon}</div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-[var(--color-text-secondary)] mb-4 flex-grow">{description}</p>
            <button onClick={() => navigate(linkUrl)} className="text-[var(--color-gold)] font-medium flex items-center hover:text-[var(--color-gold-light)]">
                {linkText}
                <ArrowRight className="w-4 h-4 ml-1" />
            </button>
        </div>
    );
};

// Step Card Component
const StepCard = ({ step, title, description }: { step: number; title: string; description: string }) => {
    return (
        <div className="elegant-card p-6 relative">
            <div className="bg-[var(--color-primary)] text-black w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-4 shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                {step}
            </div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-[var(--color-text-secondary)]">{description}</p>

            {/* Connection Line */}
            {step < 4 && <div className="hidden md:block absolute top-10 -right-3 w-6 h-0.5 bg-[var(--color-border)] z-10"></div>}
        </div>
    );
};

export default Landing;
