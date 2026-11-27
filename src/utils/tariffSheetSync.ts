import type {
  PdaChargeSection,
  PdaCustomField,
  PdaFormatPreset,
  PdaFormulaType,
  PdaPurpose,
  PdaSubItemCalcMode,
  PdaSubItemDef,
  PdaVesselType,
  PortProfile,
  TariffItem,
  TariffUnit,
} from '../types/port';

export interface NormalizedSheetTarget {
  fetchUrl: string;
  mode: 'google_sheet' | 'apps_script';
  spreadsheetId?: string;
  gid?: string;
}

/**
 * Normalizes a Google Sheet link, Spreadsheet ID, or Apps Script Web App URL
 * into a directly fetchable CSV or JSON endpoint.
 */
export function normalizeTariffSheetUrl(rawInput: string): NormalizedSheetTarget | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Google Apps Script /exec endpoint
  if (trimmed.includes('script.google.com/macros/')) {
    return {
      fetchUrl: trimmed,
      mode: 'apps_script',
    };
  }

  // Published Google Sheet CSV or direct gviz URL
  if (trimmed.includes('/gviz/tq') || trimmed.includes('output=csv') || trimmed.includes('format=csv')) {
    return {
      fetchUrl: trimmed,
      mode: 'google_sheet',
    };
  }

  // Standard Google Sheets browser URL: https://docs.google.com/spreadsheets/d/{ID}/edit#gid={GID}
  const sheetMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch?.[1]) {
    const spreadsheetId = sheetMatch[1];
    const gidMatch = trimmed.match(/[?&#]gid=(\d+)/);
    const gid = gidMatch?.[1] ?? '0';
    return {
      fetchUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
      mode: 'google_sheet',
      spreadsheetId,
      gid,
    };
  }

  // Bare Spreadsheet ID
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return {
      fetchUrl: `https://docs.google.com/spreadsheets/d/${trimmed}/gviz/tq?tqx=out:csv&gid=0`,
      mode: 'google_sheet',
      spreadsheetId: trimmed,
      gid: '0',
    };
  }

  // Any other direct CSV or JSON endpoint
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      fetchUrl: trimmed,
      mode: trimmed.toLowerCase().includes('.json') ? 'apps_script' : 'google_sheet',
    };
  }

  return null;
}

function normalizeHeaderKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Parses CSV or TSV (tab-separated copy-paste from Excel/Sheets) into a 2D array.
 */
