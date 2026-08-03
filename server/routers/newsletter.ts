import { z } from "zod";
import crypto from "crypto";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { newsletterSubscribers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function generateConfirmToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getBaseUrl(req?: any): string {
  if (req?.headers?.host) {
    const proto = req.headers["x-forwarded-proto"] || "http";
    return `${proto}://${req.headers.host}`;
  }
  return process.env.APP_URL || "https://www.humandesignmapa.cz";
}

export const newsletterRouter = router({
    subscribe: publicProcedure
        .input(z.object({
            email: z.string().email(),
            locale: z.string().default("cs"),
            source: z.string().default("popup"),
        }))
        .mutation(async ({ input, ctx }) => {
            const db = await getDb();
            if (!db) throw new Error("Database unavailable");
            const existing = await db.select().from(newsletterSubscribers)
                .where(eq(newsletterSubscribers.email, input.email.toLowerCase())).limit(1);
            if (existing.length > 0) {
                if (existing[0].status === "confirmed") {
                    return { success: true, alreadySubscribed: true };
                }
                // Re-send confirmation for pending subscribers
                const token = generateConfirmToken();
                await db.update(newsletterSubscribers)
                    .set({ confirmToken: token })
                    .where(eq(newsletterSubscribers.email, input.email.toLowerCase()));
const baseUrl = getBaseUrl(ctx.req);
                await sendConfirmEmail(input.email, token, baseUrl, input.locale);
                return { success: true, alreadySubscribed: false, needsConfirmation: true };
            }
            const token = generateConfirmToken();
            await db.insert(newsletterSubscribers).values({
                email: input.email.toLowerCase(),
                locale: input.locale,
                source: input.source,
                status: "pending",
                confirmToken: token,
            });
                const baseUrl = getBaseUrl(ctx.req);
            await sendConfirmEmail(input.email, token, baseUrl, input.locale);
            try {
                const { notifyOwner } = await import("../_core/notification");
                await notifyOwner({
                    title: "New Newsletter Subscriber ✨",
                    content: `${input.email} subscribed (locale: ${input.locale}, source: ${input.source})`,
                });
            } catch { }
            return { success: true, alreadySubscribed: false, needsConfirmation: true };
        }),

    confirm: publicProcedure
        .input(z.object({ token: z.string() }))
        .mutation(async ({ input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database unavailable");
            const subscriber = await db.select().from(newsletterSubscribers)
                .where(eq(newsletterSubscribers.confirmToken, input.token)).limit(1);
            if (subscriber.length === 0) {
                throw new Error("Invalid or expired confirmation link");
            }
            if (subscriber[0].status === "confirmed") {
                return { success: true, alreadyConfirmed: true };
            }
            const now = new Date().toISOString().slice(0, 19).replace("T", " ");
            await db.update(newsletterSubscribers)
                .set({
                    status: "confirmed",
                    confirmToken: null,
                    confirmedAt: now,
                })
                .where(eq(newsletterSubscribers.confirmToken, input.token));
            return { success: true, alreadyConfirmed: false };
        }),
});

async function sendConfirmEmail(
    email: string,
    token: string,
    baseUrl: string,
    locale: string
): Promise<void> {
    const confirmUrl = `${baseUrl}/${locale}/newsletter/confirm?token=${token}`;
    const isEn = locale === "en";
    const subject = isEn
        ? "Confirm your subscription — Human Design Chart"
        : "Potvrďte přihlášení — Human Design Mapa";
    const html = isEn
        ? `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #7c3aed;">Confirm your subscription 🔮</h2>
            <p>Thank you for subscribing to our weekly Human Design insights. Please confirm your email address by clicking the button below:</p>
            <a href="${confirmUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0;">Confirm Subscription</a>
            <p style="color: #666; font-size: 13px;">If you didn't subscribe, you can safely ignore this email.</p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">Human Design Chart · humandesignchart.app</p>
        </div>`
        : `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #7c3aed;">Potvrďte přihlášení 🔮</h2>
            <p>Děkujeme za přihlášení k odběru týdenních kosmických vhledů. Prosím potvrďte svou e-mailovou adresu kliknutím na tlačítko níže:</p>
            <a href="${confirmUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0;">Potvrdit přihlášení</a>
            <p style="color: #666; font-size: 13px;">Pokud jste se nepřihlásili, můžete tento e-mail bez obav ignorovat.</p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">Human Design Mapa · humandesignmapa.cz</p>
        </div>`;

    try {
        const { sendEmail } = await import("../leados");
        await sendEmail({ to: email, subject, html });
    } catch (err) {
        console.warn("[Newsletter] Failed to send confirmation email:", err);
    }
}
