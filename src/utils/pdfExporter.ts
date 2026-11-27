import { jsPDF } from 'jspdf';
import type {
  Language,
  PdaInput,
  PdaLineItem,
  PdaOfficeAndBankProfile,
  PdaResult,
  PortArea,
  PortProfile,
  ProductTechnicalDossier,
  VesselLineupEntry,
} from '../types/port';

export function sanitizePdfFilename(rawName: string, fallback = 'ISS-Document'): string {
  const cleaned = rawName
    .trim()
    .replace(/\.pdf$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_');
  return `${cleaned || fallback}.pdf`;
}

const DEFAULT_OFFICE_PROFILE: PdaOfficeAndBankProfile = {
  officeTitle: 'ISS Coatzacoalcos, Mexico. Office Full Style',
  addressLine1: 'Salvador Diaz Miron # 2115B, Col . Puerto Mexico',
  addressLine2: 'Coatzacoalcos, Mexico. CP. 96510',
  telephone: '+52 921 1456202',
  emails: [
    'ISS.Coatza@iss-shipping.com',
    'Ana.Ahuet@iss-shipping.com',
    'Rafael.Dominguez@iss-shipping.com',
    'Jose.Martinez@iss-shipping.com',
  ],
  bankTitle: 'ISS Bank Details for deposit purpose',
  bankName: 'Citibank, N.A. London Branch',
  bankAddress: '33 Canada Square, Canary Wharf, London E14 5LB, United Kingdom.',
  accountNo: 'GB90CITI18500814230531',
  swiftNumber: 'CITIGB2L',
  currencyLabel: 'USD US Dollar',
  accountOwner: 'ISS MARINE SERVICES MEXICO SA DE CV',
  remittanceNotice:
    'Please arrange to remit the above total amount (full funds) to our bank account 07 DAYS BEFORE ARRIVAL OF VESSEL. In case you are acting on behalf of another party, please state clearly the name and full style of this party, stating specifically which services should be charged to their account.',
  disclaimerText:
    'The information in this document is for general information purposes only. Whilst all reasonable endeavours are made to make this information as reliable as possible, including, where applicable, as regards taxes and exchange rates, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, suitability or availability of the information for any purpose. Any reliance placed on this information is therefore strictly at your own risk: in no event will we be liable for any loss or damage whatsoever, including, without limitation, indirect or consequential loss or damage, arising from or out of, or in connection with, the use of this information.',
  billingNoteText:
    'Our standard billing method will be via email and you will receive your final Disbursement Account ("DA") in ".PDF" format. If you require the DA to be sent via the mail, this should be explicitly requested at/upon appointment',
};

/**
 * Draws the transparent vector Inchcape Shipping Services emblem directly onto dark header backgrounds
 * (no pasted opaque box), anchored to the top-right.
 */
export function drawInchcapeHeaderBrand(
  doc: jsPDF,
  rightX: number,
  topY: number,
  scale = 1
): void {
  const s = scale;
  const arcCx = rightX - 9.5 * s;
  const arcCy = topY + 9.2 * s;
  const textRightX = rightX - 18.5 * s;

  // Wordmark "INCHCAPE"
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5 * s);
  doc.text('INCHCAPE', textRightX, topY + 9.2 * s, { align: 'right' });

  // Sub-label "SHIPPING SERVICES"
  doc.setTextColor(225, 29, 72);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.4 * s);
  doc.text('SHIPPING SERVICES', textRightX, topY + 13.0 * s, { align: 'right' });

  // Concentric curved arcs on the right (simulating compass / wave swoosh)
  const drawArcSegments = (
    radius: number,
    startDeg: number,
    endDeg: number,
    rgb: [number, number, number],
    lineW: number
  ) => {
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    doc.setLineWidth(lineW * s);
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const a1 = ((startDeg + ((endDeg - startDeg) * i) / steps) * Math.PI) / 180;
      const a2 = ((startDeg + ((endDeg - startDeg) * (i + 1)) / steps) * Math.PI) / 180;
      doc.line(
        arcCx + Math.cos(a1) * radius * s,
        arcCy + Math.sin(a1) * radius * s,
        arcCx + Math.cos(a2) * radius * s,
        arcCy + Math.sin(a2) * radius * s
      );
    }
  };

  drawArcSegments(7.5, -135, 72, [255, 255, 255], 0.95);
  drawArcSegments(5.8, -122, 62, [203, 213, 225], 0.55);
  drawArcSegments(4.3, -110, 52, [148, 163, 184], 0.38);

  // Crimson directional dart tip pointing NE
  doc.setFillColor(225, 29, 72);
  doc.triangle(
    arcCx + 8.6 * s,
    arcCy - 8.2 * s,
    arcCx + 4.4 * s,
    arcCy - 5.2 * s,
    arcCx + 5.9 * s,
    arcCy - 3.6 * s,
    'F'
  );

  // White swallow silhouette inside compass ring
  doc.setFillColor(255, 255, 255);
  doc.triangle(
    arcCx - 1.5 * s,
    arcCy - 1.2 * s,
    arcCx + 5.1 * s,
    arcCy - 4.8 * s,
    arcCx + 2.4 * s,
    arcCy + 1.4 * s,
    'F'
  );
}