export function parseDelimitedTable(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  // Detect tab-separated text from clipboard vs comma-separated CSV
  const firstLine = clean.split(/\r?\n/)[0] ?? '';
  const tabCount = (firstLine.match(/\t/g) ?? []).length;
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  const delimiter =
    tabCount >= 2 && tabCount >= commaCount
      ? '\t'
      : semicolonCount > commaCount
      ? ';'
      : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field.trim());
      field = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(field.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      field = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      row.push(field.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  row.push(field.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

export function normalizeTariffUnit(rawUnit: string): TariffUnit {
  const u = normalizeHeaderKey(rawUnit);
  if (u === 'per_gt' || u.includes('gt') || u.includes('uab') || u.includes('grt') || u.includes('trb')) {
    return 'per_gt';
  }
  if (u === 'per_loa_m' || u.includes('loa') || u.includes('eslora') || u.includes('metro')) {
    return 'per_loa_m';
  }
  if (u === 'per_tug_hour' || u.includes('tug') || u.includes('remolc')) {
    return 'per_tug_hour';
  }
  if (u === 'per_day' || u.includes('day') || u.includes('dia')) {
    return 'per_day';
  }
  if (u === 'per_ton' || u.includes('ton') || u.includes('mt') || u.includes('tm')) {
    return 'per_ton';
  }
  return 'flat';
}

function parseNumericRate(rawRate: unknown): number {
  if (typeof rawRate === 'number' && Number.isFinite(rawRate)) return rawRate;
  const cleaned = String(rawRate ?? '')
    .replace(/[^0-9.,-]/g, '')
    .replace(/,(?=\d{3}(?:\D|$))/g, '');
  const normalized = cleaned.includes(',') && !cleaned.includes('.')
    ? cleaned.replace(',', '.')
    : cleaned.replace(/,/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function resolvePortId(rawPort: string | undefined, defaultPortId: string, ports?: PortProfile[]): string {
  if (!rawPort || !rawPort.trim()) return defaultPortId;
  const q = rawPort.trim().toLowerCase();
  if (!ports) return defaultPortId;
  const match = ports.find(
    (p) =>
      p.id.toLowerCase() === q ||
      p.shortCode.toLowerCase() === q ||
      p.unLocode.toLowerCase() === q ||
      p.name.toLowerCase() === q
  );
  return match?.id ?? defaultPortId;
}

function resolveAreaId(rawArea: string | undefined, portId: string): string {
  const a = (rawArea ?? '').trim();
  if (!a || a.toUpperCase() === 'ALL' || a.toLowerCase() === 'todos') return 'ALL';
  const low = a.toLowerCase();
  if (portId === 'mxcoa') {
    if (low.includes('pajarito')) return 'area-pajaritos';
    if (low.includes('asipona') || low.includes('coatzacoalcos') || low.includes('comercial')) {
      return 'area-asipona-coa';
    }
    if (low.includes('offshore') || low.includes('protexa') || low.includes('cotemar')) {
      return 'area-coa-offshore';
    }
  }
  return a;
}

function pickField(record: Record<string, unknown>, candidates: string[]): string {
  for (const key of candidates) {
    if (record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== '') {
      return String(record[key]).trim();
    }
  }
  return '';
}

function normalizeChargeSection(raw: string): PdaChargeSection | undefined {
  const s = normalizeHeaderKey(raw);
  if (!s) return undefined;
  if (s.includes('agency') || s.includes('agencia') || s.includes('honorario')) {
    return 'agency';
  }
  if (s.includes('husbandry') || s.includes('inspector') || s.includes('tecnico')) {
    return 'husbandry';
  }
  if (s === 'crew' || s.includes('tripul') || s.includes('crew_charge') || s.includes('crew_signer')) {
    return 'crew';
  }
  return 'port';
}

function normalizeFormulaType(raw: string): PdaFormulaType | undefined {
  const f = normalizeHeaderKey(raw);
  if (!f) return undefined;
  if (f === 'sub_items_breakdown' || f.includes('sub_item') || f.includes('subitem') || f.includes('desglose')) {
    return 'sub_items_breakdown';
  }
  if (f === 'port_dues_hybrid' || f.includes('harbour') || f.includes('port_due')) return 'port_dues_hybrid';
  if (f === 'dockage_loa_hours' || f.includes('dockage') || f.includes('muellaje_hr')) return 'dockage_loa_hours';
  if (f === 'pilotage_gt_movements' || f.includes('pilot')) return 'pilotage_gt_movements';
  if (f === 'towage_tugs' || f.includes('tow') || f.includes('tug')) return 'towage_tugs';
  if (f === 'agency_extra_days' || f.includes('extra_day')) return 'agency_extra_days';
  if (f === 'flat_with_vat' || f.includes('flat_vat')) return 'flat_with_vat';
  if (f === 'custom_expression' || f.includes('custom') || f.includes('expr')) return 'custom_expression';
  if (f === 'standard') return 'standard';
  return undefined;
}

function parseSubItemsRaw(raw: unknown): PdaSubItemDef[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    const valid = raw
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item, idx): PdaSubItemDef => {
        const modeRaw = String(item.calcMode ?? 'per_qty');
        const calcMode: PdaSubItemCalcMode =
          modeRaw === 'fixed' ||
          modeRaw === 'per_qty' ||
          modeRaw === 'grt_rate' ||
          modeRaw === 'loa_hrs' ||
          modeRaw === 'grt_mov' ||
          modeRaw === 'tug_hrs'
            ? modeRaw
            : 'per_qty';
        return {
          id: String(item.id ?? `sub-sheet-${idx + 1}`),
          code: item.code ? String(item.code) : undefined,
          label: String(item.label ?? `Servicio ${idx + 1}`),
          labelEn: String(item.labelEn ?? item.label ?? `Service ${idx + 1}`),
          unitLabel: item.unitLabel ? String(item.unitLabel) : undefined,
          rate: parseNumericRate(item.rate ?? 0),
          calcMode,
          defaultQty: parseNumericRate(item.defaultQty ?? 0),
          notes: item.notes ? String(item.notes) : undefined,
        };
      });
    return valid.length > 0 ? valid : undefined;
  }
  const str = String(raw).trim();
  if (!str) return undefined;
  if (str.startsWith('[')) {
    try {
      return parseSubItemsRaw(JSON.parse(str));
    } catch {
      return undefined;
    }
  }
  return undefined;
}

const KNOWN_VESSEL_TYPES: PdaVesselType[] = [
  'Tanker / Chemical',
  'Crude / Aframax',
  'Gas Carrier (LPG/Ethane)',
  'Dry Bulk',
  'General Cargo / Steel',
  'Container',
  'Rail Ferry',
  'Offshore',
];

function parseVesselTypesList(raw: string): PdaVesselType[] | 'ALL' | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.toUpperCase() === 'ALL' || trimmed.toLowerCase() === 'todos') return 'ALL';
  const parts = trimmed.split(/[|,;]+/).map((p) => p.trim().toLowerCase()).filter(Boolean);
  const matched: PdaVesselType[] = [];
  for (const part of parts) {
    const exact = KNOWN_VESSEL_TYPES.find((vt) => vt.toLowerCase() === part || vt.toLowerCase().includes(part));
    if (exact && !matched.includes(exact)) matched.push(exact);
  }
  return matched.length > 0 ? matched : 'ALL';
}

