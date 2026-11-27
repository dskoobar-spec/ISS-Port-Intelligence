import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePda,
  findBerthsByProduct,
  generateSednaHtml,
  matchesSemanticCargo,
} from './pdaEngine';
import {
  formatDraftMAndFt,
  MAX_STATUS_HISTORY_PER_PORT,
  recordPortStatusTransition,
} from './i18n';
import { INITIAL_HUB_STATE } from '../data/coatzacoalcosSeed';
import {
  buildDefaultPierSheetFromBerth,
  generatePierSheetStandaloneHtml,
} from './pierSheetExporter';
import {
  normalizeTariffSheetUrl,
  parseTariffRowsFromCsvOrJson,
} from './tariffSheetSync';
import { sanitizePdfFilename } from './pdfExporter';
import {
  filterVisaRequiredCountries,
  generateCrewChangeHtml,
  generatePreArrivalPackageHtml,
  generateSparePartsHtml,
  groupPdaHistoryByMonth,
} from './packageExporter';
import {
  CREW_CHANGE_PROCEDURE_2026,
  DEFAULT_PDA_DRIVE_FOLDER_URL,
  SPARE_PARTS_PROCEDURE,
} from '../data/authoritiesAndCrewSeed';
import {
  buildExclusivePortShareUrl,
  parseExclusiveShareLink,
} from './shareLink';
import { resolveDocumentLinkUrl } from './driveLinks';
import type { PdaHistoryRecord, PortServiceItem, PortStatusEvent } from '../types/port';

test('calculatePda computes USD and MXN totals across multiple tariff units', () => {
  const result = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-pajaritos',
      vesselName: 'MT Golfo Explorer',
      gt: 20000,
      loaM: 180,
      daysAlongside: 3,
      cargoTons: 12000,
      tugHours: 4,
      usdToMxn: 20,
    },
    INITIAL_HUB_STATE.tariffs
  );

  assert.ok(result.lineItems.length > 0);
  assert.ok(result.totalUsd > 0);
  assert.equal(Math.round(result.totalMxn), Math.round(result.totalUsd * 20));
});

test('calculatePda filters tariffs strictly by active flag and area scope', () => {
  const resultPajaritos = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-pajaritos',
      vesselName: 'MT Test',
      gt: 15000,
      loaM: 160,
      daysAlongside: 2,
      cargoTons: 5000,
      tugHours: 3,
      usdToMxn: 19.5,
    },
    INITIAL_HUB_STATE.tariffs
  );

  const resultAsiponaCoa = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'MV Test',
      gt: 15000,
      loaM: 160,
      daysAlongside: 2,
      cargoTons: 5000,
      tugHours: 3,
      usdToMxn: 19.5,
    },
    INITIAL_HUB_STATE.tariffs
  );

  assert.notEqual(resultPajaritos.totalUsd, resultAsiponaCoa.totalUsd);
});

test('findBerthsByProduct matches petrochemicals and agricultural bulk accurately', () => {
  const petroMatches = findBerthsByProduct(
    INITIAL_HUB_STATE.terminals,
    INITIAL_HUB_STATE.areas,
    'mxcoa',
    'Petroquímica y Líquidos',
    ''
  );
  assert.ok(petroMatches.length >= 2);

  const maizeMatches = findBerthsByProduct(
    INITIAL_HUB_STATE.terminals,
    INITIAL_HUB_STATE.areas,
    'mxcoa',
    'ALL',
    'Maíz'
  );
  assert.ok(maizeMatches.length >= 1);
  assert.ok(
    maizeMatches.some((m) => m.terminal.areaId === 'area-asipona-coa')
  );
});

test('generateSednaHtml builds 800px email-compatible HTML using ASIPONA Coatzacoalcos with m / ft drafts (never Recinto Sur)', () => {
  const coa = INITIAL_HUB_STATE.ports.find((p) => p.id === 'mxcoa')!;
  const htmlEs = generateSednaHtml({
    port: coa,
    areas: INITIAL_HUB_STATE.areas,
    terminals: INITIAL_HUB_STATE.terminals,
    restrictions: INITIAL_HUB_STATE.restrictions,
    lang: 'es',
  });

  assert.ok(htmlEs.includes('width="800"'));
  assert.ok(htmlEs.includes('Coatzacoalcos'));
  assert.ok(htmlEs.includes('ASIPONA Coatzacoalcos'));
  assert.ok(htmlEs.includes('Laguna de Pajaritos'));
  assert.ok(htmlEs.includes(formatDraftMAndFt(11.28)));
  assert.ok(htmlEs.includes(formatDraftMAndFt(11.88)));
  assert.ok(!htmlEs.includes('Recinto Sur'));

  const htmlEn = generateSednaHtml({
    port: coa,
    areas: INITIAL_HUB_STATE.areas,
    terminals: INITIAL_HUB_STATE.terminals,
    restrictions: INITIAL_HUB_STATE.restrictions,
    lang: 'en',
  });
  assert.ok(htmlEn.includes('Port Enclosures & Operational Drafts'));
  assert.ok(htmlEn.includes('Physical & Operational Navigation Restrictions'));
  assert.ok(htmlEn.includes('Available Marine & Husbandry Services'));
});

test('all 22 Mexican ports across 5 maritime zones are seeded with complete views', () => {
  assert.equal(INITIAL_HUB_STATE.ports.length, 22);

  const expectedCodes = [
    'ALT', 'TAM', 'TUX', 'COA', 'VER', 'DOB', 'CAR', 'PRO',
    'COZ', 'CUN', 'SEY',
    'MAN', 'LZC', 'PVA', 'ENS', 'RST', 'LAP', 'MAZ', 'TOP', 'GUA', 'SCZ', 'CHP',
  ];
  const actualCodes = INITIAL_HUB_STATE.ports.map((p) => p.shortCode);
  for (const code of expectedCodes) {
    assert.ok(actualCodes.includes(code), `Missing port ${code}`);
  }

  for (const port of INITIAL_HUB_STATE.ports) {
    assert.ok(port.channels.length >= 1, `Port ${port.shortCode} missing navigation channels`);
    assert.ok(
      (port.anchorageZones?.length ?? 0) >= 1,
      `Port ${port.shortCode} missing anchorage zones`
    );
    assert.ok(
      Boolean(port.operatingRulesSummary && port.operatingRulesSummary.length > 20),
      `Port ${port.shortCode} missing operatingRulesSummary`
    );
    const portAreas = INITIAL_HUB_STATE.areas.filter((a) => a.portId === port.id);
    const portTerms = INITIAL_HUB_STATE.terminals.filter((t) => t.portId === port.id);
    const portTariffs = INITIAL_HUB_STATE.tariffs.filter((t) => t.portId === port.id);
    const portLineup = INITIAL_HUB_STATE.lineup.filter((l) => l.portId === port.id);
    const portWeather = INITIAL_HUB_STATE.weather.find((w) => w.portId === port.id);
    const portRestr = INITIAL_HUB_STATE.restrictions.filter((r) => r.portId === port.id);
    assert.ok(portAreas.length >= 1, `Port ${port.shortCode} missing areas`);
    assert.ok(portTerms.length >= 1, `Port ${port.shortCode} missing terminals`);
    assert.ok(portRestr.length >= 2, `Port ${port.shortCode} missing restrictions`);
    assert.ok(portTariffs.length >= 1, `Port ${port.shortCode} missing tariffs`);
    assert.ok(portLineup.length >= 1, `Port ${port.shortCode} missing initial line-up`);
    assert.ok(portWeather, `Port ${port.shortCode} missing weather status`);
  }
});

