import OmniUmamiPilot from "./OmniUmamiPilot";

function hasHdAnalyticsConsent(): boolean {
  try {
    const consent = JSON.parse(window.localStorage.getItem("hd-cookie-consent") || "null");
    return consent?.accepted === true && consent.analytics === true;
  } catch { return false; }
}
export default function UmamiSitePilot() {
  return (
    <OmniUmamiPilot
      consentEvent="hd:marketing-consent-changed"
      hasConsent={hasHdAnalyticsConsent}
      isPublicPath={(path) => /^\/(?:cs|en|de|es|fr|it)?\/?$/.test(path) || /^\/(?:cs|en)\/(?:pricing|cenik|about|o-nas)\/?$/.test(path)}
    />
  );
}
