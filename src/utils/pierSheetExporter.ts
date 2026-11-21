import { formatDraftMAndFt } from './i18n';
import type { Berth, PierSpecificationSheet, Terminal } from '../types/port';

export function buildDefaultPierSheetFromBerth(
  berth: Berth,
  terminal: Terminal
): PierSpecificationSheet {
  if (berth.pierSheet) return berth.pierSheet;

  const ftExact = (berth.maxDraftM * 3.28084).toFixed(1);
  const cleanTitle = berth.name.split('(')[0]?.trim() || berth.name;

  return {
    pierNumber: '01',
    pierTitle: cleanTitle,
    pierSide: terminal.name,
    subtitle: `${terminal.name.toUpperCase()} · PORT TECHNICAL BRIEF`,
    measurementNote: `Berth length: ${berth.lengthM} m · Berth depth: ${formatDraftMAndFt(
      berth.berthDepthM,
      1
    )} · ${berth.muellajeTariff ?? 'ASIPONA Official Tariff'}`,
    bannerImageUrl: terminal.imageUrl,
    brandPrimary: 'INCHCAPE',
    brandSecondary: 'SHIPPING SERVICES',
    motto: 'LEADERS IN CONNECTIONS THAT MOVE THE WORLD',
    maxDwt: 'Standard Terminal',
    maxDisplacement: `${berth.lengthM} m quay`,
    berthingVelocity: '0.15 m/s',
    maxTransverseWindage: 'Per Port Rules',
    maxLongitudinalWindage: 'Per Port Rules',
    operatingDraftDisplay: `${berth.maxDraftM.toFixed(2)} m (${ftExact} ft)`,
    maxAcceptedLoa: `${berth.maxLoaM.toFixed(2)} m`,
    maxAcceptedBeam: `${berth.maxBeamM.toFixed(2)} m`,
    conditions: berth.products.map((prod, idx) => ({
      id: `${berth.id}-cond-${idx}`,
      product: prod,
      line: berth.connections[idx] ?? berth.connections[0] ?? '—',
      connectionType: berth.equipment[0] ?? 'Terminal Gear',
      connection: '—',
      maxAvgPerHour: berth.loadingRate,
      minAvgPerHour: '—',
    })),
    footerLocation: 'PORT OF COATZACOALCOS, VERACRUZ',
    footerOffice:
      'ISS Marine Services Mexico SA de CV. / Coatzacoalcos Office',
    footerNoticeTitle: 'INFORMATION RESERVED FOR STRATEGIC CLIENTS.',
    footerNoticeBody:
      'ALL OPERATIONS MUST BE CONFIRMED WITH CURRENT CONDITIONS AND PRIOR OPERATIONAL COORDINATION.',
  };
}

