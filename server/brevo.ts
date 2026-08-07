const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_API_URL = "https://api.brevo.com/v3";

export interface SendEmailPayload {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  senderName?: string;
  senderEmail?: string;
}

/**
 * Dispatches transactional email via Brevo REST API v3
 */
export async function sendBrevoEmail(payload: SendEmailPayload): Promise<boolean> {
  try {
    const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: payload.senderName || "AI Marie — Human Design",
          email: payload.senderEmail || "info@humandesign.cz",
        },
        to: [{ email: payload.toEmail, name: payload.toName || payload.toEmail }],
        subject: payload.subject,
        htmlContent: payload.htmlContent,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Brevo API Error]", res.status, errorText);
      return false;
    }

    console.log(`[Brevo API Success] Email sent to ${payload.toEmail}`);
    return true;
  } catch (err) {
    console.error("[Brevo API Exception]", err);
    return false;
  }
}

/**
 * Adds or updates a contact in Brevo email list
 */
export async function addBrevoContact(email: string, attributes?: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch(`${BREVO_API_URL}/contacts`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        attributes: attributes || {},
        updateEnabled: true,
      }),
    });

    return res.ok || res.status === 400; // 400 if contact exists
  } catch (err) {
    console.error("[Brevo Contact Exception]", err);
    return false;
  }
}
