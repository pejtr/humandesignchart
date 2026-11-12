import { useEffect, useRef, useState } from "react";
import {
  BODYGRAPH_MOTION_STORAGE_KEY,
  DEFAULT_MOTION_PREFERENCES,
  parseMotionPreferences,
  resolveBodygraphMotion,
  type MotionPreferences,
} from "@/lib/bodygraphMotion";

function readMotion(): MotionPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_MOTION_PREFERENCES };
  try {
    return parseMotionPreferences(window.localStorage.getItem(BODYGRAPH_MOTION_STORAGE_KEY))
      ?? { ...DEFAULT_MOTION_PREFERENCES };
  } catch {
    return { ...DEFAULT_MOTION_PREFERENCES };
  }
}

export const BODYGRAPH_MOTION_CHANGE_EVENT = "hd:bodygraph-motion-change";

/**
 * Purely decorative backdrop for the bilingual motion-preview route.
 * No remote media, audio, canvas loop, timers or analytics. Transform/opacity
 * animations pause offscreen, in hidden tabs, on manual Pause or with OS reduced-motion.
 */
export default function MotionAtmosphere() {
  const root = useRef<HTMLDivElement>(null);
  const [preferences, setPreferences] = useState<MotionPreferences>(readMotion);
  const [visible, setVisible] = useState(() =>
    typeof document === "undefined" || !document.hidden
  );
  const [inView, setInView] = useState(true);
  const [reduce, setReduce] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const onMotion = (event: Event) => {
      const e = event as CustomEvent<MotionPreferences>;
      const detail = e.detail;
      // Validate cross-component event payload; localStorage can be blocked.
      if (detail?.manual === true &&
          (detail.mode === "play" || detail.mode === "pause") &&
          (detail.preset === "zen" || detail.preset === "flow")) {
        setPreferences({ mode: detail.mode, preset: detail.preset, manual: true });
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === BODYGRAPH_MOTION_STORAGE_KEY) setPreferences(readMotion());
    };
    window.addEventListener(BODYGRAPH_MOTION_CHANGE_EVENT, onMotion);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(BODYGRAPH_MOTION_CHANGE_EVENT, onMotion);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const updateVisibility = () => setVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!root.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      setInView((entries[0]?.intersectionRatio ?? 0) > 0.01);
    }, { threshold: [0, 0.01] });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  const { running } = resolveBodygraphMotion(preferences, {
    reducedMotion: reduce,
    inViewport: inView,
    pageVisible: visible,
  });

  return (
    <div
      ref={root}
      className="hd-mp-cosmos"
      aria-hidden="true"
      data-testid="motion-cosmic-backdrop"
      data-motion-state={running ? "running" : "paused"}
      data-motion-preset={preferences.preset}
    >
      <span className="hd-mp-cosmos-nebula hd-mp-cosmos-nebula-a" />
      <span className="hd-mp-cosmos-nebula hd-mp-cosmos-nebula-b" />
      <span className="hd-mp-cosmos-stars hd-mp-cosmos-stars-near" />
      <span className="hd-mp-cosmos-stars hd-mp-cosmos-stars-far" />
      <span className="hd-mp-cosmos-halo" />
      <span className="hd-mp-cosmos-comet" />
      <span className="hd-mp-cosmos-glint hd-mp-cosmos-glint-a" />
      <span className="hd-mp-cosmos-glint hd-mp-cosmos-glint-b" />
      <span className="hd-mp-cosmos-glint hd-mp-cosmos-glint-c" />
    </div>
  );
}