function sanitizeFilename(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['—'];
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

function drawParamIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  kind: number
) {
  ctx.save();
  ctx.fillStyle = '#042447';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (kind) {
    case 0: // Ship front (DWT)
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy + 2);
      ctx.lineTo(cx, cy - 11);
      ctx.lineTo(cx + 12, cy + 2);
      ctx.lineTo(cx + 9, cy + 11);
      ctx.lineTo(cx - 9, cy + 11);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 11);
      ctx.lineTo(cx + 6, cy - 11);
      ctx.stroke();
      break;
    case 1: // Weight / displacement
      ctx.beginPath();
      ctx.arc(cx, cy - 7, 5, Math.PI, 0);
      ctx.stroke();
      drawRoundedRect(ctx, cx - 10, cy - 2, 20, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#042447';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('T', cx, cy + 5);
      break;
    case 2: // Velocity gauge
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 12, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + 2);
      ctx.lineTo(cx + 7, cy - 6);
      ctx.stroke();
      break;
    case 3: // Wind waves transverse
    case 4: // Wind waves longitudinal
      for (const offset of [-6, 0, 6]) {
        ctx.beginPath();
        ctx.moveTo(cx - 11, cy + offset);
        ctx.bezierCurveTo(
          cx - 3,
          cy + offset - 4,
          cx + 3,
          cy + offset + 4,
          cx + 11,
          cy + offset
        );
        ctx.stroke();
      }
      break;
    case 5: // Operating draft arrow down + water
      ctx.beginPath();
      ctx.moveTo(cx, cy - 11);
      ctx.lineTo(cx, cy + 3);
      ctx.moveTo(cx - 6, cy - 2);
      ctx.lineTo(cx, cy + 4);
      ctx.lineTo(cx + 6, cy - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy + 9);
      ctx.quadraticCurveTo(cx - 5, cy + 6, cx, cy + 9);
      ctx.quadraticCurveTo(cx + 5, cy + 12, cx + 11, cy + 9);
      ctx.stroke();
      break;
    case 6: // LOA ship + horizontal arrow
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 2);
      ctx.lineTo(cx + 12, cy - 2);
      ctx.lineTo(cx + 9, cy + 4);
      ctx.lineTo(cx - 9, cy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 13, cy + 10);
      ctx.lineTo(cx + 13, cy + 10);
      ctx.moveTo(cx - 9, cy + 7);
      ctx.lineTo(cx - 13, cy + 10);
      ctx.lineTo(cx - 9, cy + 13);
      ctx.moveTo(cx + 9, cy + 7);
      ctx.lineTo(cx + 13, cy + 10);
      ctx.lineTo(cx + 9, cy + 13);
      ctx.stroke();
      break;
    default: // Beam arrows
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 4);
      ctx.lineTo(cx, cy - 12);
      ctx.lineTo(cx + 8, cy - 4);
      ctx.lineTo(cx + 6, cy + 4);
      ctx.lineTo(cx - 6, cy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 13, cy + 10);
      ctx.lineTo(cx + 13, cy + 10);
      ctx.moveTo(cx - 9, cy + 7);
      ctx.lineTo(cx - 13, cy + 10);
      ctx.lineTo(cx - 9, cy + 13);
      ctx.moveTo(cx + 9, cy + 7);
      ctx.lineTo(cx + 13, cy + 10);
      ctx.lineTo(cx + 9, cy + 13);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