test('Coatzacoalcos has 7 terminals, 11 ASIPONA berths, productSpecs, concessionaires and storageSummary', () => {
  const coa = INITIAL_HUB_STATE.ports.find((p) => p.id === 'mxcoa')!;
  const coaTerminals = INITIAL_HUB_STATE.terminals.filter((t) => t.portId === 'mxcoa');
  assert.equal(coaTerminals.length, 7);

  const asiponaCoa = coaTerminals.find((t) => t.id === 'term-coa-asipona')!;
  assert.ok(asiponaCoa);
  assert.equal(asiponaCoa.berths.length, 11);
  assert.ok((asiponaCoa.productSpecs?.length ?? 0) >= 6);
  assert.ok((asiponaCoa.concessionaires?.length ?? 0) >= 10);
  assert.equal(asiponaCoa.storageSummary?.coveredSqm, 32700);
  assert.equal(asiponaCoa.storageSummary?.containerYardSqm, 65000);

  const joinedNames = coaTerminals
    .map((t) => `${t.name} ${t.berths.map((b) => b.name).join(' ')}`)
    .join(' | ');

  for (const required of [
    'ASIPONA Coatzacoalcos',
    'ASIPONA Pajaritos',
    'PEMEX TASP',
    'Innophos',
    'Proagroindustrias',
    'Protexa',
    'Cotemar',
    'Muelle de Cabotaje',
    'Posición 1',
    'Posición 5',
    'Posición 9',
    'Posición Pública 1P',
    'Posición 2P / TUMP',
    'TQPM',
  ]) {
    assert.ok(joinedNames.includes(required), `Coatzacoalcos missing terminal/berth: ${required}`);
  }

  assert.ok(!joinedNames.includes('Recinto Sur'));

  const azNames = (coa.anchorageZones ?? []).map((a) => a.name).join(' | ');
  assert.ok(azNames.includes('Zona de Fondeo "A"'));
  assert.ok(azNames.includes('Zona de Fondeo "B"'));
  assert.ok(azNames.includes('Zona de Fondeo "C"'));
  assert.ok(azNames.includes('Pilotos'));

  const html = generateSednaHtml({
    port: coa,
    areas: INITIAL_HUB_STATE.areas,
    terminals: INITIAL_HUB_STATE.terminals,
    restrictions: INITIAL_HUB_STATE.restrictions,
  });
  assert.ok(html.includes('Zonas de Fondeo Autorizadas'));
  assert.ok(html.includes('Canales de Navegación'));
  assert.ok(html.includes('Reglas de Operación Vigentes'));
});

test('recordPortStatusTransition logs only real transitions and caps history at 10 events', () => {
  let history: PortStatusEvent[] = [];

  // Same status -> must NOT log
  history = recordPortStatusTransition(
    history,
    'mxcoa',
    'Abierto a toda navegación',
    'Abierto a toda navegación',
    '21/11/26 09:00'
  );
  assert.equal(history.length, 0);

  // Genuine transition -> logs
  history = recordPortStatusTransition(
    history,
    'mxcoa',
    'Abierto a toda navegación',
    'Cierre a embarcaciones mayores a 500 TRB',
    '21/11/26 12:35'
  );
  assert.equal(history.length, 1);
  assert.equal(history[0].status, 'Cierre a embarcaciones mayores a 500 TRB');
  assert.equal(history[0].timestamp, '21/11/26 12:35');

  // Repeating the same latest status -> must NOT duplicate
  history = recordPortStatusTransition(
    history,
    'mxcoa',
    'Cierre a embarcaciones mayores a 500 TRB',
    'Cierre a embarcaciones mayores a 500 TRB',
    '21/11/26 14:00'
  );
  assert.equal(history.length, 1);

  // Alternate 12 transitions -> must keep only latest 10
  for (let i = 0; i < 12; i++) {
    const prev = i % 2 === 0 ? 'Cierre a embarcaciones mayores a 500 TRB' : 'Abierto a toda navegación';
    const next = i % 2 === 0 ? 'Abierto a toda navegación' : 'Cierre a embarcaciones mayores a 500 TRB';
    history = recordPortStatusTransition(history, 'mxcoa', prev, next, `22/11/26 ${String(i).padStart(2, '0')}:00`);
  }
  assert.equal(history.length, MAX_STATUS_HISTORY_PER_PORT);
});

test('calculatePda and generateSednaHtml work across all 5 Mexican maritime regions', () => {
  const samplePortIds = ['mxcoa', 'mxczm', 'mxrst', 'mxman', 'mxpmd'];
  for (const portId of samplePortIds) {
    const port = INITIAL_HUB_STATE.ports.find((p) => p.id === portId)!;
    const area = INITIAL_HUB_STATE.areas.find((a) => a.portId === portId)!;
    const pda = calculatePda(
      {
        portId,
        areaId: area.id,
        vesselName: 'MV Test Regional',
        gt: 24000,
        loaM: 190,
        daysAlongside: 2,
        cargoTons: 8000,
        tugHours: 3,
        usdToMxn: 20,
      },
      INITIAL_HUB_STATE.tariffs
    );
    assert.ok(pda.lineItems.length >= 1, `PDA missing items for ${port.shortCode}`);
    assert.ok(pda.totalUsd > 0, `PDA total must be > 0 for ${port.shortCode}`);

    const html = generateSednaHtml({
      port,
      areas: INITIAL_HUB_STATE.areas,
      terminals: INITIAL_HUB_STATE.terminals,
      restrictions: INITIAL_HUB_STATE.restrictions,
    });
    assert.ok(html.includes(port.unLocode), `Sedna HTML missing ${port.unLocode}`);
    assert.ok(html.includes('Zonas de Fondeo Autorizadas'), `Sedna HTML missing anchorages for ${port.shortCode}`);
  }
});

test('PEMEX TASP terminal has 10 deduplicated berths with complete Pier Specification Sheets and exports', () => {
  const tasp = INITIAL_HUB_STATE.terminals.find((t) => t.id === 'term-pajaritos-tmp');
  assert.ok(tasp, 'Missing PEMEX TASP terminal');
  assert.equal(tasp.berths.length, 10);
  assert.ok((tasp.productSpecs?.length ?? 0) >= 5);
  assert.ok((tasp.concessionaires?.length ?? 0) >= 4);
  assert.equal(tasp.storageSummary?.openYardSqm, 185000);

  // Ensure unique berth IDs and no duplicated Pier 3 East entries
  const ids = new Set(tasp.berths.map((b) => b.id));
  assert.equal(ids.size, 10);
  const pier3EastCount = tasp.berths.filter(
    (b) => b.pierSheet?.pierNumber === '03' && b.pierSheet?.pierSide === 'East Side'
  ).length;
  assert.equal(pier3EastCount, 1);

  const pier1West = tasp.berths.find((b) => b.id === 'b-tasp-pier1-west')!;
  const pier1East = tasp.berths.find((b) => b.id === 'b-tasp-pier1-east')!;
  const marginal5 = tasp.berths.find((b) => b.id === 'b-tasp-marginal5')!;
  const pier9 = tasp.berths.find((b) => b.id === 'b-tasp-pier9')!;

  assert.equal(pier1West.pierSheet?.operatingDraftDisplay, '37\'00"');
  assert.equal(pier1East.pierSheet?.conditions.length, 7);
  assert.equal(marginal5.pierSheet?.conditions.length, 12);
  assert.equal(marginal5.pierSheet?.operatingDraftDisplay, '39\'00"');
  assert.equal(pier9.pierSheet?.conditions.length, 4);
  assert.equal(pier9.pierSheet?.maxAcceptedBeam, '44.00 m');

  // Verify standalone HTML generation works both for pierSheet berths and fallback terminals
  const sheetHtml = generatePierSheetStandaloneHtml(
    buildDefaultPierSheetFromBerth(marginal5, tasp),
    tasp.imageUrl
  );
  assert.ok(sheetHtml.includes('Marginal 5'));
  assert.ok(sheetHtml.includes('Navigation Parameters'));
  assert.ok(sheetHtml.includes('Products and Operating Conditions'));
  assert.ok(sheetHtml.includes('Discharge to Morelos'));
});