const KNOWN_PURPOSES: PdaPurpose[] = [
  'DISCHARGE',
  'LOAD',
  'LOAD & DISCHARGE',
  'BUNKERING',
  'CREW CHANGE',
  'REPAIRS',
  'ANCHORAGE',
];

function parsePurposesList(raw: string): PdaPurpose[] | 'ALL' | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.toUpperCase() === 'ALL' || trimmed.toLowerCase() === 'todos') return 'ALL';
  const parts = trimmed.split(/[|,;]+/).map((p) => p.trim().toUpperCase()).filter(Boolean);
  const matched: PdaPurpose[] = [];
  for (const part of parts) {
    const exact = KNOWN_PURPOSES.find((pr) => pr === part || pr.includes(part));
    if (exact && !matched.includes(exact)) matched.push(exact);
  }
  return matched.length > 0 ? matched : 'ALL';
}

function normalizeVesselTypeSingle(raw: string): PdaVesselType {
  const parsed = parseVesselTypesList(raw);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  return 'Tanker / Chemical';
}

function normalizePurposeSingle(raw: string): PdaPurpose {
  const parsed = parsePurposesList(raw);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  return 'DISCHARGE';
}

function parseVatRateValue(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const num = parseNumericRate(raw);
  if (num > 1 && num <= 100) return num / 100;
  return num;
}

function parseCustomFieldsRaw(raw: unknown): PdaCustomField[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item, idx) => ({
        id: String(item.id ?? `cf-sheet-${idx}`),
        label: String(item.label ?? 'FIELD').toUpperCase(),
        value: String(item.value ?? ''),
        column: item.column === 'right' ? 'right' : 'left',
        active: item.active !== false,
      }));
  }
  const str = String(raw).trim();
  if (!str) return undefined;
  if (str.startsWith('[')) {
    try {
      return parseCustomFieldsRaw(JSON.parse(str));
    } catch {
      return undefined;
    }
  }
  // Support compact pipe format: "CHARTERER:VITOL|LAYCAN:24-26 NOV"
  return str
    .split('|')
    .map((pair, idx): PdaCustomField | null => {
      const [label, ...rest] = pair.split(':');
      if (!label?.trim()) return null;
      return {
        id: `cf-sheet-${idx}`,
        label: label.trim().toUpperCase(),
        value: rest.join(':').trim(),
        column: idx % 2 === 0 ? 'left' : 'right',
        active: true,
      };
    })
    .filter((x): x is PdaCustomField => x !== null);
}

