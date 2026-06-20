import html2canvas from 'html2canvas';
import type { HumanDesignChartData } from "@shared/types";
import { cs } from "@shared/i18n/cs";

const t = cs;

// Czech cross type translations
const CROSS_TYPE_CS: Record<string, string> = {
  "Right Angle Cross": "Pravý Úhlový Kříž",
  "Left Angle Cross": "Levý Úhlový Kříž",
  "Juxtaposition Cross": "Juxtapoziční Kříž",
};

function translateCrossName(name: string): string {
  let result = name;
  for (const [en, cs] of Object.entries(CROSS_TYPE_CS)) {
    result = result.replace(en, cs);
  }
  return result;
}

export async function generateChartPDF(chart: HumanDesignChartData, name: string, hdData: any, bodygraphRef?: React.RefObject<HTMLDivElement | null>): Promise<void> {
  const czType = (t.types as Record<string, string>)[chart.type] || chart.type;
  const czStrategy = (t.hd.strategies as Record<string, string>)[chart.strategy] || chart.strategy;
  const czSignature = (t.hd.signatures as Record<string, string>)[chart.signature] || chart.signature;
  const czNotSelf = (t.hd.notSelfs as Record<string, string>)[chart.notSelf] || chart.notSelf;
  const czDefinition = (t.hd.definitionTypes as Record<string, string>)[chart.definition] || chart.definition;
  const czCrossName = translateCrossName(chart.incarnationCross?.name || "—");
  const czCrossType = CROSS_TYPE_CS[chart.incarnationCross?.type || ""] || chart.incarnationCross?.type || "";

  const typeDesc = hdData?.types[chart.type];
  const profileDesc = hdData?.profiles[chart.profile];
  const authDesc = hdData?.authorities[chart.authority];

  const centersHtml = (chart.centers || []).map(center => {
    const czName = (t.hd.centerNames as Record<string, string>)[center.name] || center.name;
    const status = center.defined ? "Definováno" : "Otevřeno";
    const desc = hdData?.centers[center.name];
    const statusColor = center.defined ? "#7c3aed" : "#6b7280";
    return `<tr>
      <td style="padding:5px 8px;font-weight:600;color:#374151;width:120px">${czName}</td>
      <td style="padding:5px 8px;color:${statusColor};font-weight:600">${status}</td>
      <td style="padding:5px 8px;color:#6b7280">${desc?.theme || ""}</td>
    </tr>`;
  }).join("");

  const channelsHtml = (chart.channels || []).map(ch => {
    if (!hdData) return "";
    const key = hdData.channels[`${ch.gate1}-${ch.gate2}`] ? `${ch.gate1}-${ch.gate2}` : `${ch.gate2}-${ch.gate1}`;
    const desc = hdData.channels[key];
    const czCenA = (t.hd.centerNames as Record<string, string>)[ch.centerA] || ch.centerA;
    const czCenB = (t.hd.centerNames as Record<string, string>)[ch.centerB] || ch.centerB;
    return `<tr>
      <td style="padding:5px 8px;font-weight:600;color:#374151;width:60px">${ch.gate1}–${ch.gate2}</td>
      <td style="padding:5px 8px;font-weight:600;color:#374151">${desc?.name || ""}</td>
      <td style="padding:5px 8px;color:#6b7280">${czCenA} → ${czCenB}</td>
      <td style="padding:5px 8px;color:#9ca3af;font-style:italic">${desc?.theme || ""}</td>
    </tr>`;
  }).join("");

  const activationsHtml = (activations: typeof chart.personalityActivations, label: string, color: string) =>
    `<div style="margin-bottom:16px">
      <h4 style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0">${label}</h4>
      <table style="width:100%;border-collapse:collapse">
        ${(activations || []).map(a => {
      const czPlanet = (t.hd.planets as Record<string, string>)[a.planet] || a.planet;
      const gateDesc = hdData?.gates[a.gate];
      return `<tr>
            <td style="padding:3px 8px;color:#6b7280;width:90px;font-size:10px">${czPlanet}</td>
            <td style="padding:3px 8px;font-weight:600;color:#374151;font-size:10px">Brána ${a.gate}.${a.line}</td>
            <td style="padding:3px 8px;color:#6b7280;font-size:10px">${gateDesc?.name || ""}</td>
          </tr>`;
    }).join("")}
      </table>
    </div>`;

  const gatesHtml = (chart.activatedGates || []).sort((a, b) => a - b).map(gate => {
    const desc = hdData?.gates[gate];
    return `<span style="display:inline-block;background:#f3f0ff;color:#7c3aed;border-radius:4px;padding:2px 7px;margin:2px;font-size:10px;font-weight:600">${gate}${desc ? ` · ${desc.name}` : ""}</span>`;
  }).join("");

  const variablesHtml = chart.variables ? Object.entries(chart.variables).map(([key, v]) => {
    const labels: Record<string, string> = {
      digestion: "Trávení", environment: "Prostředí",
      perspective: "Perspektiva", awareness: "Vědomí",
    };
    return `<tr>
      <td style="padding:5px 8px;font-weight:600;color:#374151;width:120px">${labels[key] || key}</td>
      <td style="padding:5px 8px;color:#7c3aed;font-weight:600">${v.type}</td>
      <td style="padding:5px 8px;color:#6b7280">${v.arrow} · Barva ${v.color} · Tón ${v.tone}</td>
    </tr>`;
  }).join("") : "";

  let bodygraphImg = "";
  if (bodygraphRef?.current) {
    try {
      const canvas = await html2canvas(bodygraphRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true
      });
      bodygraphImg = canvas.toDataURL("image/png");
    } catch (e) {
      console.error("Failed to capture bodygraph for PDF", e);
    }
  }

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Human Design — ${name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; color: #1e1e32; background: #fff; font-size: 11px; line-height: 1.5; }
    
    .header { background: linear-gradient(135deg, #7c3aed, #5b21b6); color: #fff; padding: 20px 30px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; letter-spacing: 0.05em; }
    .header-sub { font-size: 10px; color: #ddd6fe; margin-top: 3px; }
    .header-right { text-align: right; }
    .header-name { font-size: 14px; font-weight: 600; }
    .header-date { font-size: 10px; color: #ddd6fe; margin-top: 3px; }
    .accent-bar { height: 3px; background: linear-gradient(90deg, #a78bfa, #7c3aed); }
    
    .content { padding: 20px 30px; }
    
    .main-grid { display: flex; gap: 20px; }
    .bodygraph-side { width: 280px; flex-shrink: 0; text-align: center; }
    .info-side { flex: 1; }
    
    .section { margin-bottom: 18px; break-inside: avoid; }
    .section-title { background: #f3f0ff; border-left: 3px solid #7c3aed; padding: 5px 10px; font-size: 10px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    
    table { width: 100%; border-collapse: collapse; }
    td { vertical-align: top; }
    tr:nth-child(even) td { background: #fafafa; }
    
    .kv-label { font-size: 9px; color: #9ca3af; width: 100px; padding: 3px 6px; }
    .kv-value { font-size: 10px; font-weight: 600; color: #1e1e32; padding: 3px 6px; }
    
    .bodygraph-img { max-width: 100%; height: auto; margin-top: 10px; border: 1px solid #f3f0ff; border-radius: 8px; padding: 10px; }
    
    .desc-box { background: #fafafa; border: 1px solid #e9e5ff; border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; font-size: 9px; color: #4b5563; line-height: 1.5; }
    .desc-label { font-size: 8px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
    .conscious-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 4px 8px; margin-top: 4px; font-size: 9px; color: #166534; }
    .unconscious-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 4px 8px; margin-top: 4px; font-size: 9px; color: #991b1b; }
    
    .cross-gates { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 6px; }
    .cross-gate { background: #f3f0ff; border: 1px solid #ddd6fe; border-radius: 4px; padding: 6px; text-align: center; }
    .cross-gate-label { font-size: 8px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
    .cross-gate-num { font-size: 14px; font-weight: 700; color: #7c3aed; }
    
    .footer { border-top: 1px solid #e5e7eb; padding: 10px 30px; text-align: center; font-size: 9px; color: #9ca3af; margin-top: 15px; }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section { break-inside: avoid; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="header-title">HUMAN DESIGN</div>
      <div class="header-sub">Osobní energetický blueprint</div>
    </div>
    <div class="header-right">
      <div class="header-name">${name}</div>
      <div class="header-date">${new Date().toLocaleDateString("cs-CZ")}</div>
    </div>
  </div>
  <div class="accent-bar"></div>

  <div class="content">
    <div class="main-grid">
      <!-- Left side: Bodygraph -->
      <div class="bodygraph-side">
        <div class="section-title">Váš energetický Bodygraph</div>
        ${bodygraphImg ? `<img src="${bodygraphImg}" class="bodygraph-img" alt="Bodygraph" />` : `<div style="padding:40px; border:1px dashed #ccc; color:#999">Vizualizace mapy</div>`}
        
        <div style="margin-top: 20px; text-align: left">
          <div class="section-title" style="margin-top:20px">Aktivované brány (${(chart.activatedGates || []).length})</div>
          <div style="padding:4px">${gatesHtml}</div>
        </div>
      </div>

      <!-- Right side: Information -->
      <div class="info-side">
        <!-- Overview -->
        <div class="section">
          <div class="section-title">Přehled mapy</div>
          <table>
            <tr><td class="kv-label">Typ:</td><td class="kv-value">${czType}</td><td class="kv-label">Strategie:</td><td class="kv-value">${czStrategy}</td></tr>
            <tr><td class="kv-label">Profil:</td><td class="kv-value">${chart.profile} ${chart.profileName}</td><td class="kv-label">Autorita:</td><td class="kv-value">${chart.authority}</td></tr>
            <tr><td class="kv-label">Definice:</td><td class="kv-value">${czDefinition}</td><td class="kv-label">Signatura:</td><td class="kv-value">${czSignature}</td></tr>
            <tr><td class="kv-label">Inkarnační kříž:</td><td class="kv-value" colspan="3">${czCrossName}</td></tr>
          </table>
        </div>


        ${typeDesc ? `
        <!-- Type -->
        <div class="section">
          <div class="section-title">Typ: ${czType}</div>
          <div class="desc-box">${typeDesc.description}</div>
          <div style="font-size:9px;color:#7c3aed;padding:0 4px">Strategie: ${czStrategy} · Signatura: ${czSignature} · Ne-Já: ${czNotSelf}</div>
        </div>` : ""}

        ${profileDesc ? `
        <!-- Profile -->
        <div class="section">
          <div class="section-title">Profil: ${chart.profile} ${chart.profileName}</div>
          <div class="desc-box">${profileDesc.description}</div>
          <div class="conscious-box"><strong>Vědomé:</strong> ${profileDesc.conscious}</div>
          <div class="unconscious-box"><strong>Nevědomé:</strong> ${profileDesc.unconscious}</div>
        </div>` : ""}

        ${authDesc ? `
        <!-- Authority -->
        <div class="section">
          <div class="section-title">Autorita: ${chart.authority}</div>
          <div class="desc-box">${authDesc.description}</div>
          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:4px;padding:5px 8px;margin-top:4px;font-size:9px;color:#6b21a8">
            <strong>Jak používat:</strong> ${authDesc.howToUse}
          </div>
        </div>` : ""}

        <!-- Incarnation Cross -->
        <div class="section">
          <div class="section-title">Inkarnační kříž</div>
          <div style="font-size:12px;font-weight:700;color:#1e1e32;margin-bottom:2px">${czCrossName} ${czCrossType ? `· ${czCrossType}` : ""}</div>
          <div class="cross-gates">
            ${(chart.incarnationCross?.gates || []).map((g, i) => {
    const gd = hdData?.gates[g];
    const labels = ["Osobnost ☉", "Osobnost ⊕", "Design ☉", "Design ⊕"];
    return `<div class="cross-gate">
                <div class="cross-gate-label">${labels[i] || ""}</div>
                <div class="cross-gate-num">${g}</div>
              </div>`;
  }).join("")}
          </div>
        </div>
      </div>
    </div>

    <!-- Full Width Sections below grid -->
    <div style="margin-top:20px">
      <!-- Centers -->
      <div class="section">
        <div class="section-title">Centra</div>
        <table>${centersHtml}</table>
      </div>

      ${(chart.channels || []).length > 0 ? `
      <!-- Channels -->
      <div class="section">
        <div class="section-title">Kanály (${chart.channels.length})</div>
        <table>${channelsHtml}</table>
      </div>` : ""}

      <!-- Activations -->
      <div class="section">
        <div class="section-title">Planetární aktivace</div>
        <div style="display:flex; gap:20px">
          <div style="flex:1">${activationsHtml(chart.personalityActivations, "Osobnost (Vědomé)", "#166534")}</div>
          <div style="flex:1">${activationsHtml(chart.designActivations, "Design (Nevědomé)", "#991b1b")}</div>
        </div>
      </div>

      ${chart.variables ? `
      <!-- Variables -->
      <div class="section">
        <div class="section-title">Proměnné (PHS)</div>
        <table>${variablesHtml}</table>
      </div>` : ""}
    </div>
  </div>

  </div>

  <div class="footer">
    Human Design App &mdash; ${name} &mdash; Vygenerováno: ${new Date().toLocaleDateString("cs-CZ")}
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