test('ASIPONA Coatzacoalcos inner berth-connected terminals include all 13 requested concessionaires + Smart Pass Ergon subdivision', () => {
  const asipona = INITIAL_HUB_STATE.terminals.find((t) => t.id === 'term-coa-asipona')!;
  const concs = asipona.concessionaires ?? [];
  assert.ok(concs.length >= 15);

  const combinedText = concs
    .map((c) => `${c.name} ${c.subdivision ?? ''} ${c.connectionSpecs ?? ''} ${c.dischargeMethod ?? ''}`)
    .join(' | ');

  for (const requiredName of [
    'Ingeniería Avanzada en Manejo de Graneles',
    'ED&F Man',
    'Cemex',
    'Vopak',
    'Smart Pass',
    'Ergon',
    'Inpropet',
    'Primos & Cousins',
    'Multiver',
    'Celanese',
    'Oxiteno',
    'Agropalm',
    'Terminales Transgolfo',
    'Grupo Trimex',
  ]) {
    assert.ok(combinedText.includes(requiredName), `Missing ASIPONA inner terminal: ${requiredName}`);
  }

  for (const c of concs) {
    assert.ok(c.connectionSpecs && c.connectionSpecs.length > 5, `Missing connectionSpecs for ${c.name}`);
    assert.ok(c.dischargeMethod && c.dischargeMethod.length > 5, `Missing dischargeMethod for ${c.name}`);
    assert.ok(c.imageUrl && c.imageUrl.length > 5, `Missing imageUrl for ${c.name}`);
    assert.ok(c.coordinates && c.coordinates.length > 5, `Missing coordinates for ${c.name}`);
    assert.ok(c.restrictions && c.restrictions.length > 5, `Missing restrictions for ${c.name}`);
    assert.ok(c.procedures && c.procedures.length > 0, `Missing procedures for ${c.name}`);
  }
});

test('COATZACOALCOS_PRODUCT_DOSSIERS seeds 68 individualized commodities including PEMEX TASP HDS/SDS specs', () => {
  const dossiers = INITIAL_HUB_STATE.productDossiers ?? [];
  assert.equal(dossiers.length, 68);

  const joinedNames = dossiers.map((d) => `${d.name} ${d.nameEn}`).join(' | ');
  for (const commodity of [
    'Acetona',
    'Etanol',
    'Alcohol Isopropílico',
    'Metanol',
    'MEK',
    'Aromina',
    'Alcohol Láurico',
    'Asfalto',
    'UF85',
    'Sosa Cáustica',
    'Aceite de Palma Crudo / RBD (CPO)',
    'Oleína de Palma',
    'Ácido Acético',
    'Acetato de Vinilo Monómero',
    'Estireno Monómero',
    'Petróleo Crudo',
    'Gasolina Pemex Magna',
    'Gasolina Pemex Premium',
    'Diésel Automotriz',
    'Turbosina',
    'Nafta',
    'Combustóleo',
    'Gasolina de Pirólisis',
    'Benceno',
    'Tolueno',
    'Paraxileno',
    'Etano Líquido Criogénico',
    'Etileno Líquido Criogénico',
    'Cloruro de Vinilo Monómero',
    'Amoníaco Anhidro',
    'Ácido Fosfórico',
    'Maíz Amarillo',
    'Trigo a Granel',
    'Sorgo',
    'Frijol de Soya',
    'Pasta de Soya',
    'Urea Granulada',
    'Azufre Sólido',
    'Cemento Gris Portland',
    'Melaza',
    'Acero: Bobinas',
  ]) {
    assert.ok(joinedNames.includes(commodity), `Missing individualized product dossier: ${commodity}`);
  }

  for (const d of dossiers) {
    assert.ok(d.connectionSpecs.length > 10, `Missing connectionSpecs on ${d.code}`);
    assert.ok(d.transferRates.length > 5, `Missing transferRates on ${d.code}`);
    assert.ok(d.rejectionCriteria.length > 10, `Missing rejectionCriteria on ${d.code}`);
    assert.ok(d.casNumber && d.casNumber.length >= 2, `Missing casNumber on ${d.code}`);
    assert.ok(d.flashPoint && d.flashPoint.length >= 2, `Missing flashPoint on ${d.code}`);
    assert.ok(d.nfpa704 && d.nfpa704.length >= 4, `Missing nfpa704 on ${d.code}`);
    assert.ok(d.hdsPemexSummary && d.hdsPemexSummary.length > 10, `Missing hdsPemexSummary on ${d.code}`);
    assert.ok(d.ppeRequired && d.ppeRequired.length > 8, `Missing ppeRequired on ${d.code}`);
  }
});

test('Semantic accent-insensitive cargo filtering connects categories (granel agrícola, aceites vegetales, acero) and member commodities (maíz, trigo)', () => {
  const dossiers = INITIAL_HUB_STATE.productDossiers ?? [];

  // Member term "maiz" / "trigo" matches berths that say "Granel agrícola" as well as "Maíz amarillo"
  const maizMatches = findBerthsByProduct(
    INITIAL_HUB_STATE.terminals,
    INITIAL_HUB_STATE.areas,
    'mxcoa',
    'ALL',
    'maiz'
  );
  assert.ok(maizMatches.some((m) => m.terminal.id === 'term-coa-asipona'));
  assert.ok(
    maizMatches.some((m) => m.berth.id === 'b-coa-1') &&
      maizMatches.some((m) => m.berth.id === 'b-paj-1p'),
    'maiz should match berths labeled Granel agrícola (Posición 1 & Posición 1P)'
  );

  // Category term "granel agricola" matches individual grain dossiers (Maíz Amarillo, Trigo, Sorgo)
  const cornDossier = dossiers.find((d) => d.name.includes('Maíz Amarillo'));
  const wheatDossier = dossiers.find((d) => d.name.includes('Trigo'));
  assert.ok(cornDossier && wheatDossier);
  assert.equal(
    matchesSemanticCargo([cornDossier.name, cornDossier.cargoGroup, cornDossier.summary].join(' '), 'granel agricola'),
    true
  );
  assert.equal(
    matchesSemanticCargo([wheatDossier.name, wheatDossier.cargoGroup, wheatDossier.summary].join(' '), 'granel agrícola'),
    true
  );

  // Category "aceites vegetales" matches specific fractions like Oleína de Palma
  const oleinDossier = dossiers.find((d) => d.name.includes('Oleína de Palma'));
  assert.ok(oleinDossier);
  assert.equal(
    matchesSemanticCargo([oleinDossier.name, oleinDossier.summary].join(' '), 'aceites vegetales'),
    true
  );

  // Category "acero" matches steel coils/plates/pipe dossiers and berths
  const steelMatches = findBerthsByProduct(
    INITIAL_HUB_STATE.terminals,
    INITIAL_HUB_STATE.areas,
    'mxcoa',
    'ALL',
    'acero'
  );
  assert.ok(steelMatches.length > 0);
});

