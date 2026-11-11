import { Link } from "wouter";
import { ArrowDownRight, ArrowRight, Compass, Eye, Moon, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import Bodygraph from "@/components/Bodygraph";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import type { HumanDesignChartData, CenterStatusData, ChannelActivationData } from "@shared/types";
import "./MotionPreview.css";

const centerNames = ["Head", "Ajna", "Throat", "G", "Heart", "Sacral", "SolarPlexus", "Spleen", "Root"] as const;
const definedCenters = new Set<string>(["Head", "Ajna", "Throat", "G", "Sacral", "SolarPlexus"]);
const channels: ChannelActivationData[] = [
  { gate1: 64, gate2: 47, centerA: "Head", centerB: "Ajna", activatedBy: { gate1Sources: [], gate2Sources: [] } },
  { gate1: 20, gate2: 34, centerA: "Throat", centerB: "Sacral", activatedBy: { gate1Sources: [], gate2Sources: [] } },
  { gate1: 15, gate2: 5, centerA: "G", centerB: "Sacral", activatedBy: { gate1Sources: [], gate2Sources: [] } },
  { gate1: 59, gate2: 6, centerA: "Sacral", centerB: "SolarPlexus", activatedBy: { gate1Sources: [], gate2Sources: [] } },
];
const sampleCenters: CenterStatusData[] = centerNames.map(name => ({
  name, defined: definedCenters.has(name), gates: [], activatedGates: [],
}));
const emptyVariable = () => ({ type: "", color: 0, tone: 0, arrow: "" });

/** Intentionally fabricated illustration geometry, never presented as a computed person's chart. */
const ILLUSTRATIVE_CHART: HumanDesignChartData = {
  calculationVersion: "illustrative-not-calculated",
  birthDate: "", birthTime: "", birthPlace: "", timezone: "",
  birthUtc: "", utcOffsetMinutes: 0, utcOffsetSeconds: 0,
  type: "Generator", profile: "", profileName: "", strategy: "", authority: "",
  signature: "", notSelf: "", aura: "", definition: "",
  incarnationCross: { name: "", type: "", gates: [0, 0, 0, 0] },
  variables: { digestion: emptyVariable(), environment: emptyVariable(), perspective: emptyVariable(), awareness: emptyVariable() },
  personalityActivations: [], designActivations: [],
  channels, centers: sampleCenters,
  activatedGates: [64, 47, 20, 34, 15, 5, 59, 6],
  personalityPositions: {}, designPositions: {}, designDate: "",
};

export default function MotionPreview() {
  const { locale, localePath } = useLanguage();
  const cs = locale === "cs";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pathname = localePath("/motion-preview");
  useSEO({
    title: cs
      ? "Tvůj energetický blueprint. Živě. | Human Design ZEN / FLOW Preview"
      : "Your Energy Blueprint. Alive. | Human Design ZEN / FLOW Preview",
    description: cs
      ? "Prozkoumej živý Bodygraph. ZEN pro zklidnění, FLOW pro objevování. Bezplatná interaktivní ukázka s respektováním omezení pohybu."
      : "Explore the living Bodygraph. ZEN for calm, FLOW for discovery. A free interactive preview that respects reduced-motion settings.",
    locale: cs ? "cs_CZ" : "en_US",
    ogImage: `${origin}/images/og-motion-preview.png`,
    ogUrl: `${origin}${pathname}`,
    noIndex: true, // QA-only preview: do not index an unlaunched product experience.
  });

  const faq = cs ? [
    ["Ovlivňují animace výpočet mapy?", "Ne. ZEN a FLOW ovládají pouze vizuální vrstvy. Výpočet osobní mapy je na pohybu nezávislý."],
    ["Funguje Bodygraph na mobilu?", "Rozhraní je responzivní a dotykové ovládání je podporováno. Výkon na konkrétních zařízeních teprve ověřujeme v preview QA."],
    ["Musím se registrovat?", "Tuto ilustrativní ukázku si prohlédneš bez účtu. Vytvoření bezplatné osobní mapy je dostupné zvlášť; některé další funkce mohou vyžadovat přihlášení."],
  ] : [
    ["Do the animations affect the chart calculation?", "No. ZEN and FLOW only change decorative visuals; calculating a personal chart is independent of motion."],
    ["Does Bodygraph work on mobile?", "The interface is responsive with touch controls. Device-specific performance is still undergoing preview QA."],
    ["Do I need to register?", "No account is needed for this illustrative demo. The free personal chart is available separately; some other features may require sign-in."],
  ];

  return (
    <div className="hd-motion-preview min-h-screen">
      <Navbar />
      <main>
        <section className="hd-mp-hero" aria-labelledby="motion-preview-title">
          <div className="hd-mp-ambient" aria-hidden="true" />
          <div className="hd-mp-container hd-mp-hero-grid">
            <div>
              <p className="hd-mp-eyebrow"><Sparkles size={15} aria-hidden="true" /> HUMAN DESIGN • ZEN / FLOW</p>
              <h1 id="motion-preview-title" className="hd-mp-heading">
                {cs ? "Tvůj energetický blueprint." : "Your energy blueprint."}
                <em>{cs ? " Živě." : " Alive."}</em>
              </h1>
              <p className="hd-mp-lead">
                {cs
                  ? "Objev svůj Human Design v plynulém, uklidňujícím Bodygraphu. ZEN ti dá prostor zpomalit, FLOW zve k prozkoumání. Pohyb je volitelný, vhled zůstává."
                  : "Explore your Human Design in a fluid, calming Bodygraph. ZEN offers room to slow down; FLOW invites discovery. Motion is optional, insight stays."}
              </p>
              <div className="hd-mp-hero-actions">
                <a className="hd-mp-button hd-mp-button-primary" href="#live-bodygraph">
                  <PlayCircle size={19} aria-hidden="true" />
                  {cs ? "Vyzkoušet živý graf" : "Try the living chart"}
                </a>
                <a className="hd-mp-button hd-mp-button-quiet" href="#motion-modes">
                  {cs ? "Co je ZEN vs FLOW?" : "ZEN vs FLOW explained"}
                  <ArrowDownRight size={18} aria-hidden="true" />
                </a>
              </div>
              <div className="hd-mp-hero-trust">
                <span><ShieldCheck size={16} aria-hidden="true" /> {cs ? "Animace lze vypnout" : "Motion can be paused"}</span>
                <span><Eye size={16} aria-hidden="true" /> {cs ? "Přístupné ovládání" : "Accessible controls"}</span>
              </div>
            </div>
            <div className="hd-mp-orb-wrap" aria-hidden="true">
              <div className="hd-mp-orbit hd-mp-orbit-outer" />
              <div className="hd-mp-orbit hd-mp-orbit-inner" />
              <div className="hd-mp-orb-core">✧<span>ZEN<br />FLOW</span></div>
            </div>
          </div>
        </section>

        <section className="hd-mp-demo" id="live-bodygraph" aria-labelledby="motion-demo-title">
          <div className="hd-mp-container">
            <p className="hd-mp-eyebrow">{cs ? "ŽIVÁ UKÁZKA" : "INTERACTIVE DEMO"}</p>
            <h2 id="motion-demo-title">{cs ? "Pohyb, který neruší. Vhled, který zůstává." : "Motion that settles. Insight that stays."}</h2>
            <p className="hd-mp-section-lead">
              {cs
                ? "Zkus tlačítko Play/Pause, přepni ZEN a FLOW a klepni na centrum. Níže vidíš ilustrativní rozložení, nikoli výpočet konkrétní osoby."
                : "Try Play/Pause, switch ZEN and FLOW, and tap a center. This is an illustrative layout, not an individual's calculated chart."}
            </p>
            <div className="hd-mp-demo-grid">
              <div className="hd-mp-chart-shell">
                <p className="hd-mp-chart-caption">{cs ? "ILUSTRAČNÍ MAPA · MODELOVÁ DATA" : "ILLUSTRATIVE CHART · SAMPLE DATA"}</p>
                <Bodygraph chart={ILLUSTRATIVE_CHART} width={500} height={600} premium={true} />
              </div>
              <aside className="hd-mp-instructions">
                <p className="hd-mp-eyebrow">{cs ? "TŘI MALÉ KROKY" : "THREE SMALL STEPS"}</p>
                <ol>
                  <li><span>01</span><strong>{cs ? "Spusť FLOW" : "Switch to FLOW"}</strong><p>{cs ? "Všimni si jemného světla v definovaných kanálech." : "Notice the subtle light moving through defined channels."}</p></li>
                  <li><span>02</span><strong>{cs ? "Vyber centrum" : "Explore a center"}</strong><p>{cs ? "Najetím, fokusem nebo klepnutím odhal krátký popisek." : "Hover, focus or tap for a short reflective label."}</p></li>
                  <li><span>03</span><strong>{cs ? "Vrať se k ZEN" : "Return to ZEN"}</strong><p>{cs ? "Zpomal tempo. Případně animaci úplně pozastav." : "Slow the rhythm down, or pause motion entirely."}</p></li>
                </ol>
                <Link className="hd-mp-button hd-mp-button-secondary" href={localePath("/calculate")}>
                  <Compass size={18} aria-hidden="true" />
                  {cs ? "Vypočítat vlastní mapu zdarma" : "Calculate my free chart"}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <p className="hd-mp-fineprint">
                  {cs
                    ? "Tato ukázka je nástroj k sebereflexi. Není diagnostikou ani vědecky ověřeným popisem osobnosti."
                    : "This preview is for reflection, not diagnosis or a scientifically validated personality assessment."}
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section className="hd-mp-modes" id="motion-modes" aria-labelledby="motion-modes-title">
          <div className="hd-mp-container">
            <p className="hd-mp-eyebrow">ZEN / FLOW</p>
            <h2 id="motion-modes-title">{cs ? "Dva rytmy. Tvůj vlastní prostor." : "Two rhythms. Your own space."}</h2>
            <div className="hd-mp-modes-grid">
              <article className="hd-mp-mode-card"><Moon size={24} aria-hidden="true" /><h3>ZEN</h3>
                <p>{cs ? "Pomalé dýchání, tišší světlo, čas pozorovat detaily." : "Gentle breathing, softer light, room to observe."}</p>
                <span>{cs ? "Přibližně 7 s na cyklus" : "Approximately 7s per cycle"}</span>
              </article>
              <article className="hd-mp-mode-card hd-mp-flow"><Sparkles size={24} aria-hidden="true" /><h3>FLOW</h3>
                <p>{cs ? "Zřetelnější světelné proudění pro aktivní zkoumání." : "More visible energy flow for active exploration."}</p>
                <span>{cs ? "Přibližně 3,5 s na cyklus" : "Approximately 3.5s per cycle"}</span>
              </article>
            </div>
            <div className="hd-mp-assurance" role="note">
              <span>{cs ? "Respektuje systémové omezení pohybu" : "Respects system reduced-motion"}</span>
              <span>{cs ? "Mapa zůstává čitelná i bez animací" : "Chart stays readable without animation"}</span>
              <span>{cs ? "Pohyb se pozastaví mimo zobrazení" : "Auto-pauses offscreen"}</span>
            </div>
          </div>
        </section>

        <section className="hd-mp-faq" aria-labelledby="motion-faq-title">
          <div className="hd-mp-container hd-mp-faq-wrap">
            <div><p className="hd-mp-eyebrow">FAQ</p><h2 id="motion-faq-title">{cs ? "Klidně se ptej." : "A little more clarity."}</h2></div>
            <div>{faq.map(([question, answer]) => (
              <details key={question} className="hd-mp-question">
                <summary>{question}</summary><p>{answer}</p>
              </details>
            ))}</div>
          </div>
        </section>
        <section className="hd-mp-end">
          <div className="hd-mp-container">
            <p>{cs ? "Ukázka je zdarma. Tvoje skutečná mapa čeká na přesné údaje narození." : "The demo is free. Your personal chart begins with your birth details."}</p>
            <Link className="hd-mp-button hd-mp-button-primary" href={localePath("/calculate")}>
              {cs ? "Začít bezplatným výpočtem" : "Start with a free calculation"} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
