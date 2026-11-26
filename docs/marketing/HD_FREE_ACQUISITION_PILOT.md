# FREE CHART — paid acquisition pilot (CZ / EN)

## Landing variant
Use the existing birth-data calculation engine; no additional quiz questions are needed for calculating a chart. A six-step personality questionnaire is a later A/B variant only if the baseline earns revenue. The dedicated low-friction variant preserves the canonical routes and original calculator if the query flag is absent.

- CZ: https://humandesignmapa.cz/cs/human-design-kalkulacka?funnel=free&utm_source=chatgpt&utm_medium=paid&utm_campaign=human_design_cz_pilot
- EN: https://humandesignchart.app/en/calculate?funnel=free&utm_source=chatgpt&utm_medium=paid&utm_campaign=human_design_en_us_pilot

No campaign destination has been changed; ads remain paused. Do not add reserved oppref parameters manually. Test incoming click reference preservation, consent and navigation.

One prominent CTA, localized value proposition, real free chart without signup/payment, no relationship-category choice or B2B/AI assistant sections on campaign landing variant. Existing form validation and geocoding retained. No extra LLM cost. Explain uncertainty for unknown birth time. Human Design is symbolic, not validated science.

## Monetization path
Free chart → immediate result → optional confirmed five-email mini course (PR #104) → existing paid Blueprint. No compulsory marketing consent. Keep separate optional service emails (PR #105). Use real product preview, accurate price and authentic evidence; no fabricated testimonials, scarcity, discount or purchaser activity. Do not activate this funnel without testing existing global banners/popups and result page after integration of #104.

## Measurement
Existing Ads Manager web source, no second pixel. Configure server-side OPENAI_ADS_PIXEL_ID on authorized Pages runtime; public ID injected into HTML only for allowlisted branded hosts; browser fallback VITE_OPENAI_ADS_PIXEL_ID if configured. Never put API key in client. Pixel initialization requires marketing consent. Check automatic matching privacy disclosures and consent; never manually send birth data or chart content. Free calculation = custom free_chart_generated diagnostic, not a lead or registration. Checkout amount integer minor units; GA4 remains major units. Existing server purchase event requires verified paid/fulfilled order. Configure lead_created only after verified Brevo DOI, with stable ID, allowed attribution, marketing measurement consent, no birth data. Confirmed lead CAPI integration is not implemented by this PR. Ads Manager goal creation/association must be done in the authorized UI; current connector does not provide that write.

## No-spend acceptance
1. Verify exact SHA, CI and isolated Cloudflare preview. Both languages: valid/invalid birth details, unknown time, place lookup, result, mobile 390/desktop 1440, no JS errors, no unnecessary steps, canonical unchanged. Verify public ID and consent transitions, checkout value. Use official test mode or isolated mock for measurement, never send invented production purchases.
2. #104: actual Brevo form URLs, consent, DOI, seed inbox delivery, unsubscribe, paid-buyer suppression, one event per confirmed lead. #105 is independent and must not block first acquisition.
3. Verified live checkout and paid delivery, compare ledger and event receipts. Associate relevant conversion events with current campaign; retain existing CPC objective, budgets and paused status until explicit launch approval. 
4. Only after gates pass, run CZ first. Existing total cap 250 CZK, target average CPC 2 CZK, not a hard per-click ceiling. Proposed first checkpoint at 50 CZK spend (manual review, not an automated limit). Keep USA paused. Do not increase budget to obtain promotional credit.
5. Stop/review immediately on broken calculator, lead delivery, tracking or checkout. If first 25 qualified visits yield no completed free chart or no confirmed lead after allowing DOI delay, diagnose before continuing. Small samples are noisy; this is a risk-control checkpoint, not statistical proof. No claim of guaranteed zero loss.
6. Compute contribution margin per fulfilled order after provider/fulfillment fees, applicable taxes/refunds and variable costs; break-even CAC <= contribution margin. Max break-even CPL = margin × observed lead-to-paid rate. Max break-even CPC = margin × observed click-to-paid rate. Require a safety margin before scaling, use mature cohorts (at least the complete 7-day sequence and consider attribution delay), reconcile actual receipts rather than modeled conversions alone.