test('Google Sheets tariff sync normalizes URLs, parses CSV/TSV/JSON tariffs into live PDA calculation, and sanitizes PDF names', () => {
  const sheetRes = normalizeTariffSheetUrl(
    'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit#gid=456'
  );
  assert.ok(sheetRes);
  assert.equal(sheetRes.mode, 'google_sheet');
  assert.equal(
    sheetRes.fetchUrl,
    'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/gviz/tq?tqx=out:csv&gid=456'
  );

  const execRes = normalizeTariffSheetUrl(
    'https://script.google.com/macros/s/AKfycbTestEndpoint/exec'
  );
  assert.ok(execRes);
  assert.equal(execRes.mode, 'apps_script');

  const csvPayload = [
    'code,concept,provider,unit,rate,currency,areaId',
    'COA-PIL-LIVE,Practicaje Oficial Sheet,Sindicato de Pilotos,per_gt,0.20,USD,ALL',
    'COA-TUG-LIVE,Servicio de Remolque Sheet,Remolcadores del Golfo,per_tug_hour,2500,USD,ALL',
  ].join('\n');

  const parsedCsv = parseTariffRowsFromCsvOrJson(csvPayload, 'mxcoa', INITIAL_HUB_STATE.ports);
  assert.equal(parsedCsv.items.length, 2);
  assert.equal(parsedCsv.items[0].rate, 0.2);
  assert.equal(parsedCsv.items[1].unit, 'per_tug_hour');

  const pda = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'MT Live Sheet',
      gt: 10000,
      loaM: 150,
      daysAlongside: 2,
      cargoTons: 5000,
      tugHours: 4,
      usdToMxn: 20,
    },
    parsedCsv.items
  );
  assert.equal(pda.totalUsd, 10000 * 0.2 + 4 * 2500);
  assert.equal(pda.totalMxn, (10000 * 0.2 + 4 * 2500) * 20);

  const jsonPayload = JSON.stringify({
    tariffs: [
      {
        code: 'COA-PORT-JSON',
        concept: 'Derecho de Puerto JSON',
        provider: 'ASIPONA',
        unit: 'Por GT',
        rate: 0.15,
        currency: 'USD',
      },
    ],
  });
  const parsedJson = parseTariffRowsFromCsvOrJson(jsonPayload, 'mxcoa', INITIAL_HUB_STATE.ports);
  assert.equal(parsedJson.items.length, 1);
  assert.equal(parsedJson.items[0].unit, 'per_gt');

  assert.equal(
    sanitizePdfFilename('  PDA MT Golfo: 2026.pdf ', 'fallback'),
    'PDA_MT_Golfo-_2026.pdf'
  );
  assert.equal(sanitizePdfFilename('   ', 'fallback'), 'fallback.pdf');
});

test('Official PDA formula engine computes Port Dues hybrid, Dockage, Pilotage, Towage, Extra Days, and Vessel-Type tariffs accurately', () => {
  const result47 = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'TBN 2',
      vesselType: 'Tanker / Chemical',
      purpose: 'DISCHARGE',
      cargoDescription: 'VEG OIL',
      gt: 21296,
      loaM: 174,
      daysAlongside: 2,
      cargoTons: 7000,
      opsRateMtHr: 150,
      tugsCount: 2,
      tugHours: 1.25,
      movements: 2,
      usdToMxn: 17.0,
    },
    INITIAL_HUB_STATE.tariffs
  );

  assert.equal(Math.round(result47.effectivePortStayHours), 47);

  // Port Dues: ((21296 * 5.40) + 29997) * 1.16 / 17.00 -> approx 9,893.75 USD
  const portDues = result47.lineItems.find((l) => l.code === 'COA-PORT-01');
  assert.ok(portDues);
  assert.equal(portDues.chargeSection, 'port');
  assert.ok(Math.abs(portDues.amountUsd - 9893.75) < 0.05);

  // Additional days should be $0.00 when stay is 47 hrs (<= 72 hrs)
  const extraDays47 = result47.lineItems.find((l) => l.code === 'ISS-AGY-EXD');
  assert.ok(extraDays47);
  assert.equal(extraDays47.amountUsd, 0);

  // 120 hours stay (5 days) -> 2 extra days after 72 hrs -> 2 * $350 = $700
  const result120 = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'TBN 2',
      vesselType: 'Tanker / Chemical',
      purpose: 'DISCHARGE',
      gt: 21296,
      loaM: 174,
      daysAlongside: 5,
      portStayHours: 120,
      cargoTons: 7000,
      tugsCount: 2,
      tugHours: 1.25,
      movements: 2,
      usdToMxn: 17.0,
    },
    INITIAL_HUB_STATE.tariffs
  );
  const extraDays120 = result120.lineItems.find((l) => l.code === 'ISS-AGY-EXD');
  assert.equal(extraDays120?.amountUsd, 700);

  // Vessel type switches automatically activate Gas Carrier vs Dry Bulk fees
  const gasResult = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-pajaritos',
      vesselName: 'LPG Carrier',
      vesselType: 'Gas Carrier (LPG/Ethane)',
      purpose: 'LOAD',
      gt: 21296,
      loaM: 174,
      daysAlongside: 2,
      cargoTons: 8000,
      tugHours: 2,
      usdToMxn: 17.0,
    },
    INITIAL_HUB_STATE.tariffs
  );
  assert.ok(gasResult.lineItems.some((l) => l.code === 'COA-GAS-CRYO'));
  assert.ok(!gasResult.lineItems.some((l) => l.code === 'COA-BULK-01'));

  const bulkResult = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'MV Bulk',
      vesselType: 'Dry Bulk',
      purpose: 'DISCHARGE',
      gt: 21296,
      loaM: 174,
      daysAlongside: 3,
      cargoTons: 25000,
      tugHours: 2,
      usdToMxn: 17.0,
    },
    INITIAL_HUB_STATE.tariffs
  );
  assert.ok(bulkResult.lineItems.some((l) => l.code === 'COA-BULK-01'));
  assert.ok(!bulkResult.lineItems.some((l) => l.code === 'COA-GAS-CRYO'));
});

test('Tariff Sheets sync parses custom_expression formulas and JSON PDA format presets, and exports integrate top-right Inchcape logo SVG', () => {
  const payload = JSON.stringify({
    tariffs: [
      {
        code: 'COA-CUSTOM-01',
        concept: 'Custom Harbour Fee',
        provider: 'ASIPONA',
        unit: 'per_gt',
        rate: 0.25,
        currency: 'USD',
        chargeSection: 'crew_port',
        formulaType: 'custom_expression',
        customFormula: '(grt * rate + 500) * 1.16',
        applicableVesselTypes: ['Dry Bulk', 'General Cargo / Steel'],
      },
    ],
    formats: [
      {
        id: 'fmt-sheet-bulk',
        portId: 'mxcoa',
        name: 'Sheet Dry Bulk Preset',
        vesselType: 'Dry Bulk',
        purpose: 'DISCHARGE',
        defaultCargo: 'YELLOW CORN',
        defaultQuantity: 30000,
        defaultOpsRateMtHr: 300,
      },
    ],
  });

  const parsed = parseTariffRowsFromCsvOrJson(payload, 'mxcoa', INITIAL_HUB_STATE.ports);
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].formulaType, 'custom_expression');
  assert.equal(parsed.formats.length, 1);
  assert.equal(parsed.formats[0].vesselType, 'Dry Bulk');

  const customPda = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'MV Sheet Formula',
      vesselType: 'Dry Bulk',
      gt: 10000,
      loaM: 180,
      daysAlongside: 2,
      cargoTons: 30000,
      tugHours: 2,
      usdToMxn: 17.0,
    },
    parsed.items
  );
  // (10000 * 0.25 + 500) * 1.16 = 3480
  assert.equal(customPda.totalUsd, 3480);

  const coa = INITIAL_HUB_STATE.ports.find((p) => p.id === 'mxcoa')!;
  const sednaHtml = generateSednaHtml({
    port: coa,
    areas: INITIAL_HUB_STATE.areas,
    terminals: INITIAL_HUB_STATE.terminals,
    restrictions: INITIAL_HUB_STATE.restrictions,
  });
  assert.ok(sednaHtml.includes('INCHCAPE'));
  assert.ok(sednaHtml.includes('<svg'));

  const tasp = INITIAL_HUB_STATE.terminals.find((t) => t.id === 'term-pajaritos-tmp')!;
  const pierHtml = generatePierSheetStandaloneHtml(
    buildDefaultPierSheetFromBerth(tasp.berths[0], tasp),
    tasp.imageUrl
  );
  assert.ok(pierHtml.includes('aria-label="Inchcape Shipping Services"'));
  assert.ok(pierHtml.includes('align-items:flex-end'));
  assert.ok(pierHtml.includes('SHIPPING SERVICES'));
});

