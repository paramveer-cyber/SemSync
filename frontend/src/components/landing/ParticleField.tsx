import { useEffect, useRef } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { useMotionDisabled } from '../../context/AnimationPreferenceContext';

interface Particle {
    x: number;
    y: number;
    radius: number;
    baseSpeed: number;
    drift: number;
}

const PARTICLE_COUNT = 50;

function createParticle(width: number, height: number): Particle {
    return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.4,
        baseSpeed: Math.random() * 0.3 + 0.1,
        drift: Math.random() * 0.4 - 0.2,
    };
}

export default function ParticleField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const speedMultiplierRef = useRef(1);
    const motionDisabled = useMotionDisabled();
    const { scrollYProgress } = useScroll();

    useMotionValueEvent(scrollYProgress, 'change', (progress) => {
        speedMultiplierRef.current = 1 + progress * 3;
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || motionDisabled) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        let animationFrameId: number;

        function resizeCanvas() {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
                createParticle(canvas.width, canvas.height),
            );
        }

        function readBrandColor() {
            const rootStyles = getComputedStyle(document.documentElement);
            return (
                rootStyles.getPropertyValue('--color-brand').trim() || '#22c55e'
            );
        }

        function drawFrame() {
            if (!canvas || !context) return;
            const brandColor = readBrandColor();
            context.clearRect(0, 0, canvas.width, canvas.height);

            for (const particle of particlesRef.current) {
                particle.y -= particle.baseSpeed * speedMultiplierRef.current;
                particle.x += particle.drift;

                if (particle.y < -10) {
                    particle.y = canvas.height + 10;
                    particle.x = Math.random() * canvas.width;
                }
                if (particle.x < -10) particle.x = canvas.width + 10;
                if (particle.x > canvas.width + 10) particle.x = -10;

                context.beginPath();
                context.arc(
                    particle.x,
                    particle.y,
                    particle.radius,
                    0,
                    Math.PI * 2,
                );
                context.fillStyle = brandColor;
                context.globalAlpha = 0.35;
                context.fill();
            }

            animationFrameId = requestAnimationFrame(drawFrame);
        }

        resizeCanvas();
        drawFrame();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [motionDisabled]);

    if (motionDisabled) return null;

    return (
        <canvas
            ref={canvasRef}
            className='fixed inset-0 pointer-events-none z-0'
            style={{ mixBlendMode: 'screen' }}
        />
    );
}
