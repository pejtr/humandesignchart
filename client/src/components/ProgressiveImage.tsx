import { useState, useEffect, type CSSProperties } from "react";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  /** Applied to the wrapper div (controls size/layout) */
  className?: string;
  /** Applied directly to the <img> element (controls object-fit, object-position, etc.) */
  imgClassName?: string;
  style?: CSSProperties;
  placeholderColor?: string;
  /** Optional image shown when the primary source cannot be loaded. */
  fallbackSrc?: string;
}

/**
 * Progressive image loading with blur-to-sharp transition.
 * Shows a colored placeholder with blur, then fades in the full image.
 * Uses the browser native lazy-loading scheduler (no double IntersectionObserver delay).
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
  fallbackSrc,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSrc, setActiveSrc] = useState(src);

  useEffect(() => {
    setActiveSrc(src);
    setIsLoaded(false);
  }, [src]);

  return (
    <div
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
      <img
          src={activeSrc}
          alt={alt}
          decoding="async"
          className={`w-full h-full transition-opacity duration-300 ${imgClassName} ${
            isLoaded ? "opacity-100 blur-0" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            if (fallbackSrc && activeSrc !== fallbackSrc) {
              setIsLoaded(false);
              setActiveSrc(fallbackSrc);
            } else {
              setIsLoaded(true);
            }
          }}
          ref={(el) => {
            if (el && el.complete && el.naturalWidth > 0 && !isLoaded) {
              setIsLoaded(true);
            }
          }}
          loading="lazy"
        />
    </div>
  );
}