test('Authorities, Crew Change Procedure, Pre-Arrival Info HTML, and Monthly PDA grouping work end-to-end', () => {
  const authorities = INITIAL_HUB_STATE.authorities ?? [];
  const agencies = new Set(authorities.map((a) => a.agency));
  for (const requiredAgency of [
    'Aduana',
    'ASIPONA',
    'Capitanía de Puerto',
    'INM',
    'Sanidad Internacional',
    'SENASICA',
  ] as const) {
    assert.ok(agencies.has(requiredAgency), `Missing authority agency: ${requiredAgency}`);
  }

  assert.equal(
    INITIAL_HUB_STATE.pdaDriveFolderUrl,
    DEFAULT_PDA_DRIVE_FOLDER_URL
  );
  assert.ok(
    INITIAL_HUB_STATE.pdaDriveFolderUrl?.includes('1JizUaDQiSSoqaxc7X9_9oPByvTGQLAgO')
  );

  // Crew Change Procedure completeness & clean of SOP 2026 / personal Sedna signature
  assert.equal(CREW_CHANGE_PROCEDURE_2026.title, 'CREW CHANGE PROCEDURE');
  assert.ok(!CREW_CHANGE_PROCEDURE_2026.title.includes('SOP 2026'));
  assert.ok(CREW_CHANGE_PROCEDURE_2026.usC1d1Focus.join(' ').includes('C1/D1'));
  assert.ok(CREW_CHANGE_PROCEDURE_2026.minimumLeadTimeNotice.includes('3 working days'));
  assert.ok(CREW_CHANGE_PROCEDURE_2026.appendixAC.length > 10);
  assert.ok(CREW_CHANGE_PROCEDURE_2026.appendixDM.length > 10);
  assert.ok(CREW_CHANGE_PROCEDURE_2026.appendixNZ.length > 10);
  assert.ok(!JSON.stringify(CREW_CHANGE_PROCEDURE_2026).includes('Daniel Flores'));

  const coa = INITIAL_HUB_STATE.ports.find((p) => p.id === 'mxcoa')!;
  const crewHtml = generateCrewChangeHtml({
    guide: CREW_CHANGE_PROCEDURE_2026,
    port: coa,
    lang: 'en',
  });
  assert.ok(crewHtml.includes('width="800"'));
  assert.ok(crewHtml.includes('INCHCAPE'));
  assert.ok(crewHtml.includes('C1/D1'));
  assert.ok(crewHtml.includes('APPENDIX A'));
  assert.ok(!crewHtml.includes('Daniel Flores'));

  // Country visa checker filtering
  const filteredIndia = filterVisaRequiredCountries(CREW_CHANGE_PROCEDURE_2026, 'india');
  assert.ok(filteredIndia.dm.some((c) => c.toLowerCase() === 'india'));
  assert.equal(filteredIndia.ac.length, 0);

  // Verify Master Pre-Arrival Checklist items are mapped to each Authority
  const capitania = authorities.find((a) => a.agency === 'Capitanía de Puerto')!;
  const inm = authorities.find((a) => a.agency === 'INM')!;
  const sanidad = authorities.find((a) => a.agency === 'Sanidad Internacional')!;
  const aduana = authorities.find((a) => a.agency === 'Aduana')!;
  const capDocs = capitania.requiredDocuments.join(' | ');
  const capDocsEn = capitania.requiredDocumentsEn?.join(' | ') ?? '';
  assert.ok(capDocs.includes('Ship\'s Particulars'));
  assert.ok(capDocs.includes('PSC'));
  assert.ok(capDocsEn.includes('Port State Control'));
  assert.ok(capDocs.includes('Artículo 181') || capDocs.includes('Art. 181') || capitania.summary.includes('Art. 181'));
  assert.ok(capDocsEn.includes('32.'));
  assert.ok(inm.requiredDocuments.join(' | ').includes('TEXT'));
  assert.ok(sanidad.requiredDocuments.join(' | ').includes('SSCEC'));
  assert.ok(aduana.requiredDocuments.join(' | ').includes('IMO FAL 1'));

  // Spare Parts Procedure (Aduana) completeness & zero personal signature
  assert.equal(SPARE_PARTS_PROCEDURE.title, 'SPARE PARTS PROCEDURES');
  assert.ok(SPARE_PARTS_PROCEDURE.consigneeFormulation.includes('To the Master of M/V'));
  assert.ok(SPARE_PARTS_PROCEDURE.officeCompany.includes('ISS Marine Services Mexico'));
  assert.ok(SPARE_PARTS_PROCEDURE.restrictedItemsCol1.length >= 6);
  assert.ok(SPARE_PARTS_PROCEDURE.restrictedItemsCol2.length >= 5);
  assert.ok(!JSON.stringify(SPARE_PARTS_PROCEDURE).includes('Daniel Flores'));

  const spareHtml = generateSparePartsHtml({
    guide: SPARE_PARTS_PROCEDURE,
    port: coa,
    lang: 'es',
  });
  assert.ok(spareHtml.includes('width="800"'));
  assert.ok(spareHtml.includes('INCHCAPE'));
  assert.ok(spareHtml.includes('SPARE PARTS PROCEDURE'));
  assert.ok(spareHtml.includes('$500 USD'));
  assert.ok(!spareHtml.includes('Daniel Flores'));

  // One-click Pre-Arrival Info combining welcome letter + all selectable modules
  const tasp = INITIAL_HUB_STATE.terminals.find((t) => t.id === 'term-pajaritos-tmp')!;
  const dossier = (INITIAL_HUB_STATE.productDossiers ?? []).find((d) => d.portId === 'mxcoa')!;
  const weather = INITIAL_HUB_STATE.weather.find((w) => w.portId === 'mxcoa');
  const packageHtml = generatePreArrivalPackageHtml({
    port: coa,
    areas: INITIAL_HUB_STATE.areas,
    terminals: INITIAL_HUB_STATE.terminals,
    restrictions: INITIAL_HUB_STATE.restrictions,
    weather,
    statusHistory: INITIAL_HUB_STATE.statusHistory,
    selectedTerminal: tasp,
    selectedBerth: tasp.berths[0],
    selectedProduct: dossier,
    authorities,
    crewGuide: CREW_CHANGE_PROCEDURE_2026,
    sparePartsGuide: SPARE_PARTS_PROCEDURE,
    lineup: INITIAL_HUB_STATE.lineup,
    procedures: INITIAL_HUB_STATE.procedures,
    directory: INITIAL_HUB_STATE.directory,
    vesselName: 'MT Golfo Explorer',
    voyageOrEta: 'ETA 2026-11-28 08:00',
    includeModules: {
      portStatusWeather: true,
      generalParticulars: true,
      portRestrictions: true,
      productDossier: true,
      terminalSheet: true,
      portServices: true,
      lineup: true,
      authorities: true,
      spareParts: true,
      crewChange: true,
      operationalProcedures: true,
      directory: true,
    },
    lang: 'es',
  });
  assert.ok(packageHtml.includes('width="800"'));
  assert.ok(packageHtml.includes('INCHCAPE'));
  assert.ok(packageHtml.includes('Estimados Señores'));
  assert.ok(packageHtml.includes('al menos 72 horas antes'));
  assert.ok(packageHtml.includes('MT Golfo Explorer'));
  assert.ok(packageHtml.includes('SENASICA'));
  assert.ok(packageHtml.includes('SPARE PARTS PROCEDURE'));
  assert.ok(packageHtml.includes('C1/D1'));
  assert.ok(packageHtml.includes(dossier.name));
  assert.ok(packageHtml.includes(tasp.name));
  assert.ok(packageHtml.includes('Servicios Portuarios Disponibles'));
  assert.ok(packageHtml.includes('Line-Up de Buques'));
  assert.ok(packageHtml.includes('Directorio Operativo'));
  assert.ok(!packageHtml.includes('Daniel Flores'));

  // Monthly PDA Registry grouping & sorting
  const sampleInput = {
    portId: 'mxcoa',
    areaId: 'area-asipona-coa',
    vesselName: 'MT Alpha',
    gt: 20000,
    loaM: 180,
    daysAlongside: 2,
    cargoTons: 7000,
    tugHours: 1.5,
    usdToMxn: 17,
  };
  const records: PdaHistoryRecord[] = [
    {
      id: 'pda-1',
      monthKey: '2026-10',
      createdAt: '2026-10-15T10:00:00Z',
      updatedAt: '2026-10-15T10:00:00Z',
      filename: 'PDA-Oct-1.pdf',
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'MT Alpha',
      vesselType: 'Tanker / Chemical',
      purpose: 'DISCHARGE',
      cargoDescription: 'VEG OIL',
      cargoTons: 7000,
      totalUsd: 12000,
      totalMxn: 204000,
      input: sampleInput,
    },
    {
      id: 'pda-2',
      monthKey: '2026-11',
      createdAt: '2026-11-10T10:00:00Z',
      updatedAt: '2026-11-10T10:00:00Z',
      filename: 'PDA-Nov-1.pdf',
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'MT Bravo',
      vesselType: 'Tanker / Chemical',
      purpose: 'LOAD',
      cargoDescription: 'NAFTA',
      cargoTons: 10000,
      totalUsd: 15000.5,
      totalMxn: 255008.5,
      input: sampleInput,
    },
    {
      id: 'pda-3',
      monthKey: '2026-11',
      createdAt: '2026-11-22T10:00:00Z',
      updatedAt: '2026-11-22T12:00:00Z',
      filename: 'PDA-Nov-2.pdf',
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'MV Charlie',
      vesselType: 'Dry Bulk',
      purpose: 'DISCHARGE',
      cargoDescription: 'MAIZ',
      cargoTons: 25000,
      totalUsd: 20000.25,
      totalMxn: 340004.25,
      input: sampleInput,
    },
  ];
  const groups = groupPdaHistoryByMonth(records);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].monthKey, '2026-11');
  assert.equal(groups[0].records.length, 2);
  assert.equal(groups[0].records[0].id, 'pda-3');
  assert.equal(groups[0].totalUsd, 35000.75);
  assert.equal(groups[1].monthKey, '2026-10');
  assert.equal(groups[1].totalUsd, 12000);
});

