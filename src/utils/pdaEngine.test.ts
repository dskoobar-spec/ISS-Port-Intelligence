import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePda, findBerthsByProduct, generateSednaHtml } from './pdaEngine';
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
import type { PortStatusEvent } from '../types/port';

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
