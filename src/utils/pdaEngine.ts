import {
  formatDepthRangeMAndFt,
  formatDraftMAndFt,
  getDefaultMarineServices,
  getDefaultPhysicalSpecs,
  translatePortStatus,
} from './i18n';
import type {
  Berth,
  CargoGroup,
  Language,
  PdaInput,
  PdaLineItem,
  PdaResult,
  PortArea,
  PortProfile,
  PortRestriction,
  TariffItem,
  Terminal,
  WeatherStatus,
} from '../types/port';

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePda(input: PdaInput, tariffs: TariffItem[]): PdaResult {
  const safeExchange = input.usdToMxn > 0 ? input.usdToMxn : 19.5;
  const applicableTariffs = tariffs.filter(
    (item) =>
      item.active &&
      item.portId === input.portId &&
      (item.areaId === 'ALL' || item.areaId === input.areaId)
  );

  const lineItems: PdaLineItem[] = applicableTariffs.map((tariff) => {
    let quantity = 1;
    switch (tariff.unit) {
      case 'per_gt':
        quantity = Math.max(0, input.gt);
        break;
      case 'per_loa_m':
        quantity = Math.max(0, input.loaM);
        break;
      case 'per_day':
        quantity = Math.max(0, input.daysAlongside);
        break;
      case 'per_ton':
        quantity = Math.max(0, input.cargoTons);
        break;
      case 'per_tug_hour':
        quantity = Math.max(0, input.tugHours);
        break;
      case 'flat':
      default:
        quantity = 1;
        break;
    }

    const amountOriginal = round2(quantity * tariff.rate);
    const amountUsd =
      tariff.currency === 'USD'
        ? amountOriginal
        : round2(amountOriginal / safeExchange);
    const amountMxn =
      tariff.currency === 'MXN'
        ? amountOriginal
        : round2(amountOriginal * safeExchange);

    return {
      tariffId: tariff.id,
      code: tariff.code,
      concept: tariff.concept,
      conceptEn: tariff.conceptEn,
      provider: tariff.provider,
      unit: tariff.unit,
      quantity,
      unitRate: tariff.rate,
      currency: tariff.currency,
      amountOriginal,
      amountUsd,
      amountMxn,
      verificationStatus: tariff.verificationStatus,
    };
  });

  const totalUsd = round2(lineItems.reduce((sum, item) => sum + item.amountUsd, 0));
  const totalMxn = round2(lineItems.reduce((sum, item) => sum + item.amountMxn, 0));
  const pendingItemsCount = lineItems.filter(
    (item) => item.verificationStatus === 'pending_validation'
  ).length;

  return {
    lineItems,
    totalUsd,
    totalMxn,
    pendingItemsCount,
  };
}

export interface BerthProductMatch {
  terminal: Terminal;
  areaName: string;
  berth: Berth;
}