test('Exclusive single-port public share link validates signature, locks port, and expires cleanly', () => {
  const baseMs = Date.UTC(2026, 10, 25, 12, 0, 0);
  const created = buildExclusivePortShareUrl({
    origin: 'https://iss-mexico.example',
    pathname: '/',
    portId: 'mxcoa',
    durationHours: 24,
    nowMs: baseMs,
  });

  const parsedUrl = new URL(created.url);
  assert.equal(parsedUrl.searchParams.get('port'), 'mxcoa');
  assert.equal(parsedUrl.searchParams.get('lock'), '1');

  // Valid within 24h window
  const activeState = parseExclusiveShareLink(
    parsedUrl.search,
    INITIAL_HUB_STATE.ports,
    baseMs + 2 * 60 * 60 * 1000
  );
  assert.equal(activeState.isExclusive, true);
  assert.equal(activeState.portId, 'mxcoa');
  assert.equal(activeState.isExpired, false);
  assert.equal(activeState.isTampered, false);

  // Expired after 24h window
  const expiredState = parseExclusiveShareLink(
    parsedUrl.search,
    INITIAL_HUB_STATE.ports,
    baseMs + 25 * 60 * 60 * 1000
  );
  assert.equal(expiredState.isExclusive, true);
  assert.equal(expiredState.isExpired, true);
  assert.equal(expiredState.isTampered, false);

  // Tampered port parameter rejects link
  const tamperedSearch = parsedUrl.search.replace('port=mxcoa', 'port=mxver');
  const tamperedState = parseExclusiveShareLink(
    tamperedSearch,
    INITIAL_HUB_STATE.ports,
    baseMs + 1000
  );
  assert.equal(tamperedState.isExclusive, true);
  assert.equal(tamperedState.isExpired, true);
  assert.equal(tamperedState.isTampered, true);

  // Normal non-exclusive URL
  const normalState = parseExclusiveShareLink('?port=mxcoa', INITIAL_HUB_STATE.ports, baseMs);
  assert.equal(normalState.isExclusive, false);
  assert.equal(normalState.isExpired, false);

  // Selectable public share sections subset & tampering rejection on sec=
  const subsetCreated = buildExclusivePortShareUrl({
    origin: 'https://iss-mexico.example',
    portId: 'mxcoa',
    durationHours: 12,
    sections: ['status_weather', 'restrictions', 'terminals', 'authorities'],
    nowMs: baseMs,
  });
  const subsetUrl = new URL(subsetCreated.url);
  assert.equal(
    subsetUrl.searchParams.get('sec'),
    'status_weather,restrictions,terminals,authorities'
  );
  const parsedSubset = parseExclusiveShareLink(
    subsetUrl.search,
    INITIAL_HUB_STATE.ports,
    baseMs + 1000
  );
  assert.equal(parsedSubset.isExpired, false);
  assert.equal(parsedSubset.isTampered, false);
  assert.deepEqual(parsedSubset.allowedSections, [
    'status_weather',
    'restrictions',
    'terminals',
    'authorities',
  ]);

  const tamperedUrl = new URL(subsetCreated.url);
  tamperedUrl.searchParams.set('sec', 'status_weather,tariffs_pda');
  const parsedTamperedSec = parseExclusiveShareLink(
    tamperedUrl.search,
    INITIAL_HUB_STATE.ports,
    baseMs + 1000
  );
  assert.equal(parsedTamperedSec.isTampered, true);
  assert.equal(parsedTamperedSec.isExpired, true);
});

