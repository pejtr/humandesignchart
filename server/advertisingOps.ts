export interface AdCampaign {
  id: string;
  platform: "meta" | "google" | "tiktok" | "sklik";
  campaignName: string;
  budgetCZK: number;
  roas: number;
  conversions: number;
}

/**
 * Advertising Ops Manager: Tracks paid ad performance & optimizes CAPI events
 */
export async function getAdvertisingOpsReport(): Promise<AdCampaign[]> {
  return [
    {
      id: "camp_meta_01",
      platform: "meta",
      campaignName: "VSL Funnel - Master Sarah Chat 2026",
      budgetCZK: 5000,
      roas: 3.42,
      conversions: 86,
    },
    {
      id: "camp_sklik_01",
      platform: "sklik",
      campaignName: "HD Mapa Zdarma - Sklik Vyhledávání",
      budgetCZK: 3000,
      roas: 2.85,
      conversions: 44,
    },
    {
      id: "camp_tiktok_01",
      platform: "tiktok",
      campaignName: "UGC Video - 5 Chyby Otevřeného Hrdla",
      budgetCZK: 2500,
      roas: 4.10,
      conversions: 52,
    },
  ];
}
