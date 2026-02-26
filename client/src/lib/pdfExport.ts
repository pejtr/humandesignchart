import jsPDF from "jspdf";
import type { HumanDesignChartData } from "@shared/types";
import { GATE_DESCRIPTIONS, CHANNEL_DESCRIPTIONS, CENTER_DESCRIPTIONS, TYPE_DESCRIPTIONS, AUTHORITY_DESCRIPTIONS, PROFILE_DESCRIPTIONS } from "@shared/hdContent";
import { cs } from "@shared/i18n/cs";

const t = cs;

// Light theme colors
const COLORS = {
  bg: [255, 255, 255] as [number, number, number],
  card: [248, 247, 255] as [number, number, number],
  primary: [109, 40, 217] as [number, number, number],
  primaryLight: [237, 233, 254] as [number, number, number],
  text: [30, 30, 50] as [number, number, number],
  muted: [100, 100, 130] as [number, number, number],
  accent: [139, 92, 246] as [number, number, number],
  red: [185, 28, 28] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  gold: [180, 140, 20] as [number, number, number],
  border: [229, 225, 245] as [number, number, number],
};

function addHeader(doc: jsPDF, name: string, y: number): number {
  // Purple gradient header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 32, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("HUMAN DESIGN", 15, 14);
  doc.setFontSize(9);
  doc.setTextColor(220, 210, 255);
  doc.text("Osobní energetický blueprint", 15, 22);
  
  // Chart name and date
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(name, 195, 14, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(220, 210, 255);
  doc.text(new Date().toLocaleDateString("cs-CZ"), 195, 22, { align: "right" });
  
  // Thin accent line
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 32, 210, 1, "F");
  
  return 40;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  if (y > 265) {
    doc.addPage();
    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 0, 210, 297, "F");
    y = 15;
  }
  // Light purple background with left accent
  doc.setFillColor(...COLORS.primaryLight);
  doc.rect(15, y, 180, 8, "F");
  doc.setFillColor(...COLORS.primary);
  doc.rect(15, y, 2, 8, "F");
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.text(title, 22, y + 5.5);
  return y + 14;
}

function addKeyValue(doc: jsPDF, label: string, value: string, y: number, labelWidth = 55): number {
  if (y > 280) {
    doc.addPage();
    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 0, 210, 297, "F");
    y = 15;
  }
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  doc.text(label, 20, y);
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.text(value, 20 + labelWidth, y);
  return y + 6;
}

function addParagraph(doc: jsPDF, text: string, y: number, maxWidth = 170): number {
  if (y > 275) {
    doc.addPage();
    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 0, 210, 297, "F");
    y = 15;
  }
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, 20, y);
  return y + lines.length * 4 + 3;
}

function addSmallLabel(doc: jsPDF, text: string, y: number, color: [number, number, number] = COLORS.muted): number {
  if (y > 280) {
    doc.addPage();
    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 0, 210, 297, "F");
    y = 15;
  }
  doc.setTextColor(...color);
  doc.setFontSize(7);
  doc.text(text, 20, y);
  return y + 4;
}

