import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  ExternalLink,
  FileDown,
  FolderOpen,
  History,
  Link2,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {
  calculatePda,
  inferChargeSection,
  normalizeChargeSection,
  round2,
} from '../utils/pdaEngine';
import { exportPdaToPdf, sanitizePdfFilename } from '../utils/pdfExporter';
import { groupPdaHistoryByMonth } from '../utils/packageExporter';
import {
  normalizeTariffSheetUrl,
  parseTariffRowsFromCsvOrJson,
} from '../utils/tariffSheetSync';
import { FilenamePromptModal } from './FilenamePromptModal';
import type {
  Language,
  PdaChargeSection,
  PdaCustomField,
  PdaFormatPreset,
  PdaFormulaType,
  PdaHistoryRecord,
  PdaLineItem,
  PdaOfficeAndBankProfile,
  PdaPurpose,
  PdaSubItemCalcMode,
  PdaSubItemDef,
  PdaVesselType,
  PortArea,
  PortProfile,
  TariffItem,
  TariffSheetSyncConfig,
} from '../types/port';

interface TariffsAndPdaSectionProps {
  port: PortProfile;
  allPorts?: PortProfile[];
  areas: PortArea[];
  tariffs: TariffItem[];
  pdaFormats?: PdaFormatPreset[];
  pdaOfficeProfile?: PdaOfficeAndBankProfile;
  pdaDriveFolderUrl?: string;
  pdaHistory?: PdaHistoryRecord[];
  tariffSheetSync?: TariffSheetSyncConfig;
  lang: Language;
  disableDownloads?: boolean;
  onSyncTariffsFromSheet: (payload: {
    items: TariffItem[];
    formats?: PdaFormatPreset[];
    replacePortTariffs: boolean;
    config: TariffSheetSyncConfig;
  }) => void;
  onAddTariffConcept?: (tariff: TariffItem) => void;
  onUpdateTariffConcept?: (tariffId: string, patch: Partial<TariffItem>) => void;
  onSavePdaFormat?: (fmt: PdaFormatPreset) => void;
  onSavePdaHistoryRecord?: (record: PdaHistoryRecord) => void;
  onDeletePdaHistoryRecord?: (id: string) => void;
  onSelectPort?: (portId: string) => void;
  onOpenContentManager: () => void;
}

const VESSEL_TYPES: PdaVesselType[] = [
  'Tanker / Chemical',
  'Crude / Aframax',
  'Gas Carrier (LPG/Ethane)',
  'Dry Bulk',
  'General Cargo / Steel',
  'Container',
  'Rail Ferry',
  'Offshore',
];

const PURPOSES: PdaPurpose[] = [
  'DISCHARGE',
  'LOAD',
  'LOAD & DISCHARGE',
  'BUNKERING',
  'CREW CHANGE',
  'REPAIRS',
  'ANCHORAGE',
];

const UNIT_LABELS: Record<TariffItem['unit'], { es: string; en: string }> = {
  per_gt: { es: 'Por UAB/GT', en: 'Per GT' },
  per_loa_m: { es: 'Por metro LOA', en: 'Per m LOA' },
  per_day: { es: 'Por día', en: 'Per day' },
  per_ton: { es: 'Por tonelada', en: 'Per MT' },
  per_tug_hour: { es: 'Por hora-remolcador', en: 'Per tug-hour' },
  flat: { es: 'Cuota fija', en: 'Flat fee' },
};

const FORMULA_LABELS: Record<PdaFormulaType, string> = {
  standard: 'Estándar (Qty × Tarifa)',
  port_dues_hybrid: 'Port Dues ((GRT×Factor + Fijo) + IVA)',
  dockage_loa_hours: 'Muellaje (LOA × Tarifa × Hrs + IVA)',
  pilotage_gt_movements: 'Practicaje (GRT × Factor × Mov + IVA)',
  towage_tugs: 'Remolque (Tarifa × Hrs × Remolcadores + IVA)',
  agency_extra_days: 'Días Adicionales (> Días Incl.)',
  flat_with_vat: 'Cuota Fija + IVA',
  sub_items_breakdown: 'Desglose por Sub-servicios (Qty × Tarifa)',
  custom_expression: 'Fórmula Personalizada',
};

const RUBRO_META: Array<{
  key: PdaChargeSection;
  title: string;
  subtitleEs: string;
  subtitleEn: string;
}> = [
  {
    key: 'port',
    title: 'Port Charges',
    subtitleEs: 'Derechos de puerto, muellaje, practicaje, remolque, lancha y autoridades',
    subtitleEn: 'Harbour dues, dockage, pilotage, towage, launch & port authorities',
  },
  {
    key: 'crew',
    title: 'Crew Charges',
    subtitleEs: 'Cambio de tripulación (ON/OFF-Signers), traslados, hotel y visas',
    subtitleEn: 'Crew change (ON/OFF-Signers), shore transfers, hotel & immigration',
  },
  {
    key: 'husbandry',
    title: 'Husbandry Charges',
    subtitleEs: 'Inspectores, técnicos, visitas médicas, lancha husbandry y logística',
    subtitleEn: 'Surveyors, technicians, medical attendance, launch & logistics',
  },
  {
    key: 'agency',
    title: 'Agency Charges',
    subtitleEs: 'Honorarios de agenciamiento, estadía adicional, comunicación y gastos',
    subtitleEn: 'Agency fee, extra port stay days, communications & handling',
  },
];

function getSubModeLabel(mode: PdaSubItemCalcMode, lang: Language): string {
  switch (mode) {
    case 'fixed':
      return lang === 'es' ? 'Cuota fija' : 'Fixed fee';
    case 'per_qty':
      return lang === 'es' ? 'Por servicio' : 'Per service';
    case 'grt_rate':
      return 'GRT × factor';
    case 'grt_mov':
      return 'GRT × factor × mov';
    case 'loa_hrs':
      return 'LOA × factor × hrs';
    case 'tug_hrs':
      return lang === 'es' ? 'Tarifa × hrs remolque' : 'Rate × tug hrs';
  }
}