export async function renderPierSheetPngDataUrl(
  sheet: PierSpecificationSheet,
  fallbackBannerUrl?: string
): Promise<string> {
  const W = 1920;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // 1. Clean White Base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // 2. Top Hero Image + Curved Navy Overlay
  const heroBottom = 425;
  const bannerImg = await loadImage(sheet.bannerImageUrl || fallbackBannerUrl || '');
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, heroBottom + 40);
  ctx.clip();

  if (bannerImg) {
    const scale = Math.max(W / bannerImg.width, (heroBottom + 40) / bannerImg.height);
    const drawW = bannerImg.width * scale;
    const drawH = bannerImg.height * scale;
    ctx.drawImage(bannerImg, W - drawW * 0.92, -10, drawW, drawH);
  } else {
    const gradFallback = ctx.createLinearGradient(0, 0, W, heroBottom);
    gradFallback.addColorStop(0, '#042447');
    gradFallback.addColorStop(1, '#1d5d9b');
    ctx.fillStyle = gradFallback;
    ctx.fillRect(0, 0, W, heroBottom + 40);
  }

  // Deep navy swooping curve overlays
  const navyGrad = ctx.createLinearGradient(0, 0, 960, heroBottom);
  navyGrad.addColorStop(0, 'rgba(3, 27, 56, 0.98)');
  navyGrad.addColorStop(0.75, 'rgba(7, 45, 86, 0.94)');
  navyGrad.addColorStop(1, 'rgba(13, 73, 133, 0.55)');
  ctx.fillStyle = navyGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(660, 0);
  ctx.bezierCurveTo(640, 190, 820, 340, 1080, heroBottom + 40);
  ctx.lineTo(0, heroBottom + 40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(12, 82, 145, 0.42)';
  ctx.beginPath();
  ctx.moveTo(560, 0);
  ctx.lineTo(760, 0);
  ctx.bezierCurveTo(730, 180, 920, 330, 1210, heroBottom + 40);
  ctx.lineTo(950, heroBottom + 40);
  ctx.bezierCurveTo(760, 310, 610, 180, 560, 0);
  ctx.closePath();
  ctx.fill();

  // Right legibility scrim for motto
  const rightScrim = ctx.createLinearGradient(W - 440, 0, W, 0);
  rightScrim.addColorStop(0, 'rgba(3, 27, 56, 0)');
  rightScrim.addColorStop(1, 'rgba(3, 27, 56, 0.65)');
  ctx.fillStyle = rightScrim;
  ctx.fillRect(W - 440, 0, 440, heroBottom + 40);
  ctx.restore();

  // White swooping wave mask at bottom of Hero
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, 405);
  ctx.bezierCurveTo(420, 355, 1180, 455, W, 412);
  ctx.lineTo(W, heroBottom + 60);
  ctx.lineTo(0, heroBottom + 60);
  ctx.closePath();
  ctx.fill();

  // Hero Brand Block (Top-left)
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 32px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(sheet.brandPrimary || 'INCHCAPE', 64, 72);

  ctx.fillStyle = '#ef4444';
  ctx.font = '700 11px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(sheet.brandSecondary || 'SHIPPING SERVICES', 110, 88);

  // Subtle curved brand arc next to INCHCAPE
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(280, 62, 22, -Math.PI * 0.45, Math.PI * 0.55);
  ctx.stroke();

  // Gold horizontal bar
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(64, 102, 138, 3);

  // Subtitle TASP PAJARITOS
  ctx.fillStyle = '#dbeafe';
  ctx.font = '500 17px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(sheet.subtitle, 64, 136);

  // Giant Ice Blue Number
  ctx.fillStyle = '#8ce0f6';
  ctx.font = '800 128px Georgia, "Times New Roman", serif';
  ctx.fillText(sheet.pierNumber, 62, 258);

  // Pier Title + Side
  const numWidth = ctx.measureText(sheet.pierNumber).width;
  const titleX = 62 + numWidth + 24;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 72px Georgia, "Times New Roman", serif';
  ctx.fillText(sheet.pierTitle, titleX, 218);

  if (sheet.pierSide) {
    ctx.fillStyle = '#9be7f9';
    ctx.font = '700 54px Georgia, "Times New Roman", serif';
    ctx.fillText(sheet.pierSide, titleX, 276);
  }

  // Gold bar under number
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(64, 286, 138, 3);

  // Sub-notes
  let noteY = 320;
  ctx.fillStyle = '#e0f2fe';
  ctx.font = '400 18px "DM Sans", Arial, sans-serif';
  if (sheet.bcmMaxHeightNote) {
    ctx.fillText(sheet.bcmMaxHeightNote, 64, noteY);
    noteY += 26;
  }
  ctx.fillText(sheet.measurementNote, 64, noteY);

  // Right motto
  const mottoWords = (sheet.motto || DEFAULT_MOTTO).split(' ');
  const mottoLines: string[] = [];
  if (mottoWords.length >= 6) {
    mottoLines.push(mottoWords[0]);
    mottoLines.push(mottoWords.slice(1, 3).join(' '));
    mottoLines.push(mottoWords.slice(3, 5).join(' '));
    mottoLines.push(mottoWords.slice(5).join(' '));
  } else {
    mottoLines.push(sheet.motto || DEFAULT_MOTTO);
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 15px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.textAlign = 'right';
  let mottoY = 278;
  for (const ml of mottoLines) {
    ctx.fillText(ml, W - 64, mottoY);
    mottoY += 22;
  }
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(W - 156, mottoY - 6, 92, 3);
  ctx.textAlign = 'left';

  // 3. Navigation Parameters Heading
  ctx.fillStyle = '#042447';
  ctx.font = '700 32px Georgia, "Times New Roman", serif';
  ctx.fillText('Navigation Parameters', 64, 444);

  const paramCards = [
    { label: 'Maximum design deadweight tonnage', value: sheet.maxDwt },
    { label: 'Maximum accepted displacement', value: sheet.maxDisplacement },
    { label: 'Berthing velocity', value: sheet.berthingVelocity },
    { label: 'Maximum transverse windage area', value: sheet.maxTransverseWindage },
    { label: 'Maximum longitudinal windage area', value: sheet.maxLongitudinalWindage },
    { label: 'Operating draft', value: sheet.operatingDraftDisplay },
    { label: 'Maximum accepted LOA', value: sheet.maxAcceptedLoa },
    { label: 'Maximum accepted beam', value: sheet.maxAcceptedBeam },
  ];

  const gridLeft = 64;
  const gridGap = 14;
  const gridWidth = W - 128;
  const boxW = (gridWidth - gridGap * 7) / 8;
  const boxY = 462;
  const boxH = 192;

  paramCards.forEach((p, idx) => {
    const bx = gridLeft + idx * (boxW + gridGap);
    ctx.fillStyle = '#eef8fd';
    ctx.strokeStyle = '#b9e3f9';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, bx, boxY, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    drawParamIcon(ctx, bx + boxW / 2, boxY + 42, 26, idx);

    // Gold vertical bar beside label
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(bx + 16, boxY + 86, 2.5, 48);

    ctx.fillStyle = '#1e3a5f';
    ctx.font = '500 14px "DM Sans", Arial, sans-serif';
    const labelLines = wrapLines(ctx, p.label, boxW - 36, 3);
    labelLines.forEach((line, lIdx) => {
      ctx.fillText(line, bx + 26, boxY + 100 + lIdx * 17);
    });

    // Value at bottom
    ctx.fillStyle = '#042447';
    ctx.font = '800 22px "Plus Jakarta Sans", Arial, sans-serif';
    const valWidth = ctx.measureText(p.value).width;
    if (valWidth > boxW - 24) {
      ctx.font = '800 17px "Plus Jakarta Sans", Arial, sans-serif';
    }
    ctx.fillText(p.value, bx + 18, boxY + boxH - 22);
  });

  // 4. Products and Operating Conditions Table
  const tableHeadingY = 696;
  ctx.fillStyle = '#042447';
  ctx.font = '700 32px Georgia, "Times New Roman", serif';
  ctx.fillText('Products and Operating Conditions', 64, tableHeadingY);

  const tableX = 64;
  const tableY = 714;
  const tableW = W - 128;
  const footerTop = 1006;
  const maxTableH = footerTop - tableY - 14;
  const headerH = 42;
  const rows = sheet.conditions;
  const displayRows = Math.max(rows.length, 4);
  const rowH = Math.min(34, Math.max(20, (maxTableH - headerH) / displayRows));
  const actualTableH = headerH + rowH * displayRows;

  // Rounded table shell clip
  ctx.save();
  drawRoundedRect(ctx, tableX, tableY, tableW, actualTableH, 12);
  ctx.clip();

  // Header
  ctx.fillStyle = '#042447';
  ctx.fillRect(tableX, tableY, tableW, headerH);

  const colWidths = [
    tableW * 0.37,
    tableW * 0.1,
    tableW * 0.15,
    tableW * 0.11,
    tableW * 0.135,
    tableW * 0.135,
  ];
  const colStarts: number[] = [];
  let accX = tableX;
  for (const w of colWidths) {
    colStarts.push(accX);
    accX += w;
  }

  const headers = [
    'Product',
    'Line',
    'Connection type',
    'Connection',
    'Max. avg./hour',
    'Min. avg./hour',
  ];
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 15px "DM Sans", Arial, sans-serif';
  ctx.textBaseline = 'middle';
  headers.forEach((h, i) => {
    if (i === 0) {
      ctx.textAlign = 'left';
      ctx.fillText(h, colStarts[i] + 18, tableY + headerH / 2);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText(h, colStarts[i] + colWidths[i] / 2, tableY + headerH / 2);
    }
  });

  // Rows
  const rowFontSize = rowH < 24 ? 12 : 14;
  for (let rIdx = 0; rIdx < displayRows; rIdx++) {
    const ry = tableY + headerH + rIdx * rowH;
    ctx.fillStyle = rIdx % 2 === 0 ? '#e3f4fc' : '#f4fbff';
    ctx.fillRect(tableX, ry, tableW, rowH);

    // Horizontal divider
    ctx.strokeStyle = '#cdebfd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tableX, ry + rowH);
    ctx.lineTo(tableX + tableW, ry + rowH);
    ctx.stroke();

    const item = rows[rIdx];
    // Vertical dividers (skip last divider if mergedRateNote)
    for (let c = 1; c < colStarts.length; c++) {
      if (item?.mergedRateNote && c === 5) continue;
      ctx.beginPath();
      ctx.moveTo(colStarts[c], ry);
      ctx.lineTo(colStarts[c], ry + rowH);
      ctx.stroke();
    }

    if (!item) continue;

    ctx.fillStyle = '#0c2d52';
    ctx.font = `500 ${rowFontSize}px "DM Sans", Arial, sans-serif`;
    ctx.textAlign = 'left';

    let prodText = item.product;
    const maxProdW = colWidths[0] - 26;
    while (ctx.measureText(prodText).width > maxProdW && prodText.length > 8) {
      prodText = `${prodText.slice(0, -4)}...`;
    }
    ctx.fillText(prodText, colStarts[0] + 18, ry + rowH / 2);

    ctx.textAlign = 'center';
    ctx.fillText(item.line || '—', colStarts[1] + colWidths[1] / 2, ry + rowH / 2);
    ctx.fillText(
      item.connectionType || '—',
      colStarts[2] + colWidths[2] / 2,
      ry + rowH / 2
    );
    ctx.fillText(
      item.connection || '—',
      colStarts[3] + colWidths[3] / 2,
      ry + rowH / 2
    );

    if (item.mergedRateNote) {
      const mergedCenter =
        colStarts[4] + (colWidths[4] + colWidths[5]) / 2;
      ctx.fillText(item.mergedRateNote, mergedCenter, ry + rowH / 2);
    } else {
      ctx.fillText(
        item.maxAvgPerHour || '—',
        colStarts[4] + colWidths[4] / 2,
        ry + rowH / 2
      );
      ctx.fillText(
        item.minAvgPerHour || '—',
        colStarts[5] + colWidths[5] / 2,
        ry + rowH / 2
      );
    }
  }
  ctx.restore();

  // Outer table border
  ctx.strokeStyle = '#b9e3f9';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, tableX, tableY, tableW, actualTableH, 12);
  ctx.stroke();

  // 5. Footer Strip
  ctx.fillStyle = '#042447';
  ctx.fillRect(0, footerTop, W, H - footerTop);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(64, footerTop + 18, 4, 38);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#dbeafe';
  ctx.font = '600 14px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(
    sheet.footerLocation || DEFAULT_FOOTER_LOCATION,
    80,
    footerTop + 34
  );
  ctx.fillStyle = '#ffffff';
  ctx.font = '500 16px Georgia, "Times New Roman", serif';
  ctx.fillText(sheet.footerOffice || DEFAULT_FOOTER_OFFICE, 80, footerTop + 55);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#dbeafe';
  ctx.font = '600 13px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(sheet.footerNoticeTitle || DEFAULT_NOTICE_TITLE, W - 64, footerTop + 34);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 12px "DM Sans", Arial, sans-serif';
  ctx.fillText(sheet.footerNoticeBody || DEFAULT_NOTICE_BODY, W - 64, footerTop + 55);

  return canvas.toDataURL('image/png');
}