export function findBerthsByProduct(
  terminals: Terminal[],
  areas: PortArea[],
  portId: string,
  cargoGroup: CargoGroup | 'ALL',
  searchQuery: string
): BerthProductMatch[] {
  const areaById = new Map(areas.map((a) => [a.id, a.name]));
  const q = searchQuery.trim().toLowerCase();
  const matches: BerthProductMatch[] = [];

  for (const terminal of terminals) {
    if (terminal.portId !== portId) continue;
    for (const berth of terminal.berths) {
      const groupMatch =
        cargoGroup === 'ALL' || berth.cargoGroups.includes(cargoGroup);
      if (!groupMatch) continue;

      if (q.length > 0) {
        const haystack = [
          terminal.name,
          terminal.nameEn ?? '',
          terminal.operator,
          berth.name,
          berth.nameEn ?? '',
          ...berth.products,
          ...(berth.productsEn ?? []),
          ...berth.cargoGroups,
          ...berth.equipment,
          ...(berth.equipmentEn ?? []),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) continue;
      }

      matches.push({
        terminal,
        areaName: areaById.get(terminal.areaId) ?? 'Zona Portuaria',
        berth,
      });
    }
  }

  return matches;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateSednaHtml(params: {
  port: PortProfile;
  areas: PortArea[];
  terminals: Terminal[];
  restrictions: PortRestriction[];
  weather?: WeatherStatus;
  lang?: Language;
}): string {
  const { port, areas, terminals, restrictions, weather, lang = 'es' } = params;
  const isEs = lang === 'es';
  const portAreas = areas.filter((a) => a.portId === port.id);
  const portTerminals = terminals.filter((t) => t.portId === port.id);
  const portRestrictions = restrictions.filter((r) => r.portId === port.id);
  const physicalSpecs = getDefaultPhysicalSpecs(port);
  const marineServices = getDefaultMarineServices(port);

  const areaRows = portAreas
    .map(
      (area) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#0f172a;">${escapeHtml(isEs ? area.name : area.nameEn)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(formatDraftMAndFt(area.channelDepthM, 1))}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(formatDraftMAndFt(area.operationalDraftM))}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? area.tugRequirement : area.tugRequirementEn ?? area.tugRequirement)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:${area.verificationStatus === 'verified' ? '#166534' : '#92400e'};">
          ${area.verificationStatus === 'verified' ? (isEs ? 'Verificado' : 'Verified') : isEs ? 'Pendiente validación' : 'Pending confirmation'}
        </td>
      </tr>`
    )
    .join('');

  const berthRows = portTerminals
    .flatMap((t) =>
      t.berths.map(
        (b) => `
        <tr>
          <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;">${escapeHtml(isEs ? t.name : t.nameEn ?? t.name)}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? b.name : b.nameEn ?? b.name)}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${b.maxLoaM} m</td>
          <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(formatDraftMAndFt(b.maxDraftM))}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml((isEs ? b.products : b.productsEn ?? b.products).join(', '))}</td>
        </tr>`
      )
    )
    .join('');

  const channelRows = port.channels
    .map(
      (ch) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#0f172a;">${escapeHtml(isEs ? ch.name : ch.nameEn ?? ch.name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${ch.lengthNm.toFixed(2)} NM · ${ch.widthM} m</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(formatDraftMAndFt(ch.channelDepthM))}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-weight:600;color:#0369a1;">${escapeHtml(formatDraftMAndFt(ch.operationalDraftM))}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? ch.squatAllowanceNote : ch.squatAllowanceNoteEn ?? ch.squatAllowanceNote)}</td>
      </tr>`
    )
    .join('');

  const anchorageRows = (port.anchorageZones ?? [])
    .map(
      (az) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#0f172a;">${escapeHtml(isEs ? az.name : az.nameEn ?? az.name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? az.purpose : az.purposeEn ?? az.purpose)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:11px;">${escapeHtml(az.coordinates)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${escapeHtml(formatDepthRangeMAndFt(az.depthM))}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? az.maxVesselOrNotes : az.maxVesselOrNotesEn ?? az.maxVesselOrNotes)}</td>
      </tr>`
    )
    .join('');

  const physicalSpecRows = physicalSpecs
    .map(
      (spec) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#0f172a;background-color:#f8fafc;">${escapeHtml(isEs ? spec.label : spec.labelEn)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-weight:600;color:${spec.highlight === 'danger' ? '#b91c1c' : spec.highlight === 'success' ? '#166534' : '#0f172a'};">${escapeHtml(isEs ? spec.value : spec.valueEn)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(isEs ? spec.remarks : spec.remarksEn)}</td>
      </tr>`
    )
    .join('');

  const servicesList = marineServices
    .filter((s) => s.available)
    .map(
      (s) =>
        `<li style="margin-bottom:4px;"><strong>${escapeHtml(isEs ? s.name : s.nameEn)}:</strong> ${escapeHtml(isEs ? s.detail : s.detailEn)}</li>`
    )
    .join('');

  const restrictionList = portRestrictions
    .map(
      (r) =>
        `<li style="margin-bottom:6px;"><strong>${escapeHtml(isEs ? r.title : r.titleEn)} (${escapeHtml(r.limitValue)}):</strong> ${escapeHtml(isEs ? r.detail : r.detailEn)} <em style="color:#64748b;">[${r.verificationStatus === 'verified' ? (isEs ? 'Verificado' : 'Verified') : isEs ? 'Pendiente validación' : 'Pending confirmation'}]</em></li>`
    )
    .join('');

  const rulesText = isEs
    ? port.operatingRulesSummary
    : port.operatingRulesSummaryEn ?? port.operatingRulesSummary;

  const operatingRulesBlock = rulesText
    ? `<div style="margin:20px 0 0 0;padding:12px 14px;background-color:#f8fafc;border:1px solid #cbd5e1;font-size:12px;line-height:1.55;color:#1e293b;">
        <strong>${isEs ? 'Reglas de Operación Vigentes:' : 'Official Operating Rules:'}</strong> ${escapeHtml(rulesText)}
        ${port.operatingRulesUrl ? `<div style="margin-top:4px;color:#0369a1;">${isEs ? 'Referencia oficial:' : 'Official reference:'} ${escapeHtml(port.operatingRulesUrl)}</div>` : ''}
      </div>`
    : '';

  const weatherLine = weather
    ? ` · ${isEs ? 'Estatus' : 'Port Status'}: ${escapeHtml(translatePortStatus(weather.portStatus, lang))} (${escapeHtml(weather.windDirection)} ${weather.windKnots} kt)`
    : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<title>Port Restrictions — ${escapeHtml(port.name)} (${escapeHtml(port.unLocode)})</title>
