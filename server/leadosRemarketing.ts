import { sendLeadOSEvent } from "./leados";

export interface RemarketingEvent {
  userId?: number;
  email?: string;
  name?: string;
  chartType?: string;
  source?: string;
}

/** Trigger abandoned chart checkout remarketing flow in LeadOS */
export function triggerAbandonedChartRemarketing({
  userId,
  email,
  name,
  chartType,
  source = "chart_result",
}: RemarketingEvent) {
  sendLeadOSEvent({
    event: "chart_created",
    data: {
      userId,
      email,
      name,
      chartType,
      source,
      tags: ["hdm_abandoned", "drip_remarketing"],
      campaign: "24h_welcome_drip",
    },
  });
}

/** Trigger lead magnet claimed event in LeadOS */
export function triggerLeadMagnetClaimed({
  email,
  source = "exit_intent",
}: RemarketingEvent) {
  sendLeadOSEvent({
    event: "new_user",
    data: {
      email,
      source,
      tags: ["hdm_lead_magnet", "pdf_pitfalls"],
      campaign: "pdf_5_pitfalls_nurture",
    },
  });
}
