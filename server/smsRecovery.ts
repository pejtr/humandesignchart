import { sendLeadOSEvent } from "./leados";

export interface SMSRecoveryPayload {
  phoneNumber?: string;
  email?: string;
  name?: string;
  cartUrl?: string;
}

// Feature flag: set to false to deactivate SMS & WhatsApp recoveries
export const SMS_WHATSAPP_ENABLED = false;

/** Trigger SMS / WhatsApp abandoned checkout recovery via LeadOS / Webhook (Currently Deactivated) */
export function triggerSMSRecovery({
  phoneNumber,
  email,
  name,
  cartUrl,
}: SMSRecoveryPayload) {
  // Return immediately while feature is deactivated by admin request
  if (!SMS_WHATSAPP_ENABLED) return;
  if (!phoneNumber && !email) return;

  sendLeadOSEvent({
    event: "chart_created",
    data: {
      phoneNumber,
      email,
      name,
      cartUrl: cartUrl || "https://humandesign.avanito.cz/cs/pricing",
      tags: ["sms_recovery_30m", "whatsapp_checkout_drip"],
      channel: "sms_whatsapp",
    },
  });
}
