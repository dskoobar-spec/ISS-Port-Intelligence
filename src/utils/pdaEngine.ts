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
  PdaChargeSection,
  PdaInput,
  PdaLineItem,
  PdaLineItemSubBreakdown,
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

type Token =
  | { type: 'num'; value: number }
  | { type: 'id'; value: string }
  | { type: 'op'; value: string }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'comma' };

function tokenizeFormula(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        numStr += expr[i++];
      }
      const parsed = Number.parseFloat(numStr);
      tokens.push({ type: 'num', value: Number.isFinite(parsed) ? parsed : 0 });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let idStr = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        idStr += expr[i++];
      }
      tokens.push({ type: 'id', value: idStr.toLowerCase() });
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}

/**
 * Pure safe recursive-descent arithmetic evaluator for PDA formulas (no eval).
 */
export function evaluateSafeFormula(
  expression: string,
  variables: Record<string, number>
): number {
  const cleanExpr = expression.trim();
  if (!cleanExpr) return 0;
  try {
    const tokens = tokenizeFormula(cleanExpr);
    if (tokens.length === 0) return 0;
    let pos = 0;

    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    const parseExpression = (): number => {
      let left = parseTerm();
      while (peek()?.type === 'op' && (peek() as { value: string }).value.match(/[+-]/)) {
        const op = (consume() as { value: string }).value;
        const right = parseTerm();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    };

    const parseTerm = (): number => {
      let left = parseFactor();
      while (peek()?.type === 'op' && (peek() as { value: string }).value.match(/[*/]/)) {
        const op = (consume() as { value: string }).value;
        const right = parseFactor();
        if (op === '*') left *= right;
        else left = right === 0 ? 0 : left / right;
      }
      return left;
    };

    const parseFactor = (): number => {
      const tok = peek();
      if (!tok) return 0;
      if (tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
        consume();
        const val = parseFactor();
        return tok.value === '-' ? -val : val;
      }
      if (tok.type === 'num') {
        consume();
        return tok.value;
      }
      if (tok.type === 'paren' && tok.value === '(') {
        consume();
        const val = parseExpression();
        if (peek()?.type === 'paren' && (peek() as { value: string }).value === ')') {
          consume();
        }
        return val;
      }
      if (tok.type === 'id') {
        consume();
        const next = peek();
        if (next?.type === 'paren' && next.value === '(') {
          consume();
          const args: number[] = [];
          while (peek() && !(peek()?.type === 'paren' && (peek() as { value: string }).value === ')')) {
            args.push(parseExpression());
            if (peek()?.type === 'comma') consume();
            else break;
          }
          if (peek()?.type === 'paren' && (peek() as { value: string }).value === ')') {
            consume();
          }
          const a = args[0] ?? 0;
          const b = args[1] ?? 0;
          switch (tok.value) {
            case 'max':
              return Math.max(...(args.length > 0 ? args : [0]));
            case 'min':
              return Math.min(...(args.length > 0 ? args : [0]));
            case 'ceil':
              return Math.ceil(a);
            case 'floor':
              return Math.floor(a);
            case 'round':
              return Math.round(a);
            default:
              return a + b * 0;
          }
        }
        return variables[tok.value] ?? 0;
      }
      consume();
      return 0;
    };

    const res = parseExpression();
    return Number.isFinite(res) ? Math.max(0, res) : 0;
  } catch {
    return 0;
  }
}

export function normalizeChargeSection(sec?: string): PdaChargeSection {
  if (sec === 'port' || sec === 'crew' || sec === 'husbandry' || sec === 'agency') {
    return sec;
  }
  return 'port';
}

export function inferChargeSection(
  tariff: TariffItem,
  overrideSection?: PdaChargeSection
): PdaChargeSection {
  if (overrideSection) return normalizeChargeSection(overrideSection);
  if (tariff.chargeSection) return normalizeChargeSection(tariff.chargeSection);
  const codeUp = tariff.code.toUpperCase();
  const conceptLow = `${tariff.concept} ${tariff.conceptEn}`.toLowerCase();
  if (
    codeUp.includes('AGY') ||
    codeUp.includes('AGENCY') ||
    conceptLow.includes('agency') ||
    conceptLow.includes('agenciamiento') ||
    conceptLow.includes('additional day') ||
    conceptLow.includes('surcharge')
  ) {
    return 'agency';
  }
  if (
    codeUp.includes('CREW') ||
    conceptLow.includes('crew change') ||
    conceptLow.includes('on-signer') ||
    conceptLow.includes('off-signer') ||
    conceptLow.includes('tripul')
  ) {
    return 'crew';
  }
  if (
    codeUp.includes('HUSB') ||
    conceptLow.includes('husbandry') ||
    conceptLow.includes('inspector') ||
    conceptLow.includes('tecnic')
  ) {
    return 'husbandry';
  }
  return 'port';
}

function formatRemarksTemplate(
  tariff: TariffItem,
  vars: {
    gt: number;
    loaM: number;
    rate: number;
    baseFixed: number;
    vatRate: number;
    portStayHours: number;
    movements: number;
    tugHours: number;
    tugsCount: number;
    includedDays: number;
    daysAlongside: number;
    cargoTons: number;
    vesselType: string;
    subSummary?: string;
  }
): string {
  const vatMult = round2(1 + vars.vatRate);
  const vatTxt = vars.vatRate > 0 ? ` x ${vatMult.toFixed(2)} VAT` : '';
  if (tariff.remarksTemplate && tariff.remarksTemplate.trim()) {
    return tariff.remarksTemplate
      .replace(/\{subSummary\}/gi, vars.subSummary || '')
      .replace(/\{gt\}/gi, vars.gt.toLocaleString('en-US'))
      .replace(/\{grt\}/gi, vars.gt.toLocaleString('en-US'))
      .replace(/\{loaM\}|\{loa\}/gi, String(vars.loaM))
      .replace(/\{rate\}/gi, vars.rate.toLocaleString('en-US'))
      .replace(/\{baseFixed\}/gi, vars.baseFixed.toLocaleString('en-US'))
      .replace(/\{vatMult\}/gi, vatMult.toFixed(2))
      .replace(/\{vatPct\}/gi, String(Math.round(vars.vatRate * 100)))
      .replace(/\{portStayHours\}|\{hrs\}/gi, String(Math.round(vars.portStayHours)))
      .replace(/\{movements\}/gi, String(vars.movements))
      .replace(/\{tugHours\}/gi, vars.tugHours.toFixed(2))
      .replace(/\{tugsCount\}|\{tugs\}/gi, String(vars.tugsCount))
      .replace(/\{includedDays\}/gi, String(vars.includedDays))
      .replace(/\{daysAlongside\}/gi, String(vars.daysAlongside))
      .replace(/\{cargoTons\}/gi, vars.cargoTons.toLocaleString('en-US'))
      .replace(/\{vesselType\}/gi, vars.vesselType);
  }

  if (vars.subSummary) {
    return `${vars.subSummary}${vatTxt}`;
  }

  switch (tariff.formulaType ?? 'standard') {
    case 'port_dues_hybrid':
      return `GRT x (${vars.rate.toFixed(2)}) Harbour Factor + ${tariff.currency} ($${vars.baseFixed.toLocaleString('en-US')}) Tariff${vatTxt}`;
    case 'dockage_loa_hours':
      return `LOA x (${vars.rate.toFixed(2)}) Factor x (${Math.round(vars.portStayHours)}) Hrs${vatTxt}`;
    case 'pilotage_gt_movements':
      return `GRT x (${vars.rate}) Factor x (${vars.movements}) IN/OUT${vatTxt}`;
    case 'towage_tugs':
      return `${tariff.currency} ($${vars.rate.toLocaleString('en-US')}) Tariff x (${vars.tugHours.toFixed(2)}) Hrs // (${vars.tugsCount}) Tugs${vatTxt}`;
    case 'agency_extra_days':
      return `USD $${vars.rate.toFixed(0)} Per day after ${vars.includedDays * 24} Hrs port stay (if any)`;
    case 'flat_with_vat':
      return tariff.notesEn || tariff.notes || `${tariff.currency} $${vars.rate.toLocaleString('en-US')}${vatTxt}`;
    case 'sub_items_breakdown':
      return tariff.notesEn || tariff.notes || `${tariff.currency} $${vars.rate.toLocaleString('en-US')}${vatTxt}`;
    case 'custom_expression':
      return `${tariff.customFormula || 'Custom formula'} (${tariff.notesEn || tariff.notes})`;
    default:
      return tariff.notesEn || tariff.notes || tariff.provider;
  }
}

export function calculatePda(input: PdaInput, tariffs: TariffItem[]): PdaResult {
  const safeExchange = input.usdToMxn > 0 ? input.usdToMxn : 17.0;
  const excludedSet = new Set(input.excludedTariffIds ?? []);

  const computedHours =
    input.portStayHours && input.portStayHours > 0
      ? input.portStayHours
      : input.opsRateMtHr && input.opsRateMtHr > 0 && input.cargoTons > 0
      ? round2(input.cargoTons / input.opsRateMtHr)
      : Math.max(1, Math.round(input.daysAlongside * 24));

  const effectiveDays = Math.max(0.5, round2(computedHours / 24));

  const applicableTariffs = tariffs.filter((item) => {
    if (!item.active) return false;
    if (excludedSet.has(item.id)) return false;
    if (item.portId !== input.portId) return false;
    if (item.areaId !== 'ALL' && item.areaId !== input.areaId) return false;
    if (
      input.vesselType &&
      item.applicableVesselTypes &&
      item.applicableVesselTypes !== 'ALL' &&
      item.applicableVesselTypes.length > 0 &&
      !item.applicableVesselTypes.includes(input.vesselType)
    ) {
      return false;
    }
    if (
      input.purpose &&
      item.applicablePurposes &&
      item.applicablePurposes !== 'ALL' &&
      item.applicablePurposes.length > 0 &&
      !item.applicablePurposes.includes(input.purpose)
    ) {
      return false;
    }
    return true;
  });

  const lineItems: PdaLineItem[] = applicableTariffs
    .map((tariff) => {
      const rateOverride = input.tariffRateOverrides?.[tariff.id];
      const effectiveRate =
        rateOverride?.rate !== undefined && Number.isFinite(rateOverride.rate)
          ? Math.max(0, rateOverride.rate)
          : tariff.rate;
      const vatRate = Math.max(
        0,
        rateOverride?.vatRate !== undefined && Number.isFinite(rateOverride.vatRate)
          ? rateOverride.vatRate
          : tariff.vatRate ?? 0
      );
      const baseFixed = Math.max(0, tariff.baseFixed ?? 0);
      const movements = Math.max(1, input.movements ?? tariff.movements ?? 2);
      const tugsCount = Math.max(1, input.tugsCount ?? tariff.tugsCount ?? 1);
      const includedDays = Math.max(0, tariff.includedDays ?? 3);
      const gt = Math.max(0, input.gt);
      const loaM = Math.max(0, input.loaM);
      const tugHours = Math.max(0, input.tugHours);
      const cargoTons = Math.max(0, input.cargoTons);

      const formulaType = tariff.formulaType ?? 'standard';
      let quantity = 1;
      let preVatOriginal = 0;
      let subBreakdown: PdaLineItemSubBreakdown[] | undefined;
      let subSummary = '';

      if (
        tariff.subItems &&
        tariff.subItems.length > 0 &&
        (formulaType === 'sub_items_breakdown' || formulaType === 'standard' || formulaType === 'flat_with_vat' || formulaType === 'port_dues_hybrid' || formulaType === 'dockage_loa_hours' || formulaType === 'pilotage_gt_movements' || formulaType === 'towage_tugs')
      ) {
        const customQtys = input.serviceSubQuantities?.[tariff.id];
        const built: PdaLineItemSubBreakdown[] = tariff.subItems.map((sub) => {
          const rawQty =
            customQtys && customQtys[sub.id] !== undefined
              ? customQtys[sub.id]
              : sub.defaultQty;
          const qty = Math.max(0, Number.isFinite(rawQty) ? rawQty : 0);
          const subRateOverride = rateOverride?.subRates?.[sub.id];
          const unitRate =
            subRateOverride !== undefined && Number.isFinite(subRateOverride)
              ? Math.max(0, subRateOverride)
              : sub.rate;

          let subPreVat = 0;
          switch (sub.calcMode) {
            case 'grt_rate':
            case 'grt_mov':
              subPreVat = qty > 0 ? gt * unitRate * qty : 0;
              break;
            case 'loa_hrs':
              subPreVat = qty > 0 ? loaM * unitRate * computedHours * qty : 0;
              break;
            case 'tug_hrs':
              subPreVat =
                qty > 0
                  ? tugHours > 0
                    ? unitRate * tugHours * qty
                    : unitRate * qty
                  : 0;
              break;
            case 'fixed':
            case 'per_qty':
            default:
              subPreVat = qty * unitRate;
              break;
          }
          const subWithVatOriginal = round2(subPreVat * (1 + vatRate));
          const subUsd =
            tariff.currency === 'USD'
              ? subWithVatOriginal
              : round2(subWithVatOriginal / safeExchange);
          return {
            id: sub.id,
            label: sub.label,
            labelEn: sub.labelEn,
            unitLabel: sub.unitLabel,
            calcMode: sub.calcMode,
            qty,
            unitRate,
            subtotalOriginal: round2(subPreVat),
            subtotalUsd: subUsd,
          };
        });

        subBreakdown = built;
        preVatOriginal = round2(
          built.reduce((sum, b) => sum + b.subtotalOriginal, 0)
        );
        const totalSubQty = built.reduce((sum, b) => sum + b.qty, 0);
        quantity = totalSubQty > 0 ? round2(totalSubQty) : 0;
        const activeParts = built
          .filter((b) => b.qty > 0)
          .map((b) =>
            b.qty === 1 && b.calcMode === 'fixed'
              ? b.labelEn
              : `${b.labelEn} (${b.qty})`
          );
        subSummary = activeParts.join(' + ');
      } else {
        switch (formulaType) {
          case 'port_dues_hybrid':
            quantity = gt;
            preVatOriginal = gt * effectiveRate + baseFixed;
            break;
          case 'dockage_loa_hours':
            quantity = round2(loaM * computedHours);
            preVatOriginal = loaM * effectiveRate * computedHours;
            break;
          case 'pilotage_gt_movements':
            quantity = gt * movements;
            preVatOriginal = gt * effectiveRate * movements;
            break;
          case 'towage_tugs':
            quantity = round2(tugHours * tugsCount);
            preVatOriginal = effectiveRate * tugHours * tugsCount;
            break;
          case 'agency_extra_days': {
            const totalDaysCeil = Math.ceil(computedHours / 24);
            const extraDays = Math.max(0, totalDaysCeil - includedDays);
            quantity = extraDays;
            preVatOriginal = extraDays * effectiveRate;
            break;
          }
          case 'flat_with_vat':
            quantity = 1;
            preVatOriginal = effectiveRate;
            break;
          case 'custom_expression': {
            quantity = 1;
            const exprResult = evaluateSafeFormula(tariff.customFormula ?? 'rate', {
              gt,
              grt: gt,
              loa: loaM,
              loam: loaM,
              dwt: Math.max(0, input.dwt ?? gt * 1.45),
              beam: Math.max(0, input.beamM ?? 24),
              beamm: Math.max(0, input.beamM ?? 24),
              cargotons: cargoTons,
              qty: cargoTons,
              opsrate: Math.max(0, input.opsRateMtHr ?? 150),
              portstayhours: computedHours,
              stayhrs: computedHours,
              daysalongside: effectiveDays,
              days: effectiveDays,
              tughours: tugHours,
              tugscount: tugsCount,
              tugs: tugsCount,
              movements,
              rate: effectiveRate,
              basefixed: baseFixed,
              vatrate: vatRate,
              vat: 1 + vatRate,
              fx: safeExchange,
            });
            preVatOriginal = exprResult;
            break;
          }
          case 'standard':
          default: {
            switch (tariff.unit) {
              case 'per_gt':
                quantity = gt;
                break;
              case 'per_loa_m':
                quantity = loaM;
                break;
              case 'per_day':
                quantity = Math.max(0, input.daysAlongside);
                break;
              case 'per_ton':
                quantity = cargoTons;
                break;
              case 'per_tug_hour':
                quantity = tugHours;
                break;
              case 'flat':
              default:
                quantity = 1;
                break;
            }
            preVatOriginal = quantity * effectiveRate;
            break;
          }
        }
      }

      const amountOriginal =
        formulaType === 'custom_expression'
          ? round2(preVatOriginal)
          : round2(preVatOriginal * (1 + vatRate));
      const vatOriginal =
        formulaType === 'custom_expression'
          ? 0
          : round2(preVatOriginal * vatRate);

      const amountUsd =
        tariff.currency === 'USD'
          ? amountOriginal
          : round2(amountOriginal / safeExchange);
      const amountMxn =
        tariff.currency === 'MXN'
          ? amountOriginal
          : round2(amountOriginal * safeExchange);
      const vatAmountUsd =
        tariff.currency === 'USD'
          ? vatOriginal
          : round2(vatOriginal / safeExchange);

      const originalChargeSection = inferChargeSection(tariff);
      const chargeSection = inferChargeSection(
        tariff,
        input.tariffSectionOverrides?.[tariff.id]
      );
      const remarks = formatRemarksTemplate(tariff, {
        gt,
        loaM,
        rate: effectiveRate,
        baseFixed,
        vatRate,
        portStayHours: computedHours,
        movements,
        tugHours,
        tugsCount,
        includedDays,
        daysAlongside: input.daysAlongside,
        cargoTons,
        vesselType: input.vesselType ?? 'Tanker / Chemical',
        subSummary,
      });

      return {
        tariffId: tariff.id,
        code: tariff.code,
        concept: tariff.concept,
        conceptEn: tariff.conceptEn,
        provider: tariff.provider,
        unit: tariff.unit,
        quantity,
        unitRate: effectiveRate,
        currency: tariff.currency,
        amountOriginal,
        amountUsd,
        amountMxn,
        verificationStatus: tariff.verificationStatus,
        chargeSection,
        originalChargeSection,
        remarks,
        vatAmountUsd,
        subBreakdown,
        _showZero: tariff.showZeroAmount === true,
      };
    })
    .filter((item) => item.amountUsd > 0 || item._showZero)
    .map(({ _showZero: _unused, ...clean }) => clean);

  const portChargesTotalUsd = round2(
    lineItems
      .filter((i) => i.chargeSection === 'port')
      .reduce((sum, i) => sum + i.amountUsd, 0)
  );
  const crewChargesTotalUsd = round2(
    lineItems
      .filter((i) => i.chargeSection === 'crew')
      .reduce((sum, i) => sum + i.amountUsd, 0)
  );
  const husbandryChargesTotalUsd = round2(
    lineItems
      .filter((i) => i.chargeSection === 'husbandry')
      .reduce((sum, i) => sum + i.amountUsd, 0)
  );
  const agencyChargesTotalUsd = round2(
    lineItems
      .filter((i) => i.chargeSection === 'agency')
      .reduce((sum, i) => sum + i.amountUsd, 0)
  );
  const totalUsd = round2(
    portChargesTotalUsd +
      crewChargesTotalUsd +
      husbandryChargesTotalUsd +
      agencyChargesTotalUsd
  );
  const totalMxn = round2(lineItems.reduce((sum, item) => sum + item.amountMxn, 0));
  const pendingItemsCount = lineItems.filter(
    (item) => item.verificationStatus === 'pending_validation'
  ).length;

  return {
    lineItems,
    totalUsd,
    totalMxn,
    portChargesTotalUsd,
    crewChargesTotalUsd,
    husbandryChargesTotalUsd,
    agencyChargesTotalUsd,
    effectivePortStayHours: computedHours,
    pendingItemsCount,
  };
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const CARGO_SEMANTIC_GROUPS: Array<{ categories: string[]; members: string[] }> = [
  {
    categories: ['granel agricola', 'agricultural bulk', 'granel general', 'general bulk'],
    members: [
      'maiz',
      'maiz amarillo',
      'corn',
      'maize',
      'trigo',
      'wheat',
      'sorgo',
      'sorghum',
      'milo',
      'soya',
      'soja',
      'frijol de soya',
      'frijol soya',
      'pasta de soya',
      'harina de soya',
      'soybean',
      'ddg',
      'ddgs',
      'grano',
      'granos',
      'semilla',
      'azucar',
      'cebada',
      'arroz',
      'frijol',
    ],
  },
  {
    categories: ['granel mineral', 'mineral bulk', 'granel general', 'general bulk'],
    members: [
      'azufre',
      'sulfur',
      'roca fosforica',
      'fosforita',
      'phosphate rock',
      'cemento',
      'cement',
      'clinker',
      'barita',
      'barite',
      'coque',
      'petcoke',
      'urea',
      'map',
      'dap',
      'npk',
      'fosfatos',
      'sulfato de amonio',
      'nitrato de amonio',
      'fertilizante',
      'fertilizantes',
      'mineral de hierro',
      'carbon mineral',
      'bauxita',
      'yeso',
    ],
  },
  {
    categories: ['aceites vegetales', 'vegetable oils', 'aceite vegetal', 'vegetable oil'],
    members: [
      'aceite de palma',
      'palma',
      'palm oil',
      'oleina',
      'oleina de palma',
      'palm olein',
      'estearina',
      'estearina de palma',
      'palm stearin',
      'palmiste',
      'pko',
      'palm kernel',
      'aceite de soya',
      'soybean oil',
      'sebo',
      'tallow',
    ],
  },
  {
    categories: ['acero', 'steel', 'carga general', 'general cargo'],
    members: [
      'bobinas',
      'rollos de acero',
      'rollo de acero',
      'placa de acero',
      'placa',
      'varilla',
      'alambron',
      'planchon',
      'tuberia lastrada',
      'tuberia submarina',
      'coils',
      'plates',
      'rebar',
      'linepipe',
      'carga suelta',
      'bultos',
    ],
  },
  {
    categories: ['hidrocarburos', 'hydrocarbons', 'refinados', 'refined products', 'combustibles'],
    members: [
      'petroleo crudo',
      'crudo',
      'crude oil',
      'maya',
      'istmo',
      'olmeca',
      'gasolina',
      'gasolinas',
      'magna',
      'premium',
      'base octano',
      'octane base',
      'cb-1',
      'cb-9',
      'cb-8',
      'diesel',
      'uba',
      'ulsd',
      'mgo',
      'turbosina',
      'jet a-1',
      'jet fuel',
      'nafta',
      'naphtha',
      'combustoleo',
      'fuel oil',
      'ifo',
      'diluente',
      'gasoleo',
      'gasolina de pirolisis',
      'pygas',
      'propano',
      'glp',
      'lpg',
      'butano',
      'butadieno',
      'isobutano',
      'butileno',
      'etano',
      'etileno',
    ],
  },
  {
    categories: [
      'petroquimicos',
      'petroquimica',
      'productos quimicos',
      'quimicos liquidos',
      'solventes',
      'acidos',
      'aromaticos',
      'glicoles',
      'alcoholes',
    ],
    members: [
      'acetona',
      'dmk',
      'etanol',
      'isopropanol',
      'ipa',
      'metanol',
      'mek',
      'mibk',
      'mibc',
      'aromina',
      'exxsol',
      'varsol',
      'alcohol laurico',
      'benceno',
      'tolueno',
      'paraxileno',
      'xilenos',
      'sosa caustica',
      'acido acetico',
      'vam',
      'acetato de vinilo',
      'estireno',
      'uf85',
      'amoniaco',
      'vcm',
      'cloruro de vinilo',
      'acido fosforico',
      'acido sulfurico',
      'azufre liquido',
    ],
  },
  {
    categories: ['asfalto', 'asphalt', 'bitumen', 'betun'],
    members: [
      'asfalto modificado',
      'sbs',
      'emulsion asfaltica',
      'emulsiones asfalticas',
      'asfalto caliente',
      'un 3257',
      'ergon',
      'smart pass',
    ],
  },
  {
    categories: ['contenedores', 'containers', 'carga proyecto', 'project cargo', 'ferrobuque', 'rail-ferry'],
    members: [
      'fcl',
      'lcl',
      'reefer',
      'teu',
      'isotanque',
      'vagones',
      'furgones',
      'carrotanques',
      'tolvas',
      'cg railway',
      'ciit',
      'modulos offshore',
    ],
  },
];

export function matchesSemanticCargo(haystack: string, query: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  const h = normalizeSearchText(haystack);
  if (h.includes(q)) return true;
  if (q.length < 3) return false;

  for (const group of CARGO_SEMANTIC_GROUPS) {
    const queryMatchesCategory = group.categories.some(
      (cat) => cat === q || (q.length >= 4 && (cat.includes(q) || q.includes(cat)))
    );
    const queryMatchesMember = group.members.some(
      (mem) => mem === q || mem.includes(q) || (mem.length >= 4 && q.includes(mem))
    );

    if (queryMatchesMember) {
      if (group.categories.some((cat) => h.includes(cat))) {
        return true;
      }
    }

    if (queryMatchesCategory) {
      if (
        group.categories.some((cat) => h.includes(cat)) ||
        group.members.some((mem) => h.includes(mem))
      ) {
        return true;
      }
    }
  }

  return false;
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
  const q = searchQuery.trim();
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
        ].join(' ');
        if (!matchesSemanticCargo(haystack, q)) continue;
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
      <td style="background:linear-gradient(125deg,#071529 0%,#0b2747 72%,#26596b 100%);background-color:#0b1220;color:#ffffff;padding:24px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:top;padding-right:16px;">
              <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#93c5fd;">ISS Port Intelligence · Sedna Dispatch</div>
              <h1 style="margin:8px 0 4px 0;font-size:24px;font-weight:700;color:#ffffff;">${escapeHtml(port.name)} (${escapeHtml(port.unLocode)})</h1>
              <div style="font-size:13px;color:#cbd5e1;">${isEs ? 'Coordenadas' : 'Coordinates'}: ${escapeHtml(port.coordinates)} · ${isEs ? 'Autoridad' : 'Authority'}: ${escapeHtml(port.authority)} · VHF: ${escapeHtml(port.vhfChannel)}${weatherLine}</div>
            </td>
            <td style="vertical-align:top;text-align:right;width:190px;white-space:nowrap;">
              <svg width="180" height="58" viewBox="0 0 240 78" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Inchcape Shipping Services">
                <text x="12" y="48" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="25" fill="#ffffff" letter-spacing="1">INCHCAPE</text>
                <polygon points="103,29 109,43 97,43" fill="#e11d48" />
                <text x="42" y="64" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="9.5" fill="#e11d48" letter-spacing="2.4">SHIPPING SERVICES</text>
                <path d="M164 26 A31 31 0 1 1 196 68" fill="none" stroke="#ffffff" stroke-width="4.2" stroke-linecap="round"/>
                <path d="M169 29 A24 24 0 1 1 194 62" fill="none" stroke="#cbd5e1" stroke-width="2.4" stroke-linecap="round"/>
                <path d="M174 33 A18 18 0 1 1 191 56" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
                <polygon points="215,10 203,20 207,24" fill="#e11d48"/>
                <path d="M180 34 L204 20 L195 45 L193 33 Z" fill="#ffffff"/>
              </svg>
            </td>
          </tr>
        </table>
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