const DEFAULT_MOTTO = 'LEADERS IN CONNECTIONS THAT MOVE THE WORLD';
const DEFAULT_FOOTER_LOCATION = 'PORT OF COATZACOALCOS, VERACRUZ';
const DEFAULT_FOOTER_OFFICE =
  'ISS Marine Services Mexico SA de CV. / Coatzacoalcos Office';
const DEFAULT_NOTICE_TITLE = 'INFORMATION RESERVED FOR STRATEGIC CLIENTS.';
const DEFAULT_NOTICE_BODY =
  'ALL OPERATIONS MUST BE CONFIRMED WITH CURRENT CONDITIONS AND PRIOR OPERATIONAL COORDINATION.';

export async function downloadPierSheetPng(
  sheet: PierSpecificationSheet,
  fallbackBannerUrl?: string
): Promise<void> {
  const dataUrl = await renderPierSheetPngDataUrl(sheet, fallbackBannerUrl);
  const a = document.createElement('a');
  a.href = dataUrl;
  const slug = sanitizeFilename(
    `${sheet.pierNumber}-${sheet.pierTitle}-${sheet.pierSide || 'berth'}`
  );
  a.download = `tasp-pajaritos-${slug}.png`;
  a.click();
}

export function generatePierSheetStandaloneHtml(
  sheet: PierSpecificationSheet,
  fallbackBannerUrl?: string
): string {
  const imgSrc = sheet.bannerImageUrl || fallbackBannerUrl || '';
  const absoluteImgSrc =
    imgSrc && imgSrc.startsWith('/') && typeof window !== 'undefined'
      ? `${window.location.origin}${imgSrc}`
      : imgSrc;

  const params = [
    { label: 'Maximum design deadweight tonnage', value: sheet.maxDwt },
    { label: 'Maximum accepted displacement', value: sheet.maxDisplacement },
    { label: 'Berthing velocity', value: sheet.berthingVelocity },
    { label: 'Maximum transverse windage area', value: sheet.maxTransverseWindage },
    { label: 'Maximum longitudinal windage area', value: sheet.maxLongitudinalWindage },
    { label: 'Operating draft', value: sheet.operatingDraftDisplay },
    { label: 'Maximum accepted LOA', value: sheet.maxAcceptedLoa },
    { label: 'Maximum accepted beam', value: sheet.maxAcceptedBeam },
  ];

  const rowsHtml = sheet.conditions
    .map((c, idx) => {
      const bg = idx % 2 === 0 ? '#e3f4fc' : '#f4fbff';
      const rateCells = c.mergedRateNote
        ? `<td colspan="2" style="padding:7px 10px;text-align:center;border-left:1px solid #bae6fd;font-weight:500;">${escapeHtml(
            c.mergedRateNote
          )}</td>`
        : `<td style="padding:7px 10px;text-align:center;border-left:1px solid #bae6fd;">${escapeHtml(
            c.maxAvgPerHour || '—'
          )}</td>
           <td style="padding:7px 10px;text-align:center;border-left:1px solid #bae6fd;">${escapeHtml(
             c.minAvgPerHour || '—'
           )}</td>`;

      return `<tr style="background:${bg};color:#0c2d52;border-bottom:1px solid #cdebfd;">
        <td style="padding:7px 14px;font-weight:500;">${escapeHtml(c.product)}</td>
        <td style="padding:7px 10px;text-align:center;border-left:1px solid #bae6fd;">${escapeHtml(
          c.line || '—'
        )}</td>
        <td style="padding:7px 10px;text-align:center;border-left:1px solid #bae6fd;">${escapeHtml(
          c.connectionType || '—'
        )}</td>
        <td style="padding:7px 10px;text-align:center;border-left:1px solid #bae6fd;">${escapeHtml(
          c.connection || '—'
        )}</td>
        ${rateCells}
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(sheet.pierNumber)} ${escapeHtml(sheet.pierTitle)} ${escapeHtml(
    sheet.pierSide
  )} — ${escapeHtml(sheet.subtitle)}</title>
<style>
  @page { size: landscape; margin: 6mm; }
  body { margin: 0; padding: 16px; background: #e2e8f0; font-family: "DM Sans", Arial, sans-serif; }
  .sheet { max-width: 1280px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 18px 40px rgba(4,36,71,0.18); }
  @media print { body { padding: 0; background: #fff; } .sheet { box-shadow: none; border-radius: 0; max-width: 100%; } }
</style>
</head>
<body>
  <div class="sheet">
    <div style="position:relative;height:285px;background:#042447;overflow:hidden;">
      ${
        absoluteImgSrc
          ? `<img src="${escapeHtml(
              absoluteImgSrc
            )}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />`
          : ''
      }
      <div style="position:absolute;inset:0;background:linear-gradient(108deg, rgba(3,27,56,0.97) 0%, rgba(7,45,86,0.92) 45%, rgba(13,73,133,0.18) 72%, rgba(3,27,56,0.55) 100%);"></div>
      <div style="position:relative;z-index:2;padding:24px 40px;color:#fff;display:flex;justify-content:space-between;align-items:flex-end;height:220px;box-sizing:border-box;">
        <div>
          <div style="font-size:22px;font-weight:800;letter-spacing:0.02em;">${escapeHtml(
            sheet.brandPrimary || 'INCHCAPE'
          )}</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:0.18em;color:#f87171;margin-left:22px;">${escapeHtml(
            sheet.brandSecondary || 'SHIPPING SERVICES'
          )}</div>
          <div style="width:95px;height:2px;background:#f59e0b;margin:8px 0;"></div>
          <div style="font-size:11px;letter-spacing:0.18em;color:#dbeafe;margin-bottom:4px;">${escapeHtml(
            sheet.subtitle
          )}</div>
          <div style="display:flex;align-items:baseline;gap:14px;">
            <span style="font-family:Georgia,serif;font-size:82px;line-height:0.9;font-weight:700;color:#8ce0f6;">${escapeHtml(
              sheet.pierNumber
            )}</span>
            <div>
              <div style="font-family:Georgia,serif;font-size:48px;line-height:0.95;font-weight:700;color:#fff;">${escapeHtml(
                sheet.pierTitle
              )}</div>
              ${
                sheet.pierSide
                  ? `<div style="font-family:Georgia,serif;font-size:36px;line-height:1;font-weight:700;color:#9be7f9;">${escapeHtml(
                      sheet.pierSide
                    )}</div>`
                  : ''
              }
            </div>
          </div>
          <div style="width:95px;height:2px;background:#f59e0b;margin:8px 0;"></div>
          ${
            sheet.bcmMaxHeightNote
              ? `<div style="font-size:12px;color:#e0f2fe;">${escapeHtml(
                  sheet.bcmMaxHeightNote
                )}</div>`
              : ''
          }
          <div style="font-size:12px;color:#e0f2fe;">${escapeHtml(
            sheet.measurementNote
          )}</div>
        </div>
        <div style="text-align:right;font-size:11px;font-weight:600;letter-spacing:0.12em;line-height:1.45;color:#fff;">
          ${escapeHtml(sheet.motto || DEFAULT_MOTTO)}
          <div style="width:64px;height:2px;background:#f59e0b;margin-left:auto;margin-top:6px;"></div>
        </div>
      </div>
      <svg viewBox="0 0 1200 48" preserveAspectRatio="none" style="position:absolute;bottom:-1px;left:0;width:100%;height:34px;display:block;z-index:3;">
        <path d="M0,18 C320,-4 760,44 1200,12 L1200,48 L0,48 Z" fill="#ffffff" />
      </svg>
    </div>

    <div style="padding:10px 40px 22px 40px;">
      <h2 style="margin:0 0 12px 0;font-family:Georgia,serif;font-size:22px;color:#042447;">Navigation Parameters</h2>
      <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:10px;">
        ${params
          .map(
            (p) => `<div style="background:#eef8fd;border:1px solid #b9e3f9;border-radius:10px;padding:10px;display:flex;flex-direction:column;justify-content:space-between;min-height:112px;">
              <div style="border-left:2px solid #f59e0b;padding-left:7px;font-size:10.5px;line-height:1.3;color:#1e3a5f;">${escapeHtml(
                p.label
              )}</div>
              <div style="margin-top:10px;font-size:15px;font-weight:800;color:#042447;">${escapeHtml(
                p.value
              )}</div>
            </div>`
          )
          .join('')}
      </div>

      <h2 style="margin:18px 0 10px 0;font-family:Georgia,serif;font-size:22px;color:#042447;">Products and Operating Conditions</h2>
      <div style="border:1px solid #b9e3f9;border-radius:10px;overflow:hidden;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12.5px;">
          <thead>
            <tr style="background:#042447;color:#fff;">
              <th style="padding:9px 14px;text-align:left;width:38%;">Product</th>
              <th style="padding:9px 10px;text-align:center;">Line</th>
              <th style="padding:9px 10px;text-align:center;">Connection type</th>
              <th style="padding:9px 10px;text-align:center;">Connection</th>
              <th style="padding:9px 10px;text-align:center;">Max. avg./hour</th>
              <th style="padding:9px 10px;text-align:center;">Min. avg./hour</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>

    <div style="background:#042447;color:#fff;padding:12px 40px;display:flex;justify-content:space-between;align-items:center;font-size:11px;">
      <div style="border-left:3px solid #f59e0b;padding-left:10px;">
        <div style="color:#dbeafe;font-weight:600;letter-spacing:0.08em;">${escapeHtml(
          sheet.footerLocation || DEFAULT_FOOTER_LOCATION
        )}</div>
        <div style="font-family:Georgia,serif;font-size:12px;margin-top:2px;">${escapeHtml(
          sheet.footerOffice || DEFAULT_FOOTER_OFFICE
        )}</div>
      </div>
      <div style="text-align:right;color:#cbd5e1;font-size:10px;letter-spacing:0.06em;">
        <div style="color:#fff;font-weight:600;">${escapeHtml(
          sheet.footerNoticeTitle || DEFAULT_NOTICE_TITLE
        )}</div>
        <div style="margin-top:2px;">${escapeHtml(
          sheet.footerNoticeBody || DEFAULT_NOTICE_BODY
        )}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadPierSheetHtml(
  sheet: PierSpecificationSheet,
  fallbackBannerUrl?: string
): void {
  const html = generatePierSheetStandaloneHtml(sheet, fallbackBannerUrl);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const slug = sanitizeFilename(
    `${sheet.pierNumber}-${sheet.pierTitle}-${sheet.pierSide || 'berth'}`
  );
  a.download = `tasp-pajaritos-${slug}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
