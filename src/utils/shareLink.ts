import type { PortProfile } from '../types/port';

export type ShareSectionKey =
  | 'status_weather'
  | 'general_info'
  | 'restrictions'
  | 'port_map'
  | 'terminals'
  | 'cargo_matrix'
  | 'port_services'
  | 'lineup'
  | 'tariffs_pda'
  | 'authorities'
  | 'directory_knowledge';

export interface ShareSectionMeta {
  key: ShareSectionKey;
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  anchorHref: string;
  defaultOperational: boolean;
}

export const SHARE_SECTION_CATALOG: ShareSectionMeta[] = [
  {
    key: 'status_weather',
    labelEs: '01. Estatus Portuario, Clima e Histórico',
    labelEn: '01. Port Status, Weather & History',
    descEs: 'Semáforo de apertura/cierre, cierres históricos y pronóstico marino.',
    descEn: 'Open/closure status, closure timeline, and marine weather.',
    anchorHref: '#port-status',
    defaultOperational: true,
  },
  {
    key: 'general_info',
    labelEs: '02. Posición Geográfica y Datos Generales',
    labelEn: '02. Position & General Particulars',
    descEs: 'UN/LOCODE, huso horario, turnos, feriados y nivel PBIP.',
    descEn: 'UN/LOCODE, UTC offset, shifts, holidays, and ISPS level.',
    anchorHref: '#general-position',
    defaultOperational: true,
  },
  {
    key: 'restrictions',
    labelEs: '03 y 04. Calados, Fondeaderos y Restricciones',
    labelEn: '03 & 04. Drafts, Anchorages & Restrictions',
    descEs: 'Profundidades (m/ft), canales, zonas de fondeo y reglas operativas.',
    descEn: 'Depths (m/ft), channels, anchorage zones, and operating rules.',
    anchorHref: '#restrictions',
    defaultOperational: true,
  },
  {
    key: 'port_map',
    labelEs: '05. Panorama y Mapa Portuario',
    labelEn: '05. Port Overview & Interactive Map',
    descEs: 'Distribución visual interactiva de recintos y terminales.',
    descEn: 'Interactive enclosure and terminal layout view.',
    anchorHref: '#port-map',
    defaultOperational: true,
  },
  {
    key: 'terminals',
    labelEs: '06. Terminales, Muelles y Cesionarios',
    labelEn: '06. Terminals, Berths & Concessionaires',
    descEs: 'Minisitios de terminales, dimensiones de muelles y fichas TASP.',
    descEn: 'Terminal minisites, berth dimensions, and pier specification sheets.',
    anchorHref: '#terminals',
    defaultOperational: true,
  },
  {
    key: 'cargo_matrix',
    labelEs: '06B. Productos que se Manejan y Fichas SDS/HDS',
    labelEn: '06B. Handled Commodities & Technical Dossiers',
    descEs: 'Buscador por producto, bridas, caudales y criterios de rechazo.',
    descEn: 'Commodity filter, connections, transfer rates, and rejection rules.',
    anchorHref: '#cargo-matrix',
    defaultOperational: true,
  },
  {
    key: 'port_services',
    labelEs: '07. Servicios Portuarios Disponibles',
    labelEn: '07. Available Port Marine Services',
    descEs: 'Practicaje, remolque, lanchaje, avituallamiento, desechos y bunkering.',
    descEn: 'Pilotage, towage, launch boat, provisions, sludge, and bunkering.',
    anchorHref: '#port-services',
    defaultOperational: true,
  },
  {
    key: 'lineup',
    labelEs: '08. Line-Up Actual de Buques',
    labelEn: '08. Current Vessel Line-Up',
    descEs: 'Buques anunciados, fondeados y atracados con ETA/ETD.',
    descEn: 'Expected, anchored, and berthed vessels with ETA/ETD.',
    anchorHref: '#lineup',
    defaultOperational: true,
  },
  {
    key: 'tariffs_pda',
    labelEs: '09. Tarifario Maestro y Calculador PDA',
    labelEn: '09. Master Tariffs & PDA Calculator',
    descEs: 'Tarifas portuarias y estimador PDA (oculto si se desmarca).',
    descEn: 'Port tariffs and PDA estimator (hidden if unchecked).',
    anchorHref: '#tariffs-pda',
    defaultOperational: false,
  },
  {
    key: 'authorities',
    labelEs: '10. Autoridades, Spare Parts y Crew Change',
    labelEn: '10. Authorities, Spare Parts & Crew Change',
    descEs: 'Capitanía (32 cert.), ASIPONA, Aduana, INM, Sanidad y SENASICA.',
    descEn: 'Harbor Master (32 certs), ASIPONA, Customs, INM, Health, SENASICA.',
    anchorHref: '#authorities-crew',
    defaultOperational: true,
  },
  {
    key: 'directory_knowledge',
    labelEs: '11. Directorio, Organigrama, Procedimientos y Optic',
    labelEn: '11. Directory, Org Chart, Procedures & Optic',
    descEs: 'Contactos ISS, procedimientos por fase y herramientas internas.',
    descEn: 'ISS contacts, operational procedures, and internal tools.',
    anchorHref: '#hub-knowledge',
    defaultOperational: false,
  },
];

