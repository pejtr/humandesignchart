import { isPremiumUser } from "../stripeProducts";

export const FEATURE_KEYS = [
  "BASIC_CHART",
  "CENTERS_DETAIL",
  "CHANNELS_DETAIL",
  "GATES_DETAIL",
  "BLUEPRINT_PDF",
  "AI_INTERPRETATION",
  "DAILY_TRANSITS",
  "JOURNAL",
  "RELATIONSHIP_DYNAMICS",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type FeatureStatus = "AVAILABLE" | "LOCKED" | "EXHAUSTED" | "GRANDFATHERED";

export type FeatureAccess = {
  feature: FeatureKey;
  status: FeatureStatus;
  scope: "ACCOUNT" | "CHART";
  requiredProduct?: "BLUEPRINT" | "MARIE_PULSE" | "MARIE_PLUS" | "MARIE_CIRCLE";
  reason: string;
};

export type AccessSubject = {
  authenticated: boolean;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionCurrentPeriodEnd?: Date | string | null;
  aiReadingCredits?: number;
  blueprintPdfCredits?: number;
};

const premiumFeatures = new Set<FeatureKey>([
  "CENTERS_DETAIL",
  "CHANNELS_DETAIL",
  "GATES_DETAIL",
  "DAILY_TRANSITS",
  "JOURNAL",
  "RELATIONSHIP_DYNAMICS",
]);

function activePremium(subject: AccessSubject) {
  return isPremiumUser({
    subscriptionStatus: subject.subscriptionStatus ?? "none",
    subscriptionPlan: subject.subscriptionPlan ?? "none",
    subscriptionCurrentPeriodEnd: subject.subscriptionCurrentPeriodEnd ?? null,
    aiReadingCredits: subject.aiReadingCredits ?? 0,
  });
}

export function resolveFeatureAccess(subject: AccessSubject, feature: FeatureKey): FeatureAccess {
  if (feature === "BASIC_CHART") {
    return {
      feature,
      status: "AVAILABLE",
      scope: "ACCOUNT",
      reason: subject.authenticated ? "Základní mapa je součástí účtu." : "Základní mapu lze nejprve vypočítat veřejně.",
    };
  }

  if (!subject.authenticated) {
    return {
      feature,
      status: "LOCKED",
      scope: "ACCOUNT",
      requiredProduct: feature === "BLUEPRINT_PDF" || feature === "AI_INTERPRETATION" ? "BLUEPRINT" : "MARIE_PLUS",
      reason: "Pro osobní funkce se nejprve přihlaste.",
    };
  }

  if (subject.subscriptionPlan === "lifetime") {
    return { feature, status: "GRANDFATHERED", scope: "ACCOUNT", reason: "Historický nárok zůstává zachován." };
  }

  if (activePremium(subject)) {
    return { feature, status: "AVAILABLE", scope: "ACCOUNT", reason: "Je součástí aktivního členství." };
  }

  if (feature === "BLUEPRINT_PDF") {
    return (subject.blueprintPdfCredits ?? 0) > 0
      ? { feature, status: "AVAILABLE", scope: "ACCOUNT", reason: "Na účtu je dostupný kredit Blueprintu." }
      : { feature, status: "LOCKED", scope: "ACCOUNT", requiredProduct: "BLUEPRINT", reason: "PDF Blueprint vyžaduje samostatný nákup." };
  }

  if (feature === "AI_INTERPRETATION") {
    return (subject.aiReadingCredits ?? 0) > 0
      ? { feature, status: "AVAILABLE", scope: "ACCOUNT", reason: "Na účtu je dostupný AI kredit." }
      : { feature, status: "EXHAUSTED", scope: "ACCOUNT", requiredProduct: "BLUEPRINT", reason: "Není dostupný AI kredit ani aktivní členství." };
  }

  if (premiumFeatures.has(feature)) {
    return { feature, status: "LOCKED", scope: "ACCOUNT", requiredProduct: "MARIE_PLUS", reason: "Funkce je součástí průběžného členství." };
  }

  return { feature, status: "LOCKED", scope: "ACCOUNT", reason: "Funkce není v aktuálním přístupu dostupná." };
}

export function resolveFeatureMatrix(subject: AccessSubject): FeatureAccess[] {
  return FEATURE_KEYS.map(feature => resolveFeatureAccess(subject, feature));
}
