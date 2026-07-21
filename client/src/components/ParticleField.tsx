import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  fadeDir: number;
}

/**
 * Subtle floating particle animation for hero backgrounds.
 * Renders tiny glowing dots that drift slowly, creating a spiritual/cosmic atmosphere.
 * Lightweight canvas-based, pauses when not visible.
 *
 * Desktop perf: particles halved on large screens (>1024px) and disabled entirely
 * when the user prefers reduced motion.
 */
export function ParticleField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Respect user's motion preference
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // Desktop: fewer particles + no glow for performance
    const maxParticles = isDesktop ? 25 : 50;
    const count = Math.min(maxParticles, Math.floor((canvas.width * canvas.height) / 15000));
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.2 - 0.1,
      opacity: Math.random() * 0.6 + 0.2,
      fadeDir: Math.random() > 0.5 ? 1 : -1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;

        p.opacity += p.fadeDir * 0.003;
        if (p.opacity >= 0.8) p.fadeDir = -1;
        if (p.opacity <= 0.1) p.fadeDir = 1;

        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;
        if (p.y < -5) p.y = canvas.height + 5;
        if (p.y > canvas.height + 5) p.y = -5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 130, 255, ${p.opacity})`;
        ctx.fill();

        // Glow only on mobile (smaller viewport = fewer particles total)
        if (!isDesktop && p.size > 1.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(168, 130, 255, ${p.opacity * 0.15})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          cancelAnimationFrame(animRef.current);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 3 }}
    />
  );
}