test('Capitanía de Puerto separates 4 structured tables (32 certs + 9 op forms) and all 6 authorities include regulatory enrichment', () => {
  const authorities = INITIAL_HUB_STATE.authorities ?? [];
  const capitania = authorities.find((a) => a.agency === 'Capitanía de Puerto')!;
  assert.ok(capitania.documentGroups && capitania.documentGroups.length === 4);

  const certsGroup = capitania.documentGroups!.find((g) => g.id === 'cap-certs-32')!;
  const opFormsGroup = capitania.documentGroups!.find((g) => g.id === 'cap-op-forms')!;
  const zarpeGroup = capitania.documentGroups!.find((g) => g.id === 'cap-sailing')!;
  assert.equal(certsGroup.rows.length, 32);
  assert.equal(certsGroup.rows[0].code, '01');
  assert.equal(certsGroup.rows[31].code, '32');
  assert.equal(opFormsGroup.rows.length, 9);
  assert.equal(opFormsGroup.rows[0].code, 'OP-01');
  assert.equal(opFormsGroup.rows[8].code, 'OP-09');
  assert.ok(JSON.stringify(capitania.documentGroups).includes('SEMAR-05-017'));
  assert.ok(JSON.stringify(zarpeGroup).includes('48'));

  const aduana = authorities.find((a) => a.agency === 'Aduana')!;
  const asipona = authorities.find((a) => a.agency === 'ASIPONA')!;
  const inm = authorities.find((a) => a.agency === 'INM')!;
  const sanidad = authorities.find((a) => a.agency === 'Sanidad Internacional')!;
  const senasica = authorities.find((a) => a.agency === 'SENASICA')!;

  assert.ok((aduana.documentGroups?.length ?? 0) >= 1);
  assert.ok(JSON.stringify(aduana).includes('VUCEM'));
  assert.ok(JSON.stringify(asipona).includes('SIGOP'));
  assert.ok(JSON.stringify(asipona).includes('Junta de Operaciones'));
  assert.ok(JSON.stringify(inm).includes('Art. 46'));
  assert.ok(JSON.stringify(inm).includes('Shore Leave'));
  assert.ok(JSON.stringify(sanidad).includes('RSI-2005'));
  assert.ok(JSON.stringify(senasica).includes('CZI'));
  assert.ok(JSON.stringify(senasica).includes('CFI'));
  assert.ok(JSON.stringify(senasica).includes('OISA'));
});

test('PDA 4-rubro split, sub-item breakdown math, Launch section reassignment, and share terminal/subterminal filtering', () => {
  // 1. Sub-service quantities on Capitanía (COA-HM-01), Crew (ISS-CREW-01), Husbandry (ISS-HUSB-01), and Launch reassignment
  const baseRes = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'MT Rubro Test',
      vesselType: 'Tanker / Chemical',
      purpose: 'DISCHARGE',
      gt: 21296,
      loaM: 174,
      daysAlongside: 2,
      cargoTons: 7000,
      tugHours: 1.25,
      usdToMxn: 17.0,
      serviceSubQuantities: {
        'tar-harbor-master': {
          'hm-arribo': 1,
          'hm-fondeo': 2,
          'hm-despacho': 1,
        },
        'tar-crew-change': {
          'crew-on': 3,
          'crew-off': 2,
          'crew-visa': 1,
        },
        'tar-husb-assist': {
          'husb-insp': 2,
        },
      },
    },
    INITIAL_HUB_STATE.tariffs
  );

  // HM sub-items: (8393.01*1 + 8393.01*2 + 8393.02*1) / 17.00 = 33572.05 / 17 = 1974.83 USD
  const hmLine = baseRes.lineItems.find((l) => l.code === 'COA-HM-01');
  assert.ok(hmLine);
  assert.equal(hmLine.chargeSection, 'port');
  assert.equal(hmLine.amountUsd, 1974.83);
  assert.ok(hmLine.subBreakdown && hmLine.subBreakdown.length === 3);

  // Crew Charges subtotal: 3*145 + 2*145 + 1*95 = 820.00 USD
  assert.equal(baseRes.crewChargesTotalUsd, 820);
  // Husbandry subtotal: 2*180 = 360.00 USD
  assert.equal(baseRes.husbandryChargesTotalUsd, 360);
  assert.ok(baseRes.portChargesTotalUsd > 0);
  assert.ok(baseRes.agencyChargesTotalUsd > 0);
  assert.equal(
    Math.round((baseRes.portChargesTotalUsd + baseRes.crewChargesTotalUsd + baseRes.husbandryChargesTotalUsd + baseRes.agencyChargesTotalUsd) * 100),
    Math.round(baseRes.totalUsd * 100)
  );

  // Reassign Launch (tar-launch) from Port Charges to Crew Charges
  const reassignedRes = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'MT Rubro Test',
      vesselType: 'Tanker / Chemical',
      purpose: 'DISCHARGE',
      gt: 21296,
      loaM: 174,
      daysAlongside: 2,
      cargoTons: 7000,
      tugHours: 1.25,
      usdToMxn: 17.0,
      tariffSectionOverrides: {
        'tar-launch': 'crew',
      },
    },
    INITIAL_HUB_STATE.tariffs
  );
  const movedLaunch = reassignedRes.lineItems.find((l) => l.tariffId === 'tar-launch');
  assert.ok(movedLaunch);
  assert.equal(movedLaunch.chargeSection, 'crew');
  assert.equal(movedLaunch.originalChargeSection, 'port');
  assert.ok(reassignedRes.crewChargesTotalUsd >= movedLaunch.amountUsd);

  // 2. Exclusive Share terminal & subterminal filtering signature + 'none' handling
  const baseMs = Date.UTC(2026, 10, 26, 12, 0, 0);
  const filteredShare = buildExclusivePortShareUrl({
    origin: 'https://iss-mexico.example',
    portId: 'mxcoa',
    durationHours: 24,
    terminalIds: ['term-asipona-comercial'],
    allPortTerminalIds: ['term-asipona-comercial', 'term-pajaritos-tmp'],
    subterminalIds: [],
    allPortSubterminalIds: ['conc-tci', 'conc-proagro'],
    nowMs: baseMs,
  });
  const fUrl = new URL(filteredShare.url);
  assert.equal(fUrl.searchParams.get('term'), 'term-asipona-comercial');
  assert.equal(fUrl.searchParams.get('sub'), 'none');

  const parsedFiltered = parseExclusiveShareLink(
    fUrl.search,
    INITIAL_HUB_STATE.ports,
    baseMs + 1000
  );
  assert.equal(parsedFiltered.isExpired, false);
  assert.equal(parsedFiltered.isTampered, false);
  assert.deepEqual(parsedFiltered.allowedTerminalIds, ['term-asipona-comercial']);
  assert.deepEqual(parsedFiltered.allowedSubterminalIds, []);

  // Tampering with term= triggers signature rejection
  fUrl.searchParams.set('term', 'term-pajaritos-tmp');
  const tamperedTerm = parseExclusiveShareLink(
    fUrl.search,
    INITIAL_HUB_STATE.ports,
    baseMs + 1000
  );
  assert.equal(tamperedTerm.isTampered, true);
  assert.equal(tamperedTerm.isExpired, true);

  // 3. Adding an extra sub-item to Launch (tar-launch) sums into global Launch Service & Grand Total
  const customTariffs = INITIAL_HUB_STATE.tariffs.map((t) =>
    t.id === 'tar-launch'
      ? {
          ...t,
          subItems: [
            ...(t.subItems ?? []),
            {
              id: 'launch-authorities-extra',
              label: 'Lancha Autoridades Extra',
              labelEn: 'Authorities Extra Launch',
              unitLabel: 'Por viaje',
              rate: 17000,
              calcMode: 'per_qty' as const,
              defaultQty: 1,
            },
          ],
        }
      : t
  );
  const customLaunchRes = calculatePda(
    {
      portId: 'mxcoa',
      areaId: 'area-asipona-coa',
      vesselName: 'MT Launch Extra',
      vesselType: 'Tanker / Chemical',
      purpose: 'DISCHARGE',
      gt: 21296,
      loaM: 174,
      daysAlongside: 2,
      cargoTons: 7000,
      tugHours: 1.25,
      usdToMxn: 17.0,
      serviceSubQuantities: {
        'tar-launch': {
          'launch-gen': 0,
          'launch-in': 1,
          'launch-out': 1,
          'launch-authorities-extra': 1,
        },
      },
    },
    customTariffs
  );
  const customLaunchLine = customLaunchRes.lineItems.find((l) => l.tariffId === 'tar-launch');
  assert.ok(customLaunchLine);
  // (25133.31 * 2 + 17000) / 17.00 = 67266.62 / 17 = 3956.86 USD
  assert.equal(customLaunchLine.amountUsd, 3956.86);
  assert.ok(customLaunchLine.subBreakdown?.some((s) => s.id === 'launch-authorities-extra'));
});

