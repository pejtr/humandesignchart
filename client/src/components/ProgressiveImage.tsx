import { useState, useRef, useEffect, type CSSProperties } from "react";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  placeholderColor?: string;
}

/**
 * Progressive image loading with blur-to-sharp transition.
 * Shows a colored placeholder with blur, then fades in the full image.
 * Uses IntersectionObserver for lazy loading.
 */
export function ProgressiveImage({
  src,
  alt,
  className = "",
  style,
  placeholderColor = "rgba(168,85,247,0.08)",
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ ...style, backgroundColor: placeholderColor }}
    >
      {/* Placeholder with sacred geometry shimmer */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${placeholderColor} 0%, rgba(139,92,246,0.05) 50%, ${placeholderColor} 100%)`,
              backgroundSize: "200% 200%",
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
        </div>
      )}
      {/* Actual image — only starts loading when in viewport */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-sm scale-105"
          }`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}
