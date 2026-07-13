import { useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Wraps page content with a fade-in animation on route changes.
 * Uses CSS transitions for smooth, performant page transitions.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location !== prevLocation.current) {
      // Fade out
      setIsVisible(false);

      const timeout = setTimeout(() => {
        // Update content and fade in
        setDisplayChildren(children);
        setIsVisible(true);
        prevLocation.current = location;
      }, 150); // Short fade-out duration

      return () => clearTimeout(timeout);
    } else {
      // Same location, just update children (e.g. data loaded)
      setDisplayChildren(children);
    }
  }, [location, children]);

  return (
    <div
      className="page-transition"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 250ms ease-out",
        willChange: "opacity",
      }}
    >
      {displayChildren}
    </div>
  );
}