export function generateChartPDF(chart: HumanDesignChartData, name: string): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  // White background
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, 210, 297, "F");

  let y = addHeader(doc, name, 0);

  // ─── Overview Section ───
  y = addSectionTitle(doc, "Prehled mapy", y);
  
  const czType = (t.types as any)[chart.type] || chart.type;
  const czStrategy = (t.hd.strategies as any)[chart.strategy] || chart.strategy;
  const czSignature = (t.hd.signatures as any)[chart.signature] || chart.signature;
  const czNotSelf = (t.hd.notSelfs as any)[chart.notSelf] || chart.notSelf;
  const czDefinition = (t.hd.definitionTypes as any)[chart.definition] || chart.definition;

  y = addKeyValue(doc, "Typ:", czType, y);
  y = addKeyValue(doc, "Profil:", `${chart.profile} ${chart.profileName}`, y);
  y = addKeyValue(doc, "Strategie:", czStrategy, y);
  y = addKeyValue(doc, "Autorita:", chart.authority, y);
  y = addKeyValue(doc, "Definice:", czDefinition, y);
  y = addKeyValue(doc, "Signatura:", czSignature, y);
  y = addKeyValue(doc, "Ne-Ja:", czNotSelf, y);
  y = addKeyValue(doc, "Aura:", chart.aura, y);
  y = addKeyValue(doc, "Inkarnacni Kriz:", chart.incarnationCross?.name || "—", y);
  y += 4;

  // ─── Type Description ───
  const typeDesc = TYPE_DESCRIPTIONS[chart.type];
  if (typeDesc) {
    y = addSectionTitle(doc, `Typ: ${czType}`, y);
    y = addParagraph(doc, typeDesc.description, y);
    y = addSmallLabel(doc, `Strategie: ${czStrategy} | Signatura: ${czSignature} | Ne-Ja: ${czNotSelf}`, y, COLORS.accent);
    y += 2;
  }

  // ─── Profile ───
  const profileDesc = PROFILE_DESCRIPTIONS[chart.profile];
  if (profileDesc) {
    y = addSectionTitle(doc, `Profil: ${chart.profile} ${chart.profileName}`, y);
    y = addParagraph(doc, profileDesc.description, y);
    y = addSmallLabel(doc, `Vedome: ${profileDesc.conscious}`, y, COLORS.text);
    y = addSmallLabel(doc, `Nevedome: ${profileDesc.unconscious}`, y, COLORS.red);
    y += 2;
  }

  // ─── Authority ───
  const authDesc = AUTHORITY_DESCRIPTIONS[chart.authority];
  if (authDesc) {
    y = addSectionTitle(doc, `Autorita: ${chart.authority}`, y);
    y = addParagraph(doc, authDesc.description, y);
    y = addSmallLabel(doc, `Jak pouzivat: ${authDesc.howToUse}`, y, COLORS.accent);
    y += 2;
  }

  // ─── Centers ───
  y = addSectionTitle(doc, "Centra", y);
  for (const center of chart.centers || []) {
    const czName = (t.hd.centerNames as any)[center.name] || center.name;
    const status = center.defined ? "Definovane" : "Otevrene";
    const desc = CENTER_DESCRIPTIONS[center.name];
    y = addKeyValue(doc, `${czName}:`, `${status} — ${desc?.theme || ""}`, y, 40);
    if (y > 280) { doc.addPage(); doc.setFillColor(...COLORS.bg); doc.rect(0, 0, 210, 297, "F"); y = 15; }
  }
  y += 2;

  // ─── Channels ───
  if ((chart.channels || []).length > 0) {
    y = addSectionTitle(doc, `Kanaly (${chart.channels.length})`, y);
    for (const ch of chart.channels) {
      const key = CHANNEL_DESCRIPTIONS[`${ch.gate1}-${ch.gate2}`] ? `${ch.gate1}-${ch.gate2}` : `${ch.gate2}-${ch.gate1}`;
      const desc = CHANNEL_DESCRIPTIONS[key];
      const czCenA = (t.hd.centerNames as any)[ch.centerA] || ch.centerA;
      const czCenB = (t.hd.centerNames as any)[ch.centerB] || ch.centerB;
      y = addKeyValue(doc, `${ch.gate1}-${ch.gate2}:`, `${desc?.name || ""} (${czCenA} -> ${czCenB})`, y, 25);
      if (desc) {
        y = addSmallLabel(doc, `  ${desc.theme}`, y);
      }
      if (y > 280) { doc.addPage(); doc.setFillColor(...COLORS.bg); doc.rect(0, 0, 210, 297, "F"); y = 15; }
    }
    y += 2;
  }

  // ─── Planetary Activations ───
  y = addSectionTitle(doc, "Planetarni aktivace — Osobnost (Vedome)", y);
  for (const a of chart.personalityActivations || []) {
    const czPlanet = (t.hd.planets as any)[a.planet] || a.planet;
    const gateDesc = GATE_DESCRIPTIONS[a.gate];
    y = addKeyValue(doc, `${czPlanet}:`, `Brana ${a.gate}.${a.line} — ${gateDesc?.name || ""}`, y, 35);
    if (y > 280) { doc.addPage(); doc.setFillColor(...COLORS.bg); doc.rect(0, 0, 210, 297, "F"); y = 15; }
  }
  y += 2;

  y = addSectionTitle(doc, "Planetarni aktivace — Design (Nevedome)", y);
  for (const a of chart.designActivations || []) {
    const czPlanet = (t.hd.planets as any)[a.planet] || a.planet;
    const gateDesc = GATE_DESCRIPTIONS[a.gate];
    y = addKeyValue(doc, `${czPlanet}:`, `Brana ${a.gate}.${a.line} — ${gateDesc?.name || ""}`, y, 35);
    if (y > 280) { doc.addPage(); doc.setFillColor(...COLORS.bg); doc.rect(0, 0, 210, 297, "F"); y = 15; }
  }
  y += 2;

  // ─── Variables ───
  if (chart.variables) {
    y = addSectionTitle(doc, "Promenne (PHS)", y);
    const varLabels: Record<string, string> = {
      digestion: "Traveni",
      environment: "Prostredi",
      perspective: "Perspektiva",
      awareness: "Vedomi",
    };
    for (const [key, v] of Object.entries(chart.variables)) {
      y = addKeyValue(doc, `${varLabels[key] || key}:`, `${v.type} (${v.arrow}) — Barva ${v.color}, Ton ${v.tone}`, y, 35);
      if (y > 280) { doc.addPage(); doc.setFillColor(...COLORS.bg); doc.rect(0, 0, 210, 297, "F"); y = 15; }
    }
    y += 2;
  }

  // ─── All Activated Gates ───
  y = addSectionTitle(doc, `Aktivovane brany (${(chart.activatedGates || []).length})`, y);
  const gateChunks: string[] = [];
  for (const gate of (chart.activatedGates || []).sort((a, b) => a - b)) {
    const desc = GATE_DESCRIPTIONS[gate];
    gateChunks.push(`${gate}${desc ? ` (${desc.name})` : ""}`);
  }
  y = addParagraph(doc, gateChunks.join(" • "), y);

  // ─── Footer on all pages ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Re-draw white background for added pages (header page already has it)
    if (i > 1) {
      // Background is already set when page was added
    }
    // Footer line
    doc.setDrawColor(...COLORS.border);
    doc.line(15, 286, 195, 286);
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(7);
    doc.text(`Human Design App — ${name} — Strana ${i}/${pageCount}`, 105, 290, { align: "center" });
    doc.text("Vygenerovano: " + new Date().toLocaleDateString("cs-CZ"), 105, 294, { align: "center" });
  }

  doc.save(`${name.replace(/\s+/g, "_")}_Human_Design_Mapa.pdf`);
}
