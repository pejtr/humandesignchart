import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [location] = useLocation();
  const isAiGuide = location.includes("/ai-guide");

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // On AI Guide mobile, hide to avoid overlapping the input in MobileBottomNav
  if (isAiGuide) return null;

  return (
    <button
      onClick={scrollUp}
      aria-label="Scroll to top"
      className={`fixed bottom-[8.5rem] md:bottom-20 right-4 md:right-6 z-[55] w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