export interface TariffParseResult {
  items: TariffItem[];
  formats: PdaFormatPreset[];
  skippedRows: number;
}

export function parseTariffRowsFromCsvOrJson(
  rawText: string,
  defaultPortId: string,
  ports?: PortProfile[]
): TariffParseResult {
  const trimmed = rawText.replace(/^\uFEFF/, '').trim();
  if (!trimmed) {
    throw new Error('No data received from Google Sheet.');
  }

  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    throw new Error(
      'Google Sheet returned an HTML login page instead of CSV/JSON. Ensure the sheet is shared as "Anyone with the link (Viewer)" or published to the web as CSV.'
    );
  }

  let records: Record<string, unknown>[] = [];
  let rawFormatRecords: Record<string, unknown>[] = [];

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed) as unknown;
    const rawArray = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>).tariffs ??
        (parsed as Record<string, unknown>).data ??
        (parsed as Record<string, unknown>).rows ??
        (parsed as Record<string, unknown>).items
      : null;

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const formatsArr =
        (parsed as Record<string, unknown>).formats ??
        (parsed as Record<string, unknown>).pdaFormats ??
        (parsed as Record<string, unknown>).presets;
      if (Array.isArray(formatsArr)) {
        rawFormatRecords = formatsArr
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map((item) => {
            const normalized: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(item)) {
              normalized[normalizeHeaderKey(k)] = v;
            }
            return normalized;
          });
      }
    }

    if (!Array.isArray(rawArray) && rawFormatRecords.length === 0) {
      throw new Error('JSON response does not contain an array of tariff rows.');
    }

    if (Array.isArray(rawArray)) {
      records = rawArray
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => {
          const normalized: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(item)) {
            normalized[normalizeHeaderKey(k)] = v;
          }
          return normalized;
        });
    }
  } else {
    const table = parseDelimitedTable(trimmed);
    if (table.length < 2) {
      throw new Error('Spreadsheet CSV must contain a header row and at least one tariff row.');
    }
    const headers = table[0].map((h) => normalizeHeaderKey(h));
    for (let r = 1; r < table.length; r++) {
      const cells = table[r];
      const rec: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        if (h) rec[h] = cells[idx] ?? '';
      });
      records.push(rec);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const items: TariffItem[] = [];
  const formats: PdaFormatPreset[] = [];
  let skippedRows = 0;

  records.forEach((rec, index) => {
    // Check if row is a PDA Format row mixed in the sheet
    const formatName = pickField(rec, ['formatname', 'format_name', 'presetname', 'preset_name', 'formato', 'pda_format']);
    const concept = pickField(rec, [
      'concept',
      'concepto',
      'descripcion',
      'description',
      'servicio',
      'service',
      'item',
      'rubro',
    ]);

    if (formatName && !concept) {
      rawFormatRecords.push(rec);
      return;
    }

    const rawRate = pickField(rec, [
      'rate',
      'tarifa',
      'monto',
      'precio',
      'importe',
      'cost',
      'costo',
      'unit_rate',
    ]);

    if (!concept) {
      skippedRows++;
      return;
    }

    const rate = parseNumericRate(rawRate);
    const code =
      pickField(rec, ['code', 'codigo', 'clave', 'id']) ||
      `SHEET-${defaultPortId.toUpperCase()}-${String(index + 1).padStart(2, '0')}`;
    const conceptEn = pickField(rec, ['concepten', 'concept_en', 'concepto_en', 'english']) || concept;
    const provider =
      pickField(rec, ['provider', 'proveedor', 'prestador', 'vendor', 'autoridad']) ||
      'Google Sheet Tarifario';
    const unitRaw = pickField(rec, ['unit', 'unidad', 'base', 'basis', 'cobro']) || 'flat';
    const currencyRaw = pickField(rec, ['currency', 'moneda', 'divisa']).toUpperCase();
    const currency: 'USD' | 'MXN' = currencyRaw === 'MXN' || currencyRaw === 'PESOS' ? 'MXN' : 'USD';
    const portId = resolvePortId(
      pickField(rec, ['portid', 'port_id', 'puerto', 'port', 'unlocode']),
      defaultPortId,
      ports
    );
    const areaId = resolveAreaId(
      pickField(rec, ['areaid', 'area_id', 'area', 'recinto', 'terminal', 'enclosure']),
      portId
    );
    const effectiveFrom =
      pickField(rec, ['effectivefrom', 'effective_from', 'vigencia', 'fecha']) || today;
    const notes =
      pickField(rec, ['notes', 'notas', 'observaciones', 'remarks']) ||
      'Sincronizado desde Google Sheet de Tarifas.';
    const activeRaw = pickField(rec, ['active', 'activo', 'estatus', 'status']).toLowerCase();
    const active =
      activeRaw === 'false' ||
      activeRaw === '0' ||
      activeRaw === 'no' ||
      activeRaw === 'inactivo' ||
      activeRaw === 'off'
        ? false
        : true;
    const verifiedRaw = pickField(rec, ['verificationstatus', 'verificado', 'verified']).toLowerCase();

    const chargeSection = normalizeChargeSection(
      pickField(rec, ['chargesection', 'charge_section', 'section', 'seccion', 'grupo'])
    );
    const formulaType = normalizeFormulaType(
      pickField(rec, ['formulatype', 'formula_type', 'calculo', 'calc_type'])
    );
    const customFormula = pickField(rec, ['customformula', 'custom_formula', 'formula', 'ecuacion']) || undefined;
    const baseFixedRaw = pickField(rec, ['basefixed', 'base_fixed', 'fijo', 'fixed_base']);
    const baseFixed = baseFixedRaw ? parseNumericRate(baseFixedRaw) : undefined;
    const vatRate = parseVatRateValue(pickField(rec, ['vatrate', 'vat_rate', 'iva', 'vat']));
    const movementsRaw = pickField(rec, ['movements', 'movimientos', 'maniobras']);
    const movements = movementsRaw ? Math.max(1, Math.round(parseNumericRate(movementsRaw))) : undefined;
    const tugsRaw = pickField(rec, ['tugscount', 'tugs_count', 'tugs', 'remolcadores']);
    const tugsCount = tugsRaw ? Math.max(1, Math.round(parseNumericRate(tugsRaw))) : undefined;
    const includedDaysRaw = pickField(rec, ['includeddays', 'included_days', 'dias_incluidos']);
    const includedDays = includedDaysRaw ? Math.max(0, Math.round(parseNumericRate(includedDaysRaw))) : undefined;
    const applicableVesselTypes = parseVesselTypesList(
      pickField(rec, ['applicablevesseltypes', 'vesseltypes', 'vessel_types', 'tipo_buque', 'vessel_type'])
    );
    const applicablePurposes = parsePurposesList(
      pickField(rec, ['applicablepurposes', 'purposes', 'proposito', 'purpose'])
    );
    const remarksTemplate = pickField(rec, ['remarkstemplate', 'remarks_template', 'plantilla_remarks']) || undefined;
    const showZeroRaw = pickField(rec, ['showzeroamount', 'show_zero', 'mostrar_cero']).toLowerCase();
    const showZeroAmount =
      showZeroRaw === 'true' || showZeroRaw === '1' || showZeroRaw === 'si' ? true : undefined;
    const subItems = parseSubItemsRaw(rec.subitems ?? rec.sub_items ?? rec.desglose);

    items.push({
      id: `tar-sheet-${portId}-${index + 1}-${Date.now().toString(36)}`,
      portId,
      areaId,
      code,
      concept,
      conceptEn,
      provider,
      unit: normalizeTariffUnit(unitRaw),
      rate,
      currency,
      effectiveFrom,
      notes,
      notesEn: notes,
      verificationStatus:
        verifiedRaw === 'verified' || verifiedRaw === 'si' || verifiedRaw === 'true' || verifiedRaw === 'verificado'
          ? 'verified'
          : 'pending_validation',
      active,
      chargeSection,
      formulaType: subItems ? formulaType ?? 'sub_items_breakdown' : formulaType ?? (customFormula ? 'custom_expression' : undefined),
      customFormula,
      baseFixed,
      vatRate,
      movements,
      tugsCount,
      includedDays,
      applicableVesselTypes,
      applicablePurposes,
      remarksTemplate,
      showZeroAmount,
      subItems,
    });
  });

  rawFormatRecords.forEach((rec, idx) => {
    const name = pickField(rec, ['formatname', 'format_name', 'presetname', 'preset_name', 'formato', 'name', 'nombre']);
    if (!name) return;
    const portIdRaw = pickField(rec, ['portid', 'port_id', 'puerto', 'port']);
    const resolvedPort = portIdRaw.toUpperCase() === 'ALL'
      ? 'ALL'
      : resolvePortId(portIdRaw, defaultPortId, ports);
    const vesselType = normalizeVesselTypeSingle(
      pickField(rec, ['vesseltype', 'vessel_type', 'tipo_buque', 'buque_tipo'])
    );
    const purpose = normalizePurposeSingle(
      pickField(rec, ['purpose', 'proposito', 'operacion'])
    );
    const defaultCargo = pickField(rec, ['defaultcargo', 'cargo', 'producto']) || 'VEG OIL';
    const defaultQuantity = parseNumericRate(pickField(rec, ['defaultquantity', 'quantity', 'cantidad']) || '7000') || 7000;
    const defaultOpsRateMtHr = parseNumericRate(pickField(rec, ['opsrate', 'defaultopsratemthr', 'ops_rate', 'ritmo']) || '150') || 150;
    const defaultTugsCount = Math.max(1, Math.round(parseNumericRate(pickField(rec, ['tugscount', 'tugs', 'remolcadores']) || '2') || 2));
    const defaultTugHours = parseNumericRate(pickField(rec, ['tughours', 'tug_hours', 'hrs_remolque']) || '3') || 3;
    const defaultMovements = Math.max(1, Math.round(parseNumericRate(pickField(rec, ['movements', 'movimientos']) || '2') || 2));
    const defaultAreaRaw = pickField(rec, ['areaid', 'defaultareaid', 'recinto']);
    const customFields = parseCustomFieldsRaw(rec.customfields ?? rec.custom_fields ?? rec.campos);

    formats.push({
      id: `fmt-sheet-${idx + 1}-${Date.now().toString(36)}`,
      portId: resolvedPort,
      name,
      nameEn: pickField(rec, ['nameen', 'name_en']) || name,
      vesselType,
      purpose,
      defaultCargo,
      defaultQuantity,
      defaultOpsRateMtHr,
      defaultTugsCount,
      defaultTugHours,
      defaultMovements,
      defaultAreaId: defaultAreaRaw ? resolveAreaId(defaultAreaRaw, defaultPortId) : undefined,
      customFields,
      notes: pickField(rec, ['notes', 'notas']) || 'Sincronizado desde Google Sheets.',
    });
  });

  if (items.length === 0 && formats.length === 0) {
    throw new Error(
      'No valid tariff or PDA format rows found. Expected columns like: code, concept, provider, unit, rate, currency.'
    );
  }

  return { items, formats, skippedRows };
}
