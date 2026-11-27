import { jsPDF } from 'jspdf';
import {
  formatDepthRangeMAndFt,
  formatDraftMAndFt,
  getDefaultMarineServices,
  getDefaultPhysicalSpecs,
  translatePortStatus,
} from './i18n';
import { drawInchcapeHeaderBrand, sanitizePdfFilename } from './pdfExporter';
import type {
  AuthorityRequirement,
  Berth,
  CrewChangeGuideConfig,
  DirectoryEntry,
  Language,
  OperationalProcedure,
  PdaHistoryRecord,
  PortArea,
  PortProfile,
  PortRestriction,
  PortStatusEvent,
  ProductTechnicalDossier,
  SparePartsProcedureConfig,
  Terminal,
  VesselLineupEntry,
  WeatherStatus,
} from '../types/port';

export const INCHCAPE_HEADER_SVG = `<svg width="180" height="58" viewBox="0 0 240 78" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Inchcape Shipping Services">
  <text x="12" y="48" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="1">INCHCAPE</text>
  <polygon points="103,29 109,43 97,43" fill="#e11d48" />
  <text x="42" y="64" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="9.5" fill="#e11d48" letter-spacing="2.4">SHIPPING SERVICES</text>
  <path d="M164 26 A31 31 0 1 1 196 68" fill="none" stroke="#ffffff" stroke-width="4.2" stroke-linecap="round"/>
  <path d="M169 29 A24 24 0 1 1 194 62" fill="none" stroke="#cbd5e1" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M174 33 A18 18 0 1 1 191 56" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
  <polygon points="215,10 203,20 207,24" fill="#e11d48"/>
  <path d="M180 34 L204 20 L195 45 L193 33 Z" fill="#ffffff"/>
</svg>`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface MonthlyPdaGroup {
  monthKey: string;
  records: PdaHistoryRecord[];
  totalUsd: number;
}

export function groupPdaHistoryByMonth(
  records: PdaHistoryRecord[]
): MonthlyPdaGroup[] {
  const map = new Map<string, PdaHistoryRecord[]>();
  const sorted = [...records].sort((a, b) =>
    (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)
  );
  sorted.forEach((rec) => {
    const key = rec.monthKey || rec.createdAt.slice(0, 7) || '2026-11';
    const list = map.get(key) ?? [];
    list.push(rec);
    map.set(key, list);
  });

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, items]) => ({
      monthKey,
      records: items,
      totalUsd: Math.round(items.reduce((s, r) => s + r.totalUsd, 0) * 100) / 100,
    }));
}

export function filterVisaRequiredCountries(
  guide: CrewChangeGuideConfig,
  query: string
): { ac: string[]; dm: string[]; nz: string[] } {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { ac: guide.appendixAC, dm: guide.appendixDM, nz: guide.appendixNZ };
  }
  const match = (list: string[]) =>
    list.filter((c) => c.toLowerCase().includes(q));
  return {
    ac: match(guide.appendixAC),
    dm: match(guide.appendixDM),
    nz: match(guide.appendixNZ),
  };
}

