import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
    alpha: number;
    growing: boolean;
    shape: 'circle' | 'square' | 'hexagon';
    rotation: number;
    rotationSpeed: number;
}

const Web3Background = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
    const frameRef = useRef<number>(0);

    // Colors for the particles
    const particleColors = [
        'rgba(212, 175, 55, 0.7)', // Gold
        'rgba(138, 94, 216, 0.6)', // Purple
        'rgba(29, 168, 252, 0.5)', // Blue
        'rgba(54, 227, 180, 0.4)', // Teal
        'rgba(255, 255, 255, 0.3)', // White
    ];

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

        // Initialize particles
        const initParticles = () => {
            const particleCount = Math.max(Math.floor(window.innerWidth / 20), 60);
            const particles: Particle[] = [];

            for (let i = 0; i < particleCount; i++) {
                const shape = Math.random() > 0.7 ? (Math.random() > 0.5 ? 'square' : 'hexagon') : 'circle';
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 3 + 1,
                    speedX: (Math.random() - 0.5) * 0.4,
                    speedY: (Math.random() - 0.5) * 0.4,
                    color: particleColors[Math.floor(Math.random() * particleColors.length)],
                    alpha: Math.random() * 0.5 + 0.3,
                    growing: Math.random() > 0.5,
                    shape,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.02,
                });
            }

            particlesRef.current = particles;
        };

        initParticles();

        // Draw hexagon shape
        const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number = 0) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const px = size * Math.cos(angle);
                const py = size * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };

        // Draw square shape
        const drawSquare = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number = 0) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.beginPath();
            ctx.rect(-size / 2, -size / 2, size, size);
            ctx.fill();
            ctx.restore();
        };

        // Create connections between particles
        const connect = () => {
            const particles = particlesRef.current;
            const mouse = mouseRef.current;

            // Mouse attraction effect
            if (mouse.x !== null && mouse.y !== null) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
                ctx.lineWidth = 0.5;

                particles.forEach((particle) => {
                    const dx = mouse.x! - particle.x;
                    const dy = mouse.y! - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        const opacity = 1 - distance / 150;
                        ctx.strokeStyle = `rgba(212, 175, 55, ${opacity * 0.3})`;
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(mouse.x!, mouse.y!);
                        ctx.stroke();

                        // Push particles slightly away from mouse
                        const forceDirection = { x: dx / distance, y: dy / distance };
                        const force = (150 - distance) / 15000;
                        particle.speedX -= forceDirection.x * force;
                        particle.speedY -= forceDirection.y * force;
                    }
                });
            }

            // Connect particles
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        const opacity = 1 - distance / 120;
                        const colorHue = Math.abs(Math.sin(frameRef.current * 0.01)) * 60;

                        // Gradient line
                        const gradient = ctx.createLinearGradient(particles[a].x, particles[a].y, particles[b].x, particles[b].y);

                        // Fixed: Properly format RGBA colors by extracting RGB components before adding opacity
                        const getColorWithOpacity = (color: string, opacity: number) => {
                            // Extract RGB parts from rgba or rgb
                            const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                            if (rgbMatch) {
                                const r = rgbMatch[1];
                                const g = rgbMatch[2];
                                const b = rgbMatch[3];
                                return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                            }
                            return color; // Fallback to original if not matching
                        };

                        gradient.addColorStop(0, getColorWithOpacity(particles[a].color, opacity * 0.8));
                        gradient.addColorStop(1, getColorWithOpacity(particles[b].color, opacity * 0.8));

                        ctx.beginPath();
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 0.6;
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();

                        // Add flowing effect on lines (small particles)
                        if (Math.random() > 0.99) {
                            const flowParticlePos = Math.random();
                            const flowX = particles[a].x * (1 - flowParticlePos) + particles[b].x * flowParticlePos;
                            const flowY = particles[a].y * (1 - flowParticlePos) + particles[b].y * flowParticlePos;

                            ctx.beginPath();
                            ctx.fillStyle = `rgba(212, 175, 55, ${opacity * 0.8})`;
                            ctx.arc(flowX, flowY, 1.5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            }
        };

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frameRef.current++;

            // Optional: Add a subtle gradient background
            const bgGradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);

            bgGradient.addColorStop(0, 'rgba(19, 19, 37, 0.02)');
            bgGradient.addColorStop(0.5, 'rgba(15, 15, 30, 0.01)');
            bgGradient.addColorStop(1, 'rgba(10, 10, 20, 0)');

            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((particle) => {
                // Update size with pulsing effect
                if (particle.growing) {
                    particle.size += 0.02;
                    if (particle.size > (particle.shape === 'circle' ? 3.5 : 4.5)) {
                        particle.growing = false;
                    }
                } else {
                    particle.size -= 0.02;
                    if (particle.size < (particle.shape === 'circle' ? 1 : 1.5)) {
                        particle.growing = true;
                    }
                }

                // Update rotation
                particle.rotation += particle.rotationSpeed;

                // Draw particle based on shape
                ctx.fillStyle = particle.color;

                if (particle.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (particle.shape === 'square') {
                    drawSquare(ctx, particle.x, particle.y, particle.size * 2, particle.rotation);
                } else if (particle.shape === 'hexagon') {
                    drawHexagon(ctx, particle.x, particle.y, particle.size * 1.7, particle.rotation);
                }

                // Add a subtle glow for some particles
                if (Math.random() > 0.96) {
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
                    const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2);

                    // Fixed: Properly format RGBA colors
                    const rgbMatch = particle.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
                    if (rgbMatch) {
                        const r = rgbMatch[1];
                        const g = rgbMatch[2];
                        const b = rgbMatch[3];
                        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.2)`);
                    } else {
                        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                    }

                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = gradient;
                    ctx.fill();
                }

                // Move particle
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Add slight randomness to movement
                particle.speedX += (Math.random() - 0.5) * 0.01;
                particle.speedY += (Math.random() - 0.5) * 0.01;

                // Dampen speed to prevent extreme movement
                particle.speedX *= 0.99;
                particle.speedY *= 0.99;

                // Bounce off edges with some randomization
                if (particle.x < 0 || particle.x > canvas.width) {
                    particle.speedX *= -1;
                    particle.x = particle.x < 0 ? 0 : canvas.width;
                    particle.speedX += (Math.random() - 0.5) * 0.2;
                }

                if (particle.y < 0 || particle.y > canvas.height) {
                    particle.speedY *= -1;
                    particle.y = particle.y < 0 ? 0 : canvas.height;
                    particle.speedY += (Math.random() - 0.5) * 0.2;
                }
            });

            // Draw connections
            connect();

            // Periodically add new particles
            if (frameRef.current % 60 === 0 && particlesRef.current.length < 100) {
                const shape = Math.random() > 0.7 ? (Math.random() > 0.5 ? 'square' : 'hexagon') : 'circle';
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 3 + 1,
                    speedX: (Math.random() - 0.5) * 0.4,
                    speedY: (Math.random() - 0.5) * 0.4,
                    color: particleColors[Math.floor(Math.random() * particleColors.length)],
                    alpha: Math.random() * 0.5 + 0.3,
                    growing: Math.random() > 0.5,
                    shape,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.02,
                });
            }

            const animationId = requestAnimationFrame(animate);
            return animationId;
        };

        const animationId = animate();

        // Cleanup on unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <>
            <div className="hexagon-pattern"></div>
            <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.6 }} />
        </>
    );
};

export default Web3Background;