export const ALL_SHARE_SECTION_KEYS: ShareSectionKey[] = SHARE_SECTION_CATALOG.map(
  (item) => item.key
);

const VALID_SECTION_SET = new Set<ShareSectionKey>(ALL_SHARE_SECTION_KEYS);

export function normalizeShareSections(sections?: ShareSectionKey[]): ShareSectionKey[] {
  if (!sections || sections.length === 0) return [];
  const chosen = new Set(sections.filter((k) => VALID_SECTION_SET.has(k)));
  return ALL_SHARE_SECTION_KEYS.filter((k) => chosen.has(k));
}

export interface ExclusiveShareUrlResult {
  url: string;
  portId: string;
  expiresAtMs: number;
  sections: ShareSectionKey[];
  terminalIds?: string[];
  subterminalIds?: string[];
  sig: string;
}

export interface ParsedExclusiveShareState {
  isExclusive: boolean;
  portId?: string;
  expiresAtMs?: number;
  allowedSections: ShareSectionKey[];
  allowedTerminalIds?: string[];
  allowedSubterminalIds?: string[];
  isExpired: boolean;
  isTampered: boolean;
}

const SHARE_SALT = 'iss-mx-port-exclusive-2026';

export function computeShareSignature(
  portId: string,
  expiresAtMs: number,
  secParam: string = '',
  termParam: string = '',
  subParam: string = ''
): string {
  const input =
    termParam || subParam
      ? `${SHARE_SALT}:${portId}:${expiresAtMs}:${secParam || 'ALL'}:t=${termParam || 'ALL'}:s=${subParam || 'ALL'}`
      : secParam
      ? `${SHARE_SALT}:${portId}:${expiresAtMs}:${secParam}`
      : `${SHARE_SALT}:${portId}:${expiresAtMs}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (Math.imul(h2 ^ ch, 0x85ebca6b) + i) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}

function encodeIdSubset(
  selected?: string[],
  allKnown?: string[]
): { param: string; normalized?: string[] } {
  if (selected === undefined) {
    return { param: '', normalized: undefined };
  }
  const unique = Array.from(
    new Set(selected.map((s) => s.trim()).filter(Boolean))
  );
  if (allKnown && allKnown.length > 0) {
    const selectedSet = new Set(unique);
    const allMatch = allKnown.every((id) => selectedSet.has(id));
    if (allMatch) {
      return { param: '', normalized: allKnown };
    }
  }
  if (unique.length === 0) {
    return { param: 'none', normalized: [] };
  }
  return { param: unique.join(','), normalized: unique };
}

function decodeIdSubset(raw: string): string[] | undefined {
  if (!raw) return undefined;
  if (raw === 'none') return [];
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

export function buildExclusivePortShareUrl(params: {
  origin: string;
  pathname?: string;
  portId: string;
  durationHours: number;
  sections?: ShareSectionKey[];
  terminalIds?: string[];
  allPortTerminalIds?: string[];
  subterminalIds?: string[];
  allPortSubterminalIds?: string[];
  nowMs?: number;
}): ExclusiveShareUrlResult {
  const {
    origin,
    pathname = '/',
    portId,
    durationHours,
    sections,
    terminalIds,
    allPortTerminalIds,
    subterminalIds,
    allPortSubterminalIds,
    nowMs = Date.now(),
  } = params;
  const clampedHours = Math.max(1, Number.isFinite(durationHours) ? durationHours : 24);
  const expiresAtMs = Math.round(nowMs + clampedHours * 60 * 60 * 1000);

  const normalizedSections =
    sections !== undefined ? normalizeShareSections(sections) : ALL_SHARE_SECTION_KEYS;
  const isAllSelected =
    normalizedSections.length === ALL_SHARE_SECTION_KEYS.length;
  const secParam = isAllSelected
    ? ''
    : normalizedSections.length > 0
    ? normalizedSections.join(',')
    : 'none';

  const termEncoded = encodeIdSubset(terminalIds, allPortTerminalIds);
  const subEncoded = encodeIdSubset(subterminalIds, allPortSubterminalIds);

  const sig = computeShareSignature(
    portId,
    expiresAtMs,
    secParam,
    termEncoded.param,
    subEncoded.param
  );
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const qs = new URLSearchParams({
    port: portId,
    lock: '1',
    exp: String(expiresAtMs),
  });
  if (secParam) {
    qs.set('sec', secParam);
  }
  if (termEncoded.param) {
    qs.set('term', termEncoded.param);
  }
  if (subEncoded.param) {
    qs.set('sub', subEncoded.param);
  }
  qs.set('sig', sig);

  return {
    url: `${cleanOrigin}${cleanPath}?${qs.toString()}`,
    portId,
    expiresAtMs,
    sections: normalizedSections,
    terminalIds: termEncoded.normalized,
    subterminalIds: subEncoded.normalized,
    sig,
  };
}

export function parseExclusiveShareLink(
  search: string,
  ports: PortProfile[],
  nowMs: number = Date.now()
): ParsedExclusiveShareState {
  try {
    const params = new URLSearchParams(search);
    const lock = params.get('lock');
    if (lock !== '1') {
      return {
        isExclusive: false,
        allowedSections: ALL_SHARE_SECTION_KEYS,
        isExpired: false,
        isTampered: false,
      };
    }

    const rawPort = params.get('port')?.trim().toLowerCase() ?? '';
    const matchedPort = ports.find(
      (p) =>
        p.id.toLowerCase() === rawPort ||
        p.shortCode.toLowerCase() === rawPort ||
        p.unLocode.toLowerCase() === rawPort
    );

    const expRaw = Number(params.get('exp'));
    const sig = params.get('sig')?.trim() ?? '';
    const secRaw = params.get('sec')?.trim() ?? '';
    const termRaw = params.get('term')?.trim() ?? '';
    const subRaw = params.get('sub')?.trim() ?? '';

    if (!matchedPort || !Number.isFinite(expRaw) || expRaw <= 0 || !sig) {
      return {
        isExclusive: true,
        portId: matchedPort?.id,
        expiresAtMs: Number.isFinite(expRaw) ? expRaw : undefined,
        allowedSections: ALL_SHARE_SECTION_KEYS,
        isExpired: true,
        isTampered: true,
      };
    }

    const expectedSig = computeShareSignature(
      matchedPort.id,
      expRaw,
      secRaw,
      termRaw,
      subRaw
    );
    const isTampered = sig !== expectedSig;
    const isExpired = isTampered || nowMs > expRaw;

    let allowedSections: ShareSectionKey[] = ALL_SHARE_SECTION_KEYS;
    if (secRaw === 'none') {
      allowedSections = [];
    } else if (secRaw.length > 0) {
      const tokens = secRaw
        .split(',')
        .map((s) => s.trim() as ShareSectionKey)
        .filter((s) => VALID_SECTION_SET.has(s));
      allowedSections = ALL_SHARE_SECTION_KEYS.filter((k) => tokens.includes(k));
    }

    return {
      isExclusive: true,
      portId: matchedPort.id,
      expiresAtMs: expRaw,
      allowedSections,
      allowedTerminalIds: decodeIdSubset(termRaw),
      allowedSubterminalIds: decodeIdSubset(subRaw),
      isExpired,
      isTampered,
    };
  } catch {
    return {
      isExclusive: false,
      allowedSections: ALL_SHARE_SECTION_KEYS,
      isExpired: false,
      isTampered: false,
    };
  }
}

export function formatShareExpirationDate(
  expiresAtMs: number,
  lang: 'es' | 'en'
): string {
  try {
    return new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(expiresAtMs));
  } catch {
    return new Date(expiresAtMs).toISOString().slice(0, 16).replace('T', ' ');
  }
}