test('resolveDocumentLinkUrl normalizes Google Drive files and Docs/Sheets to direct downloads while preserving folders and external portals', () => {
  // 1. Standard Google Drive /file/d/<ID>/view share URL -> uc?export=download
  const driveFile = resolveDocumentLinkUrl(
    'https://drive.google.com/file/d/1AbC_dEfG12345XyZ/view?usp=sharing'
  );
  assert.equal(driveFile.href, 'https://drive.google.com/uc?export=download&id=1AbC_dEfG12345XyZ');
  assert.equal(driveFile.isDirectDownload, true);
  assert.equal(driveFile.isDrive, true);
  assert.equal(driveFile.isFolder, false);

  // 2. Legacy Google Drive open?id=<ID> URL -> uc?export=download
  const driveOpen = resolveDocumentLinkUrl(
    'https://drive.google.com/open?id=9ZyX_wVuTsR001'
  );
  assert.equal(driveOpen.href, 'https://drive.google.com/uc?export=download&id=9ZyX_wVuTsR001');
  assert.equal(driveOpen.isDirectDownload, true);
  assert.equal(driveOpen.isDrive, true);
  assert.equal(driveOpen.isFolder, false);

  // 3. Google Docs & Sheets -> PDF export direct download
  const docRes = resolveDocumentLinkUrl(
    'https://docs.google.com/document/d/1DocTestId99/edit?usp=sharing'
  );
  assert.equal(docRes.href, 'https://docs.google.com/document/d/1DocTestId99/export?format=pdf');
  assert.equal(docRes.isDirectDownload, true);
  assert.equal(docRes.isDrive, true);
  assert.equal(docRes.isFolder, false);

  const sheetRes = resolveDocumentLinkUrl(
    'https://docs.google.com/spreadsheets/d/1SheetTestId88/edit#gid=0'
  );
  assert.equal(
    sheetRes.href,
    'https://docs.google.com/spreadsheets/d/1SheetTestId88/export?format=pdf'
  );
  assert.equal(sheetRes.isDirectDownload, true);
  assert.equal(sheetRes.isDrive, true);

  // 4. Google Drive folder -> kept as folder link (not direct download)
  const folderRes = resolveDocumentLinkUrl(
    'https://drive.google.com/drive/folders/1JizUaDQiSSoqaxc7X9_9oPByvTGQLAgO?usp=sharing'
  );
  assert.equal(folderRes.isFolder, true);
  assert.equal(folderRes.isDirectDownload, false);
  assert.equal(folderRes.isDrive, true);

  // 5. External portal (VUCEM) -> preserved as external link
  const vucemRes = resolveDocumentLinkUrl('https://www.ventanillaunica.gob.mx/');
  assert.equal(vucemRes.href, 'https://www.ventanillaunica.gob.mx/');
  assert.equal(vucemRes.isDirectDownload, false);
  assert.equal(vucemRes.isDrive, false);
  assert.equal(vucemRes.isFolder, false);

  // 6. PortServiceItem supports attaching Drive tariff / agreement / restriction documentLinks
  const sampleService: PortServiceItem = {
    id: 'srv-pilot-test',
    category: 'Practicaje',
    categoryEn: 'Pilotage',
    name: 'Practicaje Obligatorio',
    nameEn: 'Mandatory Pilotage',
    detail: 'Practicaje entrada y salida.',
    detailEn: 'Inbound and outbound pilotage.',
    available: true,
    documentLinks: [
      {
        id: 'lnk-tar-1',
        label: 'Tarifa Oficial Practicaje 2026',
        url: 'https://drive.google.com/file/d/1PilotTariff2026/view',
        docType: 'Tarifa oficial',
      },
      {
        id: 'lnk-rest-1',
        label: 'Restricción nocturna por viento',
        url: 'https://drive.google.com/file/d/1PilotRestriction/view',
        docType: 'Restricción',
      },
    ],
  };
  assert.equal(sampleService.documentLinks?.length, 2);
  assert.equal(
    resolveDocumentLinkUrl(sampleService.documentLinks![0].url).href,
    'https://drive.google.com/uc?export=download&id=1PilotTariff2026'
  );
});

test('All terminals across all 22 Mexican ports have complete bilingual commercialProfile and storageSummary', () => {
  assert.ok(INITIAL_HUB_STATE.terminals.length >= 45);

  for (const terminal of INITIAL_HUB_STATE.terminals) {
    assert.ok(
      terminal.storageSummary,
      `Terminal ${terminal.id} (${terminal.name}) missing storageSummary`
    );
    assert.ok(
      terminal.storageSummary.warehousesBreakdown.length > 15 &&
        terminal.storageSummary.warehousesBreakdownEn.length > 15,
      `Terminal ${terminal.id} missing bilingual warehousesBreakdown`
    );

    const cp = terminal.commercialProfile;
    assert.ok(cp, `Terminal ${terminal.id} (${terminal.name}) missing commercialProfile`);
    assert.ok(cp.positioningHeadline.length > 10 && cp.positioningHeadlineEn.length > 10);
    assert.ok(cp.customsRegime.length > 5 && cp.customsRegimeEn.length > 5);
    assert.ok(cp.connectivity.length > 10 && cp.connectivityEn.length > 10);
    assert.ok(
      cp.commercialServices.length >= 2 && cp.commercialServicesEn.length >= 2,
      `Terminal ${terminal.id} needs >=2 bilingual commercialServices`
    );
    assert.ok(
      cp.infrastructureHighlights.length >= 2 && cp.infrastructureHighlightsEn.length >= 2,
      `Terminal ${terminal.id} needs >=2 bilingual infrastructureHighlights`
    );
    assert.ok(
      cp.vesselTypesServed.length >= 1 && cp.vesselTypesServedEn.length >= 1,
      `Terminal ${terminal.id} needs >=1 bilingual vesselTypesServed`
    );
    assert.ok(
      cp.operationalAdvantages.length >= 1 && cp.operationalAdvantagesEn.length >= 1,
      `Terminal ${terminal.id} needs >=1 bilingual operationalAdvantages`
    );
  }

  // Domain-specific spot checks for key Coatza, LZC & National terminals
  const cotemar = INITIAL_HUB_STATE.terminals.find((t) => t.id === 'term-coa-cotemar')!;
  assert.ok(JSON.stringify(cotemar.commercialProfile).includes('400'));

  const protexa = INITIAL_HUB_STATE.terminals.find((t) => t.id === 'term-coa-protexa')!;
  assert.ok(
    protexa.name.includes('Permaducto') &&
      JSON.stringify(protexa.commercialProfile).includes('Concrete Weight Coating')
  );

  const tump = INITIAL_HUB_STATE.terminals.find((t) => t.id === 'term-pajaritos-tump')!;
  assert.ok(JSON.stringify(tump.commercialProfile).includes('TQPM'));

  const proagro = INITIAL_HUB_STATE.terminals.find((t) => t.id === 'term-pajaritos-proagro')!;
  assert.ok(JSON.stringify(proagro.commercialProfile).includes('LDA'));

  const lzcRoRo = INITIAL_HUB_STATE.terminals.find((t) => t.id === 'term-lzc-mineral-cfe')!;
  assert.ok(JSON.stringify(lzcRoRo.commercialProfile).includes('SSA'));

  const ensLng = INITIAL_HUB_STATE.terminals.find((t) => t.id === 'term-mxens-costa-azul-gnl')!;
  assert.ok(JSON.stringify(ensLng.commercialProfile).includes('Sempra'));
});