function drawSmallMexicoFlagBadge(doc: jsPDF, x: number, y: number) {
  const w = 12;
  const h = 7.5;
  doc.setFillColor(0, 104, 71);
  doc.rect(x, y, w / 3, h, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(x + w / 3, y, w / 3, h, 'F');
  doc.setFillColor(206, 17, 38);
  doc.rect(x + (w * 2) / 3, y, w / 3, h, 'F');
  doc.setFillColor(120, 82, 48);
  doc.circle(x + w / 2, y + h / 2, 1.0, 'F');
}

function formatUsdCell(amount: number): string {
  if (Math.abs(amount) < 0.005) return '-';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatFriendlyDate(): string {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = now.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return `${months[now.getMonth()]}, ${day}${suffix}, ${now.getFullYear()}.`;
}

export function exportPdaToPdf(params: {
  filename: string;
  port: PortProfile;
  area?: PortArea;
  input: PdaInput;
  pdaResult: PdaResult;
  lang: Language;
  sheetSourceUrl?: string;
  officeProfile?: PdaOfficeAndBankProfile;
}): string {
  const { filename, port, area, input, pdaResult, lang, officeProfile } = params;
  const profile = officeProfile ?? DEFAULT_OFFICE_PROFILE;
  const isEs = lang === 'es';
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const savedFilename = sanitizePdfFilename(filename, `PDA-${port.shortCode}`);
  const inactive = new Set(input.inactiveFieldKeys ?? []);

  // 1. Integrated Top Dark Navy Header Strip (Logo seamlessly part of top-right header)
  doc.setFillColor(4, 36, 71);
  doc.rect(0, 0, pageWidth, 23, 'F');
  doc.setFillColor(245, 180, 0);
  doc.rect(0, 23, pageWidth, 1.0, 'F');

  drawSmallMexicoFlagBadge(doc, margin, 7.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text('PROFORMA DISBURSEMENT ACCOUNT', margin + 15.5, 11.2);
  doc.setTextColor(147, 197, 253);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.text(
    `${port.authority.toUpperCase()} · ${area ? (isEs ? area.name : area.nameEn) : port.name} (${port.unLocode})`,
    margin + 15.5,
    16.6
  );

  // Seamless top-right Inchcape logo
  drawInchcapeHeaderBrand(doc, pageWidth - margin, 3.8, 0.85);

  // 2. Date & Optional Invoice Number strip
  let y = 28.5;
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  if (!inactive.has('invoiceNumber') && input.invoiceNumber?.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE NUMBER:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(input.invoiceNumber.trim(), margin + 30, y);
  }
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageWidth - margin - 26, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(formatFriendlyDate(), pageWidth - margin, y, { align: 'right' });

  // 3. Dark Navy Banner Bar
  y += 3;
  doc.setFillColor(11, 31, 51);
  doc.rect(margin, y, contentWidth, 6.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('PROFORMA DISBURSEMENT ACCOUNT', pageWidth / 2, y + 4.3, { align: 'center' });
  y += 6.2;

  // 4. Two-Column Active-Only Metadata Grid (exact replica of official PDA)
  const stayHours = Math.round(pdaResult.effectivePortStayHours);
  const approxDays = Math.max(1, Math.round(stayHours / 24));
  const portDisplay = area
    ? `${port.authority} / ${isEs ? area.name : area.nameEn}`
    : port.name;

  type MetaEntry = { label: string; value: string; unitNote?: string };
  const leftEntries: MetaEntry[] = [];
  if (!inactive.has('principal') && (input.principal ?? '').trim()) {
    leftEntries.push({ label: 'PRINCIPAL:', value: (input.principal ?? '').trim().toUpperCase() });
  }
  if (!inactive.has('port')) {
    leftEntries.push({ label: 'PORT:', value: portDisplay.toUpperCase() });
  }
  if (!inactive.has('purpose') && input.purpose) {
    leftEntries.push({ label: 'PURPOSE:', value: input.purpose });
  }
  if (!inactive.has('vesselType') && input.vesselType) {
    leftEntries.push({ label: 'VESSEL TYPE:', value: input.vesselType.toUpperCase() });
  }
  if (!inactive.has('cargo') && (input.cargoDescription ?? '').trim()) {
    leftEntries.push({ label: 'CARGO:', value: (input.cargoDescription ?? '').trim().toUpperCase() });
  }
  if (!inactive.has('quantity') && input.cargoTons > 0) {
    leftEntries.push({
      label: 'QUANTITY:',
      value: `${input.cargoTons.toLocaleString('en-US')}   MT +-`,
    });
  }
  if (!inactive.has('opsRate') && (input.opsRateMtHr ?? 0) > 0) {
    leftEntries.push({
      label: 'OPS RATE:',
      value: `${(input.opsRateMtHr ?? 0).toLocaleString('en-US')}   MT / HRS`,
    });
  }
  if (!inactive.has('portStay')) {
    leftEntries.push({
      label: 'PORT STAY:',
      value: `${stayHours} HRS`,
      unitNote: `${String(approxDays).padStart(2, '0')} days aprox +- / Subject to rate & weather`,
    });
  }

  const rightEntries: MetaEntry[] = [];
  if (!inactive.has('vessel') && !inactive.has('vesselName') && input.vesselName.trim()) {
    rightEntries.push({ label: 'VESSEL:', value: input.vesselName.trim().toUpperCase() });
  }
  if (!inactive.has('dwt') && (input.dwt ?? 0) > 0) {
    rightEntries.push({
      label: 'DWT:',
      value: `${(input.dwt ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}   MT`,
    });
  }
  if (!inactive.has('gt') && !inactive.has('grt') && input.gt > 0) {
    rightEntries.push({
      label: 'GRT:',
      value: `${input.gt.toLocaleString('en-US')}   MT`,
    });
  }
  if (!inactive.has('loa') && input.loaM > 0) {
    rightEntries.push({
      label: 'LOA:',
      value: `${input.loaM.toFixed(2)}   MTS`,
    });
  }
  if (!inactive.has('beam') && (input.beamM ?? 0) > 0) {
    rightEntries.push({
      label: 'BEAM:',
      value: `${(input.beamM ?? 0).toFixed(2)}   MTS`,
    });
  }
  if (!inactive.has('eta') && (input.eta ?? '').trim()) {
    rightEntries.push({ label: 'ETA:', value: (input.eta ?? '').trim() });
  }

  // Append active user custom fields to requested side
  (input.customFields ?? []).forEach((cf) => {
    if (!cf.active || !cf.label.trim() || !cf.value.trim()) return;
    const entry: MetaEntry = {
      label: `${cf.label.trim().toUpperCase().replace(/:+$/, '')}:`,
      value: cf.value.trim(),
    };
    if (cf.column === 'right') rightEntries.push(entry);
    else leftEntries.push(entry);
  });

  const metaRowsCount = Math.max(leftEntries.length, rightEntries.length);
  const metaRowH = 5.0;
  const leftLabelW = 24;
  const leftValW = 86;
  const rightLabelW = 19;
  const rightX = margin + leftLabelW + leftValW;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.25);

  for (let i = 0; i < metaRowsCount; i++) {
    const ry = y + i * metaRowH;
    const left = leftEntries[i];
    const right = rightEntries[i];

    // Row box & horizontal rule
    doc.rect(margin, ry, contentWidth, metaRowH, 'S');
    // Vertical dividers
    doc.line(rightX, ry, rightX, ry + metaRowH);

    if (left) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.3);
      doc.setTextColor(15, 23, 42);
      doc.text(left.label, margin + 1.5, ry + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.4);
      const valText = left.unitNote ? `${left.value}  (${left.unitNote})` : left.value;
      const truncated = doc.splitTextToSize(valText, leftValW - 2)[0] ?? valText;
      doc.text(truncated, margin + leftLabelW + 1, ry + 3.5);
    }

    if (right) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.3);
      doc.setTextColor(15, 23, 42);
      doc.text(right.label, rightX + 1.5, ry + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.4);
      const truncatedR = doc.splitTextToSize(right.value, contentWidth - (rightX - margin) - rightLabelW - 2)[0] ?? right.value;
      doc.text(truncatedR, rightX + rightLabelW + 1, ry + 3.5);
    }
  }

  y += metaRowsCount * metaRowH + 4.5;

  // Helper to draw a Charges Section Table (Crew Charges or Agency Charges)
  const col1W = 46;
  const col2W = contentWidth - col1W - 28;
  const col3W = 28;

  const drawChargeSectionTable = (
    sectionTitle: string,
    items: PdaLineItem[],
    subtotalUsd: number
  ) => {
    const drawSectionHeader = (topY: number) => {
      doc.setFillColor(11, 31, 51);
      doc.rect(margin, topY, contentWidth, 5.8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(sectionTitle, margin + 2, topY + 4.0);
      doc.text('Remarks', margin + col1W + col2W / 2, topY + 4.0, { align: 'center' });
      doc.text('USD', pageWidth - margin - col3W / 2, topY + 4.0, { align: 'center' });
      return topY + 5.8;
    };

    if (y > pageHeight - 36) {
      doc.addPage();
      y = 14;
    }
    y = drawSectionHeader(y);

    items.forEach((line, idx) => {
      const desc = isEs ? line.concept : line.conceptEn;
      const descLines = doc.splitTextToSize(desc, col1W - 3) as string[];
      const remarkLines = doc.splitTextToSize(line.remarks || '-', col2W - 4) as string[];
      const maxLines = Math.max(descLines.length, remarkLines.length);
      const rowH = Math.max(4.8, maxLines * 3.5 + 1.6);

      if (y + rowH > pageHeight - 28) {
        doc.addPage();
        y = 14;
        y = drawSectionHeader(y);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, rowH, 'F');
      }
      doc.setDrawColor(180, 192, 206);
      doc.rect(margin, y, contentWidth, rowH, 'S');
      doc.line(margin + col1W, y, margin + col1W, y + rowH);
      doc.line(margin + col1W + col2W, y, margin + col1W + col2W, y + rowH);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.text(descLines, margin + 1.5, y + 3.4);
      doc.setTextColor(51, 65, 85);
      doc.text(remarkLines, margin + col1W + 2, y + 3.4);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.text('$', margin + col1W + col2W + 2, y + 3.4);
      doc.text(formatUsdCell(line.amountUsd), pageWidth - margin - 2, y + 3.4, { align: 'right' });

      y += rowH;
    });

    // Sub Total Row
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.35);
    doc.rect(margin, y, contentWidth, 5.4, 'S');
    doc.line(margin + col1W + col2W, y, margin + col1W + col2W, y + 5.4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(15, 23, 42);
    doc.text('Sub Total:', margin + col1W + col2W - 3, y + 3.8, { align: 'right' });
    doc.text('$', margin + col1W + col2W + 2, y + 3.8);
    doc.text(formatUsdCell(subtotalUsd), pageWidth - margin - 2, y + 3.8, { align: 'right' });
    doc.setLineWidth(0.25);

    y += 5.4;
  };

  const portItems = pdaResult.lineItems.filter(
    (i) => i.chargeSection === 'port' || (i.chargeSection as string) === 'crew_port'
  );
  const crewItems = pdaResult.lineItems.filter((i) => i.chargeSection === 'crew');
  const husbandryItems = pdaResult.lineItems.filter((i) => i.chargeSection === 'husbandry');
  const agencyItems = pdaResult.lineItems.filter((i) => i.chargeSection === 'agency');

  if (portItems.length > 0) {
    drawChargeSectionTable('Port Charges', portItems, pdaResult.portChargesTotalUsd);
    y += 3.5;
  }

  if (crewItems.length > 0) {
    drawChargeSectionTable('Crew Charges', crewItems, pdaResult.crewChargesTotalUsd);
    y += 3.5;
  }

  if (husbandryItems.length > 0) {
    drawChargeSectionTable('Husbandry Charges', husbandryItems, pdaResult.husbandryChargesTotalUsd);
    y += 3.5;
  }

  if (agencyItems.length > 0) {
    drawChargeSectionTable('Agency Charges', agencyItems, pdaResult.agencyChargesTotalUsd);
    y += 3.5;
  }

  // 6. Grand Total Estimate Row aligned with ISS Navy & Gold palette
  if (y > pageHeight - 62) {
    doc.addPage();
    y = 14;
  }
  doc.setFillColor(4, 36, 71);
  doc.setDrawColor(4, 36, 71);
  doc.rect(margin, y, contentWidth, 6.2, 'FD');
  doc.setFillColor(245, 180, 0);
  doc.rect(margin, y, contentWidth, 0.7, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + col1W + col2W, y + 0.7, margin + col1W + col2W, y + 6.2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(255, 255, 255);
  doc.text('Grand Total Estimate:', margin + col1W + col2W - 3, y + 4.4, { align: 'right' });
  doc.text('$', margin + col1W + col2W + 2, y + 4.4);
  doc.text(formatUsdCell(pdaResult.totalUsd), pageWidth - margin - 2, y + 4.4, { align: 'right' });

  y += 9.8;

  // Indicative rate footnote + FX info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `** Indicative rate for information only, This is subject to change acc to daily rate fluctuation. (FX: 1 USD = ${input.usdToMxn.toFixed(2)} MXN | Approx: $${pdaResult.totalMxn.toLocaleString('en-US', { minimumFractionDigits: 2 })} MXN)`,
    margin,
    y
  );

  y += 6.5;

  // 7. Two-Column Office Full Style (left) & ISS Bank Details (right)
  if (y > pageHeight - 54) {
    doc.addPage();
    y = 14;
  }

  const officeLeftX = margin;
  const bankRightX = margin + contentWidth * 0.52;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(15, 23, 42);
  doc.text(profile.officeTitle, officeLeftX, y);
  doc.text(profile.bankTitle, bankRightX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.1);
  doc.setTextColor(51, 65, 85);

  const officeLines = [
    profile.addressLine1,
    profile.addressLine2,
    `Telephone: ${profile.telephone}`,
    ...profile.emails.map((em) => `Email: ${em}`),
  ].filter((l) => l.trim().length > 0);

  const bankLines = [
    profile.bankName,
    `Bank Address: ${profile.bankAddress}`,
    `Account No: ${profile.accountNo}`,
    `Swift Number: ${profile.swiftNumber}`,
    `Currency: ${profile.currencyLabel}`,
    `Account owner: ${profile.accountOwner}`,
  ].filter((l) => l.trim().length > 0);

  let oy = y + 3.6;
  officeLines.forEach((line) => {
    doc.text(line, officeLeftX, oy);
    oy += 3.3;
  });

  let by = y + 3.6;
  bankLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, contentWidth * 0.46) as string[];
    doc.text(wrapped, bankRightX, by);
    by += wrapped.length * 3.3;
  });

  y = Math.max(oy, by) + 3.5;

  // 8. Red Remittance Notice
  const redLines = doc.splitTextToSize(profile.remittanceNotice, contentWidth) as string[];
  if (y + redLines.length * 3.4 + 26 > pageHeight - 8) {
    doc.addPage();
    y = 14;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(220, 38, 38);
  doc.text(redLines, margin, y);
  y += redLines.length * 3.3 + 3;

  // 9. Legal DISCLAIMER & Standard Billing Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  const discLines = doc.splitTextToSize(`DISCLAIMER : ${profile.disclaimerText}`, contentWidth) as string[];
  doc.text(discLines, margin, y);
  y += discLines.length * 2.9 + 2.5;

  const billLines = doc.splitTextToSize(profile.billingNoteText, contentWidth) as string[];
  doc.text(billLines, margin, y);

  doc.save(savedFilename);
  return savedFilename;
}

