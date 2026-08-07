import React, { createContext, useContext, useState, useEffect } from "react";

export type PriceVariant = "control_390" | "variant_490_bonus";

interface AbTestingContextType {
  priceVariant: PriceVariant;
  trackConversion: (goalName: string) => void;
}

const AbTestingContext = createContext<AbTestingContextType>({
  priceVariant: "control_390",
  trackConversion: () => {},
});

export const AbTestingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [priceVariant, setPriceVariant] = useState<PriceVariant>("control_390");

  useEffect(() => {
    // Persistent A/B test variant assignment
    const stored = localStorage.getItem("hd_ab_variant");
    if (stored === "control_390" || stored === "variant_490_bonus") {
      setPriceVariant(stored);
    } else {
      const assigned: PriceVariant = Math.random() > 0.5 ? "variant_490_bonus" : "control_390";
      localStorage.setItem("hd_ab_variant", assigned);
      setPriceVariant(assigned);
    }
  }, []);

  const trackConversion = (goalName: string) => {
    console.log(`[A/B Test Conversion] Variant: ${priceVariant}, Goal: ${goalName}`);
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "ab_conversion", {
        event_category: "experiment",
        event_label: `${priceVariant}_${goalName}`,
      });
    }
  };

  return (
    <AbTestingContext.Provider value={{ priceVariant, trackConversion }}>
      {children}
    </AbTestingContext.Provider>
  );
};

export function useAbTesting() {
  return useContext(AbTestingContext);
}
