import { useState, useRef, useEffect, type CSSProperties } from "react";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  /** Applied to the wrapper div (controls size/layout) */
  className?: string;
  /** Applied directly to the <img> element (controls object-fit, object-position, etc.) */
  imgClassName?: string;
  style?: CSSProperties;
  placeholderColor?: string;
}

/**
 * Progressive image loading with blur-to-sharp transition.
 * Shows a colored placeholder with blur, then fades in the full image.
 * Uses IntersectionObserver for lazy loading.
 *
 * Use `imgClassName` to control object-fit on the actual <img> element.
 * The default is `object-contain` which prevents portrait images from being cropped.
 */
export function ProgressiveImage({
  src,
  alt,
  className = "",
  imgClassName = "object-contain",
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
      { rootMargin: "600px" } // Preload 600px before reaching viewport
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
      {/* Placeholder shimmer */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${placeholderColor} 0%, rgba(139,92,246,0.12) 50%, ${placeholderColor} 100%)`,
              backgroundSize: "200% 200%",
            }}
          />
        </div>
      )}
      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          decoding="async"
          className={`w-full h-full transition-opacity duration-300 ${imgClassName} ${
            isLoaded ? "opacity-100 blur-0" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          ref={(el) => {
            if (el && el.complete && el.naturalWidth > 0 && !isLoaded) {
              setIsLoaded(true);
            }
          }}
          loading="lazy"
        />
      )}
    </div>
  );
}