export function TariffsAndPdaSection({
  port,
  allPorts,
  areas,
  tariffs,
  pdaFormats = [],
  pdaOfficeProfile,
  pdaDriveFolderUrl = 'https://drive.google.com/drive/folders/1JizUaDQiSSoqaxc7X9_9oPByvTGQLAgO',
  pdaHistory = [],
  tariffSheetSync,
  lang,
  disableDownloads = false,
  onSyncTariffsFromSheet,
  onAddTariffConcept,
  onUpdateTariffConcept,
  onSavePdaFormat,
  onSavePdaHistoryRecord,
  onDeletePdaHistoryRecord,
  onSelectPort,
  onOpenContentManager,
}: TariffsAndPdaSectionProps) {
  const portAreas = areas.filter((a) => a.portId === port.id);
  const availableFormats = useMemo(
    () => pdaFormats.filter((f) => f.portId === 'ALL' || f.portId === port.id),
    [pdaFormats, port.id]
  );

  const [selectedFormatId, setSelectedFormatId] = useState<string>(
    availableFormats[0]?.id ?? ''
  );
  const effectiveFormatId = availableFormats.some((f) => f.id === selectedFormatId)
    ? selectedFormatId
    : '';
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    portAreas[0]?.id ?? 'area-asipona-coa'
  );

  // Official PDA Header & Vessel Fields
  const [principal, setPrincipal] = useState('TO BE ADVISED');
  const [invoiceNumber, setInvoiceNumber] = useState('PDA-COA-2026-001');
  const [vesselName, setVesselName] = useState('TBN 2');
  const [vesselType, setVesselType] = useState<PdaVesselType>('Tanker / Chemical');
  const [purpose, setPurpose] = useState<PdaPurpose>('DISCHARGE');
  const [cargoDescription, setCargoDescription] = useState('VEG OIL');
  const [cargoTons, setCargoTons] = useState(7000);
  const [opsRateMtHr, setOpsRateMtHr] = useState(150);
  const [dwt, setDwt] = useState(32292);
  const [gt, setGt] = useState(21296);
  const [loaM, setLoaM] = useState(174);
  const [beamM, setBeamM] = useState(27);
  const [manualPortStayHrs, setManualPortStayHrs] = useState<number | null>(null);
  const [eta, setEta] = useState('TBAD');
  const [tugsCount, setTugsCount] = useState(2);
  const [tugHours, setTugHours] = useState(1.25);
  const [movements, setMovements] = useState(2);
  const [usdToMxn, setUsdToMxn] = useState(17.0);

  // Active toggles for metadata fields + temporary exclusions + dynamic sub-quantities & overrides
  const [inactiveFieldKeys, setInactiveFieldKeys] = useState<string[]>([
    'invoiceNumber',
  ]);
  const [excludedTariffIds, setExcludedTariffIds] = useState<string[]>([]);
  const [serviceSubQuantities, setServiceSubQuantities] = useState<
    Record<string, Record<string, number>>
  >({});
  const [tariffSectionOverrides, setTariffSectionOverrides] = useState<
    Record<string, PdaChargeSection>
  >({});
  const [tariffRateOverrides, setTariffRateOverrides] = useState<
    Record<string, { rate?: number; vatRate?: number; subRates?: Record<string, number> }>
  >({});
  const [expandedTariffIds, setExpandedTariffIds] = useState<Record<string, boolean>>({});
  const [showCustomFields, setShowCustomFields] = useState(false);

  const [customFields, setCustomFields] = useState<PdaCustomField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [newFieldColumn, setNewFieldColumn] = useState<'left' | 'right'>('left');

  // Inline Create New Format Preset
  const [showNewFormatForm, setShowNewFormatForm] = useState(false);
  const [newFmtName, setNewFmtName] = useState('');

  // Per-Rubro Inline Add / Reassign Concept Panel
  const [activeAdderSection, setActiveAdderSection] = useState<PdaChargeSection | null>(null);
  const [adderMode, setAdderMode] = useState<'create' | 'move'>('create');
  const [qcConcept, setQcConcept] = useState('');
  const [qcProvider, setQcProvider] = useState('ISS / Proveedor');
  const [qcSection, setQcSection] = useState<PdaChargeSection>('port');
  const [qcFormulaType, setQcFormulaType] = useState<PdaFormulaType>('flat_with_vat');
  const [qcCustomExpr, setQcCustomExpr] = useState('grt * rate * 1.16');
  const [qcRate, setQcRate] = useState(250);
  const [qcCurrency, setQcCurrency] = useState<'USD' | 'MXN'>('USD');
  const [qcVatPct, setQcVatPct] = useState(16);
  const [qcVesselScope, setQcVesselScope] = useState<PdaVesselType | 'ALL'>('ALL');

  // Google Sheets Tariff Sync state
  const [sheetUrlInput, setSheetUrlInput] = useState(tariffSheetSync?.sheetUrl ?? '');
  const [replacePortTariffs, setReplacePortTariffs] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [pasteCsvText, setPasteCsvText] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // PDF Filename Modal & History states
  const [pdfPromptOpen, setPdfPromptOpen] = useState(false);
  const [prefilledPdfName, setPrefilledPdfName] = useState<string | null>(null);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [loadedHistoryBanner, setLoadedHistoryBanner] = useState<string | null>(null);
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');

  const effectiveAreaId = portAreas.some((a) => a.id === selectedAreaId)
    ? selectedAreaId
    : portAreas[0]?.id ?? '';
  const activeArea = portAreas.find((a) => a.id === effectiveAreaId);

  const autoStayHours =
    opsRateMtHr > 0 && cargoTons > 0 ? Math.round(cargoTons / opsRateMtHr) : 48;
  const effectiveStayHours =
    manualPortStayHrs !== null && manualPortStayHrs > 0
      ? manualPortStayHrs
      : autoStayHours;
  const derivedDaysAlongside = Math.max(0.5, round2(effectiveStayHours / 24));

  const isFieldActive = (key: string) => !inactiveFieldKeys.includes(key);
  const toggleFieldActive = (key: string) => {
    setInactiveFieldKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleExpandTariff = (tariffId: string) => {
    setExpandedTariffIds((prev) => ({ ...prev, [tariffId]: !prev[tariffId] }));
  };

  const setSubQty = (tariffId: string, subId: string, nextQty: number) => {
    const cleanQty = Math.max(0, Number.isFinite(nextQty) ? nextQty : 0);
    setServiceSubQuantities((prev) => ({
      ...prev,
      [tariffId]: {
        ...(prev[tariffId] ?? {}),
        [subId]: cleanQty,
      },
    }));
  };

  const setSubRateOverride = (tariffId: string, subId: string, nextRate: number) => {
    const cleanRate = Math.max(0, Number.isFinite(nextRate) ? nextRate : 0);
    setTariffRateOverrides((prev) => ({
      ...prev,
      [tariffId]: {
        ...(prev[tariffId] ?? {}),
        subRates: {
          ...(prev[tariffId]?.subRates ?? {}),
          [subId]: cleanRate,
        },
      },
    }));
  };

  const setTariffBaseRateOverride = (tariffId: string, nextRate: number) => {
    const cleanRate = Math.max(0, Number.isFinite(nextRate) ? nextRate : 0);
    setTariffRateOverrides((prev) => ({
      ...prev,
      [tariffId]: {
        ...(prev[tariffId] ?? {}),
        rate: cleanRate,
      },
    }));
  };

  const handleAssignTariffSection = (tariffId: string, targetSection: PdaChargeSection) => {
    setTariffSectionOverrides((prev) => ({
      ...prev,
      [tariffId]: targetSection,
    }));
    setExcludedTariffIds((prev) => prev.filter((id) => id !== tariffId));
  };

  const handleApplyPreset = (presetId: string) => {
    setSelectedFormatId(presetId);
    const preset = availableFormats.find((f) => f.id === presetId);
    if (!preset) return;
    setVesselType(preset.vesselType);
    setPurpose(preset.purpose);
    setCargoDescription(preset.defaultCargo);
    setCargoTons(preset.defaultQuantity);
    setOpsRateMtHr(preset.defaultOpsRateMtHr);
    setTugsCount(preset.defaultTugsCount);
    setTugHours(preset.defaultTugHours);
    setMovements(preset.defaultMovements);
    setManualPortStayHrs(null);
    if (
      preset.defaultAreaId &&
      portAreas.some((a) => a.id === preset.defaultAreaId)
    ) {
      setSelectedAreaId(preset.defaultAreaId);
    }
    if (preset.customFields) {
      setCustomFields(preset.customFields.map((f) => ({ ...f })));
    } else {
      setCustomFields([]);
    }
  };

  const handleCreateNewFormat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFmtName.trim() || !onSavePdaFormat) return;
    const fmt: PdaFormatPreset = {
      id: `fmt-${port.id}-${Date.now()}`,
      portId: port.id,
      name: newFmtName.trim(),
      nameEn: newFmtName.trim(),
      vesselType,
      purpose,
      defaultCargo: cargoDescription.trim() || 'CARGO',
      defaultQuantity: cargoTons,
      defaultOpsRateMtHr: opsRateMtHr,
      defaultTugsCount: tugsCount,
      defaultTugHours: tugHours,
      defaultMovements: movements,
      defaultAreaId: effectiveAreaId,
      customFields: customFields.map((f) => ({ ...f })),
    };
    onSavePdaFormat(fmt);
    setSelectedFormatId(fmt.id);
    setNewFmtName('');
    setShowNewFormatForm(false);
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return;
    setCustomFields((prev) => [
      ...prev,
      {
        id: `cf-${Date.now()}`,
        label: newFieldLabel.trim().toUpperCase(),
        value: newFieldValue.trim() || '-',
        column: newFieldColumn,
        active: true,
      },
    ]);
    setNewFieldLabel('');
    setNewFieldValue('');
  };

  const openSectionAdder = (sec: PdaChargeSection) => {
    if (activeAdderSection === sec) {
      setActiveAdderSection(null);
      return;
    }
    setActiveAdderSection(sec);
    setQcSection(sec);
    setAdderMode('create');
  };

  const handleAddQuickConcept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcConcept.trim() || !onAddTariffConcept) return;
    const newId = `tar-${port.id}-${Date.now()}`;
    const cleanConcept = qcConcept.trim();
    const initialSubItems: PdaSubItemDef[] | undefined =
      qcFormulaType === 'sub_items_breakdown'
        ? [
            {
              id: `sub-${Date.now()}`,
              label: cleanConcept,
              labelEn: cleanConcept,
              unitLabel: lang === 'es' ? 'Por servicio' : 'Per service',
              rate: Math.max(0, qcRate),
              calcMode: 'per_qty',
              defaultQty: 1,
            },
          ]
        : undefined;

    const item: TariffItem = {
      id: newId,
      portId: port.id,
      areaId: 'ALL',
      code: `${port.shortCode}-CUSTOM`,
      concept: cleanConcept,
      conceptEn: cleanConcept,
      provider: qcProvider.trim() || 'ISS / Proveedor',
      unit: 'flat',
      rate: Math.max(0, qcRate),
      currency: qcCurrency,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      notes: 'Concepto agregado en calculadora PDA',
      notesEn: 'Custom PDA concept',
      verificationStatus: 'pending_validation',
      active: true,
      showZeroAmount: true,
      chargeSection: qcSection,
      formulaType: qcFormulaType,
      customFormula: qcFormulaType === 'custom_expression' ? qcCustomExpr.trim() : undefined,
      vatRate: Math.max(0, qcVatPct / 100),
      tugsCount,
      movements,
      applicableVesselTypes: qcVesselScope === 'ALL' ? 'ALL' : [qcVesselScope],
      subItems: initialSubItems,
    };
    onAddTariffConcept(item);
    setExpandedTariffIds((prev) => ({ ...prev, [newId]: true }));
    setQcConcept('');
    setActiveAdderSection(null);
  };

  const handleAddSubItemToTariff = (
    tariff: TariffItem,
    payload: {
      label: string;
      rate: number;
      calcMode: PdaSubItemCalcMode;
      qty: number;
    }
  ) => {
    if (!onUpdateTariffConcept || !payload.label.trim()) return;
    const cleanLabel = payload.label.trim();
    const cleanRate = Math.max(0, Number.isFinite(payload.rate) ? payload.rate : 0);
    const cleanQty = Math.max(0, Number.isFinite(payload.qty) ? payload.qty : 1);
    const newSub: PdaSubItemDef = {
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: cleanLabel,
      labelEn: cleanLabel,
      unitLabel: getSubModeLabel(payload.calcMode, lang),
      rate: cleanRate,
      calcMode: payload.calcMode,
      defaultQty: cleanQty,
    };

    const existingSubs = tariff.subItems ?? [];
    let baseSubs: PdaSubItemDef[] = existingSubs;
    const initialQtyPatch: Record<string, number> = {
      ...(serviceSubQuantities[tariff.id] ?? {}),
      [newSub.id]: cleanQty,
    };

    if (existingSubs.length === 0) {
      const effectiveRate =
        tariffRateOverrides[tariff.id]?.rate !== undefined
          ? Math.max(0, tariffRateOverrides[tariff.id].rate!)
          : tariff.rate;
      const ft = tariff.formulaType ?? 'standard';
      if (ft === 'port_dues_hybrid') {
        const varId = `sub-base-var-${tariff.id}`;
        baseSubs = [
          {
            id: varId,
            label: `${tariff.concept} (Variable GRT)`,
            labelEn: `${tariff.conceptEn} (GRT Variable)`,
            unitLabel: 'GRT × factor',
            rate: effectiveRate,
            calcMode: 'grt_rate',
            defaultQty: 1,
          },
        ];
        initialQtyPatch[varId] = 1;
        if ((tariff.baseFixed ?? 0) > 0) {
          const fixId = `sub-base-fix-${tariff.id}`;
          baseSubs.push({
            id: fixId,
            label: `${tariff.concept} (Cuota fija)`,
            labelEn: `${tariff.conceptEn} (Fixed fee)`,
            unitLabel: lang === 'es' ? 'Cuota fija' : 'Fixed fee',
            rate: tariff.baseFixed ?? 0,
            calcMode: 'fixed',
            defaultQty: 1,
          });
          initialQtyPatch[fixId] = 1;
        }
      } else if (ft === 'dockage_loa_hours') {
        const baseId = `sub-base-dock-${tariff.id}`;
        baseSubs = [
          {
            id: baseId,
            label: tariff.concept,
            labelEn: tariff.conceptEn,
            unitLabel: 'LOA × hrs',
            rate: effectiveRate,
            calcMode: 'loa_hrs',
            defaultQty: 1,
          },
        ];
        initialQtyPatch[baseId] = 1;
      } else if (ft === 'pilotage_gt_movements') {
        const baseId = `sub-base-pilot-${tariff.id}`;
        baseSubs = [
          {
            id: baseId,
            label: tariff.concept,
            labelEn: tariff.conceptEn,
            unitLabel: 'GRT × mov',
            rate: effectiveRate,
            calcMode: 'grt_mov',
            defaultQty: movements,
          },
        ];
        initialQtyPatch[baseId] = movements;
      } else if (ft === 'towage_tugs') {
        const baseId = `sub-base-tow-${tariff.id}`;
        baseSubs = [
          {
            id: baseId,
            label: tariff.concept,
            labelEn: tariff.conceptEn,
            unitLabel: lang === 'es' ? 'Tarifa × hrs remolque' : 'Rate × tug hrs',
            rate: effectiveRate,
            calcMode: 'tug_hrs',
            defaultQty: tugsCount,
          },
        ];
        initialQtyPatch[baseId] = tugsCount;
      } else {
        const baseId = `sub-base-main-${tariff.id}`;
        const baseQty =
          ft === 'agency_extra_days'
            ? Math.max(0, Math.ceil(effectiveStayHours / 24) - (tariff.includedDays ?? 3))
            : 1;
        baseSubs = [
          {
            id: baseId,
            label: `${tariff.concept} (Base)`,
            labelEn: `${tariff.conceptEn} (Base)`,
            unitLabel:
              lang === 'es'
                ? UNIT_LABELS[tariff.unit]?.es ?? 'Por servicio'
                : UNIT_LABELS[tariff.unit]?.en ?? 'Per service',
            rate: effectiveRate,
            calcMode: 'per_qty',
            defaultQty: baseQty,
          },
        ];
        initialQtyPatch[baseId] = baseQty;
      }
    }

    onUpdateTariffConcept(tariff.id, {
      formulaType: 'sub_items_breakdown',
      showZeroAmount: true,
      subItems: [...baseSubs, newSub],
    });
    setServiceSubQuantities((prev) => ({
      ...prev,
      [tariff.id]: initialQtyPatch,
    }));
    setExpandedTariffIds((prev) => ({ ...prev, [tariff.id]: true }));
  };

  const handleRemoveSubItemFromTariff = (tariff: TariffItem, subId: string) => {
    if (!onUpdateTariffConcept || !tariff.subItems) return;
    const remaining = tariff.subItems.filter((s) => s.id !== subId);
    onUpdateTariffConcept(tariff.id, {
      subItems: remaining,
    });
    setServiceSubQuantities((prev) => {
      const current = { ...(prev[tariff.id] ?? {}) };
      delete current[subId];
      return { ...prev, [tariff.id]: current };
    });
  };

  const pdaInput = useMemo(
    () => ({
      portId: port.id,
      areaId: effectiveAreaId,
      principal,
      invoiceNumber,
      vesselName,
      vesselType,
      purpose,
      cargoDescription,
      dwt,
      gt,
      loaM,
      beamM,
      opsRateMtHr,
      portStayHours: effectiveStayHours,
      daysAlongside: derivedDaysAlongside,
      cargoTons,
      eta,
      tugsCount,
      tugHours,
      movements,
      usdToMxn,
      customFields,
      inactiveFieldKeys,
      excludedTariffIds,
      serviceSubQuantities,
      tariffSectionOverrides,
      tariffRateOverrides,
    }),
    [
      port.id,
      effectiveAreaId,
      principal,
      invoiceNumber,
      vesselName,
      vesselType,
      purpose,
      cargoDescription,
      dwt,
      gt,
      loaM,
      beamM,
      opsRateMtHr,
      effectiveStayHours,
      derivedDaysAlongside,
      cargoTons,
      eta,
      tugsCount,
      tugHours,
      movements,
      usdToMxn,
      customFields,
      inactiveFieldKeys,
      excludedTariffIds,
      serviceSubQuantities,
      tariffSectionOverrides,
      tariffRateOverrides,
    ]
  );

  const pda = useMemo(() => calculatePda(pdaInput, tariffs), [pdaInput, tariffs]);

  // All applicable tariffs for this port/area/vessel/purpose (including $0 Crew/Husbandry items so user can expand and input qty!)
  const applicableTariffs = useMemo(() => {
    return tariffs.filter((item) => {
      if (!item.active) return false;
      if (item.portId !== port.id) return false;
      if (item.areaId !== 'ALL' && item.areaId !== effectiveAreaId) return false;
      if (
        vesselType &&
        item.applicableVesselTypes &&
        item.applicableVesselTypes !== 'ALL' &&
        item.applicableVesselTypes.length > 0 &&
        !item.applicableVesselTypes.includes(vesselType)
      ) {
        return false;
      }
      if (
        purpose &&
        item.applicablePurposes &&
        item.applicablePurposes !== 'ALL' &&
        item.applicablePurposes.length > 0 &&
        !item.applicablePurposes.includes(purpose)
      ) {
        return false;
      }
      return true;
    });
  }, [tariffs, port.id, effectiveAreaId, vesselType, purpose]);

  // Pre-calculate line items for all applicable tariffs ignoring exclusions and showZeroAmount suppression so UI always displays accurate preview
  const previewLineMap = useMemo(() => {
    const forcedShowTariffs = applicableTariffs.map((t) => ({
      ...t,
      showZeroAmount: true,
    }));
    const previewResult = calculatePda(
      { ...pdaInput, excludedTariffIds: [] },
      forcedShowTariffs
    );
    return new Map<string, PdaLineItem>(
      previewResult.lineItems.map((l) => [l.tariffId, l])
    );
  }, [pdaInput, applicableTariffs]);

  const activeLineMap = useMemo(
    () => new Map<string, PdaLineItem>(pda.lineItems.map((l) => [l.tariffId, l])),
    [pda.lineItems]
  );

  const portTariffs = tariffs.filter((t) => t.portId === port.id);

  const vesselSpecificCount = useMemo(
    () =>
      portTariffs.filter(
        (t) =>
          t.active &&
          Array.isArray(t.applicableVesselTypes) &&
          t.applicableVesselTypes.includes(vesselType)
      ).length,
    [portTariffs, vesselType]
  );

  const defaultPdaFilename = useMemo(() => {
    const vesselSlug = sanitizePdfFilename(vesselName || 'Vessel', 'Vessel').replace(/\.pdf$/i, '');
    const cargoSlug = sanitizePdfFilename(cargoDescription || 'CARGO', 'CARGO').replace(/\.pdf$/i, '');
    return `PDA-${port.shortCode}-${vesselSlug}-${purpose}-${cargoSlug}-${cargoTons}_TM`.replace(
      /_+/g,
      '_'
    );
  }, [vesselName, port.shortCode, purpose, cargoDescription, cargoTons]);

  const handleSyncRemoteSheet = async () => {
    const normalized = normalizeTariffSheetUrl(sheetUrlInput);
    if (!normalized) {
      setSyncFeedback({
        type: 'error',
        message:
          lang === 'es'
            ? 'Ingresa una URL válida de Google Sheets, ID de hoja o Web App (/exec).'
            : 'Enter a valid Google Sheets URL, Spreadsheet ID, or Apps Script /exec endpoint.',
      });
      return;
    }

    setSyncLoading(true);
    setSyncFeedback(null);
    try {
      const response = await fetch(normalized.fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const rawText = await response.text();
      const { items, formats, skippedRows } = parseTariffRowsFromCsvOrJson(
        rawText,
        port.id,
        allPorts ?? [port]
      );
      if (items.length === 0 && formats.length === 0) {
        throw new Error(
          lang === 'es'
            ? 'La hoja respondió pero no se encontraron tarifas o formatos válidos (revisa columnas: concept, rate, unit, currency).'
            : 'Sheet responded but no valid tariff rows or formats were found.'
        );
      }
      const nowIso = new Date().toISOString();
      onSyncTariffsFromSheet({
        items,
        formats,
        replacePortTariffs,
        config: {
          sheetUrl: sheetUrlInput.trim(),
          lastSyncedAt: nowIso,
          lastRowCount: items.length,
          mode: normalized.mode,
        },
      });
      setSyncFeedback({
        type: 'success',
        message:
          lang === 'es'
            ? `Sincronizadas ${items.length} tarifas${
                formats.length > 0 ? ` y ${formats.length} formatos PDA` : ''
              } desde Google Sheets${
                skippedRows > 0 ? ` (${skippedRows} filas omitidas)` : ''
              }.`
            : `Synced ${items.length} tariffs${
                formats.length > 0 ? ` and ${formats.length} PDA presets` : ''
              } from Google Sheets${
                skippedRows > 0 ? ` (${skippedRows} rows skipped)` : ''
              }.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncFeedback({
        type: 'error',
        message:
          lang === 'es'
            ? `No se pudo leer automáticamente (${msg}). Verifica que el Google Sheet tenga acceso "Cualquier persona con el enlace (Lector)" o usa "Pegar CSV / TSV" abajo.`
            : `Auto-fetch failed (${msg}). Ensure the Google Sheet allows link viewers or use "Paste CSV / TSV" below.`,
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleImportPastedTable = () => {
    if (!pasteCsvText.trim()) return;
    setSyncFeedback(null);
    try {
      const { items, formats, skippedRows } = parseTariffRowsFromCsvOrJson(
        pasteCsvText,
        port.id,
        allPorts ?? [port]
      );
      if (items.length === 0 && formats.length === 0) {
        setSyncFeedback({
          type: 'error',
          message:
            lang === 'es'
              ? 'No se detectaron filas válidas. Incluye encabezados como: code, concept, provider, unit, rate, currency, formulaType, chargeSection, vatRate, vesselTypes.'
              : 'No valid tariff rows detected. Include headers like code, concept, provider, unit, rate, currency, formulaType.',
        });
        return;
      }
      const nowIso = new Date().toISOString();
      onSyncTariffsFromSheet({
        items,
        formats,
        replacePortTariffs,
        config: {
          sheetUrl: sheetUrlInput.trim() || tariffSheetSync?.sheetUrl || 'clipboard-import',
          lastSyncedAt: nowIso,
          lastRowCount: items.length,
          mode: 'manual_csv',
        },
      });
      setPasteCsvText('');
      setShowPasteFallback(false);
      setSyncFeedback({
        type: 'success',
        message:
          lang === 'es'
            ? `Importadas ${items.length} tarifas${
                formats.length > 0 ? ` y ${formats.length} formatos` : ''
              } desde portapapeles${skippedRows > 0 ? ` (${skippedRows} omitidas)` : ''}.`
            : `Imported ${items.length} tariffs${
                formats.length > 0 ? ` and ${formats.length} formats` : ''
              } from clipboard.`,
      });
    } catch (err) {
      setSyncFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const historyGroups = useMemo(
    () => groupPdaHistoryByMonth(pdaHistory),
    [pdaHistory]
  );

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return pdaHistory
      .filter((r) => historyMonthFilter === 'ALL' || r.monthKey === historyMonthFilter)
      .filter((r) => {
        if (!q) return true;
        return (
          r.filename.toLowerCase().includes(q) ||
          r.vesselName.toLowerCase().includes(q) ||
          r.cargoDescription.toLowerCase().includes(q) ||
          r.purpose.toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)
      );
  }, [pdaHistory, historyMonthFilter, historySearch]);

  const handleLoadHistoryRecord = (rec: PdaHistoryRecord) => {
    if (rec.portId !== port.id && onSelectPort) {
      onSelectPort(rec.portId);
    }
    const inp = rec.input;
    if (inp.areaId) setSelectedAreaId(inp.areaId);
    setPrincipal(inp.principal ?? 'TO BE ADVISED');
    setInvoiceNumber(inp.invoiceNumber ?? 'PDA-COA-2026-001');
    setVesselName(inp.vesselName);
    setVesselType(inp.vesselType ?? 'Tanker / Chemical');
    setPurpose(inp.purpose ?? 'DISCHARGE');
    setCargoDescription(inp.cargoDescription ?? '');
    setCargoTons(inp.cargoTons);
    setOpsRateMtHr(inp.opsRateMtHr ?? 150);
    setDwt(inp.dwt ?? 32292);
    setGt(inp.gt);
    setLoaM(inp.loaM);
    setBeamM(inp.beamM ?? 27);
    setManualPortStayHrs(inp.portStayHours ?? null);
    setEta(inp.eta ?? 'TBAD');
    setTugsCount(inp.tugsCount ?? 2);
    setTugHours(inp.tugHours);
    setMovements(inp.movements ?? 2);
    setUsdToMxn(inp.usdToMxn);
    setInactiveFieldKeys(inp.inactiveFieldKeys ? [...inp.inactiveFieldKeys] : []);
    setExcludedTariffIds(inp.excludedTariffIds ? [...inp.excludedTariffIds] : []);
    setCustomFields(inp.customFields ? inp.customFields.map((f) => ({ ...f })) : []);
    setServiceSubQuantities(
      inp.serviceSubQuantities
        ? Object.fromEntries(
            Object.entries(inp.serviceSubQuantities).map(([k, v]) => [k, { ...v }])
          )
        : {}
    );
    setTariffSectionOverrides(
      inp.tariffSectionOverrides ? { ...inp.tariffSectionOverrides } : {}
    );
    setTariffRateOverrides(
      inp.tariffRateOverrides
        ? Object.fromEntries(
            Object.entries(inp.tariffRateOverrides).map(([k, v]) => [
              k,
              { ...v, subRates: v.subRates ? { ...v.subRates } : undefined },
            ])
          )
        : {}
    );
    setEditingHistoryId(rec.id);
    setPrefilledPdfName(rec.filename.replace(/\.pdf$/i, ''));
    setLoadedHistoryBanner(
      lang === 'es'
        ? `Cargada para edición: ${rec.filename} (${rec.vesselName})`
        : `Loaded for editing: ${rec.filename} (${rec.vesselName})`
    );
  };

  const handleConfirmPdaPdf = (customFilename: string) => {
    const savedFilename = exportPdaToPdf({
      filename: customFilename,
      port,
      area: activeArea,
      input: pdaInput,
      pdaResult: pda,
      lang,
      sheetSourceUrl:
        (sheetUrlInput || tariffSheetSync?.sheetUrl || '').trim() || undefined,
      officeProfile: pdaOfficeProfile,
    });

    if (onSavePdaHistoryRecord) {
      const nowIso = new Date().toISOString();
      const existing = editingHistoryId
        ? pdaHistory.find((r) => r.id === editingHistoryId)
        : undefined;
      onSavePdaHistoryRecord({
        id: existing ? existing.id : `pda-rec-${Date.now()}`,
        monthKey: existing?.monthKey ?? nowIso.slice(0, 7),
        createdAt: existing?.createdAt ?? nowIso,
        updatedAt: nowIso,
        filename: savedFilename,
        portId: port.id,
        areaId: effectiveAreaId,
        vesselName: vesselName.trim() || 'TBN',
        vesselType,
        purpose,
        cargoDescription: cargoDescription.trim() || 'CARGO',
        cargoTons,
        totalUsd: pda.totalUsd,
        totalMxn: pda.totalMxn,
        input: {
          ...pdaInput,
          customFields: pdaInput.customFields?.map((f) => ({ ...f })),
          inactiveFieldKeys: [...(pdaInput.inactiveFieldKeys ?? [])],
          excludedTariffIds: [...(pdaInput.excludedTariffIds ?? [])],
          serviceSubQuantities: Object.fromEntries(
            Object.entries(serviceSubQuantities).map(([k, v]) => [k, { ...v }])
          ),
          tariffSectionOverrides: { ...tariffSectionOverrides },
          tariffRateOverrides: Object.fromEntries(
            Object.entries(tariffRateOverrides).map(([k, v]) => [
              k,
              { ...v, subRates: v.subRates ? { ...v.subRates } : undefined },
            ])
          ),
        },
      });
    }

    setPrefilledPdfName(null);
    setPdfPromptOpen(false);
  };

  const sectionSubtotalMap: Record<PdaChargeSection, number> = {
    port: pda.portChargesTotalUsd,
    crew: pda.crewChargesTotalUsd,
    husbandry: pda.husbandryChargesTotalUsd,
    agency: pda.agencyChargesTotalUsd,
  };

  return (
    <section id="tariffs-pda" className="bg-[#f5f5f7] py-20 lg:py-24 border-b border-[#e5e5ea]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium text-[#0066cc] mb-2">
              {lang === 'es'
                ? '09. Proforma PDA por Rubros, Tarifario & Google Sheets'
                : '09. Official 4-Section PDA Engine, Tariffs & Google Sheets'}
            </p>
            <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
              {lang === 'es'
                ? 'Proforma PDA en 4 rubros con desglose de servicios.'
                : '4-Section PDA builder with live service breakdown.'}
            </h2>
            <p className="mt-3 text-[16px] text-[#424245]">
              {lang === 'es'
                ? 'Organiza tus cargos en Port, Crew, Husbandry y Agency Charges; despliega cualquier concepto para definir cantidades y mover rubros como Lancha con cálculo automático.'
                : 'Organize charges across Port, Crew, Husbandry & Agency Charges; expand any line item to adjust sub-service quantities, tariffs, and section assignment live.'}
            </p>
          </div>

          {!disableDownloads && (
            <button
              type="button"
              onClick={onOpenContentManager}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors self-start lg:self-auto"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {lang === 'es'
                ? 'Editar tarifas y banco en Content Manager'
                : 'Edit tariffs & bank in Content Manager'}
            </button>
          )}
        </div>

        {/* Google Sheets Tariff & PDA Format Connector (Admin / Internal View Only) */}
        {!disableDownloads && (
          <div className="mt-8 bg-white rounded-2xl border border-[#e5e5ea] p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#e5e5ea]">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eef6ff] border border-[#cde3ff] flex items-center justify-center shrink-0 text-[#0066cc]">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-semibold text-[#1d1d1f]">
                    {lang === 'es'
                      ? 'Conectar Google Sheet de Tarifas y Plantillas PDA'
                      : 'Connect Google Sheet for Tariffs & PDA Presets'}
                  </h3>
                  <p className="text-[12.5px] text-[#6e6e73] mt-0.5">
                    {lang === 'es'
                      ? 'Columnas soportadas: code, concept, provider, unit, rate, currency, areaId, chargeSection (port/crew/husbandry/agency), formulaType, subItems, baseFixed, vatRate, applicableVesselTypes, o JSON formats[].'
                      : 'Supported columns: code, concept, provider, unit, rate, currency, areaId, chargeSection (port/crew/husbandry/agency), formulaType, subItems, baseFixed, vatRate, applicableVesselTypes, or JSON formats[].'}
                  </p>
                </div>
              </div>

              {tariffSheetSync?.lastSyncedAt && (
                <div className="text-[11.5px] text-[#065f46] bg-[#ecfdf5] border border-[#a7f3d0] px-3 py-1.5 rounded-lg shrink-0 font-mono">
                  {lang === 'es' ? 'Última sync:' : 'Last sync:'}{' '}
                  {tariffSheetSync.lastSyncedAt.slice(0, 16).replace('T', ' ')} (
                  {tariffSheetSync.lastRowCount ?? 0})
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
              <input
                type="text"
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                aria-label={lang === 'es' ? 'URL de Google Sheet de Tarifas' : 'Tariff Google Sheet URL'}
                placeholder="https://docs.google.com/spreadsheets/d/1ABC.../edit#gid=0  o  https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3.5 py-2.5 text-[13px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f]"
              />

              <label className="inline-flex items-center gap-2 text-[12.5px] text-[#424245] px-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={replacePortTariffs}
                  onChange={(e) => setReplacePortTariffs(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#0066cc]"
                />
                {lang === 'es' ? 'Reemplazar tarifas del puerto' : 'Replace port tariffs'}
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncRemoteSheet}
                  disabled={syncLoading || !sheetUrlInput.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] disabled:opacity-50 rounded-xl transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                  {syncLoading
                    ? lang === 'es'
                      ? 'Sincronizando...'
                      : 'Syncing...'
                    : lang === 'es'
                    ? 'Sincronizar ahora'
                    : 'Sync now'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPasteFallback((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[12.5px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-xl transition-colors"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  {lang === 'es' ? 'Pegar CSV / TSV' : 'Paste CSV / TSV'}
                </button>
              </div>
            </div>

            {syncFeedback && (
              <div
                className={`mt-3 px-4 py-2.5 rounded-xl border text-[13px] flex items-start gap-2 ${
                  syncFeedback.type === 'success'
                    ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]'
                    : 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]'
                }`}
              >
                {syncFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>{syncFeedback.message}</span>
              </div>
            )}

            {showPasteFallback && (
              <div className="mt-4 p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-2.5">
                <div className="text-[12.5px] font-medium text-[#1d1d1f]">
                  {lang === 'es'
                    ? 'Copia las celdas directo de Google Sheets (con encabezados) y pégalas aquí:'
                    : 'Copy cells directly from Google Sheets (including headers) and paste here:'}
                </div>
                <textarea
                  rows={4}
                  value={pasteCsvText}
                  onChange={(e) => setPasteCsvText(e.target.value)}
                  placeholder={
                    'code\tconcept\tprovider\tunit\trate\tcurrency\tchargeSection\tformulaType\tvatRate\tvesselTypes\nCOA-PORT\tPort Dues\tASIPONA\tper_gt\t5.40\tMXN\tport\tport_dues_hybrid\t0.16\tALL'
                  }
                  className="w-full p-3 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-xl"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasteFallback(false)}
                    className="px-3 py-1.5 text-[12px] font-medium text-[#424245] bg-white border border-[#d2d2d7] rounded-lg"
                  >
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleImportPastedTable}
                    disabled={!pasteCsvText.trim()}
                    className="px-3.5 py-1.5 text-[12px] font-medium text-white bg-[#1d1d1f] disabled:opacity-50 rounded-lg"
                  >
                    {lang === 'es' ? 'Importar a Tarifario y PDA' : 'Import to Tariffs & PDA'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Workspace: Compact Call Data (Left) + 4-Rubro Live PDA Breakdown (Right) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Compact Vessel & Call Parameters */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e5e5ea] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#e5e5ea]">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#0066cc]" />
                <h3 className="font-display text-[16px] font-semibold text-[#1d1d1f]">
                  {lang === 'es' ? 'Datos de la PDA' : 'PDA Call Data'}
                </h3>
              </div>
              {!disableDownloads && (
                <span className="text-[11px] font-mono text-[#6e6e73]">
                  {lang === 'es' ? 'Check = visible en PDF' : 'Checked = shown in PDF'}
                </span>
              )}
            </div>

            {loadedHistoryBanner && (
              <div className="p-2.5 rounded-xl bg-[#eef6ff] border border-[#cde3ff] flex items-center justify-between gap-2 text-[12px] text-[#042447]">
                <span className="font-medium truncate">{loadedHistoryBanner}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingHistoryId(null);
                    setLoadedHistoryBanner(null);
                  }}
                  className="text-[11px] font-semibold text-[#0066cc] hover:underline shrink-0"
                >
                  {lang === 'es' ? 'Crear nueva' : 'Save as new'}
                </button>
              </div>
            )}

            {/* Format Preset Selector + Inline Create Format */}
            <div className="p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="pda-format-preset"
                  className="text-[11px] font-semibold text-[#0066cc] uppercase tracking-wider"
                >
                  {lang === 'es' ? 'Plantilla / Formato PDA' : 'PDA Template'}
                </label>
                {!disableDownloads && onSavePdaFormat && (
                  <button
                    type="button"
                    onClick={() => setShowNewFormatForm((v) => !v)}
                    className="text-[11px] font-medium text-[#0066cc] hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {lang === 'es' ? 'Crear plantilla' : 'Save template'}
                  </button>
                )}
              </div>
              <select
                id="pda-format-preset"
                value={effectiveFormatId}
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[12.5px] font-medium bg-white border border-[#d2d2d7] rounded-lg"
              >
                <option value="">
                  {lang === 'es' ? '-- Configuración manual --' : '-- Custom setup --'}
                </option>
                {availableFormats.map((fmt) => (
                  <option key={fmt.id} value={fmt.id}>
                    {lang === 'es' ? fmt.name : fmt.nameEn}
                  </option>
                ))}
              </select>

              {showNewFormatForm && onSavePdaFormat && !disableDownloads && (
                <form onSubmit={handleCreateNewFormat} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    required
                    value={newFmtName}
                    onChange={(e) => setNewFmtName(e.target.value)}
                    placeholder={lang === 'es' ? 'Ej. Tanker Químico Load 10K' : 'Template name'}
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-[11.5px] font-medium text-white bg-[#1d1d1f] rounded-lg shrink-0"
                  >
                    {lang === 'es' ? 'Guardar' : 'Save'}
                  </button>
                </form>
              )}
            </div>

            {/* Row 1: TIPO EMBARCACION | PROPOSITO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-vessel-type" className="text-[10.5px] font-semibold uppercase tracking-wide text-[#424245]">
                    {lang === 'es' ? 'Tipo Embarcación' : 'Vessel Type'}
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('vesselType')}
                    onChange={() => toggleFieldActive('vesselType')}
                    className="w-3.5 h-3.5 accent-[#0066cc]"
                  />
                </div>
                <select
                  id="pda-vessel-type"
                  value={vesselType}
                  onChange={(e) => setVesselType(e.target.value as PdaVesselType)}
                  className="w-full px-2.5 py-1.5 text-[12.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                >
                  {VESSEL_TYPES.map((vt) => (
                    <option key={vt} value={vt}>
                      {vt}
                    </option>
                  ))}
                </select>
                {vesselSpecificCount > 0 && (
                  <p className="mt-1 text-[10.5px] font-medium text-[#0066cc]">
                    +{vesselSpecificCount}{' '}
                    {lang === 'es' ? 'tarifa(s) por tipo de buque' : 'vessel-specific tariff(s)'}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-purpose" className="text-[10.5px] font-semibold uppercase tracking-wide text-[#424245]">
                    {lang === 'es' ? 'Propósito' : 'Purpose'}
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('purpose')}
                    onChange={() => toggleFieldActive('purpose')}
                    className="w-3.5 h-3.5 accent-[#0066cc]"
                  />
                </div>
                <select
                  id="pda-purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as PdaPurpose)}
                  className="w-full px-2.5 py-1.5 text-[12.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                >
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: RECINTO */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="pda-area" className="text-[10.5px] font-semibold uppercase tracking-wide text-[#424245]">
                  {lang === 'es' ? 'Recinto' : 'Enclosure'}
                </label>
                <input
                  type="checkbox"
                  checked={isFieldActive('port')}
                  onChange={() => toggleFieldActive('port')}
                  className="w-3.5 h-3.5 accent-[#0066cc]"
                />
              </div>
              <select
                id="pda-area"
                value={effectiveAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[12.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
              >
                {portAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {lang === 'es' ? a.name : a.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: PRINCIPAL | INVOICE */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-principal" className="text-[10.5px] font-semibold uppercase tracking-wide text-[#424245]">
                    Principal
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('principal')}
                    onChange={() => toggleFieldActive('principal')}
                    className="w-3.5 h-3.5 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-principal"
                  type="text"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-invoice" className="text-[10.5px] font-semibold uppercase tracking-wide text-[#424245]">
                    Invoice
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('invoiceNumber')}
                    onChange={() => toggleFieldActive('invoiceNumber')}
                    className="w-3.5 h-3.5 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-invoice"
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12.5px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>
            </div>

            {/* Row 4: BUQUE | PRODUCTO (CARGO) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-vessel" className="text-[10.5px] font-semibold uppercase tracking-wide text-[#424245]">
                    {lang === 'es' ? 'Buque' : 'Vessel'}
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('vesselName')}
                    onChange={() => toggleFieldActive('vesselName')}
                    className="w-3.5 h-3.5 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-vessel"
                  type="text"
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-cargo-desc" className="text-[10.5px] font-semibold uppercase tracking-wide text-[#424245]">
                    Producto (Cargo)
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('cargo')}
                    onChange={() => toggleFieldActive('cargo')}
                    className="w-3.5 h-3.5 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-cargo-desc"
                  type="text"
                  value={cargoDescription}
                  onChange={(e) => setCargoDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>
            </div>

            {/* Row 5: DWT | GRT/UAB | LOA | BEAM */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-dwt" className="text-[10.5px] font-semibold uppercase text-[#424245]">
                    DWT
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('dwt')}
                    onChange={() => toggleFieldActive('dwt')}
                    className="w-3 h-3 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-dwt"
                  type="number"
                  value={dwt}
                  onChange={(e) => setDwt(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-[12.5px] font-mono tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-gt" className="text-[10.5px] font-semibold uppercase text-[#424245]">
                    GRT/UAB
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('grt')}
                    onChange={() => toggleFieldActive('grt')}
                    className="w-3 h-3 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-gt"
                  type="number"
                  min={100}
                  step={100}
                  value={gt}
                  onChange={(e) => setGt(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-[12.5px] font-mono tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-loa" className="text-[10.5px] font-semibold uppercase text-[#424245]">
                    LOA (m)
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('loa')}
                    onChange={() => toggleFieldActive('loa')}
                    className="w-3 h-3 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-loa"
                  type="number"
                  min={20}
                  step={1}
                  value={loaM}
                  onChange={(e) => setLoaM(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-[12.5px] font-mono tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-beam" className="text-[10.5px] font-semibold uppercase text-[#424245]">
                    BEAM (m)
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('beam')}
                    onChange={() => toggleFieldActive('beam')}
                    className="w-3 h-3 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-beam"
                  type="number"
                  min={5}
                  step={0.5}
                  value={beamM}
                  onChange={(e) => setBeamM(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-[12.5px] font-mono tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>
            </div>

            {/* Row 6: QUANTITY | OPS RATE / HR | PORT STAY */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-cargo" className="text-[10.5px] font-semibold uppercase text-[#424245]">
                    QUANTITY
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('quantity')}
                    onChange={() => toggleFieldActive('quantity')}
                    className="w-3 h-3 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-cargo"
                  type="number"
                  min={0}
                  step={250}
                  value={cargoTons}
                  onChange={(e) => setCargoTons(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-[12.5px] font-mono tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-opsrate" className="text-[10.5px] font-semibold uppercase text-[#424245]">
                    OPS RATE / HR
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('opsRate')}
                    onChange={() => toggleFieldActive('opsRate')}
                    className="w-3 h-3 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-opsrate"
                  type="number"
                  min={1}
                  step={10}
                  value={opsRateMtHr}
                  onChange={(e) => setOpsRateMtHr(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-[12.5px] font-mono tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-stay" className="text-[10.5px] font-semibold uppercase text-[#424245]">
                    PORT STAY
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('portStay')}
                    onChange={() => toggleFieldActive('portStay')}
                    className="w-3 h-3 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-stay"
                  type="number"
                  min={1}
                  step={1}
                  value={effectiveStayHours}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setManualPortStayHrs(v > 0 ? v : null);
                  }}
                  className="w-full px-2 py-1.5 text-[12.5px] font-mono tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>
            </div>

            {/* Row 7: Compact Operational Parameters (ROE, ETA, Tugs, Tug Hrs, Movs) */}
            <div className="pt-2.5 border-t border-[#e5e5ea] grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-fx" className="text-[10px] font-semibold uppercase text-[#6e6e73]">
                    ROE
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('fxRate')}
                    onChange={() => toggleFieldActive('fxRate')}
                    className="w-3 h-3 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-fx"
                  type="number"
                  min={1}
                  step={0.1}
                  value={usdToMxn}
                  onChange={(e) => setUsdToMxn(Number(e.target.value) || 17)}
                  className="w-full px-2 py-1 text-[12px] font-mono tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pda-eta" className="text-[10px] font-semibold uppercase text-[#6e6e73]">
                    ETA
                  </label>
                  <input
                    type="checkbox"
                    checked={isFieldActive('eta')}
                    onChange={() => toggleFieldActive('eta')}
                    className="w-3 h-3 accent-[#0066cc]"
                  />
                </div>
                <input
                  id="pda-eta"
                  type="text"
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  className="w-full px-2 py-1 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="pda-tug-count" className="block text-[10px] font-semibold uppercase text-[#6e6e73] mb-1">
                  {lang === 'es' ? 'Remolc.' : 'Tugs'}
                </label>
                <input
                  id="pda-tug-count"
                  type="number"
                  min={1}
                  max={6}
                  value={tugsCount}
                  onChange={(e) => setTugsCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-2 py-1 text-[12px] font-mono tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="pda-tug-hrs" className="block text-[10px] font-semibold uppercase text-[#6e6e73] mb-1">
                  {lang === 'es' ? 'Hrs Rem.' : 'Tug Hrs'}
                </label>
                <input
                  id="pda-tug-hrs"
                  type="number"
                  min={0}
                  step={0.25}
                  value={tugHours}
                  onChange={(e) => setTugHours(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2 py-1 text-[12px] font-mono tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="pda-movements" className="block text-[10px] font-semibold uppercase text-[#6e6e73] mb-1">
                  Movs
                </label>
                <input
                  id="pda-movements"
                  type="number"
                  min={1}
                  max={6}
                  value={movements}
                  onChange={(e) => setMovements(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-2 py-1 text-[12px] font-mono tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>
            </div>

            {/* Collapsible Dynamic Custom Fields */}
            <div className="pt-2 border-t border-[#e5e5ea]">
              <button
                type="button"
                onClick={() => setShowCustomFields((v) => !v)}
                className="w-full flex items-center justify-between text-[12px] font-semibold text-[#1d1d1f] py-1 hover:text-[#0066cc] transition-colors"
              >
                <span>
                  {lang === 'es'
                    ? `Campos dinámicos en encabezado (${customFields.length})`
                    : `Dynamic Header Fields (${customFields.length})`}
                </span>
                {showCustomFields ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {showCustomFields && (
                <div className="mt-2.5 space-y-2">
                  {customFields.map((cf) => (
                    <div
                      key={cf.id}
                      className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea]"
                    >
                      <input
                        type="checkbox"
                        checked={cf.active}
                        onChange={() =>
                          setCustomFields((prev) =>
                            prev.map((item) =>
                              item.id === cf.id ? { ...item, active: !item.active } : item
                            )
                          )
                        }
                        className="w-3.5 h-3.5 accent-[#0066cc] shrink-0"
                      />
                      <input
                        type="text"
                        value={cf.label}
                        onChange={(e) =>
                          setCustomFields((prev) =>
                            prev.map((item) =>
                              item.id === cf.id ? { ...item, label: e.target.value } : item
                            )
                          )
                        }
                        className="w-24 px-2 py-1 text-[11px] font-semibold bg-white border border-[#d2d2d7] rounded"
                      />
                      <input
                        type="text"
                        value={cf.value}
                        onChange={(e) =>
                          setCustomFields((prev) =>
                            prev.map((item) =>
                              item.id === cf.id ? { ...item, value: e.target.value } : item
                            )
                          )
                        }
                        className="flex-1 min-w-0 px-2 py-1 text-[11px] bg-white border border-[#d2d2d7] rounded"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCustomFields((prev) => prev.filter((item) => item.id !== cf.id))
                        }
                        aria-label="Remove custom field"
                        className="p-1 text-[#6e6e73] hover:text-[#dc2626]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-1.5">
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder={lang === 'es' ? 'Campo (ej. BERTH)' : 'Label'}
                      className="w-24 px-2 py-1 text-[11.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                    />
                    <input
                      type="text"
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                      placeholder={lang === 'es' ? 'Valor' : 'Value'}
                      className="flex-1 min-w-[90px] px-2 py-1 text-[11.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                    />
                    <select
                      value={newFieldColumn}
                      onChange={(e) => setNewFieldColumn(e.target.value as 'left' | 'right')}
                      className="px-2 py-1 text-[11.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                    >
                      <option value="left">{lang === 'es' ? 'Izq' : 'Left'}</option>
                      <option value="right">{lang === 'es' ? 'Der' : 'Right'}</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      disabled={!newFieldLabel.trim()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium text-white bg-[#1d1d1f] disabled:opacity-40 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {lang === 'es' ? 'Agregar' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Live 4-Rubro PDA Tables with Expandable Sub-Services */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
            {/* Dark Header Banner */}
            <div className="p-5 sm:p-6 bg-[#042447] text-white flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#f5b400]">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#93c5fd]">
                  PROFORMA DISBURSEMENT ACCOUNT · {vesselType} · {purpose}
                </div>
                <div
                  data-testid="pda-total-usd"
                  className="mt-1 font-mono text-[28px] font-semibold tabular-nums"
                >
                  ${pda.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-right">
                  <div className="text-[11px] text-[#93c5fd]">
                    ROE 1 USD = {usdToMxn.toFixed(2)} MXN
                  </div>
                  <div className="font-mono text-[16px] font-medium text-white tabular-nums">
                    ${pda.totalMxn.toLocaleString('en-US', { minimumFractionDigits: 2 })} MXN
                  </div>
                </div>

                {!disableDownloads && (
                  <button
                    type="button"
                    onClick={() => setPdfPromptOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[#0066cc] hover:bg-[#0077ed] rounded-xl transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    {lang === 'es' ? 'Descargar PDA PDF Oficial' : 'Download Official PDA PDF'}
                  </button>
                )}
              </div>
            </div>

            {/* 4-Rubro KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#e5e5ea] bg-[#fafafa] border-b border-[#e5e5ea] text-[12px]">
              {RUBRO_META.map((rubro) => (
                <div key={rubro.key} className="px-4 py-2.5">
                  <div className="text-[11px] font-medium text-[#6e6e73]">{rubro.title}</div>
                  <div className="font-mono font-semibold text-[#1d1d1f] tabular-nums mt-0.5">
                    ${sectionSubtotalMap[rubro.key].toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Active Fields Preview Strip */}
            <div className="px-5 py-2.5 bg-[#f5f5f7] border-b border-[#e5e5ea] grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11.5px]">
              {isFieldActive('principal') && principal.trim() && (
                <div>
                  <span className="font-semibold text-[#6e6e73]">PRINCIPAL:</span>{' '}
                  <span className="font-medium text-[#1d1d1f]">{principal}</span>
                </div>
              )}
              {isFieldActive('invoiceNumber') && invoiceNumber.trim() && (
                <div className="font-mono">
                  <span className="font-semibold text-[#6e6e73]">INVOICE:</span>{' '}
                  <span className="font-medium text-[#1d1d1f]">{invoiceNumber}</span>
                </div>
              )}
              {isFieldActive('port') && activeArea && (
                <div className="truncate">
                  <span className="font-semibold text-[#6e6e73]">RECINTO:</span>{' '}
                  <span className="font-medium text-[#1d1d1f]">
                    {lang === 'es' ? activeArea.name : activeArea.nameEn}
                  </span>
                </div>
              )}
              {isFieldActive('vesselName') && (
                <div>
                  <span className="font-semibold text-[#6e6e73]">VESSEL:</span>{' '}
                  <span className="font-medium text-[#1d1d1f]">{vesselName}</span>
                </div>
              )}
              {isFieldActive('cargo') && cargoDescription.trim() && (
                <div>
                  <span className="font-semibold text-[#6e6e73]">CARGO:</span>{' '}
                  <span className="font-medium text-[#1d1d1f]">
                    {cargoDescription}
                    {isFieldActive('quantity')
                      ? ` (${cargoTons.toLocaleString('en-US')} MT)`
                      : ''}
                  </span>
                </div>
              )}
              {(isFieldActive('grt') || isFieldActive('loa')) && (
                <div className="font-mono">
                  <span className="font-semibold text-[#6e6e73]">GRT/LOA:</span>{' '}
                  {isFieldActive('grt') ? gt.toLocaleString('en-US') : '-'} /{' '}
                  {isFieldActive('loa') ? `${loaM}m` : '-'}
                </div>
              )}
              {(isFieldActive('dwt') || isFieldActive('beam')) && (
                <div className="font-mono">
                  <span className="font-semibold text-[#6e6e73]">DWT/BEAM:</span>{' '}
                  {isFieldActive('dwt') ? dwt.toLocaleString('en-US') : '-'} /{' '}
                  {isFieldActive('beam') ? `${beamM}m` : '-'}
                </div>
              )}
              {isFieldActive('opsRate') && (
                <div className="font-mono">
                  <span className="font-semibold text-[#6e6e73]">OPS RATE:</span>{' '}
                  {opsRateMtHr.toLocaleString('en-US')} MT/HR
                </div>
              )}
              {isFieldActive('portStay') && (
                <div className="font-mono">
                  <span className="font-semibold text-[#6e6e73]">STAY:</span>{' '}
                  {Math.round(pda.effectivePortStayHours)} Hrs ({Math.max(1, Math.round(pda.effectivePortStayHours / 24))} Days)
                </div>
              )}
              {isFieldActive('eta') && eta.trim() && (
                <div className="font-mono">
                  <span className="font-semibold text-[#6e6e73]">ETA:</span> {eta}
                </div>
              )}
              {customFields
                .filter((cf) => cf.active)
                .map((cf) => (
                  <div key={cf.id}>
                    <span className="font-semibold text-[#6e6e73]">{cf.label}:</span>{' '}
                    <span className="font-medium text-[#1d1d1f]">{cf.value}</span>
                  </div>
                ))}
            </div>

            {/* 4 Separate Charge Rubro Tables */}
            <div className="divide-y divide-[#e5e5ea]">
              {RUBRO_META.map((rubro) => {
                const rubroTariffs = applicableTariffs.filter((t) => {
                  const effSec = normalizeChargeSection(
                    tariffSectionOverrides[t.id] ?? inferChargeSection(t)
                  );
                  return effSec === rubro.key;
                });

                const otherRubroTariffs = applicableTariffs.filter((t) => {
                  const effSec = normalizeChargeSection(
                    tariffSectionOverrides[t.id] ?? inferChargeSection(t)
                  );
                  return effSec !== rubro.key;
                });

                return (
                  <div key={rubro.key} className="bg-white">
                    {/* Rubro Navy Header */}
                    <div className="px-4 py-2.5 bg-[#0b1f33] text-white flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[12.5px] font-semibold tracking-wide">
                          {rubro.title}
                        </span>
                        <span className="ml-2 text-[11px] text-[#93c5fd] hidden sm:inline">
                          {lang === 'es' ? rubro.subtitleEs : rubro.subtitleEn}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[12.5px] font-semibold tabular-nums">
                          ${sectionSubtotalMap[rubro.key].toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                        </span>
                        {!disableDownloads && (
                          <button
                            type="button"
                            onClick={() => openSectionAdder(rubro.key)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            {lang === 'es' ? 'Agregar / mover' : 'Add / move'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Per-Rubro Inline Adder / Move Drawer */}
                    {activeAdderSection === rubro.key && !disableDownloads && (
                      <div className="p-4 bg-[#f5f5f7] border-b border-[#e5e5ea] space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="inline-flex p-0.5 bg-white border border-[#d2d2d7] rounded-lg text-[11.5px]">
                            <button
                              type="button"
                              onClick={() => setAdderMode('create')}
                              className={`px-3 py-1 rounded-md font-medium ${
                                adderMode === 'create'
                                  ? 'bg-[#042447] text-white'
                                  : 'text-[#424245]'
                              }`}
                            >
                              {lang === 'es'
                                ? `Crear nuevo en ${rubro.title}`
                                : `Create new in ${rubro.title}`}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdderMode('move')}
                              className={`px-3 py-1 rounded-md font-medium ${
                                adderMode === 'move'
                                  ? 'bg-[#042447] text-white'
                                  : 'text-[#424245]'
                              }`}
                            >
                              {lang === 'es'
                                ? `Mover concepto existente (${otherRubroTariffs.length})`
                                : `Move existing concept (${otherRubroTariffs.length})`}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveAdderSection(null)}
                            className="text-[11.5px] font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
                          >
                            {lang === 'es' ? 'Cerrar' : 'Close'}
                          </button>
                        </div>

                        {adderMode === 'move' ? (
                          <div className="space-y-2">
                            <p className="text-[11.5px] text-[#424245]">
                              {lang === 'es'
                                ? `Selecciona cualquier servicio del puerto (ej. Lancha) para reasignarlo a ${rubro.title}:`
                                : `Select any port tariff (e.g. Launch Service) to reassign it to ${rubro.title}:`}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                              {otherRubroTariffs.map((t) => {
                                const currentSec = normalizeChargeSection(
                                  tariffSectionOverrides[t.id] ?? inferChargeSection(t)
                                );
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                      handleAssignTariffSection(t.id, rubro.key);
                                      setActiveAdderSection(null);
                                    }}
                                    className="flex items-center justify-between gap-2 px-3 py-2 text-left bg-white hover:bg-[#eef6ff] border border-[#d2d2d7] rounded-lg text-[12px] transition-colors"
                                  >
                                    <span className="font-medium text-[#1d1d1f] truncate">
                                      {lang === 'es' ? t.concept : t.conceptEn}
                                    </span>
                                    <span className="text-[10.5px] font-mono text-[#6e6e73] shrink-0">
                                      {currentSec} → {rubro.key}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          onAddTariffConcept && (
                            <form onSubmit={handleAddQuickConcept} className="space-y-2.5">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  required
                                  value={qcConcept}
                                  onChange={(e) => setQcConcept(e.target.value)}
                                  placeholder={lang === 'es' ? 'Nombre del concepto' : 'Concept name'}
                                  className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                                />
                                <input
                                  type="text"
                                  value={qcProvider}
                                  onChange={(e) => setQcProvider(e.target.value)}
                                  placeholder={lang === 'es' ? 'Proveedor' : 'Provider'}
                                  className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                                />
                                <select
                                  value={qcSection}
                                  onChange={(e) => setQcSection(e.target.value as PdaChargeSection)}
                                  className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                                >
                                  <option value="port">Port Charges</option>
                                  <option value="crew">Crew Charges</option>
                                  <option value="husbandry">Husbandry Charges</option>
                                  <option value="agency">Agency Charges</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                <select
                                  value={qcFormulaType}
                                  onChange={(e) => setQcFormulaType(e.target.value as PdaFormulaType)}
                                  className="col-span-2 px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                                >
                                  {(Object.keys(FORMULA_LABELS) as PdaFormulaType[]).map((ft) => (
                                    <option key={ft} value={ft}>
                                      {FORMULA_LABELS[ft]}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={qcRate}
                                  onChange={(e) => setQcRate(Number(e.target.value) || 0)}
                                  placeholder="Rate"
                                  className="px-2.5 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                                />
                                <select
                                  value={qcCurrency}
                                  onChange={(e) => setQcCurrency(e.target.value as 'USD' | 'MXN')}
                                  className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                                >
                                  <option value="USD">USD</option>
                                  <option value="MXN">MXN</option>
                                </select>
                                <input
                                  type="number"
                                  min={0}
                                  max={30}
                                  value={qcVatPct}
                                  onChange={(e) => setQcVatPct(Number(e.target.value) || 0)}
                                  placeholder="IVA %"
                                  title="IVA %"
                                  className="px-2.5 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                                />
                              </div>

                              {qcFormulaType === 'custom_expression' && (
                                <input
                                  type="text"
                                  value={qcCustomExpr}
                                  onChange={(e) => setQcCustomExpr(e.target.value)}
                                  placeholder="Ej: (grt * 0.52 + 1200) * 1.16"
                                  className="w-full px-2.5 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                                />
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <select
                                  value={qcVesselScope}
                                  onChange={(e) =>
                                    setQcVesselScope(e.target.value as PdaVesselType | 'ALL')
                                  }
                                  className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                                >
                                  <option value="ALL">
                                    {lang === 'es' ? 'Aplica a todos los buques' : 'Applies to ALL vessels'}
                                  </option>
                                  {VESSEL_TYPES.map((vt) => (
                                    <option key={vt} value={vt}>
                                      {lang === 'es' ? `Solo: ${vt}` : `Only: ${vt}`}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="submit"
                                  className="px-3.5 py-1.5 text-[12px] font-medium text-white bg-[#0066cc] rounded-lg"
                                >
                                  {lang === 'es' ? 'Guardar en este rubro' : 'Save to section'}
                                </button>
                              </div>
                            </form>
                          )
                        )}
                      </div>
                    )}

                    {/* Englobed Table Rows + Inline Expandable Sub-Services */}
                    {rubroTariffs.length === 0 ? (
                      <div className="px-4 py-4 text-[12px] text-[#6e6e73]">
                        {lang === 'es'
                          ? 'Sin conceptos asignados actualmente en este rubro. Usa "+ Agregar / mover" arriba para agregar o trasladar servicios.'
                          : 'No active concepts assigned to this section yet. Use "+ Add / move" above to add or assign services.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[12.5px]">
                          <thead>
                            <tr className="bg-[#f5f5f7] border-b border-[#e5e5ea] text-[11px] text-[#6e6e73]">
                              <th className="py-2 pl-4 pr-2 font-semibold w-8">Act</th>
                              <th className="py-2 px-2 font-semibold">
                                {lang === 'es' ? 'Concepto (pulsa para desglose)' : 'Service (click to expand)'}
                              </th>
                              <th className="py-2 px-3 font-semibold text-right w-32">Amount USD</th>
                              <th className="py-2 px-4 font-semibold">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e5e5ea]">
                            {rubroTariffs.map((t) => {
                              const included = !excludedTariffIds.includes(t.id);
                              const activeLine = activeLineMap.get(t.id);
                              const previewLine = previewLineMap.get(t.id);
                              const displayLine = activeLine ?? previewLine;
                              const amt = activeLine ? activeLine.amountUsd : previewLine?.amountUsd ?? 0;
                              const isExpanded = Boolean(expandedTariffIds[t.id]);
                              const subBreakdown = displayLine?.subBreakdown;
                              const hasSubItems = Boolean(subBreakdown && subBreakdown.length > 0);
                              const currentOverrideRate = tariffRateOverrides[t.id]?.rate;
                              const currentVat =
                                tariffRateOverrides[t.id]?.vatRate ?? t.vatRate ?? 0;

                              return (
                                <FragmentRows
                                  key={t.id}
                                  tariff={t}
                                  included={included}
                                  isExpanded={isExpanded}
                                  amt={amt}
                                  remarks={displayLine?.remarks ?? (lang === 'es' ? t.notes : t.notesEn ?? t.notes)}
                                  rubroKey={rubro.key}
                                  hasSubItems={hasSubItems}
                                  subBreakdown={subBreakdown}
                                  currentOverrideRate={currentOverrideRate}
                                  currentVat={currentVat}
                                  lang={lang}
                                  disableDownloads={disableDownloads}
                                  canEditStructure={Boolean(!disableDownloads && onUpdateTariffConcept)}
                                  onToggleInclude={() =>
                                    setExcludedTariffIds((prev) =>
                                      prev.includes(t.id)
                                        ? prev.filter((id) => id !== t.id)
                                        : [...prev, t.id]
                                    )
                                  }
                                  onToggleExpand={() => toggleExpandTariff(t.id)}
                                  onChangeSubQty={(subId, qty) => setSubQty(t.id, subId, qty)}
                                  onChangeSubRate={(subId, rate) => setSubRateOverride(t.id, subId, rate)}
                                  onAddSubItem={(payload) => handleAddSubItemToTariff(t, payload)}
                                  onRemoveSubItem={(subId) => handleRemoveSubItemFromTariff(t, subId)}
                                  onChangeBaseRate={(rate) => setTariffBaseRateOverride(t.id, rate)}
                                  onChangeSection={(sec) => handleAssignTariffSection(t.id, sec)}
                                />
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grand Total Estimate Bar aligned with ISS Navy & Gold Page Palette */}
            <div className="px-5 py-3.5 bg-[#042447] border-t-2 border-[#f5b400] flex flex-wrap items-center justify-between gap-2 text-white">
              <div>
                <span className="font-display font-bold text-[14px] tracking-wide">
                  Grand Total Estimate:
                </span>
                {isFieldActive('fxRate') && (
                  <span className="ml-2 text-[11px] font-mono text-[#93c5fd] tabular-nums">
                    (ROE {usdToMxn.toFixed(2)} · $
                    {pda.totalMxn.toLocaleString('en-US', { minimumFractionDigits: 2 })} MXN)
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-[16px] text-white tabular-nums">
                USD ${pda.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="px-5 py-3 bg-[#f5f5f7] border-t border-[#e5e5ea] text-[12px] text-[#6e6e73]">
              {lang === 'es'
                ? 'Haz clic en cualquier servicio para desplegar sus sub-servicios, agregar más valores al desplegable, ajustar cantidades o reasignarlo a otro rubro.'
                : 'Click any line item to expand its sub-services, add more breakdown values, adjust quantities, or move it between Port, Crew, Husbandry & Agency Charges.'}
            </div>
          </div>
        </div>

        {/* Monthly PDA Registry & Re-Edit */}
        <div className="mt-10 bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#e5e5ea] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#eef6ff] border border-[#cde3ff] flex items-center justify-center shrink-0 text-[#0066cc]">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-[16px] font-semibold text-[#1d1d1f]">
                  {lang === 'es'
                    ? 'Registro Mensual de PDAs Generadas y Re-Edición'
                    : 'Monthly PDA Registry & Rapid Re-Edit'}
                </h3>
                <p className="text-[12.5px] text-[#6e6e73] mt-0.5">
                  {lang === 'es'
                    ? 'Cada PDA archivada conserva parámetros, cantidades por sub-servicio y rubros asignados para editar sin recapturar.'
                    : 'Each archived PDA keeps all call inputs, sub-service quantities & section assignments for 1-click editing.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {!disableDownloads && pdaDriveFolderUrl && (
                <a
                  href={pdaDriveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-medium text-[#0066cc] bg-[#eef6ff] hover:bg-[#dcebff] border border-[#cde3ff] rounded-xl transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  {lang === 'es' ? 'Carpeta Drive PDAs' : 'PDA Drive Folder'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <div className="flex items-center gap-1.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6e6e73]" />
                <select
                  value={historyMonthFilter}
                  onChange={(e) => setHistoryMonthFilter(e.target.value)}
                  aria-label={lang === 'es' ? 'Filtrar PDAs por mes' : 'Filter PDAs by month'}
                  className="text-[12.5px] font-mono bg-transparent text-[#1d1d1f] focus:outline-none"
                >
                  <option value="ALL">
                    {lang === 'es' ? `Todos (${pdaHistory.length})` : `All (${pdaHistory.length})`}
                  </option>
                  {historyGroups.map((g) => (
                    <option key={g.monthKey} value={g.monthKey}>
                      {g.monthKey} ({g.records.length} · ${g.totalUsd.toLocaleString('en-US')})
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={lang === 'es' ? 'Buscar buque o archivo...' : 'Search vessel or file...'}
                className="px-3 py-1.5 text-[12.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl"
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="px-6 py-8 text-center text-[13px] text-[#6e6e73]">
              {lang === 'es'
                ? 'Aún no hay PDAs guardadas en este mes.'
                : 'No PDAs saved for this month yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#f5f5f7] border-b border-[#e5e5ea] text-[12px] text-[#6e6e73]">
                    <th className="py-2.5 px-5 font-medium">{lang === 'es' ? 'Mes / Fecha' : 'Month / Date'}</th>
                    <th className="py-2.5 px-4 font-medium">{lang === 'es' ? 'Archivo' : 'Reference'}</th>
                    <th className="py-2.5 px-4 font-medium">{lang === 'es' ? 'Buque / Tipo' : 'Vessel / Type'}</th>
                    <th className="py-2.5 px-4 font-medium">{lang === 'es' ? 'Carga / Propósito' : 'Cargo / Purpose'}</th>
                    <th className="py-2.5 px-4 font-medium text-right">Total USD</th>
                    <th className="py-2.5 px-5 font-medium text-right">{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5ea]">
                  {filteredHistory.map((rec) => {
                    const isLoaded = editingHistoryId === rec.id;
                    return (
                      <tr key={rec.id} className={isLoaded ? 'bg-[#eef6ff]/50' : ''}>
                        <td className="py-3 px-5 font-mono text-[12px] text-[#424245]">
                          <div className="font-semibold text-[#1d1d1f]">{rec.monthKey}</div>
                          <div className="text-[11px] text-[#6e6e73]">
                            {rec.updatedAt.slice(0, 16).replace('T', ' ')}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[12px] font-medium text-[#0066cc]">
                          {rec.filename}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#1d1d1f]">{rec.vesselName}</div>
                          <div className="text-[11px] text-[#6e6e73]">{rec.vesselType}</div>
                        </td>
                        <td className="py-3 px-4 text-[12.5px] text-[#424245]">
                          {rec.cargoDescription} · {rec.cargoTons.toLocaleString('en-US')} MT
                          <div className="text-[11px] font-mono text-[#6e6e73]">{rec.purpose}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#1d1d1f]">
                          ${rec.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleLoadHistoryRecord(rec)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-[#0066cc] bg-[#eef6ff] hover:bg-[#dcebff] border border-[#cde3ff] rounded-lg transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              {lang === 'es' ? 'Cargar y Editar' : 'Load & Edit'}
                            </button>
                            {!disableDownloads && onDeletePdaHistoryRecord && (
                              <button
                                type="button"
                                onClick={() => {
                                  onDeletePdaHistoryRecord(rec.id);
                                  if (editingHistoryId === rec.id) {
                                    setEditingHistoryId(null);
                                    setLoadedHistoryBanner(null);
                                  }
                                }}
                                title={lang === 'es' ? 'Eliminar registro' : 'Delete record'}
                                className="p-1.5 text-[#6e6e73] hover:text-[#dc2626] rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Shared Master Tariff Table */}
        <div className="mt-10 bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
            <h3 className="font-display text-[16px] font-semibold text-[#1d1d1f]">
              {lang === 'es'
                ? 'Catálogo maestro de tarifas, fórmulas y alcance por embarcación'
                : 'Master Tariff Catalog, Formulas & Vessel Scope'}
            </h3>
            <span className="text-[12px] text-[#6e6e73]">
              {portTariffs.length} {lang === 'es' ? 'conceptos registrados' : 'registered items'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f5f5f7] border-b border-[#e5e5ea] text-[12px] text-[#6e6e73]">
                  <th className="py-3 px-5 font-medium">
                    {lang === 'es' ? 'Código' : 'Code'}
                  </th>
                  <th className="py-3 px-4 font-medium">
                    {lang === 'es' ? 'Concepto' : 'Concept'}
                  </th>
                  <th className="py-3 px-4 font-medium">
                    {lang === 'es' ? 'Fórmula / Rubro' : 'Formula / Section'}
                  </th>
                  <th className="py-3 px-4 font-medium">
                    {lang === 'es' ? 'Buques aplicables' : 'Vessel Scope'}
                  </th>
                  <th className="py-3 px-4 font-medium text-right">
                    {lang === 'es' ? 'Tarifa base' : 'Base Rate'}
                  </th>
                  <th className="py-3 px-5 font-medium">
                    {lang === 'es' ? 'Vigencia / IVA' : 'Effective / VAT'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5ea]">
                {portTariffs.map((t) => {
                  const effSec = normalizeChargeSection(
                    tariffSectionOverrides[t.id] ?? inferChargeSection(t)
                  );
                  const secLabel =
                    RUBRO_META.find((r) => r.key === effSec)?.title ?? 'Port Charges';
                  return (
                    <tr key={t.id} className={!t.active ? 'opacity-50' : ''}>
                      <td className="py-3 px-5 font-mono text-[12px] text-[#424245]">{t.code}</td>
                      <td className="py-3 px-4 font-medium text-[#1d1d1f]">
                        {lang === 'es' ? t.concept : t.conceptEn}
                        <div className="text-[11px] font-normal text-[#6e6e73]">
                          {t.provider}
                          {t.subItems && t.subItems.length > 0
                            ? ` · ${t.subItems.length} ${
                                lang === 'es' ? 'sub-servicios' : 'sub-services'
                              }`
                            : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[12px] text-[#424245]">
                        <div>
                          {t.formulaType
                            ? FORMULA_LABELS[t.formulaType]
                            : lang === 'es'
                            ? UNIT_LABELS[t.unit].es
                            : UNIT_LABELS[t.unit].en}
                        </div>
                        <div className="text-[11px] font-mono text-[#0066cc]">{secLabel}</div>
                      </td>
                      <td className="py-3 px-4 text-[12px] text-[#424245]">
                        {!t.applicableVesselTypes || t.applicableVesselTypes === 'ALL'
                          ? lang === 'es'
                            ? 'Todos los buques'
                            : 'All vessels'
                          : t.applicableVesselTypes.join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                        {t.rate.toFixed(2)} {t.currency}
                      </td>
                      <td className="py-3 px-5 text-[12px] text-[#6e6e73]">
                        {t.effectiveFrom} · IVA {Math.round((t.vatRate ?? 0) * 100)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {!disableDownloads && (
        <FilenamePromptModal
          open={pdfPromptOpen}
          defaultFilename={prefilledPdfName ?? defaultPdaFilename}
          title={lang === 'es' ? 'Nombrar y descargar PDA Oficial en PDF' : 'Name and download Official PDA PDF'}
          subtitle={
            lang === 'es'
              ? 'Asigna el nombre del archivo PDF antes de descargarlo (se guardará automáticamente en el Registro Mensual de PDAs para futura edición).'
              : 'Assign a filename before generating the official PDA PDF (automatically logged in the Monthly PDA Registry for future re-editing).'
          }
          lang={lang}
          onConfirm={handleConfirmPdaPdf}
          onClose={() => {
            setPrefilledPdfName(null);
            setPdfPromptOpen(false);
          }}
        />
      )}
    </section>
  );
}

interface FragmentRowsProps {
  tariff: TariffItem;
  included: boolean;
  isExpanded: boolean;
  amt: number;
  remarks: string;
  rubroKey: PdaChargeSection;
  hasSubItems: boolean;
  subBreakdown?: PdaLineItem['subBreakdown'];
  currentOverrideRate?: number;
  currentVat: number;
  lang: Language;
  disableDownloads?: boolean;
  canEditStructure?: boolean;
  onToggleInclude: () => void;
  onToggleExpand: () => void;
  onChangeSubQty: (subId: string, qty: number) => void;
  onChangeSubRate: (subId: string, rate: number) => void;
  onAddSubItem?: (payload: {
    label: string;
    rate: number;
    calcMode: PdaSubItemCalcMode;
    qty: number;
  }) => void;
  onRemoveSubItem?: (subId: string) => void;
  onChangeBaseRate: (rate: number) => void;
  onChangeSection: (sec: PdaChargeSection) => void;
}

function FragmentRows({
  tariff,
  included,
  isExpanded,
  amt,
  remarks,
  rubroKey,
  hasSubItems,
  subBreakdown,
  currentOverrideRate,
  currentVat,
  lang,
  disableDownloads,
  canEditStructure,
  onToggleInclude,
  onToggleExpand,
  onChangeSubQty,
  onChangeSubRate,
  onAddSubItem,
  onRemoveSubItem,
  onChangeBaseRate,
  onChangeSection,
}: FragmentRowsProps) {
  const [showAddSubForm, setShowAddSubForm] = useState(false);
  const [newSubLabel, setNewSubLabel] = useState('');
  const [newSubMode, setNewSubMode] = useState<PdaSubItemCalcMode>('per_qty');
  const [newSubRate, setNewSubRate] = useState<number>(0);
  const [newSubQty, setNewSubQty] = useState<number>(1);

  const handleSubmitSubItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddSubItem || !newSubLabel.trim()) return;
    onAddSubItem({
      label: newSubLabel.trim(),
      rate: newSubRate,
      calcMode: newSubMode,
      qty: newSubQty,
    });
    setNewSubLabel('');
    setNewSubRate(0);
    setNewSubQty(1);
    setShowAddSubForm(false);
  };

  return (
    <>
      <tr className={!included ? 'opacity-45 bg-[#fafafa]' : 'hover:bg-[#fafafa] transition-colors'}>
        <td className="py-2.5 pl-4 pr-2 align-top">
          <input
            type="checkbox"
            checked={included}
            onChange={onToggleInclude}
            aria-label={`Include ${tariff.conceptEn}`}
            className="w-3.5 h-3.5 accent-[#0066cc] mt-0.5"
          />
        </td>
        <td className="py-2.5 px-2 align-top">
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            className="w-full text-left flex items-start gap-1.5 group"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[#0066cc] shrink-0 mt-0.5" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#6e6e73] group-hover:text-[#0066cc] shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <div className="font-medium text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors">
                {lang === 'es' ? tariff.concept : tariff.conceptEn}
              </div>
              <div className="text-[11px] font-normal text-[#6e6e73]">
                {tariff.code} · {tariff.provider}
                {hasSubItems && (
                  <span className="ml-1.5 text-[#0066cc] font-medium">
                    · {subBreakdown!.length}{' '}
                    {lang === 'es' ? 'conceptos' : 'sub-items'}
                  </span>
                )}
              </div>
            </div>
          </button>
        </td>
        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#1d1d1f] align-top whitespace-nowrap">
          {amt > 0
            ? `$${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            : '-'}
        </td>
        <td className="py-2.5 px-4 text-[11.5px] text-[#424245] align-top">
          {remarks}
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-[#f8fafc]">
          <td colSpan={4} className="px-4 py-3 border-t border-[#e5e5ea]">
            <div className="space-y-3">
              {/* Top control bar: Reassign Rubro & Single-rate override if no subItems */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#e5e5ea]">
                <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                  <span className="font-semibold text-[#424245]">
                    {lang === 'es' ? 'Asignado a rubro:' : 'Charge section:'}
                  </span>
                  <select
                    value={rubroKey}
                    onChange={(e) => onChangeSection(e.target.value as PdaChargeSection)}
                    aria-label={`Assign section for ${tariff.concept}`}
                    className="px-2 py-1 text-[11.5px] font-medium bg-white border border-[#d2d2d7] rounded-md text-[#1d1d1f]"
                  >
                    <option value="port">Port Charges</option>
                    <option value="crew">Crew Charges</option>
                    <option value="husbandry">Husbandry Charges</option>
                    <option value="agency">Agency Charges</option>
                  </select>
                </div>

                {!hasSubItems && (
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className="text-[#6e6e73]">
                      {lang === 'es' ? 'Tarifa unitaria' : 'Unit rate'} ({tariff.currency}):
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={currentOverrideRate ?? tariff.rate}
                      onChange={(e) => onChangeBaseRate(Number(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-right font-mono tabular-nums bg-white border border-[#d2d2d7] rounded-md"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-[#6e6e73] tabular-nums">
                    {tariff.currency} · IVA {Math.round(currentVat * 100)}%
                  </span>
                  {!disableDownloads && canEditStructure && onAddSubItem && (
                    <button
                      type="button"
                      onClick={() => setShowAddSubForm((v) => !v)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#0066cc] bg-[#eef6ff] hover:bg-[#dcebff] border border-[#cde3ff] rounded-md transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {lang === 'es' ? 'Agregar valor al desplegable' : 'Add breakdown item'}
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Form to Add a New Sub-Concept / Value inside this Concept's Dropdown */}
              {showAddSubForm && !disableDownloads && canEditStructure && onAddSubItem && (
                <form
                  onSubmit={handleSubmitSubItem}
                  className="p-3 bg-white border border-[#cde3ff] rounded-xl space-y-2"
                >
                  <div className="text-[11.5px] font-semibold text-[#042447]">
                    {lang === 'es'
                      ? `Agregar nuevo sub-concepto que se sumará a "${tariff.concept}"`
                      : `Add new breakdown item summed into "${tariff.conceptEn}"`}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      required
                      value={newSubLabel}
                      onChange={(e) => setNewSubLabel(e.target.value)}
                      placeholder={
                        lang === 'es'
                          ? 'Nombre (ej. Lancha Autoridades)'
                          : 'Label (e.g. Authorities Launch)'
                      }
                      className="sm:col-span-4 px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                    />
                    <select
                      value={newSubMode}
                      onChange={(e) => setNewSubMode(e.target.value as PdaSubItemCalcMode)}
                      aria-label="Sub-item calculation mode"
                      className="sm:col-span-3 px-2 py-1.5 text-[11.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                    >
                      <option value="per_qty">{lang === 'es' ? 'Por servicio' : 'Per service'}</option>
                      <option value="fixed">{lang === 'es' ? 'Cuota fija' : 'Fixed fee'}</option>
                      <option value="grt_rate">GRT × factor</option>
                      <option value="grt_mov">GRT × factor × mov</option>
                      <option value="loa_hrs">LOA × factor × hrs</option>
                      <option value="tug_hrs">{lang === 'es' ? 'Tarifa × hrs remolque' : 'Rate × tug hrs'}</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={newSubRate}
                      onChange={(e) => setNewSubRate(Number(e.target.value) || 0)}
                      placeholder={`Tarifa ${tariff.currency}`}
                      aria-label={`New sub-item rate (${tariff.currency})`}
                      className="sm:col-span-2 px-2 py-1.5 text-right font-mono text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                    />
                    <input
                      type="number"
                      step={newSubMode === 'tug_hrs' ? 0.5 : 1}
                      min={0}
                      value={newSubQty}
                      onChange={(e) => setNewSubQty(Number(e.target.value) || 0)}
                      placeholder="Cant."
                      aria-label="New sub-item quantity"
                      className="sm:col-span-1 px-2 py-1.5 text-center font-mono text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                    />
                    <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-[11.5px] font-medium text-white bg-[#042447] hover:bg-[#0b315d] rounded-lg"
                      >
                        {lang === 'es' ? 'Agregar' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddSubForm(false)}
                        className="px-2 py-1.5 text-[11.5px] text-[#6e6e73] hover:text-[#1d1d1f]"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Sub-services Individual Quantities & Unit Tariffs */}
              {hasSubItems && subBreakdown && (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-12 gap-2 text-[10.5px] font-semibold uppercase tracking-wide text-[#6e6e73] px-1">
                    <div className="col-span-5">
                      {lang === 'es' ? 'Sub-servicio incluido' : 'Sub-service'}
                    </div>
                    <div className="col-span-3 text-right">
                      {lang === 'es' ? `Tarifa (${tariff.currency})` : `Rate (${tariff.currency})`}
                    </div>
                    <div className="col-span-2 text-center">
                      {lang === 'es' ? 'Cant.' : 'Qty'}
                    </div>
                    <div className="col-span-2 text-right">USD</div>
                  </div>

                  {subBreakdown.map((sub) => (
                    <div
                      key={sub.id}
                      className="grid grid-cols-12 gap-2 items-center bg-white border border-[#e5e5ea] rounded-lg px-2.5 py-1.5 text-[12px]"
                    >
                      <div className="col-span-5 min-w-0">
                        <div className="font-medium text-[#1d1d1f] truncate">
                          {lang === 'es' ? sub.label : sub.labelEn}
                        </div>
                        <div className="text-[10.5px] text-[#6e6e73]">
                          {getSubModeLabel(sub.calcMode, lang)}
                          {sub.unitLabel ? ` · ${sub.unitLabel}` : ''}
                        </div>
                      </div>

                      <div className="col-span-3 flex justify-end">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={sub.unitRate}
                          onChange={(e) => onChangeSubRate(sub.id, Number(e.target.value) || 0)}
                          aria-label={`Rate for ${sub.label}`}
                          className="w-24 px-2 py-1 text-right font-mono text-[11.5px] tabular-nums bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                        />
                      </div>

                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onChangeSubQty(sub.id, Math.max(0, sub.qty - 1))}
                          aria-label={`Decrease quantity for ${sub.label}`}
                          className="w-6 h-6 rounded bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] flex items-center justify-center text-[#1d1d1f]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          step={sub.calcMode === 'tug_hrs' ? 0.5 : 1}
                          value={sub.qty}
                          onChange={(e) => onChangeSubQty(sub.id, Number(e.target.value) || 0)}
                          aria-label={`Quantity for ${sub.label}`}
                          className="w-11 px-1 py-0.5 text-center font-mono text-[12px] tabular-nums bg-white border border-[#d2d2d7] rounded"
                        />
                        <button
                          type="button"
                          onClick={() => onChangeSubQty(sub.id, sub.qty + 1)}
                          aria-label={`Increase quantity for ${sub.label}`}
                          className="w-6 h-6 rounded bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] flex items-center justify-center text-[#1d1d1f]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-1.5 font-mono tabular-nums font-semibold text-[#1d1d1f]">
                        <span>
                          {sub.subtotalUsd > 0
                            ? `$${sub.subtotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </span>
                        {!disableDownloads && canEditStructure && onRemoveSubItem && (
                          <button
                            type="button"
                            onClick={() => onRemoveSubItem(sub.id)}
                            aria-label={`Remove ${sub.label}`}
                            title={lang === 'es' ? 'Eliminar sub-concepto' : 'Remove sub-item'}
                            className="p-0.5 text-[#6e6e73] hover:text-[#dc2626] rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
