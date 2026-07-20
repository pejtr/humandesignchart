import os

file_path = "server/routers/subscription.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacement = """            const successUrl = `${input.origin}/${input.locale}/payment/success?plan=${input.plan}`;
            const cancelUrl = `${input.origin}/${input.locale}/payment/cancel`;

            if (!isSubscription && isCzech && ENV.comgateMerchantId) {
                const { createComgateCheckoutSession } = await import("../_core/comgate");
                
                const rawMeta: any = {
                    u: user.id,
                    p: input.plan,
                    email: user.email,
                    name: user.name,
                };
                if (input.recipientEmail) rawMeta.recEmail = input.recipientEmail;
                if (input.recipientName) rawMeta.recName = input.recipientName;
                if (input.senderName) rawMeta.sndName = input.senderName;
                
                const refId = Buffer.from(JSON.stringify(rawMeta)).toString("base64").substring(0, 255);

                try {
                    const comgateRes = await createComgateCheckoutSession({
                        price: unitAmount,
                        currency: "CZK",
                        label: priceData.name,
                        refId: refId,
                        email: user.email || "neznamy@zakaznik.cz",
                        lang: "cs"
                    });
                    return { url: comgateRes.redirectUrl };
                } catch (e: any) {
                    console.error("[Comgate API error]", e);
                }
            }

            if (isSubscription) {"""

# Replace using string parsing for flexible whitespace
part1 = "const successUrl"
part2 = "if (isSubscription) {"

if part1 in content and part2 in content and "createComgateCheckoutSession" not in content:
    idx1 = content.find(part1)
    # find the start of the line with const successUrl
    while idx1 > 0 and content[idx1-1] != "\\n":
        idx1 -= 1
    
    idx2 = content.find(part2)
    idx2 += len(part2)
    
    # We replace from the line of successUrl up to if(isSubscription) {
    old_block = content[idx1:idx2]
    content = content.replace(old_block, replacement)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Success")
else:
    print("Failed to replace or already done")
