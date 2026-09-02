import React from "react";

interface QuantumLivingAuraProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "subtle" | "medium" | "vibrant";
  showSpinningAura?: boolean;
}

/**
 * QuantumLivingAura — Dimensional Living Quantum Organism System
 * Wraps elements in a 360° rotating conic gradient aura with ambient color morphing.
 */
export function QuantumLivingAura({
  children,
  className = "",
  intensity = "vibrant",
  showSpinningAura = true,
}: QuantumLivingAuraProps) {
  const opacityClass =
    intensity === "subtle"
      ? "opacity-35 blur-xl"
      : intensity === "medium"
      ? "opacity-60 blur-2xl"
      : "opacity-80 blur-2xl";

  return (
    <div className={`relative group ${className}`}>
      {showSpinningAura && (
        <>
          {/* Outer 360° Orbital Spinning Conic Aura */}
          <div
            className={`absolute -inset-4 rounded-[2.5rem] spinning-conic-aura ${opacityClass} pointer-events-none transition-opacity duration-700`}
          />

          {/* Inner Counter-Spinning Glow Beam */}
          <div
            className={`absolute -inset-1 rounded-[2.2rem] inner-counter-spin ${
              intensity === "subtle" ? "opacity-30" : "opacity-70"
            } blur-md pointer-events-none transition-opacity duration-700`}
          />
        </>
      )}

      {/* Children Surface */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