export function generateCrewChangeHtml(params: {
  guide: CrewChangeGuideConfig;
  port?: PortProfile;
  lang?: Language;
}): string {
  const { guide, port, lang = 'es' } = params;
  const portContext = port ? ` · ${escapeHtml(port.name)} (${escapeHtml(port.unLocode)})` : '';

  const renderBullets = (items: string[], color = '#334155') =>
    `<ul style="margin:6px 0 0 0;padding-left:18px;font-size:12px;color:${color};line-height:1.55;">
      ${items.map((i) => `<li style="margin-bottom:3px;">${escapeHtml(i)}</li>`).join('')}
    </ul>`;

  const checklistRowsHtml = guide.checklistRows
    .map(
      (row, idx) => `
      <tr style="background-color:${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
        <td style="padding:7px 12px;border:1px solid #cbd5e1;font-weight:700;color:#0f172a;">${escapeHtml(lang === 'es' ? row.item : row.itemEn)}</td>
        <td style="padding:7px 12px;border:1px solid #cbd5e1;text-align:center;font-weight:700;color:${row.onSigner.includes('Required') ? '#15803d' : '#0284c7'};">${escapeHtml(row.onSigner)}</td>
        <td style="padding:7px 12px;border:1px solid #cbd5e1;text-align:center;font-weight:700;color:${row.offSigner.includes('Required') ? '#15803d' : row.offSigner.includes('N/A') ? '#64748b' : '#0284c7'};">${escapeHtml(row.offSigner)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(guide.title)}${portContext}</title>
</head>
<body style="margin:0;padding:16px;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <table width="800" cellpadding="0" cellspacing="0" align="center" style="width:100%;max-width:800px;background-color:#ffffff;border:1px solid #cbd5e1;border-collapse:collapse;">
    <tr>
      <td style="background-color:#0b192c;padding:24px 28px;color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:middle;padding-right:16px;">
              <div style="font-size:19px;font-weight:800;color:#ffffff;text-transform:uppercase;">${escapeHtml(guide.title)}</div>
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-top:4px;">${escapeHtml(guide.subtitle)}${portContext}</div>
            </td>
            <td style="vertical-align:middle;text-align:right;width:185px;">
              ${INCHCAPE_HEADER_SVG}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color:#1e293b;padding:10px 28px;border-top:1px solid #334155;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11px;color:#94a3b8;">
          <tr>
            <td><strong>DOCUMENT TYPE:</strong> <span style="background-color:#0284c7;color:#ffffff;padding:3px 8px;border-radius:4px;font-weight:700;">STANDARD OPERATING PROCEDURE (SOP)</span></td>
            <td align="right">AGENCY: <strong style="color:#ffffff;">ISS Marine Services Mexico</strong></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;">
        <div style="background-color:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;padding:12px 15px;margin-bottom:22px;">
          <div style="font-size:12px;font-weight:700;color:#991b1b;text-transform:uppercase;">IMPORTANT NOTICE &amp; ENTRY ADVISORY</div>
          <p style="margin:5px 0 0 0;font-size:12px;color:#7f1d1d;line-height:1.5;">${escapeHtml(guide.entryAdvisory)}</p>
        </div>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">1. VISA ASSESSMENT &amp; QUALIFYING ALTERNATIVES</h2>
        <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;padding:12px 15px;margin-bottom:12px;">
          <div style="font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;">1.1 Nationals Exempt from Mexican Visa</div>
          ${renderBullets(guide.visaExemptNotes, '#166534')}
        </div>
        <div style="background-color:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid #0284c7;padding:12px 15px;margin-bottom:12px;">
          <div style="font-size:12px;font-weight:700;color:#0369a1;text-transform:uppercase;">1.2 Qualifying Alternatives to a Mexican Visa</div>
          ${renderBullets(guide.qualifyingAlternatives, '#334155')}
          <div style="background-color:#f0f9ff;border:1px solid #bae6fd;padding:10px 12px;margin-top:10px;">
            <div style="font-size:12px;font-weight:700;color:#0284c7;">Special Focus: U.S. C1/D1 Transit &amp; Crewmember Visas</div>
            ${renderBullets(guide.usC1d1Focus, '#0f172a')}
          </div>
        </div>
        <div style="background-color:#f8fafc;border:1px solid #cbd5e1;padding:12px 15px;margin-bottom:22px;">
          <div style="font-size:12px;font-weight:700;color:#1e293b;text-transform:uppercase;">1.3 Mandatory Documents for Seafarers Arriving by Air</div>
          ${renderBullets(guide.airArrivalMandatoryDocs, '#334155')}
        </div>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">2. RISK ADVISORY — VISA-REQUIRED NATIONALITIES</h2>
        <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #ea580c;padding:12px 15px;margin-bottom:22px;">
          <div style="font-size:12px;font-weight:700;color:#c2410c;text-transform:uppercase;">Critical Operational Warning for Seafarers Requiring a Visa:</div>
          ${renderBullets(guide.riskAdvisoryBullets, '#7c2d12')}
        </div>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">3. CREW CHANGE REQUIRED DOCUMENTATION</h2>
        <div style="background-color:#f8fafc;border:1px solid #cbd5e1;padding:12px 15px;margin-bottom:8px;">
          ${renderBullets(guide.requiredDocsList, '#334155')}
        </div>
        <div style="background-color:#eff6ff;border:1px solid #bfdbfe;padding:9px 12px;font-size:12px;color:#0f172a;margin-bottom:22px;">
          <strong>Minimum Lead Time Notice:</strong> ${escapeHtml(guide.minimumLeadTimeNotice)}
        </div>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">4. ON-SIGNERS &amp; OFF-SIGNERS PROCEDURES</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:22px;">
          <tr valign="top">
            <td width="48%" style="background-color:#f0f9ff;border:1px solid #bae6fd;border-left:4px solid #0284c7;padding:12px;">
              <div style="font-size:12px;font-weight:700;color:#0284c7;text-transform:uppercase;">4.1 On-Signers (Joining Crew)</div>
              ${renderBullets(guide.onSignerSteps, '#0f172a')}
            </td>
            <td width="4%">&nbsp;</td>
            <td width="48%" style="background-color:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid #475569;padding:12px;">
              <div style="font-size:12px;font-weight:700;color:#334155;text-transform:uppercase;">4.2 Off-Signers (Repatriating Crew)</div>
              ${renderBullets(guide.offSignerSteps, '#334155')}
            </td>
          </tr>
        </table>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">5. WORKING HOURS &amp; PERMIT PROCESSING</h2>
        <div style="background-color:#f8fafc;border:1px solid #cbd5e1;padding:12px 15px;margin-bottom:22px;">
          ${renderBullets(guide.workingHoursBullets, '#334155')}
        </div>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">6. CUSTOMS &amp; BAGGAGE OPERATIONAL GUIDANCE</h2>
        <div style="background-color:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid #0284c7;padding:12px 15px;margin-bottom:22px;">
          ${renderBullets(guide.customsBaggageBullets, '#334155')}
          <p style="margin:8px 0 0 0;font-size:11px;color:#64748b;font-style:italic;">${escapeHtml(guide.customsBaggageFootnote)}</p>
        </div>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">7. QUICK CLIENT CHECKLIST</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px;margin-bottom:22px;">
          <thead>
            <tr style="background-color:#0b192c;color:#ffffff;">
              <th style="padding:8px 12px;border:1px solid #cbd5e1;text-align:left;">Required Item / Document</th>
              <th style="padding:8px 12px;border:1px solid #cbd5e1;text-align:center;" width="24%">On-Signer</th>
              <th style="padding:8px 12px;border:1px solid #cbd5e1;text-align:center;" width="24%">Off-Signer</th>
            </tr>
          </thead>
          <tbody>${checklistRowsHtml}</tbody>
        </table>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 10px 0;text-transform:uppercase;">APPENDIX A — COUNTRIES &amp; REGIONS THAT REQUIRE A VISA</h2>
        <p style="margin:0 0 10px 0;font-size:12px;color:#334155;">${escapeHtml(guide.appendixIntro)}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #cbd5e1;font-size:11.5px;line-height:1.45;margin-bottom:22px;">
          <tr valign="top" style="background-color:#f8fafc;">
            <td width="33%" style="padding:10px;border-right:1px solid #cbd5e1;"><strong style="color:#0284c7;">A - C</strong><br/>${guide.appendixAC.map((c) => `&bull; ${escapeHtml(c)}`).join('<br/>')}</td>
            <td width="33%" style="padding:10px;border-right:1px solid #cbd5e1;"><strong style="color:#0284c7;">D - M</strong><br/>${guide.appendixDM.map((c) => `&bull; ${escapeHtml(c)}`).join('<br/>')}</td>
            <td width="34%" style="padding:10px;"><strong style="color:#0284c7;">N - Z</strong><br/>${guide.appendixNZ.map((c) => `&bull; ${escapeHtml(c)}`).join('<br/>')}</td>
          </tr>
        </table>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">8. AGENCY CONTACT &amp; OFFICIAL REFERENCES</h2>
        <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;padding:12px 15px;margin-bottom:12px;font-size:12px;color:#166534;">
          <div style="font-weight:700;color:#15803d;font-size:13px;margin-bottom:6px;">ISS Marine Services Mexico S.A. de C.V.</div>
          <div><strong>Address:</strong> ${escapeHtml(guide.officeAddress)}</div>
          <div style="margin-top:4px;"><strong>Phone:</strong> ${escapeHtml(guide.regionalPhone)}</div>
          <div style="margin-top:4px;"><strong>Personnel:</strong> ${guide.keyPersonnel.map((p) => escapeHtml(p)).join(' | ')}</div>
          <div style="margin-top:4px;"><strong>Emails:</strong> ${guide.emailDirectory.map((em) => escapeHtml(em)).join(' | ')}</div>
        </div>
        <div style="background-color:#f8fafc;border:1px solid #e2e8f0;padding:12px;font-size:11.5px;color:#475569;">
          <div><strong>Official INM Portals:</strong></div>
          <ul style="margin:4px 0 8px 0;padding-left:18px;">
            ${guide.officialPortals.map((p) => `<li>${escapeHtml(p.label)}: <a style="color:#0284c7;" href="${escapeHtml(p.url)}">${escapeHtml(p.url)}</a></li>`).join('')}
          </ul>
          <div style="font-style:italic;color:#64748b;"><strong>Disclaimer:</strong> ${escapeHtml(guide.disclaimer)}</div>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color:#0b192c;padding:16px 28px;text-align:center;color:#94a3b8;font-size:11px;">
        <div style="color:#ffffff;font-weight:700;">${escapeHtml(guide.title)}</div>
        <div style="margin-top:2px;">ISS Marine Services Mexico S.A. de C.V.</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateSparePartsHtml(params: {
  guide: SparePartsProcedureConfig;
  port?: PortProfile;
  lang?: Language;
}): string {
  const { guide, port, lang = 'es' } = params;
  const isEs = lang === 'es';
  const portContext = port ? ` · ${escapeHtml(port.name)} (${escapeHtml(port.unLocode)})` : '';

  const timelineRows = guide.timelines
    .map(
      (t, idx) => `
      <tr style="background-color:${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
        <td style="padding:7px 10px;border-bottom:1px solid #cbd5e1;font-weight:700;color:#0f172a;">${escapeHtml(isEs ? t.label : t.labelEn)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #cbd5e1;font-weight:700;color:#991b1b;text-align:right;">${escapeHtml(t.duration)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(guide.title)}${portContext}</title>
</head>
<body style="margin:0;padding:16px;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <table width="800" cellpadding="0" cellspacing="0" align="center" style="width:100%;max-width:800px;background-color:#ffffff;border:1px solid #cbd5e1;border-collapse:collapse;">
    <tr>
      <td style="background-color:#0b192c;padding:24px 28px;color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:middle;padding-right:16px;">
              <div style="font-size:19px;font-weight:800;color:#ffffff;text-transform:uppercase;">${escapeHtml(guide.title)}</div>
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-top:4px;">${escapeHtml(guide.subtitle)}${portContext}</div>
            </td>
            <td style="vertical-align:middle;text-align:right;width:185px;">
              ${INCHCAPE_HEADER_SVG}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color:#1e293b;padding:10px 28px;border-top:1px solid #334155;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11px;color:#94a3b8;">
          <tr>
            <td><strong>DOCUMENT TYPE:</strong> <span style="background-color:#0284c7;color:#ffffff;padding:3px 8px;border-radius:4px;font-weight:700;">CUSTOMS &amp; LOGISTICS GUIDELINES</span></td>
            <td align="right">AGENCY: <strong style="color:#ffffff;">ISS Marine Services Mexico</strong></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;">
        <div style="background-color:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid #2563eb;padding:12px 15px;margin-bottom:20px;">
          <div style="font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;">${escapeHtml(isEs ? guide.importationNoticeTitle : guide.importationNoticeTitleEn)}</div>
          <p style="margin:6px 0 0 0;font-size:12px;color:#334155;line-height:1.5;">${escapeHtml(isEs ? guide.importationNotice : guide.importationNoticeEn)}</p>
        </div>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">1. INVOICE &amp; DOCUMENTATION REQUIREMENTS</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:10px;">
          <tr valign="top">
            <td width="48%" style="background-color:#f1f5f9;border:1px solid #cbd5e1;padding:12px;">
              <div style="font-size:12px;font-weight:700;color:#0f172a;">Consignee Formulation</div>
              <p style="margin:6px 0 0 0;font-size:12px;color:#1d4ed8;font-weight:700;">${escapeHtml(guide.consigneeFormulation)}</p>
            </td>
            <td width="4%">&nbsp;</td>
            <td width="48%" style="background-color:#f1f5f9;border:1px solid #cbd5e1;padding:12px;">
              <div style="font-size:12px;font-weight:700;color:#0f172a;">Itemized Listing</div>
              <p style="margin:6px 0 0 0;font-size:11.5px;color:#334155;line-height:1.5;">${escapeHtml(guide.itemizedListingNote)}</p>
            </td>
          </tr>
        </table>
        <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #f97316;padding:10px 14px;font-size:11.5px;color:#9a3412;margin-bottom:22px;">
          <strong>DETAILED EXPLANATION REQUIRED:</strong> ${escapeHtml(guide.detailedExplanationNote)}
        </div>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">2. SHIPPING LOGISTICS &amp; ESTIMATED TIMELINES</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:22px;">
          <tr valign="top">
            <td width="48%" style="background-color:#f8fafc;border:1px solid #cbd5e1;padding:12px;font-size:11.5px;">
              <div style="font-size:12px;font-weight:700;color:#0284c7;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px;">Routing &amp; Package Size</div>
              <p style="margin:0 0 8px 0;line-height:1.5;">${escapeHtml(guide.smallPackageRouting)}</p>
              <p style="margin:0;line-height:1.5;">${escapeHtml(guide.largePackageRouting)}</p>
            </td>
            <td width="4%">&nbsp;</td>
            <td width="48%" style="background-color:#fef2f2;border:1px solid #fecaca;padding:12px;font-size:11.5px;">
              <div style="font-size:12px;font-weight:700;color:#b91c1c;border-bottom:1px solid #fecaca;padding-bottom:6px;margin-bottom:8px;">Customs Clearance Timelines</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                ${timelineRows}
              </table>
              <div style="margin-top:6px;font-size:10.5px;color:#dc2626;text-align:right;">${escapeHtml(guide.customsHoursNote)}</div>
            </td>
          </tr>
        </table>

        <h2 style="font-size:14px;font-weight:700;color:#991b1b;border-bottom:2px solid #dc2626;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">3. RESTRICTED &amp; PROHIBITED ITEMS</h2>
        <div style="background-color:#fef2f2;border:1px solid #fca5a5;padding:14px;margin-bottom:22px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11.5px;color:#991b1b;font-weight:700;">
            <tr valign="top">
              <td width="50%">
                <ul style="margin:0;padding-left:18px;line-height:1.6;">
                  ${guide.restrictedItemsCol1.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
              </td>
              <td width="50%">
                <ul style="margin:0;padding-left:18px;line-height:1.6;">
                  ${guide.restrictedItemsCol2.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
              </td>
            </tr>
          </table>
        </div>

        <h2 style="font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin:0 0 12px 0;text-transform:uppercase;">4. CONSIGNEE DETAILS &amp; PRE-APPROVAL</h2>
        <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #22c55e;padding:12px 14px;font-size:12px;color:#166534;margin-bottom:10px;">
          ${escapeHtml(guide.preApprovalNote)}
        </div>
        <div style="background-color:#f8fafc;border:1px solid #cbd5e1;padding:12px 14px;font-size:12px;color:#334155;line-height:1.55;">
          <strong>${escapeHtml(guide.officeCompany)}</strong><br/>
          ${escapeHtml(guide.officeAddress)}<br/>
          ${escapeHtml(guide.officePhones)} · ${escapeHtml(guide.officeWebsite)}
        </div>
        <p style="margin:8px 0 0 0;font-size:11px;color:#64748b;font-style:italic;">* ${escapeHtml(guide.invoiceAddressFootnote)}</p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#0b192c;padding:16px 28px;text-align:center;color:#94a3b8;font-size:11px;">
        <div style="color:#ffffff;font-weight:700;">${escapeHtml(guide.title)}</div>
        <div style="margin-top:2px;">${escapeHtml(guide.legalFooter)}</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildDefaultPreArrivalIntro(port: PortProfile, lang: Language): string {
  if (lang === 'es') {
    return `Estimados Señores\n\nBienvenidos al ${port.name}, con el fin de presentarles una perspectiva del puerto adjuntamos a usted la información relevante que deberá conocer y remitir al menos 72 horas antes de su llegada para poder garantizar su arribo seguro y sus operaciones.`;
  }
  return `Dear Sirs,\n\nWelcome to ${port.name}; in order to provide an operational overview of the port, we attach the relevant information you should review and submit at least 72 hours prior to arrival to guarantee a safe port call and smooth operations.`;
}

export interface PreArrivalPackageParams {
  port: PortProfile;
  areas: PortArea[];
  terminals: Terminal[];
  restrictions: PortRestriction[];
  weather?: WeatherStatus;
  statusHistory?: PortStatusEvent[];
  selectedTerminal?: Terminal;
  selectedBerth?: Berth;
  selectedProduct?: ProductTechnicalDossier;
  authorities: AuthorityRequirement[];
  crewGuide: CrewChangeGuideConfig;
  sparePartsGuide?: SparePartsProcedureConfig;
  lineup?: VesselLineupEntry[];
  procedures?: OperationalProcedure[];
  directory?: DirectoryEntry[];
  vesselName: string;
  voyageOrEta?: string;
  welcomeMessage?: string;
  includeModules: {
    portStatusWeather?: boolean;
    generalParticulars?: boolean;
    portRestrictions: boolean;
    productDossier: boolean;
    terminalSheet: boolean;
    includeAllTerminals?: boolean;
    portServices?: boolean;
    lineup?: boolean;
    authorities: boolean;
    spareParts?: boolean;
    crewChange: boolean;
    operationalProcedures?: boolean;
    directory?: boolean;
  };
  lang: Language;
}

export function generatePreArrivalPackageHtml(
  params: PreArrivalPackageParams
): string {
  const {
    port,
    areas,
    terminals,
    restrictions,
    weather,
    statusHistory = [],
    selectedTerminal,
    selectedBerth,
    selectedProduct,
    authorities,
    crewGuide,
    sparePartsGuide,
    lineup = [],
    procedures = [],
    directory = [],
    vesselName,
    voyageOrEta,
    welcomeMessage,
    includeModules,
    lang,
  } = params;
  const isEs = lang === 'es';
  const portAreas = areas.filter((a) => a.portId === port.id);
  const portTerminals = terminals.filter((t) => t.portId === port.id);
  const portRestrictions = restrictions.filter((r) => r.portId === port.id);
  const physicalSpecs = getDefaultPhysicalSpecs(port);
  const marineServices = getDefaultMarineServices(port);
  const portStatusLog = statusHistory.filter((s) => s.portId === port.id).slice(0, 10);
  const portLineup = lineup.filter((v) => v.portId === port.id);
  const portProcedures = procedures.filter((p) => p.portId === 'ALL' || p.portId === port.id);
  const portDirectory = directory.filter((d) => d.portId === 'ALL' || d.portId === port.id);

  const introText = (welcomeMessage && welcomeMessage.trim()) || buildDefaultPreArrivalIntro(port, lang);
  const introParagraphs = introText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 8px 0;font-size:13px;line-height:1.55;color:#0f172a;">${escapeHtml(p)}</p>`)
    .join('');

  const sectionsHtml: string[] = [];

  if (includeModules.portStatusWeather) {
    const historyHtml =
      portStatusLog.length > 0
        ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11.5px;margin-bottom:14px;">
            <thead><tr style="background:#f1f5f9;text-align:left;"><th style="padding:7px 10px;">${isEs ? 'Fecha/Hora' : 'Timestamp'}</th><th style="padding:7px 10px;">${isEs ? 'Estatus' : 'Status'}</th><th style="padding:7px 10px;">${isEs ? 'Alcance' : 'Scope'}</th></tr></thead>
            <tbody>
              ${portStatusLog
                .map(
                  (ev) => `<tr>
                    <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(ev.timestamp)}</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:700;">${escapeHtml(translatePortStatus(ev.status, lang))}</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? ev.navigationScope : ev.navigationScopeEn ?? ev.navigationScope)}</td>
                  </tr>`
                )
                .join('')}
            </tbody>
          </table>`
        : '';

    sectionsHtml.push(`
      <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">01. ${isEs ? 'Estatus Portuario, Clima e Histórico de Cierres' : 'Port Status, Weather & Closure History'}</h2>
      ${
        weather
          ? `<div style="padding:10px 14px;background:#f0f9ff;border:1px solid #bae6fd;margin-bottom:12px;font-size:12px;">
              <strong>${isEs ? 'Estatus Actual:' : 'Current Port Status:'}</strong> ${escapeHtml(translatePortStatus(weather.portStatus, lang))} ·
              <strong>${isEs ? 'Viento:' : 'Wind:'}</strong> ${escapeHtml(weather.windDirection)} ${weather.windKnots} kt ·
              <strong>${isEs ? 'Oleaje:' : 'Wave:'}</strong> ${weather.waveHeightM} m ·
              <strong>${isEs ? 'Corriente:' : 'Current:'}</strong> ${weather.barCurrentKnots} kt<br/>
              <span style="color:#334155;">${escapeHtml(isEs ? weather.advisory : weather.advisoryEn)}</span>
            </div>`
          : ''
      }
      ${historyHtml}
    `);
  }

  if (includeModules.generalParticulars && port.generalInfo) {
    const gi = port.generalInfo;
    sectionsHtml.push(`
      <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">02. ${isEs ? 'Posición Geográfica y Datos Generales del Puerto' : 'Port Geographical Position & General Particulars'}</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11.5px;margin-bottom:16px;">
        <tr><td width="32%" style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">${isEs ? 'Posición / UN/LOCODE' : 'Position / UN/LOCODE'}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${escapeHtml(port.coordinates)} · ${escapeHtml(isEs ? gi.geographicalNote : gi.geographicalNoteEn ?? gi.geographicalNote)} · ${escapeHtml(port.unLocode)} · ${escapeHtml(gi.ispsLevel)}</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">${isEs ? 'Zona Horaria / Turnos' : 'Time Zone / Shifts'}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${escapeHtml(gi.utcOffset)} · ${escapeHtml(isEs ? gi.workingHours : gi.workingHoursEn ?? gi.workingHours)}</td></tr>
        ${gi.approachNote ? `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">${isEs ? 'Aproximación y Recintos' : 'Approach & Enclosures'}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${escapeHtml(isEs ? gi.approachNote : gi.approachNoteEn ?? gi.approachNote)}</td></tr>` : ''}
        <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">${isEs ? 'Feriados Oficiales' : 'Official Holidays'}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${escapeHtml(isEs ? gi.holidays : gi.holidaysEn ?? gi.holidays)}</td></tr>
      </table>
    `);
  }

  if (includeModules.portRestrictions) {
    const areaRows = portAreas
      .map(
        (a) => `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:600;">${escapeHtml(isEs ? a.name : a.nameEn)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(formatDraftMAndFt(a.channelDepthM, 1))}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(formatDraftMAndFt(a.operationalDraftM))}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? a.tugRequirement : a.tugRequirementEn ?? a.tugRequirement)}</td>
        </tr>`
      )
      .join('');

    const anchorageRows = (port.anchorageZones ?? [])
      .map(
        (az) => `<tr>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-weight:600;">${escapeHtml(isEs ? az.name : az.nameEn ?? az.name)}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(az.coordinates)}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(formatDepthRangeMAndFt(az.depthM))}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? az.maxVesselOrNotes : az.maxVesselOrNotesEn ?? az.maxVesselOrNotes)}</td>
        </tr>`
      )
      .join('');

    const specRows = physicalSpecs
      .slice(0, 9)
      .map(
        (s) => `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:600;background:#f8fafc;">${escapeHtml(isEs ? s.label : s.labelEn)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(isEs ? s.value : s.valueEn)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? s.remarks : s.remarksEn)}</td>
        </tr>`
      )
      .join('');

    sectionsHtml.push(`
      <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">03. ${isEs ? 'Restricciones Portuarias, Calados, Fondeo y Clima' : 'Port Restrictions, Drafts, Anchorages & Weather'}</h2>
      ${
        !includeModules.portStatusWeather && weather
          ? `<div style="padding:10px 14px;background:#f0f9ff;border:1px solid #bae6fd;margin-bottom:12px;font-size:12px;">
              <strong>${isEs ? 'Estatus Actual:' : 'Current Port Status:'}</strong> ${escapeHtml(translatePortStatus(weather.portStatus, lang))} ·
              <strong>${isEs ? 'Viento:' : 'Wind:'}</strong> ${escapeHtml(weather.windDirection)} ${weather.windKnots} kt ·
              <strong>${isEs ? 'Oleaje:' : 'Wave:'}</strong> ${weather.waveHeightM} m ·
              <strong>${isEs ? 'Corriente:' : 'Current:'}</strong> ${weather.barCurrentKnots} kt
            </div>`
          : ''
      }
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px;margin-bottom:12px;">
        <thead><tr style="background:#f1f5f9;text-align:left;"><th style="padding:8px 10px;">${isEs ? 'Recinto' : 'Area'}</th><th style="padding:8px 10px;">${isEs ? 'Prof. Canal' : 'Depth'}</th><th style="padding:8px 10px;">${isEs ? 'Calado Op.' : 'Max Draft'}</th><th style="padding:8px 10px;">${isEs ? 'Remolque' : 'Towage'}</th></tr></thead>
        <tbody>${areaRows}</tbody>
      </table>
      ${
        anchorageRows
          ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11.5px;margin-bottom:12px;">
              <thead><tr style="background:#f1f5f9;text-align:left;"><th style="padding:7px 10px;">${isEs ? 'Fondeo' : 'Anchorage'}</th><th style="padding:7px 10px;">Coords</th><th style="padding:7px 10px;">${isEs ? 'Prof.' : 'Depth'}</th><th style="padding:7px 10px;">${isEs ? 'Notas' : 'Notes'}</th></tr></thead>
              <tbody>${anchorageRows}</tbody>
            </table>`
          : ''
      }
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11.5px;margin-bottom:12px;">
        <tbody>${specRows}</tbody>
      </table>
      <ul style="margin:0 0 18px 0;padding-left:18px;font-size:12px;line-height:1.5;">
        ${portRestrictions.slice(0, 8).map((r) => `<li><strong>${escapeHtml(isEs ? r.title : r.titleEn)} (${escapeHtml(r.limitValue)}):</strong> ${escapeHtml(isEs ? r.detail : r.detailEn)}</li>`).join('')}
      </ul>
    `);
  }

  const terminalsForExport = includeModules.includeAllTerminals
    ? portTerminals
    : selectedTerminal
    ? [selectedTerminal]
    : [];

  if (includeModules.terminalSheet && terminalsForExport.length > 0) {
    terminalsForExport.forEach((term) => {
      const berthsToShow =
        !includeModules.includeAllTerminals && selectedBerth ? [selectedBerth] : term.berths;
      sectionsHtml.push(`
        <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">04. ${isEs ? 'Ficha Técnica de Terminal y Muelles' : 'Terminal & Pier Operational Sheet'} — ${escapeHtml(isEs ? term.name : term.nameEn ?? term.name)}</h2>
        <div style="font-size:12px;background:#f8fafc;border:1px solid #cbd5e1;padding:10px 14px;margin-bottom:12px;">
          <div><strong>${isEs ? 'Operador:' : 'Operator:'}</strong> ${escapeHtml(term.operator)} · <strong>Coords:</strong> ${escapeHtml(term.coordinates)}</div>
          <div style="margin-top:4px;">${escapeHtml(isEs ? term.shortDesc : term.shortDescEn)}</div>
          <div style="margin-top:4px;color:#991b1b;"><strong>${isEs ? 'Restricciones Terminal:' : 'Terminal Restrictions:'}</strong> ${escapeHtml(isEs ? term.restrictionsSummary : term.restrictionsSummaryEn ?? term.restrictionsSummary)}</div>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11.5px;margin-bottom:20px;">
          <thead><tr style="background:#0b2747;color:#fff;text-align:left;"><th style="padding:7px 10px;">${isEs ? 'Muelle' : 'Berth'}</th><th style="padding:7px 10px;">LOA / Beam</th><th style="padding:7px 10px;">${isEs ? 'Calado Máx.' : 'Max Draft'}</th><th style="padding:7px 10px;">${isEs ? 'Caudal / Conexiones' : 'Rates / Connections'}</th><th style="padding:7px 10px;">${isEs ? 'Productos' : 'Products'}</th></tr></thead>
          <tbody>
            ${berthsToShow
              .map(
                (b) => `<tr>
                  <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-weight:700;">${escapeHtml(isEs ? b.name : b.nameEn ?? b.name)}</td>
                  <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${b.maxLoaM} m × ${b.maxBeamM} m</td>
                  <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-weight:700;">${escapeHtml(formatDraftMAndFt(b.maxDraftM))}</td>
                  <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? b.loadingRate : b.loadingRateEn ?? b.loadingRate)}<br/><span style="color:#64748b;">${escapeHtml((isEs ? b.connections : b.connectionsEn ?? b.connections).join(', '))}</span></td>
                  <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml((isEs ? b.products : b.productsEn ?? b.products).join(', '))}</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `);
    });
  }

  if (includeModules.productDossier && selectedProduct) {
    sectionsHtml.push(`
      <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">05. ${isEs ? 'Ficha Técnica del Producto' : 'Commodity Technical Dossier'} — ${escapeHtml(isEs ? selectedProduct.name : selectedProduct.nameEn)} (${escapeHtml(selectedProduct.code)})</h2>
      <div style="background:#f0f7ff;border:1px solid #bae6fd;padding:10px 14px;font-size:12px;margin-bottom:10px;">
        <strong>UN ${escapeHtml(selectedProduct.unNumber)} · IMO ${escapeHtml(selectedProduct.imoClass)}</strong>${selectedProduct.casNumber ? ` · CAS ${escapeHtml(selectedProduct.casNumber)}` : ''}${selectedProduct.nfpa704 ? ` · NFPA 704: ${escapeHtml(selectedProduct.nfpa704)}` : ''}<br/>
        <strong>${isEs ? 'Muelles habilitados:' : 'Authorized Berths:'}</strong> ${escapeHtml(selectedProduct.coatzacoalcosBerths)}<br/>
        <strong>${isEs ? 'Terminales:' : 'Terminals:'}</strong> ${escapeHtml(selectedProduct.concessionaires)}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11.5px;margin-bottom:22px;">
        <tr><td width="30%" style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">${isEs ? 'Resumen Operativo' : 'Summary'}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${escapeHtml(isEs ? selectedProduct.summary : selectedProduct.summaryEn)}</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">${isEs ? 'Conexiones y Bridas' : 'Connections & Flanges'}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${escapeHtml(isEs ? selectedProduct.connectionSpecs : selectedProduct.connectionSpecsEn)}</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">${isEs ? 'Caudales y Transferencia' : 'Transfer Rates'}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${escapeHtml(isEs ? selectedProduct.transferRates : selectedProduct.transferRatesEn)}</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;">${isEs ? 'Temperatura y Estabilidad' : 'Temperature & Stability'}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${escapeHtml(isEs ? selectedProduct.temperatureLimits : selectedProduct.temperatureLimitsEn)} · ${escapeHtml(isEs ? selectedProduct.stabilityControl : selectedProduct.stabilityControlEn)}</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #fecaca;background:#fef2f2;font-weight:700;color:#991b1b;">${isEs ? 'Criterios de Rechazo / Paro' : 'Rejection Criteria'}</td><td style="padding:6px 10px;border:1px solid #fecaca;background:#fef2f2;color:#7f1d1d;">${escapeHtml(isEs ? selectedProduct.rejectionCriteria : selectedProduct.rejectionCriteriaEn)}</td></tr>
      </table>
    `);
  }

  if (includeModules.portServices) {
    sectionsHtml.push(`
      <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">06. ${isEs ? 'Servicios Portuarios Disponibles' : 'Available Port Marine Services'}</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11.5px;margin-bottom:20px;">
        <thead><tr style="background:#f1f5f9;text-align:left;"><th style="padding:7px 10px;">${isEs ? 'Servicio' : 'Service'}</th><th style="padding:7px 10px;">${isEs ? 'Estatus' : 'Status'}</th><th style="padding:7px 10px;">${isEs ? 'Proveedor / Detalle' : 'Provider / Detail'}</th></tr></thead>
        <tbody>
          ${marineServices
            .map(
              (sv) => `<tr>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:600;">${escapeHtml(isEs ? sv.name : sv.nameEn)}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;color:${sv.available ? '#15803d' : '#b45309'};font-weight:700;">${sv.available ? (isEs ? 'Disponible' : 'Available') : (isEs ? 'Bajo Solicitud / Restringido' : 'On Request / Restricted')}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? sv.detail : sv.detailEn ?? sv.detail)}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `);
  }

  if (includeModules.lineup && portLineup.length > 0) {
    sectionsHtml.push(`
      <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">07. ${isEs ? 'Line-Up de Buques en Puerto' : 'Current Port Vessel Line-Up'}</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11.5px;margin-bottom:20px;">
        <thead><tr style="background:#f1f5f9;text-align:left;"><th style="padding:7px 10px;">${isEs ? 'Buque' : 'Vessel'}</th><th style="padding:7px 10px;">${isEs ? 'Terminal / Muelle' : 'Terminal / Berth'}</th><th style="padding:7px 10px;">${isEs ? 'Carga' : 'Cargo'}</th><th style="padding:7px 10px;">ETA / ETD</th><th style="padding:7px 10px;">${isEs ? 'Estatus' : 'Status'}</th></tr></thead>
        <tbody>
          ${portLineup
            .map(
              (v) => `<tr>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:700;">${escapeHtml(v.vesselName)}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(v.terminalOrBerth)}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(v.cargo)}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(v.etaOrEtd)}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:700;">${escapeHtml(v.status)}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `);
  }

  if (includeModules.authorities && authorities.length > 0) {
    sectionsHtml.push(`
      <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">08. ${isEs ? 'Requerimientos de Autoridades Marítimas (Aduana, ASIPONA, Capitanía, INM, Sanidad, SENASICA)' : 'Maritime Authorities Requirements (Customs, ASIPONA, Harbor Master, INM, Health, SENASICA)'}</h2>
      ${authorities
        .map((auth) => {
          const groups = auth.documentGroups ?? [];
          const bodyHtml =
            groups.length > 0
              ? groups
                  .map(
                    (g) => `
                  <div style="margin-top:10px;border:1px solid #cbd5e1;border-radius:4px;overflow:hidden;">
                    <div style="background:#f1f5f9;padding:6px 10px;font-size:11.5px;font-weight:700;color:#0b2747;border-bottom:1px solid #cbd5e1;">
                      ${escapeHtml(isEs ? g.title : g.titleEn || g.title)} (${g.rows.length})
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11px;">
                      <thead>
                        <tr style="background:#f8fafc;color:#475569;text-align:left;">
                          <th style="padding:5px 8px;border-bottom:1px solid #e2e8f0;width:72px;">${isEs ? 'Cód.' : 'Code'}</th>
                          <th style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">${isEs ? 'Documento / Requisito' : 'Document / Requirement'}</th>
                          <th style="padding:5px 8px;border-bottom:1px solid #e2e8f0;width:140px;">${isEs ? 'Plazo / Formato' : 'Timing / Format'}</th>
                          <th style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">${isEs ? 'Observaciones' : 'Remarks'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${g.rows
                          .map(
                            (r, idx) => `<tr style="background:${idx % 2 === 1 ? '#fafafa' : '#ffffff'};">
                              <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-weight:700;color:#0066cc;">${escapeHtml(r.code || String(idx + 1).padStart(2, '0'))}</td>
                              <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#0f172a;">${escapeHtml(isEs ? r.name : r.nameEn ?? r.name)}</td>
                              <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;color:#334155;">${escapeHtml(isEs ? r.timingOrFormat || '—' : r.timingOrFormatEn ?? r.timingOrFormat ?? '—')}</td>
                              <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;color:#64748b;">${escapeHtml(isEs ? r.notes || '—' : r.notesEn ?? r.notes ?? '—')}</td>
                            </tr>`
                          )
                          .join('')}
                      </tbody>
                    </table>
                  </div>`
                  )
                  .join('')
              : `<ul style="margin:6px 0 0 0;padding-left:18px;font-size:11.5px;color:#1e293b;">
                  ${(isEs ? auth.requiredDocuments : auth.requiredDocumentsEn ?? auth.requiredDocuments).map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
                </ul>`;

          return `<div style="border:1px solid #cbd5e1;background:#ffffff;padding:12px 14px;margin-bottom:12px;font-size:12px;">
            <div style="font-weight:700;color:#0b2747;">[${escapeHtml(auth.agency)}] ${escapeHtml(isEs ? auth.title : auth.titleEn)}</div>
            <div style="margin-top:4px;color:#334155;">${escapeHtml(isEs ? auth.summary : auth.summaryEn)}</div>
            ${
              auth.newCircularNotice
                ? `<div style="margin-top:6px;padding:6px 10px;background:#fff7ed;border-left:3px solid #ea580c;color:#9a3412;"><strong>${isEs ? 'Aviso / Nuevo Requerimiento:' : 'New Notice:'}</strong> ${escapeHtml(isEs ? auth.newCircularNotice : auth.newCircularNoticeEn ?? auth.newCircularNotice)}</div>`
                : ''
            }
            ${bodyHtml}
          </div>`;
        })
        .join('')}
      <div style="margin-bottom:18px;"></div>
    `);
  }

  if (includeModules.spareParts && sparePartsGuide) {
    sectionsHtml.push(`
      <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">09. ${escapeHtml(sparePartsGuide.title)} (${isEs ? 'Aduana / Customs' : 'Customs'})</h2>
      <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:10px 14px;font-size:11.5px;color:#1e293b;margin-bottom:10px;">
        <strong>${escapeHtml(isEs ? sparePartsGuide.importationNoticeTitle : sparePartsGuide.importationNoticeTitleEn)}:</strong> ${escapeHtml(isEs ? sparePartsGuide.importationNotice : sparePartsGuide.importationNoticeEn)}
      </div>
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;padding:10px 14px;font-size:11.5px;margin-bottom:10px;">
        <strong>Consignee:</strong> ${escapeHtml(sparePartsGuide.consigneeFormulation)}<br/>
        <strong>Itemized Listing:</strong> ${escapeHtml(sparePartsGuide.itemizedListingNote)}<br/>
        <strong>Routing &amp; Lead Time:</strong> ${escapeHtml(sparePartsGuide.smallPackageRouting)} | ${escapeHtml(sparePartsGuide.largePackageRouting)} (${escapeHtml(sparePartsGuide.customsHoursNote)})
      </div>
      <div style="background:#fef2f2;border:1px solid #fca5a5;padding:10px 14px;font-size:11.5px;color:#991b1b;margin-bottom:16px;">
        <strong>RESTRICTED ITEMS (DO NOT INCLUDE):</strong> ${escapeHtml([...sparePartsGuide.restrictedItemsCol1, ...sparePartsGuide.restrictedItemsCol2].join(' · '))}
      </div>
    `);
  }

  if (includeModules.crewChange) {
    sectionsHtml.push(`
      <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">10. ${escapeHtml(crewGuide.title)} (INM)</h2>
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:10px 14px;font-size:11.5px;color:#7f1d1d;margin-bottom:10px;">
        <strong>IMPORTANT:</strong> ${escapeHtml(crewGuide.entryAdvisory)}
      </div>
      <div style="background:#f0f9ff;border:1px solid #bae6fd;padding:10px 14px;font-size:11.5px;margin-bottom:10px;">
        <strong>U.S. C1/D1 &amp; Qualifying Alternatives:</strong>
        <ul style="margin:4px 0 0 0;padding-left:18px;">
          ${crewGuide.qualifyingAlternatives.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}
          ${crewGuide.usC1d1Focus.map((u) => `<li>${escapeHtml(u)}</li>`).join('')}
        </ul>
      </div>
      <div style="background:#fff7ed;border:1px solid #fed7aa;padding:10px 14px;font-size:11.5px;color:#7c2d12;margin-bottom:10px;">
        <strong>Risk Advisory &amp; Lead Time:</strong> ${escapeHtml(crewGuide.minimumLeadTimeNotice)}
        <ul style="margin:4px 0 0 0;padding-left:18px;">
          ${crewGuide.riskAdvisoryBullets.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>
      <div style="font-size:11px;color:#475569;margin-bottom:16px;">
        <strong>INM Visa-Required Summary:</strong> A-C (${crewGuide.appendixAC.length}), D-M (${crewGuide.appendixDM.length}), N-Z (${crewGuide.appendixNZ.length}) ·
        ${crewGuide.officialPortals.map((p) => `<a style="color:#0284c7;" href="${escapeHtml(p.url)}">${escapeHtml(p.label)}</a>`).join(' | ')}
      </div>
    `);
  }

  if (includeModules.operationalProcedures && portProcedures.length > 0) {
    sectionsHtml.push(`
      <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">11. ${isEs ? 'Procedimientos Operativos del Puerto' : 'Port Operational Procedures'}</h2>
      ${portProcedures
        .map(
          (pr) => `<div style="border:1px solid #cbd5e1;padding:10px 14px;margin-bottom:10px;font-size:11.5px;">
            <div style="font-weight:700;color:#0b2747;">[${escapeHtml(pr.phase)}] ${escapeHtml(isEs ? pr.title : pr.titleEn)}</div>
            <div style="margin-top:3px;color:#334155;">${escapeHtml(isEs ? pr.summary : pr.summaryEn ?? pr.summary)}</div>
          </div>`
        )
        .join('')}
    `);
  }

  if (includeModules.directory && portDirectory.length > 0) {
    sectionsHtml.push(`
      <h2 style="margin:0 0 10px 0;font-size:15px;color:#0b2747;border-bottom:2px solid #0066cc;padding-bottom:6px;">12. ${isEs ? 'Directorio Operativo y Contactos ISS' : 'Operational Directory & ISS Contacts'}</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:11.5px;margin-bottom:16px;">
        <thead><tr style="background:#f1f5f9;text-align:left;"><th style="padding:7px 10px;">${isEs ? 'Organización / Rol' : 'Organization / Role'}</th><th style="padding:7px 10px;">${isEs ? 'Contacto' : 'Contact'}</th><th style="padding:7px 10px;">Email / Tel</th></tr></thead>
        <tbody>
          ${portDirectory
            .map(
              (d) => `<tr>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-weight:700;">${escapeHtml(d.organization)} — ${escapeHtml(isEs ? d.role : d.roleEn ?? d.role)}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(d.contactName)}</td>
                <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(d.email)} · ${escapeHtml(d.phone)}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `);
  }

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<title>Información Pre-Arribo — ${escapeHtml(vesselName)} — ${escapeHtml(port.name)}</title>
</head>
<body style="margin:0;padding:16px;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <table width="800" cellpadding="0" cellspacing="0" align="center" style="width:100%;max-width:800px;background-color:#ffffff;border:1px solid #cbd5e1;border-collapse:collapse;">
    <tr>
      <td style="background:linear-gradient(125deg,#071529 0%,#0b2747 72%,#1e4d6b 100%);background-color:#0b1220;color:#ffffff;padding:22px 26px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:top;padding-right:16px;">
              <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#93c5fd;">ISS MARINE SERVICES MEXICO · ${isEs ? 'INFORMACIÓN PRE-ARRIBO' : 'PRE-ARRIVAL INFORMATION'}</div>
              <h1 style="margin:6px 0 4px 0;font-size:21px;font-weight:700;color:#ffffff;">${escapeHtml(vesselName || 'M/V TBN')} · ${escapeHtml(port.name)} (${escapeHtml(port.unLocode)})</h1>
              <div style="font-size:12px;color:#cbd5e1;">
                ${voyageOrEta ? `ETA / Ref: ${escapeHtml(voyageOrEta)} · ` : ''}VHF: ${escapeHtml(port.vhfChannel)} · ${escapeHtml(port.authority)}
              </div>
            </td>
            <td style="vertical-align:top;text-align:right;width:185px;">
              ${INCHCAPE_HEADER_SVG}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 26px;">
        <div style="background:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid #0066cc;padding:14px 16px;margin-bottom:20px;">
          ${introParagraphs}
        </div>
        ${sectionsHtml.join('\n')}
      </td>
    </tr>
    <tr>
      <td style="background:#0b192c;color:#cbd5e1;padding:14px 26px;font-size:11px;text-align:center;">
        ISS Marine Services Mexico S.A. de C.V. · ${isEs ? 'Información Pre-Arribo' : 'Pre-Arrival Information'} · ${new Date().toISOString().slice(0, 10)}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function drawPdfPageTopHeader(
  doc: jsPDF,
  eyebrow: string,
  title: string,
  subtitle: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  doc.setFillColor(4, 36, 71);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setFillColor(245, 180, 0);
  doc.rect(0, 25, pageWidth, 1.0, 'F');

  doc.setTextColor(147, 197, 253);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(eyebrow, margin, 7.8);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12.5);
  const titleTrunc = doc.splitTextToSize(title, pageWidth - margin * 2 - 52)[0] ?? title;
  doc.text(titleTrunc, margin, 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(226, 232, 240);
  const subTrunc = doc.splitTextToSize(subtitle, pageWidth - margin * 2 - 52)[0] ?? subtitle;
  doc.text(subTrunc, margin, 20.8);

  drawInchcapeHeaderBrand(doc, pageWidth - margin, 3.8, 0.85);
}

function writeCrewChangeSectionsToPdf(
  doc: jsPDF,
  guide: CrewChangeGuideConfig,
  headerEyebrow: string,
  headerTitle: string,
  headerSubtitle: string,
  startOnNewPage: boolean
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  if (startOnNewPage) doc.addPage();
  drawPdfPageTopHeader(doc, headerEyebrow, headerTitle, headerSubtitle);
  let y = 31;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 14) {
      doc.addPage();
      drawPdfPageTopHeader(doc, headerEyebrow, headerTitle, headerSubtitle);
      y = 31;
    }
  };

  const drawBox = (
    heading: string,
    lines: string[],
    bg: [number, number, number],
    border: [number, number, number],
    titleColor: [number, number, number]
  ) => {
    const wrappedLines = lines.flatMap(
      (l) => doc.splitTextToSize(`• ${l}`, contentWidth - 8) as string[]
    );
    const boxH = wrappedLines.length * 3.8 + 10;
    ensureSpace(boxH + 3);
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.roundedRect(margin, y, contentWidth, boxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    doc.text(heading, margin + 4, y + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(30, 41, 59);
    doc.text(wrappedLines, margin + 4, y + 9.5);
    y += boxH + 3;
  };

  drawBox(
    'IMPORTANT NOTICE & ENTRY ADVISORY',
    [guide.entryAdvisory],
    [254, 242, 242],
    [254, 202, 202],
    [153, 27, 27]
  );

  drawBox(
    '1. VISA ASSESSMENT, QUALIFYING ALTERNATIVES & U.S. C1/D1 FOCUS',
    [
      ...guide.visaExemptNotes,
      ...guide.qualifyingAlternatives,
      ...guide.usC1d1Focus,
      `Air Arrival Mandatory Docs: ${guide.airArrivalMandatoryDocs.join(', ')}`,
    ],
    [240, 249, 255],
    [186, 230, 253],
    [3, 105, 161]
  );

  drawBox(
    '2. RISK ADVISORY — VISA-REQUIRED NATIONALITIES',
    guide.riskAdvisoryBullets,
    [255, 247, 237],
    [254, 215, 170],
    [194, 65, 12]
  );

  drawBox(
    '3. CREW CHANGE REQUIRED DOCUMENTATION (MIN. 3 WORKING DAYS)',
    [guide.minimumLeadTimeNotice, ...guide.requiredDocsList],
    [248, 250, 252],
    [203, 213, 225],
    [15, 23, 42]
  );

  drawBox(
    '4. ON-SIGNERS & OFF-SIGNERS PROCEDURES',
    [
      ...guide.onSignerSteps.map((s) => `[ON-SIGNER] ${s}`),
      ...guide.offSignerSteps.map((s) => `[OFF-SIGNER] ${s}`),
    ],
    [248, 250, 252],
    [203, 213, 225],
    [15, 23, 42]
  );

  drawBox(
    '5 & 6. WORKING HOURS (MON-FRI 09:00-16:00) & CUSTOMS / BAGGAGE',
    [
      ...guide.workingHoursBullets,
      ...guide.customsBaggageBullets,
      guide.customsBaggageFootnote,
    ],
    [248, 250, 252],
    [203, 213, 225],
    [15, 23, 42]
  );

  // Quick Checklist Table
  ensureSpace(44);
  doc.setFillColor(11, 25, 44);
  doc.rect(margin, y, contentWidth, 6.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('7. QUICK CLIENT CHECKLIST', margin + 3, y + 4.3);
  doc.text('On-Signer', margin + contentWidth * 0.65, y + 4.3);
  doc.text('Off-Signer', margin + contentWidth * 0.84, y + 4.3);
  y += 6.2;

  guide.checklistRows.forEach((row, idx) => {
    ensureSpace(7);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 5.2, 'F');
    }
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 5.2, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(15, 23, 42);
    doc.text(row.itemEn, margin + 2.5, y + 3.6);
    doc.setFont('helvetica', 'bold');
    doc.text(row.onSigner, margin + contentWidth * 0.65, y + 3.6);
    doc.text(row.offSigner, margin + contentWidth * 0.84, y + 3.6);
    y += 5.2;
  });

  y += 4;
  drawBox(
    'APPENDIX A — COUNTRIES & REGIONS REQUIRING A MEXICAN VISA (INM)',
    [
      guide.appendixIntro,
      `A - C: ${guide.appendixAC.join(', ')}`,
      `D - M: ${guide.appendixDM.join(', ')}`,
      `N - Z: ${guide.appendixNZ.join(', ')}`,
    ],
    [248, 250, 252],
    [203, 213, 225],
    [3, 105, 161]
  );

  drawBox(
    '8. AGENCY CONTACT & OFFICIAL INM REFERENCES',
    [
      `ISS Marine Services Mexico S.A. de C.V. — ${guide.officeAddress}`,
      `Phone: ${guide.regionalPhone}`,
      `Key Personnel: ${guide.keyPersonnel.join(' | ')}`,
      `Emails: ${guide.emailDirectory.join(' | ')}`,
      ...guide.officialPortals.map((p) => `${p.label}: ${p.url}`),
    ],
    [240, 253, 244],
    [187, 247, 208],
    [21, 128, 61]
  );
}

export function exportCrewChangeToPdf(params: {
  filename: string;
  guide: CrewChangeGuideConfig;
  port?: PortProfile;
  lang?: Language;
}): string {
  const { filename, guide, port } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const portLabel = port ? `${port.name} (${port.unLocode})` : 'ALL MEXICAN PORTS';
  writeCrewChangeSectionsToPdf(
    doc,
    guide,
    'ISS MARINE SERVICES MEXICO · CREW CHANGE PROCEDURE',
    guide.title,
    `${guide.subtitle} · ${portLabel}`,
    false
  );
  const saved = sanitizePdfFilename(filename, 'ISS-Crew-Change-Procedure');
  doc.save(saved);
  return saved;
}

export function exportSparePartsToPdf(params: {
  filename: string;
  guide: SparePartsProcedureConfig;
  port?: PortProfile;
  lang?: Language;
}): string {
  const { filename, guide, port, lang = 'es' } = params;
  const isEs = lang === 'es';
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const portLabel = port ? `${port.name} (${port.unLocode})` : 'ALL MEXICAN PORTS';

  drawPdfPageTopHeader(
    doc,
    'ISS MARINE SERVICES MEXICO · ADUANA / CUSTOMS PROCEDURE',
    guide.title,
    `${guide.subtitle} · ${portLabel}`
  );
  let y = 31;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 14) {
      doc.addPage();
      drawPdfPageTopHeader(
        doc,
        'ISS MARINE SERVICES MEXICO · ADUANA / CUSTOMS PROCEDURE',
        guide.title,
        `${guide.subtitle} · ${portLabel}`
      );
      y = 31;
    }
  };

  const drawBox = (
    heading: string,
    lines: string[],
    bg: [number, number, number],
    border: [number, number, number],
    titleColor: [number, number, number]
  ) => {
    const wrappedLines = lines.flatMap(
      (l) => doc.splitTextToSize(`• ${l}`, contentWidth - 8) as string[]
    );
    const boxH = wrappedLines.length * 3.8 + 10;
    ensureSpace(boxH + 3);
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.roundedRect(margin, y, contentWidth, boxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    doc.text(heading, margin + 4, y + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(30, 41, 59);
    doc.text(wrappedLines, margin + 4, y + 9.5);
    y += boxH + 3;
  };

  drawBox(
    (isEs ? guide.importationNoticeTitle : guide.importationNoticeTitleEn).toUpperCase(),
    [isEs ? guide.importationNotice : guide.importationNoticeEn],
    [240, 249, 255],
    [186, 230, 253],
    [30, 64, 175]
  );

  drawBox(
    '1. INVOICE & DOCUMENTATION REQUIREMENTS',
    [
      `Consignee Formulation: ${guide.consigneeFormulation}`,
      `Itemized Listing: ${guide.itemizedListingNote}`,
      `Detailed Explanation Required: ${guide.detailedExplanationNote}`,
    ],
    [248, 250, 252],
    [203, 213, 225],
    [15, 23, 42]
  );

  drawBox(
    '2. SHIPPING LOGISTICS & ESTIMATED TIMELINES',
    [
      guide.smallPackageRouting,
      guide.largePackageRouting,
      ...guide.timelines.map((t) => `${isEs ? t.label : t.labelEn}: ${t.duration}`),
      guide.customsHoursNote,
    ],
    [248, 250, 252],
    [203, 213, 225],
    [2, 132, 199]
  );

  drawBox(
    '3. RESTRICTED & PROHIBITED ITEMS (DO NOT INCLUDE)',
    [...guide.restrictedItemsCol1, ...guide.restrictedItemsCol2],
    [254, 242, 242],
    [254, 202, 202],
    [153, 27, 27]
  );

  drawBox(
    '4. CONSIGNEE DETAILS & PRE-APPROVAL',
    [
      guide.preApprovalNote,
      `${guide.officeCompany} — ${guide.officeAddress}`,
      `${guide.officePhones} | ${guide.officeWebsite}`,
      guide.invoiceAddressFootnote,
    ],
    [240, 253, 244],
    [187, 247, 208],
    [21, 128, 61]
  );

  const saved = sanitizePdfFilename(filename, 'ISS-Spare-Parts-Procedure');
  doc.save(saved);
  return saved;
}

export function exportPreArrivalPackageToPdf(
  params: PreArrivalPackageParams & { filename: string }
): string {
  const {
    filename,
    port,
    areas,
    terminals,
    restrictions,
    weather,
    statusHistory = [],
    selectedTerminal,
    selectedBerth,
    selectedProduct,
    authorities,
    crewGuide,
    sparePartsGuide,
    lineup = [],
    procedures = [],
    directory = [],
    vesselName,
    voyageOrEta,
    welcomeMessage,
    includeModules,
    lang,
  } = params;
  const isEs = lang === 'es';
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const headerSubtitle = `${port.name} (${port.unLocode}) · ${voyageOrEta ? `ETA/Ref: ${voyageOrEta} · ` : ''}VHF ${port.vhfChannel}`;
  const headerTitle = `${vesselName || 'M/V TBN'} — ${isEs ? 'Información Pre-Arribo' : 'Pre-Arrival Information'}`;

  drawPdfPageTopHeader(
    doc,
    'ISS MARINE SERVICES MEXICO · INFORMACION PRE-ARRIBO',
    headerTitle,
    headerSubtitle
  );
  let y = 31;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 14) {
      doc.addPage();
      drawPdfPageTopHeader(
        doc,
        'ISS MARINE SERVICES MEXICO · INFORMACION PRE-ARRIBO',
        headerTitle,
        headerSubtitle
      );
      y = 31;
    }
  };

  const drawBlock = (
    heading: string,
    lines: string[],
    bg: [number, number, number] = [248, 250, 252],
    border: [number, number, number] = [203, 213, 225],
    titleRgb: [number, number, number] = [4, 36, 71]
  ) => {
    const wrapped = lines.flatMap(
      (l) => doc.splitTextToSize(`• ${l}`, contentWidth - 8) as string[]
    );
    const boxH = wrapped.length * 3.8 + 10;
    ensureSpace(boxH + 3);
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.roundedRect(margin, y, contentWidth, boxH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(titleRgb[0], titleRgb[1], titleRgb[2]);
    doc.text(heading, margin + 4, y + 5.2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(30, 41, 59);
    doc.text(wrapped, margin + 4, y + 9.4);
    y += boxH + 3;
  };

  // Opening Welcome Letter (Required 72h Pre-Arrival Notice)
  const introText = (welcomeMessage && welcomeMessage.trim()) || buildDefaultPreArrivalIntro(port, lang);
  const introParagraphs = introText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const introLines = introParagraphs.flatMap(
    (p) => doc.splitTextToSize(p, contentWidth - 8) as string[]
  );
  const introH = introLines.length * 4.0 + 7;
  ensureSpace(introH + 3);
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(margin, y, contentWidth, introH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text(introLines, margin + 4, y + 5.5);
  y += introH + 4;

  if (includeModules.portStatusWeather) {
    const portStatusLog = statusHistory.filter((s) => s.portId === port.id).slice(0, 10);
    drawBlock(
      `01. ${isEs ? 'ESTATUS PORTUARIO, CLIMA E HISTÓRICO' : 'PORT STATUS, WEATHER & CLOSURE HISTORY'}`,
      [
        weather
          ? `${isEs ? 'Estatus Actual:' : 'Current Status:'} ${translatePortStatus(weather.portStatus, lang)} · ${weather.windDirection} ${weather.windKnots} kt · Oleaje ${weather.waveHeightM} m · Corriente ${weather.barCurrentKnots} kt`
          : `${port.name} (${port.coordinates})`,
        ...(weather ? [isEs ? weather.advisory : weather.advisoryEn] : []),
        ...portStatusLog.map(
          (ev) => `[${ev.timestamp}] ${translatePortStatus(ev.status, lang)} — ${isEs ? ev.navigationScope : ev.navigationScopeEn ?? ev.navigationScope}`
        ),
      ],
      [240, 249, 255],
      [186, 230, 253],
      [4, 36, 71]
    );
  }

  if (includeModules.generalParticulars && port.generalInfo) {
    const gi = port.generalInfo;
    drawBlock(
      `02. ${isEs ? 'POSICIÓN GEOGRÁFICA Y DATOS GENERALES' : 'GEOGRAPHICAL POSITION & GENERAL PARTICULARS'}`,
      [
        `${port.coordinates} · ${isEs ? gi.geographicalNote : gi.geographicalNoteEn ?? gi.geographicalNote} · UN/LOCODE ${port.unLocode} · ${gi.ispsLevel}`,
        `${gi.utcOffset} · ${isEs ? gi.workingHours : gi.workingHoursEn ?? gi.workingHours}`,
        ...(gi.approachNote
          ? [isEs ? gi.approachNote : gi.approachNoteEn ?? gi.approachNote]
          : []),
        `${isEs ? 'Feriados:' : 'Holidays:'} ${isEs ? gi.holidays : gi.holidaysEn ?? gi.holidays}`,
      ]
    );
  }

  if (includeModules.portRestrictions) {
    const portAreas = areas.filter((a) => a.portId === port.id);
    const portRestrictions = restrictions.filter((r) => r.portId === port.id);
    drawBlock(
      `03. ${isEs ? 'CALADOS, CANALES, ZONAS DE FONDEO Y RESTRICCIONES' : 'DRAFTS, CHANNELS, ANCHORAGES & RESTRICTIONS'}`,
      [
        ...portAreas.map(
          (a) =>
            `${isEs ? a.name : a.nameEn}: ${isEs ? 'Canal' : 'Depth'} ${formatDraftMAndFt(a.channelDepthM, 1)} | ${isEs ? 'Calado Op.' : 'Op. Draft'} ${formatDraftMAndFt(a.operationalDraftM)} | ${isEs ? a.tugRequirement : a.tugRequirementEn ?? a.tugRequirement}`
        ),
        ...(port.anchorageZones ?? []).map(
          (az) =>
            `${isEs ? az.name : az.nameEn ?? az.name} (${az.coordinates}) — ${formatDepthRangeMAndFt(az.depthM)} · ${isEs ? az.maxVesselOrNotes : az.maxVesselOrNotesEn ?? az.maxVesselOrNotes}`
        ),
        ...portRestrictions.map(
          (r) => `${isEs ? r.title : r.titleEn} [${r.limitValue}]: ${isEs ? r.detail : r.detailEn}`
        ),
      ]
    );
  }

  const portTerminals = terminals.filter((t) => t.portId === port.id);
  const terminalsForExport = includeModules.includeAllTerminals
    ? portTerminals
    : selectedTerminal
    ? [selectedTerminal]
    : [];

  if (includeModules.terminalSheet && terminalsForExport.length > 0) {
    terminalsForExport.forEach((term) => {
      const berthsToShow =
        !includeModules.includeAllTerminals && selectedBerth ? [selectedBerth] : term.berths;
      drawBlock(
        `04. ${isEs ? 'TERMINAL Y MUELLES' : 'TERMINAL & BERTH SPECS'} — ${isEs ? term.name : term.nameEn ?? term.name}`,
        [
          `${isEs ? 'Operador:' : 'Operator:'} ${term.operator} · Coords: ${term.coordinates}`,
          `${isEs ? 'Restricciones:' : 'Restrictions:'} ${isEs ? term.restrictionsSummary : term.restrictionsSummaryEn ?? term.restrictionsSummary}`,
          ...berthsToShow.map(
            (b) =>
              `${isEs ? b.name : b.nameEn ?? b.name}: LOA ${b.maxLoaM} m · Manga ${b.maxBeamM} m · Calado ${formatDraftMAndFt(b.maxDraftM)} · Rate: ${isEs ? b.loadingRate : b.loadingRateEn ?? b.loadingRate} · Conexiones: ${(isEs ? b.connections : b.connectionsEn ?? b.connections).join(', ')}`
          ),
        ]
      );
    });
  }

  if (includeModules.productDossier && selectedProduct) {
    drawBlock(
      `05. ${isEs ? 'FICHA TÉCNICA DE PRODUCTO' : 'PRODUCT TECHNICAL DOSSIER'} — ${isEs ? selectedProduct.name : selectedProduct.nameEn} (${selectedProduct.code})`,
      [
        `UN ${selectedProduct.unNumber} · IMO ${selectedProduct.imoClass}${selectedProduct.casNumber ? ` · CAS ${selectedProduct.casNumber}` : ''}${selectedProduct.nfpa704 ? ` · NFPA 704: ${selectedProduct.nfpa704}` : ''}`,
        `${isEs ? 'Muelles:' : 'Berths:'} ${selectedProduct.coatzacoalcosBerths} | ${isEs ? 'Terminales:' : 'Terminals:'} ${selectedProduct.concessionaires}`,
        `${isEs ? 'Conexiones:' : 'Connections:'} ${isEs ? selectedProduct.connectionSpecs : selectedProduct.connectionSpecsEn}`,
        `${isEs ? 'Caudales:' : 'Transfer Rates:'} ${isEs ? selectedProduct.transferRates : selectedProduct.transferRatesEn}`,
        `${isEs ? 'Temperatura y Estabilidad:' : 'Temp & Stability:'} ${isEs ? selectedProduct.temperatureLimits : selectedProduct.temperatureLimitsEn} | ${isEs ? selectedProduct.stabilityControl : selectedProduct.stabilityControlEn}`,
        `${isEs ? 'Criterios de Rechazo:' : 'Rejection Criteria:'} ${isEs ? selectedProduct.rejectionCriteria : selectedProduct.rejectionCriteriaEn}`,
      ],
      [255, 251, 235],
      [253, 230, 138],
      [69, 26, 3]
    );
  }

  if (includeModules.portServices) {
    const services = getDefaultMarineServices(port);
    drawBlock(
      `06. ${isEs ? 'SERVICIOS PORTUARIOS DISPONIBLES' : 'AVAILABLE PORT SERVICES'}`,
      services.map(
        (sv) =>
          `${isEs ? sv.name : sv.nameEn} [${sv.available ? (isEs ? 'Disponible' : 'Available') : (isEs ? 'Restringido' : 'Restricted')}]: ${isEs ? sv.detail : sv.detailEn ?? sv.detail}`
      )
    );
  }

  if (includeModules.lineup) {
    const portLineup = lineup.filter((v) => v.portId === port.id);
    if (portLineup.length > 0) {
      drawBlock(
        `07. ${isEs ? 'LINE-UP ACTUAL DE BUQUES' : 'CURRENT VESSEL LINE-UP'}`,
        portLineup.map(
          (v) => `${v.vesselName} · ${v.terminalOrBerth} · ${v.cargo} · ${v.etaOrEtd} [${v.status}]`
        )
      );
    }
  }

  if (includeModules.authorities && authorities.length > 0) {
    authorities.forEach((a) => {
      const headerLine = `[${a.agency}] ${isEs ? a.title : a.titleEn}`;
      const noticeLine = a.newCircularNotice
        ? [`[${a.agency} AVISO] ${isEs ? a.newCircularNotice : a.newCircularNoticeEn ?? a.newCircularNotice}`]
        : [];
      const groups = a.documentGroups ?? [];
      if (groups.length > 0) {
        groups.forEach((g, gIdx) => {
          drawBlock(
            `08. ${headerLine} — ${isEs ? g.title : g.titleEn || g.title}`,
            [
              ...(gIdx === 0 ? [isEs ? a.summary : a.summaryEn, ...noticeLine] : []),
              ...g.rows.map((r, rIdx) => {
                const code = r.code || String(rIdx + 1).padStart(2, '0');
                const title = isEs ? r.name : r.nameEn ?? r.name;
                const timing = isEs ? r.timingOrFormat : r.timingOrFormatEn ?? r.timingOrFormat;
                const notes = isEs ? r.notes : r.notesEn ?? r.notes;
                return `[${code}] ${title}${timing ? ` (${timing})` : ''}${notes ? ` — ${notes}` : ''}`;
              }),
            ]
          );
        });
      } else {
        drawBlock(
          `08. ${headerLine}`,
          [
            isEs ? a.summary : a.summaryEn,
            ...noticeLine,
            ...(isEs ? a.requiredDocuments : a.requiredDocumentsEn ?? a.requiredDocuments),
          ]
        );
      }
    });
  }

  if (includeModules.spareParts && sparePartsGuide) {
    drawBlock(
      `09. ${sparePartsGuide.title} (ADUANA / CUSTOMS)`,
      [
        isEs ? sparePartsGuide.importationNotice : sparePartsGuide.importationNoticeEn,
        `Consignee: ${sparePartsGuide.consigneeFormulation}`,
        sparePartsGuide.itemizedListingNote,
        sparePartsGuide.detailedExplanationNote,
        `${sparePartsGuide.smallPackageRouting} | ${sparePartsGuide.largePackageRouting}`,
        ...sparePartsGuide.timelines.map((t) => `${isEs ? t.label : t.labelEn}: ${t.duration}`),
        `RESTRICTED ITEMS: ${[...sparePartsGuide.restrictedItemsCol1, ...sparePartsGuide.restrictedItemsCol2].join(', ')}`,
      ],
      [255, 247, 237],
      [254, 215, 170],
      [154, 52, 18]
    );
  }

  if (includeModules.operationalProcedures) {
    const portProcedures = procedures.filter((p) => p.portId === 'ALL' || p.portId === port.id);
    if (portProcedures.length > 0) {
      drawBlock(
        `11. ${isEs ? 'PROCEDIMIENTOS OPERATIVOS POR FASE' : 'OPERATIONAL PROCEDURES BY PHASE'}`,
        portProcedures.map(
          (pr) => `[${pr.phase}] ${isEs ? pr.title : pr.titleEn}: ${isEs ? pr.summary : pr.summaryEn ?? pr.summary}`
        )
      );
    }
  }

  if (includeModules.directory) {
    const portDir = directory.filter((d) => d.portId === 'ALL' || d.portId === port.id);
    if (portDir.length > 0) {
      drawBlock(
        `12. ${isEs ? 'DIRECTORIO OPERATIVO Y CONTACTOS ISS' : 'OPERATIONAL DIRECTORY & ISS CONTACTS'}`,
        portDir.map((d) => `${d.organization} (${isEs ? d.role : d.roleEn ?? d.role}) — ${d.contactName} | ${d.email} | ${d.phone}`)
      );
    }
  }

  if (includeModules.crewChange) {
    writeCrewChangeSectionsToPdf(
      doc,
      crewGuide,
      'ISS MARINE SERVICES MEXICO · INFORMACION PRE-ARRIBO · CREW CHANGE PROCEDURE',
      crewGuide.title,
      headerSubtitle,
      true
    );
  }

  const saved = sanitizePdfFilename(
    filename,
    `Informacion_PreArribo_${vesselName || 'Vessel'}_${port.shortCode}`
  );
  doc.save(saved);
  return saved;
}
