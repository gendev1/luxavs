import { useEffect, useRef } from 'react';

interface FloatingItem {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    type: 'watch' | 'bag' | 'jewelry' | 'logo';
}

const LuxuryBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const itemsRef = useRef<FloatingItem[]>([]);
    const frameRef = useRef<number>(0);
    const imagesRef = useRef<Record<string, HTMLImageElement>>({});
    const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        // Handle mouse movement
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: null, y: null };
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        // Load images
        const loadImages = async () => {
            const imageSources = {
                watch1: '/images/luxury-watch-1.png', // Replace with your actual image paths
                watch2: '/images/luxury-watch-2.png',
                bag1: '/images/luxury-bag-1.png',
                bag2: '/images/luxury-bag-2.png',
                jewelry1: '/images/luxury-jewelry-1.png',
                logo: '/images/logo-gold.png',
            };

            // For testing purposes, create colored blocks instead of loading images
            const createDummyImage = (color: string) => {
                const dummyCanvas = document.createElement('canvas');
                dummyCanvas.width = 80;
                dummyCanvas.height = 80;
                const dummyCtx = dummyCanvas.getContext('2d');
                if (dummyCtx) {
                    dummyCtx.fillStyle = color;
                    dummyCtx.beginPath();

                    // Create different shapes for different item types
                    if (color === 'gold') {
                        // Watch - circle
                        dummyCtx.arc(40, 40, 30, 0, Math.PI * 2);
                    } else if (color === 'rgba(212, 175, 55, 0.7)') {
                        // Bag - rectangle
                        dummyCtx.rect(15, 20, 50, 40);
                    } else if (color === 'rgba(229, 228, 226, 0.7)') {
                        // Jewelry - diamond shape
                        dummyCtx.moveTo(40, 10);
                        dummyCtx.lineTo(70, 40);
                        dummyCtx.lineTo(40, 70);
                        dummyCtx.lineTo(10, 40);
                    } else {
                        // Logo - hexagon
                        for (let i = 0; i < 6; i++) {
                            const angle = (Math.PI / 3) * i;
                            const x = 40 + 30 * Math.cos(angle);
                            const y = 40 + 30 * Math.sin(angle);
                            if (i === 0) dummyCtx.moveTo(x, y);
                            else dummyCtx.lineTo(x, y);
                        }
                    }

                    dummyCtx.closePath();
                    dummyCtx.fill();

                    if (color === 'gold' || color === 'rgba(212, 175, 55, 0.7)' || color === 'rgba(229, 228, 226, 0.7)') {
                        dummyCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                        dummyCtx.lineWidth = 2;
                        dummyCtx.stroke();
                    }
                }

                const img = new Image();
                img.src = dummyCanvas.toDataURL();
                return img;
            };

            const dummyImages = {
                watch1: createDummyImage('gold'),
                watch2: createDummyImage('gold'),
                bag1: createDummyImage('rgba(212, 175, 55, 0.7)'),
                bag2: createDummyImage('rgba(212, 175, 55, 0.7)'),
                jewelry1: createDummyImage('rgba(229, 228, 226, 0.7)'),
                logo: createDummyImage('rgba(212, 175, 55, 0.9)'),
            };

            imagesRef.current = dummyImages;
        };

        // Initialize floating items
        const initItems = () => {
            const itemCount = Math.max(Math.floor(window.innerWidth / 200), 10);
            const items: FloatingItem[] = [];

            for (let i = 0; i < itemCount; i++) {
                const types: ('watch' | 'bag' | 'jewelry' | 'logo')[] = ['watch', 'bag', 'jewelry', 'logo'];
                const type = types[Math.floor(Math.random() * types.length)];

                items.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 0.5 + 0.5, // Size multiplier between 0.5 and 1
                    speedX: (Math.random() - 0.5) * 0.3,
                    speedY: (Math.random() - 0.5) * 0.3,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.01,
                    opacity: Math.random() * 0.2 + 0.1, // Very subtle opacity between 0.1 and 0.3
                    type,
                });
            }

            itemsRef.current = items;
        };

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frameRef.current++;

            // Background gradient for smooth blending
            const bgGradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width);
            bgGradient.addColorStop(0, 'rgba(8, 8, 24, 0)');
            bgGradient.addColorStop(1, 'rgba(8, 8, 24, 0)');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw and update floating items
            itemsRef.current.forEach((item) => {
                // Update position
                item.x += item.speedX;
                item.y += item.speedY;

                // Wrap around edges
                if (item.x < -100) item.x = canvas.width + 100;
                if (item.x > canvas.width + 100) item.x = -100;
                if (item.y < -100) item.y = canvas.height + 100;
                if (item.y > canvas.height + 100) item.y = -100;

                // Update rotation
                item.rotation += item.rotationSpeed;

                // Slowly pulsate opacity
                item.opacity = 0.1 + Math.sin(frameRef.current * 0.02) * 0.05;

                // Draw the item
                ctx.save();
                ctx.translate(item.x, item.y);
                ctx.rotate(item.rotation);

                // Get image based on type
                let imageName = 'logo';
                if (item.type === 'watch') {
                    imageName = Math.random() > 0.5 ? 'watch1' : 'watch2';
                } else if (item.type === 'bag') {
                    imageName = Math.random() > 0.5 ? 'bag1' : 'bag2';
                } else if (item.type === 'jewelry') {
                    imageName = 'jewelry1';
                }

                const image = imagesRef.current[imageName];
                if (image) {
                    ctx.globalAlpha = item.opacity;
                    const size = 80 * item.size;
                    ctx.drawImage(image, -size / 2, -size / 2, size, size);
                }

                ctx.restore();

                // Mouse interaction
                const mouse = mouseRef.current;
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = mouse.x - item.x;
                    const dy = mouse.y - item.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        // Gentle push away from cursor
                        const pushFactor = 0.05;
                        const angle = Math.atan2(dy, dx);
                        item.speedX -= Math.cos(angle) * pushFactor;
                        item.speedY -= Math.sin(angle) * pushFactor;

                        // Add subtle glow effect around items near mouse
                        ctx.save();
                        ctx.translate(item.x, item.y);
                        ctx.rotate(item.rotation);
                        const glowSize = 80 * item.size * 1.5;

                        const glow = ctx.createRadialGradient(0, 0, glowSize / 3, 0, 0, glowSize);
                        glow.addColorStop(0, `rgba(212, 175, 55, ${0.2 * (1 - distance / 150)})`);
                        glow.addColorStop(1, 'rgba(212, 175, 55, 0)');

                        ctx.fillStyle = glow;
                        ctx.fillRect(-glowSize / 2, -glowSize / 2, glowSize, glowSize);
                        ctx.restore();
                    }
                }
            });

            // Apply speed limits and dampening
            itemsRef.current.forEach((item) => {
                const maxSpeed = 0.5;
                const dampening = 0.98;

                // Limit speed
                if (Math.abs(item.speedX) > maxSpeed) {
                    item.speedX = Math.sign(item.speedX) * maxSpeed;
                }
                if (Math.abs(item.speedY) > maxSpeed) {
                    item.speedY = Math.sign(item.speedY) * maxSpeed;
                }

                // Apply dampening
                item.speedX *= dampening;
                item.speedY *= dampening;
            });

            frameRef.current = requestAnimationFrame(animate);
        };

        // Load resources and start animation
        loadImages().then(() => {
            initItems();
            frameRef.current = requestAnimationFrame(animate);
        });

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(frameRef.current);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10 pointer-events-none" style={{ background: 'transparent' }} />;
};

export default LuxuryBackground;
