import { useLocation } from "wouter";
import { useLayoutEffect, useRef, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * A short, decorative page-change ritual, not a fake loading operation:
 * route content is never held hostage by the animation. Payment, login,
 * checkout and account routes skip the effect entirely.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousLocation = useRef(location);

  useLayoutEffect(() => {
    if (previousLocation.current === location) return;
    const previous = previousLocation.current;
    previousLocation.current = location;

    const sensitivePath = /(?:^|\\/)(?:payment|checkout|login|portal)(?:\\/|$)/i;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || sensitivePath.test(location) || sensitivePath.test(previous)) {
      setIsTransitioning(false);
      return;
    }

    setIsTransitioning(true);
    const timeout = window.setTimeout(() => setIsTransitioning(false), 660);
    return () => window.clearTimeout(timeout);
  }, [location]);

  return (
    <div className="page-transition">
      {children}
      {isTransitioning && (
        <div className="sacral-route-veil" aria-hidden="true">
          <div className="sacral-route-veil__aura" />
          <div className="sacral-route-machine">
            <span className="sacral-route-machine__ring sacral-route-machine__ring--outer" />
            <span className="sacral-route-machine__ring sacral-route-machine__ring--middle" />
            <span className="sacral-route-machine__ring sacral-route-machine__ring--inner" />
            <span className="sacral-route-machine__core">✧</span>
          </div>
          <span className="sacral-route-label">UNFOLDING</span>
        </div>
      )}
    </div>
  );
}
