import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BODYGRAPH_MOTION_STORAGE_KEY,
  DEFAULT_MOTION_PREFERENCES,
  parseMotionPreferences,
  resolveBodygraphMotion,
  type MotionMode,
  type MotionPreferences,
  type MotionPreset,
} from "@/lib/bodygraphMotion";
import "./bodygraph-motion.css";

function readPreferences(): MotionPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_MOTION_PREFERENCES };
  try {
    return parseMotionPreferences(window.localStorage.getItem(BODYGRAPH_MOTION_STORAGE_KEY))
      ?? { ...DEFAULT_MOTION_PREFERENCES };
  } catch {
    return { ...DEFAULT_MOTION_PREFERENCES };
  }
}

function initialReducedMotion(): boolean {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function BodygraphMotionFrame({
  children,
  width,
  enabled = true,
  premium = false,
}: {
  children: ReactNode;
  width: number;
  enabled?: boolean;
  premium?: boolean;
}) {
  // Developer opt-in, preview-only; never runs on the production domain.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const { hostname, search } = window.location;
    const isPreview = hostname === "localhost" ||
      hostname === "127.0.0.1" || hostname.endsWith(".pages.dev");
    if (!isPreview || new URLSearchParams(search).get("motionqa") !== "1") return;
    let disposed = false;
    let stop = () => {};
    void import("@/lib/bodygraphMotionQA").then(({ startBodygraphMotionSampler }) => {
      if (!disposed && rootRef.current) stop = startBodygraphMotionSampler(rootRef.current);
    }).catch(() => { /* Diagnostics must never affect chart rendering. */ });
    return () => { disposed = true; stop(); };
  }, [enabled]);

  const { locale } = useLanguage();
  const isCz = locale === "cs";
  const rootRef = useRef<HTMLDivElement>(null);
  const [preferences, setPreferences] = useState<MotionPreferences>(readPreferences);
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const [inViewport, setInViewport] = useState(true);
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document === "undefined" || !document.hidden
  );

  useEffect(() => {
    if (!enabled || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(query.matches);
    onChange();
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => setPageVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !rootRef.current || typeof IntersectionObserver === "undefined") return;
    // Only motion is paused: the SVG and interactive chart remain rendered.
    const observer = new IntersectionObserver(
      entries => setInViewport((entries[0]?.intersectionRatio ?? 0) >= 0.25),
      { threshold: [0, 0.25, 0.5, 1] },
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [enabled]);

  const { running, autoPaused, systemPaused } = resolveBodygraphMotion(
    preferences,
    { reducedMotion, inViewport, pageVisible },
  );

  const setPreference = (key: "mode" | "preset", value: MotionMode | MotionPreset) => {
    const updated: MotionPreferences = {
      ...preferences,
      [key]: value,
      manual: true,
    };
    setPreferences(updated);
    // Same-tab settings change for the route's decorative cosmic backdrop.
    window.dispatchEvent(new CustomEvent("hd:bodygraph-motion-change", { detail: updated }));
    try {
      window.localStorage.setItem(BODYGRAPH_MOTION_STORAGE_KEY, JSON.stringify(updated));
    } catch { /* Private browsing can disable storage; session control still works. */ }
  };

  const stateLabel = !enabled ? "" : systemPaused
    ? (isCz ? "Animace vypnuty nastavením systému" : "Animations disabled by system settings")
    : autoPaused
      ? (isCz ? "Animace automaticky pozastaveny" : "Animations paused automatically")
      : running
        ? (isCz ? "Animace spuštěny" : "Animations playing")
        : (isCz ? "Animace pozastaveny" : "Animations paused");

  return (
    <div
      ref={rootRef}
      className={`bodygraph-motion-frame${premium ? " bodygraph-premium-preview" : ""}`}
      style={{ width, maxWidth: "100%" }}
      data-motion-state={enabled && running ? "running" : "paused"}
      data-motion-preset={preferences.preset}
      data-motion-auto={autoPaused ? "true" : "false"}
      data-motion-system={systemPaused ? "reduce" : "normal"}
    >
      {children}
      {enabled && (
        <div
          role="group"
          aria-label={isCz ? "Ovládání animací mapy" : "Bodygraph animation controls"}
          className="hd-motion-control"
          data-testid="bodygraph-motion-control"
        >
          <button
            type="button"
            className="hd-motion-btn hd-motion-play"
            data-testid="bodygraph-motion-toggle"
            disabled={systemPaused}
            aria-pressed={preferences.mode === "play"}
            aria-label={isCz
              ? preferences.mode === "play" ? "Pozastavit animaci" : "Spustit animaci"
              : preferences.mode === "play" ? "Pause animation" : "Play animation"}
            title={stateLabel}
            onClick={() => setPreference("mode", preferences.mode === "play" ? "pause" : "play")}
          >
            {preferences.mode === "play"
              ? <Pause aria-hidden="true" size={17} />
              : <Play aria-hidden="true" size={17} />}
          </button>
          <div className="hd-motion-segment" role="group" aria-label={isCz ? "Režim pohybu" : "Motion intensity"}>
          {(["zen", "flow"] as const).map(preset => (
            <button
              key={preset}
              type="button"
              className="hd-motion-btn hd-motion-preset"
              data-testid={`bodygraph-motion-${preset}`}
              title={preset === "zen" ? (isCz ? "Jemný a pomalý pohyb" : "Gentle, slow motion") : (isCz ? "Plynulé proudění" : "Fluid motion")}
              aria-pressed={preferences.preset === preset}
              onClick={() => setPreference("preset", preset)}
            >
              {preset === "zen" ? "ZEN" : "FLOW"}
            </button>
          ))}
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {stateLabel}
          </span>
        </div>
      )}
    </div>
  );
}