</head>
<body style="margin:0;padding:16px;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <table width="800" cellpadding="0" cellspacing="0" align="center" style="width:100%;max-width:800px;background-color:#ffffff;border:1px solid #cbd5e1;border-collapse:collapse;">
    <tr>
      <td style="background-color:#0b1220;color:#ffffff;padding:24px 28px;">
        <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#93c5fd;">ISS Port Intelligence · Sedna Dispatch</div>
        <h1 style="margin:8px 0 4px 0;font-size:24px;font-weight:700;">${escapeHtml(port.name)} (${escapeHtml(port.unLocode)})</h1>
        <div style="font-size:13px;color:#cbd5e1;">${isEs ? 'Coordenadas' : 'Coordinates'}: ${escapeHtml(port.coordinates)} · ${isEs ? 'Autoridad' : 'Authority'}: ${escapeHtml(port.authority)} · VHF: ${escapeHtml(port.vhfChannel)}${weatherLine}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 28px;">
        <h2 style="margin:0 0 10px 0;font-size:16px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">1. ${isEs ? 'Recintos Portuarios y Calados' : 'Port Enclosures & Operational Drafts'}</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background-color:#f1f5f9;text-align:left;">
              <th style="padding:10px 12px;">${isEs ? 'Recinto' : 'Port Area'}</th>
              <th style="padding:10px 12px;">${isEs ? 'Prof. Canal' : 'Channel Depth'}</th>
              <th style="padding:10px 12px;">${isEs ? 'Calado Operativo' : 'Operational Draft'}</th>
              <th style="padding:10px 12px;">${isEs ? 'Remolque' : 'Towage'}</th>
              <th style="padding:10px 12px;">${isEs ? 'Estatus' : 'Status'}</th>
            </tr>
          </thead>
          <tbody>${areaRows}</tbody>
        </table>

        <h2 style="margin:24px 0 10px 0;font-size:16px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">2. ${isEs ? 'Canales de Navegación' : 'Navigation Channels & Turning Basins'}</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background-color:#f1f5f9;text-align:left;">
              <th style="padding:8px 12px;">${isEs ? 'Canal' : 'Channel'}</th>
              <th style="padding:8px 12px;">${isEs ? 'Dimensión' : 'Dimension'}</th>
              <th style="padding:8px 12px;">${isEs ? 'Prof. Canal' : 'Depth'}</th>
              <th style="padding:8px 12px;">${isEs ? 'Calado Op.' : 'Max Draft'}</th>
              <th style="padding:8px 12px;">${isEs ? 'Notas' : 'Remarks'}</th>
            </tr>
          </thead>
          <tbody>${channelRows}</tbody>
        </table>

        ${
          anchorageRows
            ? `<h2 style="margin:24px 0 10px 0;font-size:16px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">3. ${isEs ? 'Zonas de Fondeo Autorizadas' : 'Authorized Anchorage Zones'}</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background-color:#f1f5f9;text-align:left;">
              <th style="padding:8px 12px;">${isEs ? 'Zona' : 'Zone'}</th>
              <th style="padding:8px 12px;">${isEs ? 'Uso' : 'Purpose'}</th>
              <th style="padding:8px 12px;">${isEs ? 'Coordenadas' : 'Coordinates'}</th>
              <th style="padding:8px 12px;">${isEs ? 'Profundidad' : 'Depth'}</th>
              <th style="padding:8px 12px;">${isEs ? 'Reglas / Observaciones' : 'Rules / Remarks'}</th>
            </tr>
          </thead>
          <tbody>${anchorageRows}</tbody>
        </table>`
            : ''
        }

        <h2 style="margin:24px 0 10px 0;font-size:16px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">4. ${isEs ? 'Restricciones Físicas y Operativas' : 'Physical & Operational Navigation Restrictions'}</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px;">
          <tbody>${physicalSpecRows}</tbody>
        </table>

        <h2 style="margin:24px 0 10px 0;font-size:16px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">5. ${isEs ? 'Terminales y Muelles Habilitados' : 'Terminals & Qualified Berths'}</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background-color:#f1f5f9;text-align:left;">
              <th style="padding:9px 12px;">Terminal</th>
              <th style="padding:9px 12px;">${isEs ? 'Muelle' : 'Berth'}</th>
              <th style="padding:9px 12px;">${isEs ? 'Eslora Máx.' : 'Max LOA'}</th>
              <th style="padding:9px 12px;">${isEs ? 'Calado Muelle' : 'Berth Draft'}</th>
              <th style="padding:9px 12px;">${isEs ? 'Productos' : 'Commodities'}</th>
            </tr>
          </thead>
          <tbody>${berthRows}</tbody>
        </table>

        <h2 style="margin:24px 0 10px 0;font-size:16px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">6. ${isEs ? 'Servicios Portuarios Autorizados' : 'Available Marine & Husbandry Services'}</h2>
        <ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.55;">
          ${servicesList}
        </ul>

        <h2 style="margin:24px 0 10px 0;font-size:16px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">7. ${isEs ? 'Restricciones y Reglas de Operación' : 'Restrictions & Operating Rules'}</h2>
        <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.55;">
          ${restrictionList}
        </ul>
        ${operatingRulesBlock}
      </td>
    </tr>
    <tr>
      <td style="background-color:#f8fafc;padding:14px 28px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;">
        ${
          isEs
            ? 'Generado automáticamente desde ISS Port Intelligence Hub · Los parámetros marcados como Pendiente validación deben confirmarse con Capitanía de Puerto / ASIPONA antes de emitir instrucción final.'
            : 'Generated automatically from ISS Port Intelligence Hub · Parameters flagged as Pending confirmation must be verified with the local Harbor Master / ASIPONA prior to final vessel dispatch.'
        }
      </td>
    </tr>
  </table>
</body>
</html>`;
}
