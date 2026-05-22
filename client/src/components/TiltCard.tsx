import { useRef, useState, type ReactNode, type CSSProperties } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxTilt?: number;
  scale?: number;
  glareEnabled?: boolean;
  hermeticGlow?: boolean;
}

/**
 * A card wrapper with 3D tilt effect on hover.
 * Includes optional hermeticism-inspired sacred geometry glare overlay.
 */
export function TiltCard({
  children,
  className = "",
  style,
  maxTilt = 8,
  scale = 1.02,
  glareEnabled = true,
  hermeticGlow = true,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)");
  const [glareStyle, setGlareStyle] = useState<CSSProperties>({ opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransform(
      `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`
    );

    if (glareEnabled) {
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      setGlareStyle({
        opacity: 0.2,
        background: `radial-gradient(ellipse at ${glareX}% ${glareY}%, rgba(168,85,247,0.4) 0%, rgba(217,170,255,0.15) 30%, transparent 65%)`,
      });
    }
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setTransform("perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)");
    setGlareStyle({ opacity: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      className={`relative transition-transform duration-300 ease-out ${className}`}
      style={{ ...style, transform, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {/* Hermeticism sacred geometry glow overlay */}
      {glareEnabled && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300"
          style={glareStyle}
        />
      )}
      {/* Sacred geometry border glow on hover */}
      {hermeticGlow && isHovered && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-500"
          style={{
            opacity: 0.6,
            boxShadow: "inset 0 0 20px rgba(168,85,247,0.1), 0 0 15px rgba(168,85,247,0.15), 0 0 30px rgba(139,92,246,0.08)",
          }}
        />
      )}
    </div>
  );
}
