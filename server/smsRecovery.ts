import { sendLeadOSEvent } from "./leados";

export interface SMSRecoveryPayload {
  phoneNumber?: string;
  email?: string;
  name?: string;
  cartUrl?: string;
}

/** Trigger SMS / WhatsApp abandoned checkout recovery via LeadOS / Webhook */
export function triggerSMSRecovery({
  phoneNumber,
  email,
  name,
  cartUrl,
}: SMSRecoveryPayload) {
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
