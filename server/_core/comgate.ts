import { ENV } from "./env";

export interface ComgatePaymentInput {
    price: number; // in halere (cents)
    currency: "CZK" | "EUR";
    label: string;
    refId: string;
    email: string;
    method?: string; // e.g. 'ALL'
    lang?: "cs" | "en";
}

export interface ComgatePaymentOutput {
    transId: string;
    redirectUrl: string;
}

/**
 * Parses Comgate's form-urlencoded response into a standard JavaScript object
 */
function parseComgateResponse(body: string): Record<string, string> {
    const params = new URLSearchParams(body);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
        result[key] = value;
    });
    return result;
}

export async function createComgateCheckoutSession(input: ComgatePaymentInput): Promise<ComgatePaymentOutput> {
    if (!ENV.comgateMerchantId || !ENV.comgateSecret) {
        throw new Error("Comgate credentials not configured");
    }

    const payload = new URLSearchParams();
    payload.append("merchant", ENV.comgateMerchantId);
    payload.append("secret", ENV.comgateSecret);
    payload.append("test", ENV.comgateTestMode ? "true" : "false");
    payload.append("type", "json"); // Let's try requesting JSON, though urlencoded fallback is safer for Comgate
    payload.append("price", input.price.toString());
    payload.append("curr", input.currency);
    payload.append("label", input.label);
    payload.append("refId", input.refId);
    payload.append("email", input.email);
    payload.append("method", input.method || "ALL");
    payload.append("lang", input.lang || "cs");
    payload.append("prepareOnly", "true"); // Must be true to generate redirect link without instantly picking method

    const response = await fetch("https://payments.comgate.cz/v1.0/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: payload.toString()
    });

    const bodyText = await response.text();
    const data = parseComgateResponse(bodyText);

    if (data.code !== "0") {
        console.error("[Comgate API error]", data);
        throw new Error(`Comgate API error: ${data.message} (code ${data.code})`);
    }

    // Usually comgate redirects via transId on their gateway
    // E.g., https://payments.comgate.cz/client/instructions/index?id=TRANS_ID
    // But they return 'redirect' containing the exact URL

    // Fallback URL if redirect field isn't present
    const redirectUrl = data.redirect || `https://payments.comgate.cz/client/instructions/index?id=${data.transId}`;

    return {
        transId: data.transId,
        redirectUrl
    };
}

export interface ComgateStatusOutput {
    code: string;
    message: string;
    merchant: string;
    test: string;
    price: string;
    curr: string;
    label: string;
    refId: string;
    method: string;
    email: string;
    transId: string;
    status: string; // "PAID", "PENDING", "CANCELLED"
}

export async function checkComgateStatus(transId: string): Promise<ComgateStatusOutput> {
    if (!ENV.comgateMerchantId || !ENV.comgateSecret) {
        throw new Error("Comgate credentials not configured");
    }

    const payload = new URLSearchParams();
    payload.append("merchant", ENV.comgateMerchantId);
    payload.append("secret", ENV.comgateSecret);
    payload.append("transId", transId);

    const response = await fetch("https://payments.comgate.cz/v1.0/status", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: payload.toString()
    });

    const bodyText = await response.text();
    const data = parseComgateResponse(bodyText);

    if (data.code !== "0") {
        throw new Error(`Comgate API error (status): ${data.message} (code ${data.code})`);
    }

    return data as any;
}

