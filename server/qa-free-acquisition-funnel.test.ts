import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { withServerRenderedSeoMeta } from "../workers/social-meta";

const html = () => new Response('<!doctype html><html><head><!--SEO_META--></head><body><div id="root"></div></body></html>',{headers:{"content-type":"text/html"}});
const id="FixturePixel123";
describe("Free chart paid acquisition pilot",()=>{
  it("exposes only a validated public pixel ID on the two branded domains",async()=>{
    for(const host of ["humandesignmapa.cz","www.humandesignmapa.cz","humandesignchart.app","www.humandesignchart.app"]){
      const res=await withServerRenderedSeoMeta(new URL("https://"+host+"/"),html(),id);
      expect(await res.text()).toContain('name="hd-openai-ads-pixel-id" content="'+id+'"');
    }
    const preview=await withServerRenderedSeoMeta(new URL("https://preview.pages.dev/"),html(),id);
    expect(await preview.text()).not.toContain("hd-openai-ads-pixel-id");
    const invalid=await withServerRenderedSeoMeta(new URL("https://humandesignchart.app/"),html(),'"<script>');
    expect(await invalid.text()).not.toContain("hd-openai-ads-pixel-id");
  });
  it("measures actual calculation success without registering or counting a lead",()=>{
    const calculator=readFileSync("client/src/pages/ChartCalculator.tsx","utf8");
    expect(calculator).toContain('get("funnel") === "free"');
    expect(calculator).toContain("Reveal my free chart");
    expect(calculator).toContain("Zobrazit můj výklad zdarma");
    expect(calculator.indexOf("measureFreeChartGenerated();")).toBeGreaterThan(calculator.indexOf("onSuccess: (data)"));
    expect(calculator).not.toContain("meta.completeRegistration(");
    expect(calculator).not.toContain('chart_type: data.type');
    const pixel=readFileSync("client/src/hooks/useOpenAIAdsPixel.ts","utf8");
    expect(pixel).toContain('custom_event_name: "free_chart_generated"');
    expect(pixel).toContain('if (!initOpenAIAdsPixelAfterConsent()) return false');
    expect(pixel).toContain('oaiq?.("consent", true)');
    expect(pixel).toContain('meta[name="hd-openai-ads-pixel-id"]');
  });
  it("uses integer minor units for OpenAI checkout value and keeps GA4's major-unit value",()=>{
    const pricing=readFileSync("client/src/pages/Pricing.tsx","utf8");
    expect(pricing).toMatch(/measureOpenAIAdsEvent\("checkout_started", \{\s*type: "contents",\s*amount: totalAmountMinor/);
    expect(pricing).toContain("value: valueMajor");
  });
});