export function exportLineupToPdf(params: {
  filename: string;
  port: PortProfile;
  lineup: VesselLineupEntry[];
  lang: Language;
}): string {
  const { filename, port, lineup, lang } = params;
  const isEs = lang === 'es';
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const savedFilename = sanitizePdfFilename(filename, `LineUp-${port.shortCode}`);

  // Integrated Top Dark Navy Header + Top-Right Inchcape Brand
  const drawHeader = () => {
    doc.setFillColor(4, 36, 71);
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.setFillColor(245, 180, 0);
    doc.rect(0, 26, pageWidth, 1.2, 'F');

    doc.setTextColor(147, 197, 253);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ISS PORT INTELLIGENCE · NATIONAL VESSEL LINE-UP', margin, 8.5);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text(`${port.name} (${port.unLocode})`, margin, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(226, 232, 240);
    doc.text(
      `${isEs ? 'Autoridad:' : 'Authority:'} ${port.authority} · VHF: ${port.vhfChannel} · ${isEs ? 'Emitido:' : 'Issued:'} ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
      margin,
      22
    );

    drawInchcapeHeaderBrand(doc, pageWidth - margin, 4.2, 0.92);
  };

  drawHeader();

  const portVessels = lineup.filter((v) => v.portId === port.id);
  const countBy = (status: VesselLineupEntry['status']) =>
    portVessels.filter((v) => v.status === status).length;

  let y = 32;
  // Status summary bar
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(215, 222, 230);
  doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `TOTAL: ${portVessels.length}    |    BERTHED: ${countBy('BERTHED')}    |    ANCHORED: ${countBy('ANCHORED')}    |    EXPECTED: ${countBy('EXPECTED')}    |    SAILED: ${countBy('SAILED')}`,
    margin + 4,
    y + 5.7
  );

  y += 13;

  const colWidths = [56, 56, 66, 34, 34, contentWidth - 246];
  const drawTableHeader = (topY: number) => {
    doc.setFillColor(11, 37, 69);
    doc.rect(margin, topY, contentWidth, 7.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const headers = [
      isEs ? 'BUQUE / IMO' : 'VESSEL / IMO',
      isEs ? 'TERMINAL / MUELLE' : 'TERMINAL / BERTH',
      isEs ? 'CARGA / OPERACIÓN' : 'CARGO / OPERATION',
      'ETA / ETD',
      isEs ? 'AGENCIA' : 'AGENCY',
      isEs ? 'ESTATUS' : 'STATUS',
    ];
    let cx = margin;
    headers.forEach((h, i) => {
      doc.text(h, cx + 2.5, topY + 5);
      cx += colWidths[i];
    });
    return topY + 7.5;
  };

  y = drawTableHeader(y);

  portVessels.forEach((v, idx) => {
    const vesselTxt = v.imo ? `${v.vesselName}\nIMO ${v.imo}` : v.vesselName;
    const berthLines = doc.splitTextToSize(v.terminalOrBerth, colWidths[1] - 4) as string[];
    const cargoLines = doc.splitTextToSize(v.cargo, colWidths[2] - 4) as string[];
    const vesselLines = doc.splitTextToSize(vesselTxt, colWidths[0] - 4) as string[];
    const rowLines = Math.max(vesselLines.length, berthLines.length, cargoLines.length);
    const rowH = Math.max(8.5, rowLines * 4 + 3.5);

    if (y + rowH > pageHeight - 14) {
      doc.addPage();
      drawHeader();
      y = 32;
      y = drawTableHeader(y);
    }

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowH, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, rowH, 'S');

    let cx = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(vesselLines, cx + 2.5, y + 4.3);
    cx += colWidths[0];

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(berthLines, cx + 2.5, y + 4.3);
    cx += colWidths[1];

    doc.text(cargoLines, cx + 2.5, y + 4.3);
    cx += colWidths[2];

    doc.text(v.etaOrEtd, cx + 2.5, y + 4.5);
    cx += colWidths[3];

    doc.text(doc.splitTextToSize(v.agencyOrOperator, colWidths[4] - 4) as string[], cx + 2.5, y + 4.5);
    cx += colWidths[4];

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(v.status === 'BERTHED' ? 6 : v.status === 'CANCELLED' ? 185 : 4, v.status === 'BERTHED' ? 95 : v.status === 'CANCELLED' ? 28 : 36, v.status === 'BERTHED' ? 70 : v.status === 'CANCELLED' ? 28 : 71);
    doc.text(v.status, cx + 2.5, y + 4.5);

    y += rowH;
  });

  doc.save(savedFilename);
  return savedFilename;
}

function renderDossierToPdfPages(
  doc: jsPDF,
  dossier: ProductTechnicalDossier,
  portName: string,
  lang: Language,
  isFirstPage: boolean
) {
  const isEs = lang === 'es';
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 13;
  const contentWidth = pageWidth - margin * 2;
  const leftTextMaxW = contentWidth - 52;

  if (!isFirstPage) {
    doc.addPage();
  }

  // Header with integrated top-right Inchcape vector logo
  doc.setFillColor(4, 36, 71);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFillColor(0, 102, 204);
  doc.rect(0, 30, pageWidth, 1.5, 'F');

  doc.setTextColor(147, 197, 253);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text(
    `ISS PORT INTELLIGENCE · ${portName.toUpperCase()} · ${dossier.code} · UN ${dossier.unNumber} · IMO ${dossier.imoClass}`,
    margin,
    9.5
  );

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(
    isEs ? dossier.name : dossier.nameEn,
    leftTextMaxW
  ) as string[];
  doc.text(titleLines[0] ?? dossier.name, margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(226, 232, 240);
  const berthLine = doc.splitTextToSize(
    `${isEs ? 'Muelles:' : 'Berths:'} ${dossier.coatzacoalcosBerths}  |  ${
      isEs ? 'Terminales:' : 'Terminals:'
    } ${dossier.concessionaires}`,
    leftTextMaxW
  )[0];
  doc.text(berthLine ?? '', margin, 25.5);

  // Seamless integrated top-right Inchcape logo inside dark header
  drawInchcapeHeaderBrand(doc, pageWidth - margin, 6.0, 0.88);

  let y = 36;

  // Summary Callout
  const summaryLines = doc.splitTextToSize(
    isEs ? dossier.summary : dossier.summaryEn,
    contentWidth - 8
  ) as string[];
  const summaryH = summaryLines.length * 4 + 6;
  doc.setFillColor(240, 247, 255);
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(margin, y, contentWidth, summaryH, 1.5, 1.5, 'FD');
  doc.setTextColor(29, 29, 31);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(summaryLines, margin + 4, y + 5.2);
  y += summaryH + 3.5;

  // Optional HDS / GHS / NFPA / PPE Block
  const flashPt = isEs ? dossier.flashPoint : dossier.flashPointEn ?? dossier.flashPoint;
  const hdsText = isEs ? dossier.hdsPemexSummary : dossier.hdsPemexSummaryEn ?? dossier.hdsPemexSummary;
  const ppeText = isEs ? dossier.ppeRequired : dossier.ppeRequiredEn ?? dossier.ppeRequired;
  const metaParts = [
    dossier.casNumber ? `CAS: ${dossier.casNumber}` : '',
    flashPt ? `${isEs ? 'P. Inflamación' : 'Flash Pt'}: ${flashPt}` : '',
    dossier.nfpa704 ? `NFPA 704: ${dossier.nfpa704}` : '',
  ].filter(Boolean);

  if (metaParts.length > 0 || hdsText || ppeText) {
    const hdsCombined = [
      metaParts.join('  |  '),
      hdsText ? `HDS/GHS: ${hdsText}` : '',
      ppeText ? `${isEs ? 'EPP' : 'PPE'}: ${ppeText}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    const hdsLines = doc.splitTextToSize(hdsCombined, contentWidth - 8) as string[];
    const hdsHeight = hdsLines.length * 3.7 + 6;
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(margin, y, contentWidth, hdsHeight, 1.5, 1.5, 'FD');
    doc.setTextColor(69, 26, 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.text(hdsLines, margin + 4, y + 4.8);
    y += hdsHeight + 4;
  } else {
    y += 1.5;
  }

  const sections: Array<{ label: string; value: string; alert?: boolean }> = [
    {
      label: isEs ? '01. Identidad y Grado' : '01. Identity & Grade',
      value: isEs ? dossier.identity : dossier.identityEn,
    },
    {
      label: isEs ? '02. Estado Físico y Riesgos' : '02. Physical State & Hazards',
      value: isEs ? dossier.stateAndHazard : dossier.stateAndHazardEn,
    },
    {
      label: isEs ? '03. Compatibilidad de Circuito y Sellos' : '03. System & Seal Compatibility',
      value: isEs ? dossier.compatibility : dossier.compatibilityEn,
    },
    {
      label: isEs ? '04. Calidad, Humedad y Producto Previo' : '04. Quality & Previous Cargo',
      value: isEs ? dossier.qualityControl : dossier.qualityControlEn,
    },
    {
      label: isEs ? '05. Límites de Temperatura' : '05. Temperature Envelope',
      value: isEs ? dossier.temperatureLimits : dossier.temperatureLimitsEn,
    },
    {
      label: isEs ? '06. Conexión, Bridas y Vapores' : '06. Connection, Flanges & Vapor Control',
      value: isEs ? dossier.connectionSpecs : dossier.connectionSpecsEn,
    },
    {
      label: isEs ? '07. Método y Caudal de Transferencia' : '07. Transfer Method & Rates',
      value: isEs ? dossier.transferRates : dossier.transferRatesEn,
    },
    {
      label: isEs ? '08. Estabilidad, Inhibidores y Atmósfera' : '08. Stability, Inhibitors & Blanket',
      value: isEs ? dossier.stabilityControl : dossier.stabilityControlEn,
    },
    {
      label: isEs ? '09. Terminación, Drenado y Desconexión' : '09. Termination, Draining & Disconnect',
      value: isEs ? dossier.terminationProcedure : dossier.terminationProcedureEn,
    },
    {
      label: isEs ? '10. Criterios de Rechazo / Paro Inmediato' : '10. Stop / Rejection Criteria',
      value: isEs ? dossier.rejectionCriteria : dossier.rejectionCriteriaEn,
      alert: true,
    },
  ];

  sections.forEach((sec) => {
    const bodyLines = doc.splitTextToSize(sec.value, contentWidth - 6) as string[];
    const boxHeight = bodyLines.length * 3.85 + 9;
    if (y + boxHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
    }

    if (sec.alert) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
    }
    doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    if (sec.alert) {
      doc.setTextColor(185, 28, 28);
    } else {
      doc.setTextColor(4, 36, 71);
    }
    doc.text(sec.label, margin + 3.5, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.1);
    doc.setTextColor(38, 38, 42);
    doc.text(bodyLines, margin + 3.5, y + 9.2);

    y += boxHeight + 2.5;
  });

  if (y < pageHeight - 10) {
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${isEs ? 'Fuentes y referencias:' : 'Reference sources:'} ${dossier.referenceSource}`,
      margin,
      Math.min(pageHeight - 7, y + 3)
    );
  }
}

export function exportProductDossierToPdf(params: {
  filename: string;
  dossier: ProductTechnicalDossier;
  portName: string;
  lang: Language;
}): string {
  const { filename, dossier, portName, lang } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  renderDossierToPdfPages(doc, dossier, portName, lang, true);
  const saved = sanitizePdfFilename(filename, dossier.code);
  doc.save(saved);
  return saved;
}

export function exportAllProductsCatalogToPdf(params: {
  filename: string;
  dossiers: ProductTechnicalDossier[];
  portName: string;
  lang: Language;
}): string {
  const { filename, dossiers, portName, lang } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  dossiers.forEach((dossier, idx) => {
    renderDossierToPdfPages(doc, dossier, portName, lang, idx === 0);
  });
  const saved = sanitizePdfFilename(filename, `Catalogo-Productos-${portName}`);
  doc.save(saved);
  return saved;
}
