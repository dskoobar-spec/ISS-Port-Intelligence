import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  INITIAL_HUB_STATE,
  PAJARITOS_IMAGE_PATH,
  RECINTO_SUR_IMAGE_PATH,
} from '../data/coatzacoalcosSeed';
import { compressImageFileToDataUrl } from '../utils/imageUpload';
import { resolveDocumentLinkUrl } from '../utils/driveLinks';
import { normalizeChargeSection } from '../utils/pdaEngine';
import { buildDefaultPierSheetFromBerth } from '../utils/pierSheetExporter';
import {
  DIR_CATEGORY_LABELS,
  getDefaultGeneralInfo,
  getDefaultMarineServices,
  getDefaultPhysicalSpecs,
  PORT_STATUS_META,
  recordPortStatusTransition,
  translatePortStatus,
} from '../utils/i18n';
import type {
  AnchorageZone,
  AppsScriptTool,
  AuthorityAgency,
  AuthorityRequirement,
  Berth,
  ConcessionaireTerminal,
  CrewChangeGuideConfig,
  DirectoryCategory,
  DirectoryEntry,
  HubState,
  Language,
  NavigationChannel,
  OfficialPortStatus,
  OperationalProcedure,
  OpticConcept,
  OrgChartNode,
  OrgCustomField,
  OrgSubDepartment,
  PdaChargeSection,
  PdaFormatPreset,
  PdaFormulaType,
  PdaOfficeAndBankProfile,
  PdaPurpose,
  PdaSubItemCalcMode,
  PdaSubItemDef,
  PdaVesselType,
  PhysicalRestrictionSpec,
  PierProductCondition,
  PierSpecificationSheet,
  PortGeneralInfo,
  PortProfile,
  PortRestriction,
  PortServiceItem,
  PortStatusEvent,
  ProductHandlingSpec,
  ProductTechnicalDossier,
  SparePartsProcedureConfig,
  StorageSummary,
  TariffItem,
  TariffUnit,
  Terminal,
  TerminalCommercialProfile,
  VesselLineupEntry,
  VesselStatus,
  WeatherStatus,
} from '../types/port';

const PDA_VESSEL_TYPE_OPTIONS: PdaVesselType[] = [
  'Tanker / Chemical',
  'Crude / Aframax',
  'Gas Carrier (LPG/Ethane)',
  'Dry Bulk',
  'General Cargo / Steel',
  'Container',
  'Rail Ferry',
  'Offshore',
];

const PDA_FORMULA_OPTIONS: { id: PdaFormulaType; label: string }[] = [
  { id: 'standard', label: 'Estándar (Qty × Tarifa)' },
  { id: 'port_dues_hybrid', label: 'Port Dues ((GRT×Factor + Fijo) + IVA)' },
  { id: 'dockage_loa_hours', label: 'Muellaje (LOA × Tarifa × Hrs + IVA)' },
  { id: 'pilotage_gt_movements', label: 'Practicaje (GRT × Factor × Mov + IVA)' },
  { id: 'towage_tugs', label: 'Remolque (Tarifa × Hrs × Remolcadores + IVA)' },
  { id: 'agency_extra_days', label: 'Días Adicionales (> Días Incl.)' },
  { id: 'flat_with_vat', label: 'Cuota Fija + IVA' },
  { id: 'sub_items_breakdown', label: 'Desglose por Sub-servicios (Qty × Tarifa)' },
  { id: 'custom_expression', label: 'Fórmula Personalizada' },
];

const PDA_PURPOSE_OPTIONS: PdaPurpose[] = [
  'DISCHARGE',
  'LOAD',
  'LOAD & DISCHARGE',
  'BUNKERING',
  'CREW CHANGE',
  'REPAIRS',
  'ANCHORAGE',
];

export type ManagerTab =
  | 'port'
  | 'weather'
  | 'channels'
  | 'terminals'
  | 'products'
  | 'restrictions'
  | 'services'
  | 'lineup'
  | 'tariffs'
  | 'authorities'
  | 'directory'
  | 'apps';

interface ContentManagerModalProps {
  open: boolean;
  portId: string;
  hubState: HubState;
  lang: Language;
  initialTab?: ManagerTab;
  initialTerminalId?: string;
  initialBerthId?: string;
  initialDossierId?: string;
  onUpdateState: (updater: (prev: HubState) => HubState) => void;
  onResetSeed: () => void;
  onClose: () => void;
}

const VESSEL_STATUSES: VesselStatus[] = [
  'EXPECTED',
  'ANCHORED',
  'BERTHED',
  'SAILED',
  'CANCELLED',
  'UNCONFIRMED',
];

const OFFICIAL_PORT_STATUSES: OfficialPortStatus[] = [
  'Abierto a toda navegación',
  'Cerrado a embarcaciones menores',
  'Cierre a embarcaciones mayores a 500 TRB',
  'Restringido por Norte',
  'Cerrado a toda navegación',
];

const DIR_CATEGORIES: DirectoryCategory[] = [
  'ISS',
  'Subagentes',
  'Proveedores',
  'CLS_HUB',
  'Clientes',
  'Dow_Jones',
];

interface ImageUploaderFieldProps {
  id: string;
  label: string;
  value: string;
  lang: Language;
  onChange: (nextUrl: string) => void;
}

function ImageUploaderField({
  id,
  label,
  value,
  lang,
  onChange,
}: ImageUploaderFieldProps) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      onChange(dataUrl);
    } catch {
      // ignore failed local image decode
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-[12px] font-semibold text-[#1d1d1f] flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#0066cc]" />
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-2 py-1 text-[11px] font-medium text-[#6e6e73] hover:text-[#dc2626] bg-white border border-[#d2d2d7] rounded-md transition-colors"
            >
              {lang === 'es' ? 'Quitar' : 'Clear'}
            </button>
          )}
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-[#e5e5ea] text-[#1d1d1f] border border-[#d2d2d7] rounded-md cursor-pointer transition-colors">
            <Upload className="w-3 h-3" />
            {uploading
              ? lang === 'es'
                ? 'Optimizando...'
                : 'Optimizing...'
              : lang === 'es'
              ? 'Subir foto local'
              : 'Upload local photo'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {value && (
          <img
            src={value}
            alt={label}
            className="w-16 h-11 object-cover rounded-md border border-[#d2d2d7] shrink-0 bg-[#0b1220]"
          />
        )}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... / /src/assets/..."
          className="w-full px-3 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
        />
      </div>
    </div>
  );
}

export function ContentManagerModal({
  open,
  portId,
  hubState,
  lang,
  initialTab = 'port',
  initialTerminalId,
  initialBerthId,
  initialDossierId,
  onUpdateState,
  onResetSeed,
  onClose,
}: ContentManagerModalProps) {
  const [tab, setTab] = useState<ManagerTab>(initialTab);
  const [savedNotice, setSavedNotice] = useState('');
  const [expandedPierSheetBerthId, setExpandedPierSheetBerthId] = useState<string | null>(null);
  const [showCommercialEditor, setShowCommercialEditor] = useState(false);

  const activePort = hubState.ports.find((p) => p.id === portId);
  const portAreas = hubState.areas.filter((a) => a.portId === portId);
  const portTerminals = hubState.terminals.filter((t) => t.portId === portId);
  const portRestrictions = hubState.restrictions.filter((r) => r.portId === portId);
  const portTariffs = hubState.tariffs.filter((t) => t.portId === portId);
  const portLineup = (hubState.lineup ?? []).filter((v) => v.portId === portId);
  const activeWeather = hubState.weather.find((w) => w.portId === portId);
  const portHistory = (hubState.statusHistory ?? []).filter((h) => h.portId === portId);
  const portDossiers = (hubState.productDossiers ?? []).filter((d) => d.portId === portId);
  const portDirectory = hubState.directory.filter(
    (d) => d.portId === portId || d.category === 'CLS_HUB' || d.category === 'Dow_Jones'
  );

  // Selected terminal & product dossier for editing
  const [selectedEditTermId, setSelectedEditTermId] = useState<string>(
    initialTerminalId ?? portTerminals[0]?.id ?? ''
  );
  const [selectedDossierId, setSelectedDossierId] = useState<string>(
    initialDossierId ?? portDossiers[0]?.id ?? ''
  );

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      if (initialTerminalId && portTerminals.some((t) => t.id === initialTerminalId)) {
        setSelectedEditTermId(initialTerminalId);
      }
      if (initialBerthId) {
        setExpandedPierSheetBerthId(initialBerthId);
      }
      if (initialDossierId && portDossiers.some((d) => d.id === initialDossierId)) {
        setSelectedDossierId(initialDossierId);
      }
    }
  }, [open, initialTab, initialTerminalId, initialBerthId, initialDossierId, portTerminals, portDossiers]);

  useEffect(() => {
    if (!portTerminals.some((t) => t.id === selectedEditTermId)) {
      setSelectedEditTermId(portTerminals[0]?.id ?? '');
    }
  }, [portId, portTerminals, selectedEditTermId]);

  useEffect(() => {
    if (!portDossiers.some((d) => d.id === selectedDossierId)) {
      setSelectedDossierId(portDossiers[0]?.id ?? '');
    }
  }, [portId, portDossiers, selectedDossierId]);

  const [termAreaId, setTermAreaId] = useState(portAreas[0]?.id ?? '');
  useEffect(() => {
    const firstArea = hubState.areas.find((a) => a.portId === portId)?.id ?? '';
    setTermAreaId(firstArea);
  }, [portId, hubState.areas]);

  // Line-Up Vessel form
  const [luVesselName, setLuVesselName] = useState('');
  const [luImo, setLuImo] = useState('');
  const [luTerminal, setLuTerminal] = useState('');
  const [luCargo, setLuCargo] = useState('');
  const [luEta, setLuEta] = useState('2026-11-22 08:00');
  const [luStatus, setLuStatus] = useState<VesselStatus>('EXPECTED');
  const [luAgency, setLuAgency] = useState('ISS México');
  const [bulkLineupText, setBulkLineupText] = useState('');

  // New Terminal form
  const [showNewTermForm, setShowNewTermForm] = useState(false);
  const [termName, setTermName] = useState('');
  const [termOperator, setTermOperator] = useState('');
  const [termBerthName, setTermBerthName] = useState('Muelle Principal');
  const [termMaxLoa, setTermMaxLoa] = useState(190);
  const [termMaxDraft, setTermMaxDraft] = useState(11.0);
  const [termProducts, setTermProducts] = useState('Carga general, Granel mineral');

  // New Restriction form
  const [restTitle, setRestTitle] = useState('');
  const [restLimit, setRestLimit] = useState('');
  const [restDetail, setRestDetail] = useState('');
  const [restCategory, setRestCategory] =
    useState<PortRestriction['category']>('Operativa');
  const [restVerified, setRestVerified] = useState(false);

  // New Tariff form
  const [newTariffCode, setNewTariffCode] = useState('');
  const [newTariffConcept, setNewTariffConcept] = useState('');
  const [newTariffProvider, setNewTariffProvider] = useState('ASIPONA / Proveedor');
  const [newTariffUnit, setNewTariffUnit] = useState<TariffUnit>('flat');
  const [newTariffRate, setNewTariffRate] = useState(500);
  const [newTariffCurrency, setNewTariffCurrency] = useState<'USD' | 'MXN'>('USD');
  const [newTariffSection, setNewTariffSection] = useState<PdaChargeSection>('port');
  const [newTariffFormula, setNewTariffFormula] = useState<PdaFormulaType>('flat_with_vat');
  const [newTariffCustomFormula, setNewTariffCustomFormula] = useState('grt * rate * 1.16');
  const [newTariffVatPct, setNewTariffVatPct] = useState(16);

  // New PDA Format Preset form
  const [newFormatName, setNewFormatName] = useState('');
  const [newFormatVesselType, setNewFormatVesselType] = useState<PdaVesselType>('Tanker / Chemical');
  const [newFormatPurpose, setNewFormatPurpose] = useState<PdaPurpose>('DISCHARGE');
  const [newFormatCargo, setNewFormatCargo] = useState('CARGO');
  const [newFormatQty, setNewFormatQty] = useState(10000);

  // New Service form
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvNameEn, setNewSrvNameEn] = useState('');
  const [newSrvDetail, setNewSrvDetail] = useState('');

  // New Directory contact form
  const [newDirCategory, setNewDirCategory] = useState<DirectoryCategory>('ISS');
  const [newDirOrg, setNewDirOrg] = useState('');
  const [newDirContact, setNewDirContact] = useState('');
  const [newDirRole, setNewDirRole] = useState('');
  const [newDirEmail, setNewDirEmail] = useState('');
  const [newDirPhone, setNewDirPhone] = useState('');

  if (!open || !activePort) return null;

  const notifySaved = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(''), 2500);
  };

  // Port & GeneralInfo updaters
  const handleUpdatePortProfile = (patch: Partial<PortProfile>) => {
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) => (p.id === portId ? { ...p, ...patch } : p)),
    }));
    notifySaved(lang === 'es' ? 'Ficha del puerto actualizada.' : 'Port profile updated.');
  };

  const handleUpdateGeneralInfo = (patch: Partial<PortGeneralInfo>) => {
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) => {
        if (p.id !== portId) return p;
        const base = getDefaultGeneralInfo(p);
        return { ...p, generalInfo: { ...base, ...patch } };
      }),
    }));
    notifySaved(lang === 'es' ? 'Datos generales guardados.' : 'General particulars saved.');
  };

  // Weather & Status History (only logs history on genuine transition)
  const handleUpdateWeather = (patch: Partial<WeatherStatus>) => {
    onUpdateState((prev) => {
      const currentWeather = prev.weather.find((w) => w.portId === portId);
      const nextStatus = patch.portStatus;
      let nextHistory = prev.statusHistory ?? [];

      if (nextStatus && currentWeather && nextStatus !== currentWeather.portStatus) {
        nextHistory = recordPortStatusTransition(
          nextHistory,
          portId,
          currentWeather.portStatus,
          nextStatus
        );
      }

      return {
        ...prev,
        weather: prev.weather.map((w) =>
          w.portId === portId ? { ...w, ...patch } : w
        ),
        statusHistory: nextHistory,
      };
    });
    notifySaved(
      lang === 'es'
        ? 'Estatus meteorológico e histórico actualizados.'
        : 'Weather & port status history updated.'
    );
  };

  const handleUpdateStatusEvent = (id: string, patch: Partial<PortStatusEvent>) => {
    onUpdateState((prev) => ({
      ...prev,
      statusHistory: (prev.statusHistory ?? []).map((ev) =>
        ev.id === id ? { ...ev, ...patch } : ev
      ),
    }));
    notifySaved(lang === 'es' ? 'Registro histórico editado.' : 'Status history record edited.');
  };

  const handleDeleteStatusEvent = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      statusHistory: (prev.statusHistory ?? []).filter((ev) => ev.id !== id),
    }));
    notifySaved(lang === 'es' ? 'Registro histórico eliminado.' : 'History event deleted.');
  };

  // Channels, Anchorages & Physical Specs
  const handleUpdateChannel = (chId: string, patch: Partial<NavigationChannel>) => {
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) =>
        p.id === portId
          ? { ...p, channels: p.channels.map((c) => (c.id === chId ? { ...c, ...patch } : c)) }
          : p
      ),
    }));
    notifySaved(lang === 'es' ? 'Canal actualizado.' : 'Channel updated.');
  };

  const handleDeleteChannel = (chId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) =>
        p.id === portId
          ? { ...p, channels: p.channels.filter((c) => c.id !== chId) }
          : p
      ),
    }));
  };

  const handleAddChannel = () => {
    const newCh: NavigationChannel = {
      id: `ch-${portId}-${Date.now()}`,
      name: 'Nuevo Canal / Dársena',
      nameEn: 'New Channel / Basin',
      lengthNm: 0.5,
      widthM: 150,
      channelDepthM: 12.0,
      operationalDraftM: 11.0,
      squatAllowanceNote: 'Operación estándar sujeta a practicaje.',
      squatAllowanceNoteEn: 'Standard pilotage rules apply.',
      verificationStatus: 'pending_validation',
    };
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) =>
        p.id === portId ? { ...p, channels: [...p.channels, newCh] } : p
      ),
    }));
  };

  const handleUpdateAnchorage = (azId: string, patch: Partial<AnchorageZone>) => {
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) =>
        p.id === portId
          ? {
              ...p,
              anchorageZones: (p.anchorageZones ?? []).map((az) =>
                az.id === azId ? { ...az, ...patch } : az
              ),
            }
          : p
      ),
    }));
    notifySaved(lang === 'es' ? 'Zona de fondeo actualizada.' : 'Anchorage zone updated.');
  };

  const handleAddAnchorage = () => {
    const newAz: AnchorageZone = {
      id: `az-${portId}-${Date.now()}`,
      name: 'Nueva Zona de Fondeo',
      nameEn: 'New Anchorage Zone',
      purpose: 'Espera de buques / Carga general',
      purposeEn: 'Waiting area / General cargo',
      coordinates: activePort.coordinates,
      depthM: '18 – 26 m',
      maxVesselOrNotes: 'Sujeto a autorización de Capitanía.',
      maxVesselOrNotesEn: 'Subject to Harbor Master authorization.',
      verificationStatus: 'pending_validation',
    };
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) =>
        p.id === portId
          ? { ...p, anchorageZones: [...(p.anchorageZones ?? []), newAz] }
          : p
      ),
    }));
  };

  const handleDeleteAnchorage = (azId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) =>
        p.id === portId
          ? {
              ...p,
              anchorageZones: (p.anchorageZones ?? []).filter((az) => az.id !== azId),
            }
          : p
      ),
    }));
  };

  const activePhysicalSpecs = getDefaultPhysicalSpecs(activePort);
  const handleUpdatePhysicalSpec = (
    specId: string,
    patch: Partial<PhysicalRestrictionSpec>
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) => {
        if (p.id !== portId) return p;
        const specs = getDefaultPhysicalSpecs(p).map((s) =>
          s.id === specId ? { ...s, ...patch } : s
        );
        return { ...p, physicalSpecs: specs };
      }),
    }));
    notifySaved(lang === 'es' ? 'Especificación física actualizada.' : 'Physical spec updated.');
  };

  const handleDeletePhysicalSpec = (specId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) => {
        if (p.id !== portId) return p;
        const specs = getDefaultPhysicalSpecs(p).filter((s) => s.id !== specId);
        return { ...p, physicalSpecs: specs };
      }),
    }));
  };

  // Terminals & Berths
  const editingTerminal =
    portTerminals.find((t) => t.id === selectedEditTermId) ?? portTerminals[0];

  const handleUpdateTerminal = (termId: string, patch: Partial<Terminal>) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) =>
        t.id === termId ? { ...t, ...patch } : t
      ),
    }));
    notifySaved(lang === 'es' ? 'Terminal actualizada.' : 'Terminal updated.');
  };

  const handleUpdateTerminalStorage = (
    termId: string,
    patch: Partial<StorageSummary>
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) => {
        if (t.id !== termId) return t;
        const base: StorageSummary = t.storageSummary ?? {
          coveredSqm: 0,
          openYardSqm: 0,
          containerYardSqm: 0,
          warehousesBreakdown: '',
          warehousesBreakdownEn: '',
        };
        return { ...t, storageSummary: { ...base, ...patch } };
      }),
    }));
    notifySaved(
      lang === 'es' ? 'Almacenaje de terminal actualizado.' : 'Terminal storage updated.'
    );
  };

  const handleUpdateTerminalCommercial = (
    termId: string,
    patch: Partial<TerminalCommercialProfile>
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) => {
        if (t.id !== termId) return t;
        const base: TerminalCommercialProfile = t.commercialProfile ?? {
          positioningHeadline: t.name,
          positioningHeadlineEn: t.nameEn ?? t.name,
          address: '',
          customsRegime: '',
          customsRegimeEn: '',
          commercialServices: [],
          commercialServicesEn: [],
          infrastructureHighlights: [],
          infrastructureHighlightsEn: [],
          vesselTypesServed: [],
          vesselTypesServedEn: [],
          connectivity: '',
          connectivityEn: '',
          customsProcess: [],
          customsProcessEn: [],
          operationalAdvantages: [],
          operationalAdvantagesEn: [],
          keyClientsOrTrades: [],
          certifications: [],
        };
        return { ...t, commercialProfile: { ...base, ...patch } };
      }),
    }));
    notifySaved(
      lang === 'es'
        ? 'Perfil comercial de terminal actualizado.'
        : 'Terminal commercial profile updated.'
    );
  };

  const handleDeleteTerminal = (termId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.filter((t) => t.id !== termId),
    }));
    notifySaved(lang === 'es' ? 'Terminal eliminada.' : 'Terminal removed.');
  };

  const handleUpdateBerth = (
    termId: string,
    berthId: string,
    patch: Partial<Berth>
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) =>
        t.id === termId
          ? {
              ...t,
              berths: t.berths.map((b) => (b.id === berthId ? { ...b, ...patch } : b)),
            }
          : t
      ),
    }));
    notifySaved(lang === 'es' ? 'Muelle actualizado.' : 'Berth updated.');
  };

  const handleAddBerthToTerminal = (termId: string) => {
    const newBerth: Berth = {
      id: `b-${Date.now()}`,
      name: 'Nuevo Muelle / Posición',
      nameEn: 'New Berth / Position',
      lengthM: 220,
      maxLoaM: 195,
      maxBeamM: 32.3,
      berthDepthM: 12.0,
      maxDraftM: 11.2,
      products: ['Carga general'],
      productsEn: ['General cargo'],
      cargoGroups: ['Carga General y Contenedores'],
      equipment: ['Equipo de terminal'],
      connections: ['Servicios en muelle'],
      loadingRate: 'Por confirmar',
      loadingRateEn: 'To be confirmed',
      notes: 'Creado desde Content Manager.',
      notesEn: 'Created from Content Manager.',
      verificationStatus: 'pending_validation',
    };
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) =>
        t.id === termId ? { ...t, berths: [...t.berths, newBerth] } : t
      ),
    }));
  };

  const handleDeleteBerthFromTerminal = (termId: string, berthId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) =>
        t.id === termId
          ? { ...t, berths: t.berths.filter((b) => b.id !== berthId) }
          : t
      ),
    }));
  };

  const handleAddProductSpec = (termId: string) => {
    const newSpec: ProductHandlingSpec = {
      id: `ps-${Date.now()}`,
      product: 'Nuevo Producto',
      productEn: 'New Commodity',
      berths: 'Posición 1',
      dischargeRate: 'Por confirmar',
      dischargeRateEn: 'To be confirmed',
      muellajeTariff: '$12.12 MXN/ton',
      muellajeTariffEn: '$12.12 MXN/MT',
      restrictions: 'Sujeto a reglas de operación vigentes.',
      restrictionsEn: 'Subject to current operating rules.',
      maneuvers: 'Estiba / bombeo estándar de terminal.',
      maneuversEn: 'Standard terminal cargo operation.',
    };
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) =>
        t.id === termId
          ? { ...t, productSpecs: [...(t.productSpecs ?? []), newSpec] }
          : t
      ),
    }));
    notifySaved(lang === 'es' ? 'Ficha de producto agregada.' : 'Product handling spec added.');
  };

  const handleUpdateProductSpec = (
    termId: string,
    specId: string,
    patch: Partial<ProductHandlingSpec>
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) =>
        t.id === termId
          ? {
              ...t,
              productSpecs: (t.productSpecs ?? []).map((ps) =>
                ps.id === specId ? { ...ps, ...patch } : ps
              ),
            }
          : t
      ),
    }));
    notifySaved(lang === 'es' ? 'Producto / muellaje actualizado.' : 'Product / wharfage updated.');
  };

  const handleDeleteProductSpec = (termId: string, specId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) =>
        t.id === termId
          ? {
              ...t,
              productSpecs: (t.productSpecs ?? []).filter((ps) => ps.id !== specId),
            }
          : t
      ),
    }));
  };

  // Pier Visual Sheet CRUD (photos, hero, 8 navigation params, product condition rows)
  const handleEnsurePierSheet = (termId: string, berthId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) => {
        if (t.id !== termId) return t;
        return {
          ...t,
          berths: t.berths.map((b) =>
            b.id === berthId
              ? { ...b, pierSheet: b.pierSheet ?? buildDefaultPierSheetFromBerth(b, t) }
              : b
          ),
        };
      }),
    }));
    setExpandedPierSheetBerthId(berthId);
  };

  const handleUpdatePierSheet = (
    termId: string,
    berthId: string,
    patch: Partial<PierSpecificationSheet>
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) => {
        if (t.id !== termId) return t;
        return {
          ...t,
          berths: t.berths.map((b) => {
            if (b.id !== berthId) return b;
            const base = b.pierSheet ?? buildDefaultPierSheetFromBerth(b, t);
            return { ...b, pierSheet: { ...base, ...patch } };
          }),
        };
      }),
    }));
    notifySaved(
      lang === 'es'
        ? 'Ficha visual y fotografía de muelle guardadas.'
        : 'Berth visual sheet & photo saved.'
    );
  };

  const handleAddPierCondition = (termId: string, berthId: string) => {
    const newRow: PierProductCondition = {
      id: `pc-${Date.now()}`,
      product: 'Nuevo Producto',
      line: '12"',
      connectionType: 'Hose',
      connection: '8"',
      maxAvgPerHour: '500 MT',
      minAvgPerHour: '150 MT',
    };
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) => {
        if (t.id !== termId) return t;
        return {
          ...t,
          berths: t.berths.map((b) => {
            if (b.id !== berthId) return b;
            const base = b.pierSheet ?? buildDefaultPierSheetFromBerth(b, t);
            return {
              ...b,
              pierSheet: { ...base, conditions: [...base.conditions, newRow] },
            };
          }),
        };
      }),
    }));
  };

  const handleUpdatePierCondition = (
    termId: string,
    berthId: string,
    condId: string,
    patch: Partial<PierProductCondition>
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) => {
        if (t.id !== termId) return t;
        return {
          ...t,
          berths: t.berths.map((b) => {
            if (b.id !== berthId) return b;
            const base = b.pierSheet ?? buildDefaultPierSheetFromBerth(b, t);
            return {
              ...b,
              pierSheet: {
                ...base,
                conditions: base.conditions.map((c) =>
                  c.id === condId ? { ...c, ...patch } : c
                ),
              },
            };
          }),
        };
      }),
    }));
    notifySaved(
      lang === 'es'
        ? 'Condición de producto actualizada.'
        : 'Product operating condition updated.'
    );
  };

  const handleDeletePierCondition = (
    termId: string,
    berthId: string,
    condId: string
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) => {
        if (t.id !== termId) return t;
        return {
          ...t,
          berths: t.berths.map((b) => {
            if (b.id !== berthId || !b.pierSheet) return b;
            return {
              ...b,
              pierSheet: {
                ...b.pierSheet,
                conditions: b.pierSheet.conditions.filter((c) => c.id !== condId),
              },
            };
          }),
        };
      }),
    }));
  };

  // Concessionaires CRUD inside terminal
  const handleAddConcessionaire = (termId: string) => {
    const newConc: ConcessionaireTerminal = {
      id: `conc-${Date.now()}`,
      name: 'Nuevo Cesionario / Área Operativa',
      coordinates: "18°08'22\"N · 94°24'55\"W",
      cargoCategory: 'Carga especializada',
      cargoCategoryEn: 'Specialized cargo',
      berthsUsed: 'Muelles asignados',
      infrastructure: 'Infraestructura y capacidad de transferencia.',
      infrastructureEn: 'Transfer infrastructure and storage capacity.',
      restrictions: 'Cumplir lista de verificación portuaria, ISGOTT y Reglas de Operación vigentes.',
      restrictionsEn: 'Comply with port checklist, ISGOTT and current Port Operations Rules.',
      procedures: [
        'Reunión pre-operativa y verificación de conexiones/mangueras.',
      ],
      proceduresEn: [
        'Pre-transfer conference and manifold/hose inspection.',
      ],
    };
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) =>
        t.id === termId
          ? { ...t, concessionaires: [...(t.concessionaires ?? []), newConc] }
          : t
      ),
    }));
  };

  const handleUpdateConcessionaire = (
    termId: string,
    concId: string,
    patch: Partial<ConcessionaireTerminal>
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) =>
        t.id === termId
          ? {
              ...t,
              concessionaires: (t.concessionaires ?? []).map((c) =>
                c.id === concId ? { ...c, ...patch } : c
              ),
            }
          : t
      ),
    }));
    notifySaved(lang === 'es' ? 'Cesionario actualizado.' : 'Concessionaire updated.');
  };

  const handleDeleteConcessionaire = (termId: string, concId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      terminals: prev.terminals.map((t) =>
        t.id === termId
          ? {
              ...t,
              concessionaires: (t.concessionaires ?? []).filter((c) => c.id !== concId),
            }
          : t
      ),
    }));
  };

  const handleAddTerminal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termName.trim() || !termOperator.trim()) return;

    const newTerm: Terminal = {
      id: `term-custom-${Date.now()}`,
      portId,
      areaId: portAreas.some((a) => a.id === termAreaId)
        ? termAreaId
        : portAreas[0]?.id ?? 'area-asipona-coa',
      name: termName.trim(),
      nameEn: termName.trim(),
      operator: termOperator.trim(),
      shortDesc: `Terminal agregada desde Content Manager (${termProducts}).`,
      shortDescEn: `Terminal registered via Content Manager (${termProducts}).`,
      coordinates: activePort.coordinates,
      mapX: 50,
      mapY: 54,
      imageUrl:
        termAreaId === 'area-pajaritos' ? PAJARITOS_IMAGE_PATH : RECINTO_SUR_IMAGE_PATH,
      cargoGroups: ['Carga General y Contenedores'],
      berths: [
        {
          id: `b-custom-${Date.now()}`,
          name: termBerthName.trim() || 'Muelle 1',
          nameEn: termBerthName.trim() || 'Berth 1',
          lengthM: Math.round(termMaxLoa * 1.2),
          maxLoaM: termMaxLoa,
          maxBeamM: 32.2,
          berthDepthM: Number((termMaxDraft + 0.8).toFixed(1)),
          maxDraftM: termMaxDraft,
          products: termProducts.split(',').map((p) => p.trim()).filter(Boolean),
          productsEn: termProducts.split(',').map((p) => p.trim()).filter(Boolean),
          cargoGroups: ['Carga General y Contenedores'],
          equipment: ['Equipo estándar de terminal'],
          connections: ['Servicios básicos en muelle'],
          loadingRate: 'Por confirmar con operador',
          loadingRateEn: 'To be confirmed with operator',
          notes: 'Registro creado desde Content Manager.',
          notesEn: 'Created from Content Manager.',
          verificationStatus: 'pending_validation',
        },
      ],
      procedures: ['Confirmar requisitos operativos con el operador de terminal.'],
      proceduresEn: ['Confirm operational rules with terminal operator.'],
      restrictionsSummary: `Calado máx. ${termMaxDraft} m · Eslora máx. ${termMaxLoa} m.`,
      restrictionsSummaryEn: `Max draft ${termMaxDraft} m · Max LOA ${termMaxLoa} m.`,
      audit: {
        updatedAt: new Date().toISOString().slice(0, 10),
        updatedBy: 'Administrador Content Manager',
        source: 'Alta directa en plataforma web',
        verificationStatus: 'pending_validation',
      },
    };

    onUpdateState((prev) => ({
      ...prev,
      terminals: [...prev.terminals, newTerm],
    }));
    setSelectedEditTermId(newTerm.id);
    setTermName('');
    setTermOperator('');
    setShowNewTermForm(false);
    notifySaved(lang === 'es' ? 'Nueva terminal publicada.' : 'New terminal published.');
  };

  // Restrictions
  const handleUpdateRestriction = (id: string, patch: Partial<PortRestriction>) => {
    onUpdateState((prev) => ({
      ...prev,
      restrictions: prev.restrictions.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    notifySaved(lang === 'es' ? 'Restricción actualizada.' : 'Restriction updated.');
  };

  const handleDeleteRestriction = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      restrictions: prev.restrictions.filter((r) => r.id !== id),
    }));
  };

  const handleAddRestriction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restTitle.trim() || !restDetail.trim()) return;

    const newRest: PortRestriction = {
      id: `rest-custom-${Date.now()}`,
      portId,
      category: restCategory,
      title: restTitle.trim(),
      titleEn: restTitle.trim(),
      detail: restDetail.trim(),
      detailEn: restDetail.trim(),
      limitValue: restLimit.trim() || 'Ver nota',
      verificationStatus: restVerified ? 'verified' : 'pending_validation',
      source: 'Content Manager · Actualización interna',
    };

    onUpdateState((prev) => ({
      ...prev,
      restrictions: [newRest, ...prev.restrictions],
    }));
    setRestTitle('');
    setRestLimit('');
    setRestDetail('');
    notifySaved(lang === 'es' ? 'Restricción agregada.' : 'Restriction added.');
  };

  // Marine Services
  const activeServices = getDefaultMarineServices(activePort);
  const handleUpdateService = (srvId: string, patch: Partial<PortServiceItem>) => {
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) => {
        if (p.id !== portId) return p;
        const list = getDefaultMarineServices(p).map((s) =>
          s.id === srvId ? { ...s, ...patch } : s
        );
        return { ...p, marineServices: list };
      }),
    }));
    notifySaved(lang === 'es' ? 'Servicio portuario actualizado.' : 'Port service updated.');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName.trim()) return;
    const item: PortServiceItem = {
      id: `srv-${portId}-${Date.now()}`,
      category: 'Servicio Adicional',
      categoryEn: 'Additional Service',
      name: newSrvName.trim(),
      nameEn: newSrvNameEn.trim() || newSrvName.trim(),
      detail: newSrvDetail.trim() || 'Disponible bajo coordinación de agencia.',
      detailEn: newSrvDetail.trim() || 'Available via port agency coordination.',
      available: true,
    };
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) =>
        p.id === portId
          ? { ...p, marineServices: [...getDefaultMarineServices(p), item] }
          : p
      ),
    }));
    setNewSrvName('');
    setNewSrvNameEn('');
    setNewSrvDetail('');
    notifySaved(lang === 'es' ? 'Servicio agregado.' : 'Service added.');
  };

  const handleDeleteService = (srvId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      ports: prev.ports.map((p) =>
        p.id === portId
          ? {
              ...p,
              marineServices: getDefaultMarineServices(p).filter((s) => s.id !== srvId),
            }
          : p
      ),
    }));
  };

  // Lineup
  const handleAddLineupVessel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!luVesselName.trim()) return;
    const newEntry: VesselLineupEntry = {
      id: `lu-${portId}-${Date.now()}`,
      portId,
      vesselName: luVesselName.trim(),
      imo: luImo.trim() || undefined,
      terminalOrBerth: luTerminal.trim() || 'Muelle Principal',
      cargo: luCargo.trim() || 'Carga general',
      etaOrEtd: luEta.trim() || new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: luStatus,
      agencyOrOperator: luAgency.trim() || 'ISS México',
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    onUpdateState((prev) => ({
      ...prev,
      lineup: [newEntry, ...(prev.lineup ?? [])],
    }));
    setLuVesselName('');
    setLuImo('');
    setLuTerminal('');
    setLuCargo('');
    notifySaved(lang === 'es' ? 'Buque agregado al Line-Up.' : 'Vessel added to Line-Up.');
  };

  const handleUpdateLineupEntry = (id: string, patch: Partial<VesselLineupEntry>) => {
    onUpdateState((prev) => ({
      ...prev,
      lineup: (prev.lineup ?? []).map((v) =>
        v.id === id
          ? { ...v, ...patch, updatedAt: new Date().toISOString().slice(0, 10) }
          : v
      ),
    }));
    notifySaved(lang === 'es' ? 'Registro de buque actualizado.' : 'Vessel record updated.');
  };

  const handleDeleteLineupVessel = (vesselId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      lineup: (prev.lineup ?? []).filter((v) => v.id !== vesselId),
    }));
  };

  const handleImportBulkLineup = (replacePortRows: boolean) => {
    const lines = bulkLineupText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const parsedEntries: VesselLineupEntry[] = lines.map((line, idx) => {
      const cols = line.split(/[\t|;,]+/).map((c) => c.trim());
      const rawStatus = (cols[5] ?? 'EXPECTED').toUpperCase() as VesselStatus;
      const validStatus: VesselStatus = VESSEL_STATUSES.includes(rawStatus)
        ? rawStatus
        : 'EXPECTED';
      return {
        id: `lu-${portId}-imp-${Date.now()}-${idx}`,
        portId,
        vesselName: cols[0] || `Buque ${idx + 1}`,
        imo: cols[1] || undefined,
        terminalOrBerth: cols[2] || 'Muelle por confirmar',
        cargo: cols[3] || 'Carga general',
        etaOrEtd: cols[4] || today,
        status: validStatus,
        agencyOrOperator: cols[6] || 'ISS México',
        updatedAt: today,
      };
    });

    onUpdateState((prev) => {
      const base = replacePortRows
        ? (prev.lineup ?? []).filter((v) => v.portId !== portId)
        : prev.lineup ?? [];
      return {
        ...prev,
        lineup: [...parsedEntries, ...base],
      };
    });
    setBulkLineupText('');
    notifySaved(
      lang === 'es'
        ? `${parsedEntries.length} buques importados.`
        : `${parsedEntries.length} vessels imported.`
    );
  };

  // Tariffs
  const handleUpdateTariff = (tariffId: string, patch: Partial<TariffItem>) => {
    onUpdateState((prev) => ({
      ...prev,
      tariffs: prev.tariffs.map((t) => (t.id === tariffId ? { ...t, ...patch } : t)),
    }));
    notifySaved(
      lang === 'es'
        ? 'Tarifa actualizada y sincronizada con PDA.'
        : 'Tariff updated and synced with PDA.'
    );
  };

  const handleDeleteTariff = (tariffId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      tariffs: prev.tariffs.filter((t) => t.id !== tariffId),
    }));
  };

  const handleAddTariff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTariffConcept.trim()) return;
    const item: TariffItem = {
      id: `tar-${portId}-${Date.now()}`,
      portId,
      areaId: 'ALL',
      code: newTariffCode.trim() || `${activePort.shortCode}-NEW`,
      concept: newTariffConcept.trim(),
      conceptEn: newTariffConcept.trim(),
      provider: newTariffProvider.trim() || 'ASIPONA',
      unit: newTariffUnit,
      rate: Math.max(0, newTariffRate),
      currency: newTariffCurrency,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      notes: 'Tarifa registrada desde Content Manager',
      notesEn: 'Registered via Content Manager',
      verificationStatus: 'pending_validation',
      active: true,
      chargeSection: newTariffSection,
      formulaType: newTariffFormula,
      customFormula:
        newTariffFormula === 'custom_expression'
          ? newTariffCustomFormula.trim()
          : undefined,
      vatRate: Math.max(0, newTariffVatPct / 100),
      applicableVesselTypes: 'ALL',
      applicablePurposes: 'ALL',
    };
    onUpdateState((prev) => ({
      ...prev,
      tariffs: [...prev.tariffs, item],
    }));
    setNewTariffCode('');
    setNewTariffConcept('');
    notifySaved(lang === 'es' ? 'Nueva tarifa agregada.' : 'New tariff added.');
  };

  const handleAddPdaFormat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormatName.trim()) return;
    const preset: PdaFormatPreset = {
      id: `fmt-${Date.now()}`,
      portId,
      name: newFormatName.trim(),
      nameEn: newFormatName.trim(),
      vesselType: newFormatVesselType,
      purpose: newFormatPurpose,
      defaultCargo: newFormatCargo.trim() || 'GENERAL CARGO',
      defaultQuantity: Math.max(0, newFormatQty),
      defaultOpsRateMtHr: 150,
      defaultTugsCount: 2,
      defaultTugHours: 1.5,
      defaultMovements: 2,
    };
    onUpdateState((prev) => ({
      ...prev,
      pdaFormats: [...(prev.pdaFormats ?? []), preset],
    }));
    setNewFormatName('');
    notifySaved(lang === 'es' ? 'Formato PDA agregado.' : 'PDA format preset added.');
  };

  const handleDeletePdaFormat = (formatId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      pdaFormats: (prev.pdaFormats ?? []).filter((f) => f.id !== formatId),
    }));
  };

  const handleUpdateOfficeProfile = (patch: Partial<PdaOfficeAndBankProfile>) => {
    const base =
      hubState.pdaOfficeProfile ?? INITIAL_HUB_STATE.pdaOfficeProfile!;
    onUpdateState((prev) => ({
      ...prev,
      pdaOfficeProfile: {
        ...(prev.pdaOfficeProfile ?? base),
        ...patch,
      },
    }));
    notifySaved(lang === 'es' ? 'Datos de oficina y banco guardados.' : 'Office & bank profile saved.');
  };

  // OrgChart & Directory
  const handleUpdateOrgNode = (id: string, patch: Partial<OrgChartNode>) => {
    onUpdateState((prev) => ({
      ...prev,
      orgChart: (prev.orgChart ?? []).map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
    notifySaved(lang === 'es' ? 'Nodo de organigrama actualizado.' : 'Org chart updated.');
  };

  const handleMoveOrgNode = (id: string, dir: -1 | 1) => {
    onUpdateState((prev) => {
      const list = [...(prev.orgChart ?? [])];
      const idx = list.findIndex((n) => n.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= list.length) return prev;
      const [item] = list.splice(idx, 1);
      list.splice(target, 0, item);
      return { ...prev, orgChart: list };
    });
  };

  const handleAddOrgNodeRelative = (refNode: OrgChartNode, mode: 'sibling' | 'child') => {
    const nextLevel =
      mode === 'sibling'
        ? refNode.level
        : (Math.min(3, refNode.level + 1) as 1 | 2 | 3);
    const newNode: OrgChartNode = {
      id: `org-${Date.now()}`,
      level: nextLevel,
      title: mode === 'sibling' ? 'Nueva Jefatura / Posición' : 'Nuevo Subnivel Operativo',
      titleEn: mode === 'sibling' ? 'New Position' : 'New Sub-level Role',
      department: refNode.department,
      departmentEn: refNode.departmentEn,
      holderOrTeam: 'Por asignar',
      holderOrTeamEn: 'To be assigned',
      email: 'ops@iss-shipping.com',
      reportsTo: mode === 'sibling' ? refNode.reportsTo : refNode.id,
      subDepartments: [],
      customFields: [],
    };
    onUpdateState((prev) => {
      const list = [...(prev.orgChart ?? [])];
      const idx = list.findIndex((n) => n.id === refNode.id);
      if (idx === -1) {
        return { ...prev, orgChart: [...list, newNode] };
      }
      list.splice(idx + 1, 0, newNode);
      return { ...prev, orgChart: list };
    });
    notifySaved(
      mode === 'sibling'
        ? lang === 'es'
          ? 'Nodo agregado en la misma línea.'
          : 'Sibling node added.'
        : lang === 'es'
        ? 'Subnodo / subnivel agregado.'
        : 'Child sub-node added.'
    );
  };

  const handleDeleteOrgNode = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      orgChart: (prev.orgChart ?? []).filter((n) => n.id !== id),
    }));
  };

  const handleAddOrgSubDept = (nodeId: string) => {
    const newSub: OrgSubDepartment = {
      id: `sub-${Date.now()}`,
      name: 'Nuevo Subdepartamento',
      nameEn: 'New Sub-department',
      leadOrTeam: 'Responsable / Turno',
      leadOrTeamEn: 'Lead / Team',
      email: '',
      fields: [],
    };
    onUpdateState((prev) => ({
      ...prev,
      orgChart: (prev.orgChart ?? []).map((n) =>
        n.id === nodeId
          ? { ...n, subDepartments: [...(n.subDepartments ?? []), newSub] }
          : n
      ),
    }));
  };

  const handleUpdateOrgSubDept = (
    nodeId: string,
    subId: string,
    patch: Partial<OrgSubDepartment>
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      orgChart: (prev.orgChart ?? []).map((n) =>
        n.id === nodeId
          ? {
              ...n,
              subDepartments: (n.subDepartments ?? []).map((s) =>
                s.id === subId ? { ...s, ...patch } : s
              ),
            }
          : n
      ),
    }));
  };

  const handleDeleteOrgSubDept = (nodeId: string, subId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      orgChart: (prev.orgChart ?? []).map((n) =>
        n.id === nodeId
          ? {
              ...n,
              subDepartments: (n.subDepartments ?? []).filter((s) => s.id !== subId),
            }
          : n
      ),
    }));
  };

  const handleAddOrgCustomField = (nodeId: string, subId?: string) => {
    const field: OrgCustomField = {
      id: `ocf-${Date.now()}`,
      label: 'Campo',
      value: 'Valor',
    };
    onUpdateState((prev) => ({
      ...prev,
      orgChart: (prev.orgChart ?? []).map((n) => {
        if (n.id !== nodeId) return n;
        if (subId) {
          return {
            ...n,
            subDepartments: (n.subDepartments ?? []).map((s) =>
              s.id === subId ? { ...s, fields: [...(s.fields ?? []), field] } : s
            ),
          };
        }
        return { ...n, customFields: [...(n.customFields ?? []), field] };
      }),
    }));
  };

  const handleUpdateOrgCustomField = (
    nodeId: string,
    fieldId: string,
    patch: Partial<OrgCustomField>,
    subId?: string
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      orgChart: (prev.orgChart ?? []).map((n) => {
        if (n.id !== nodeId) return n;
        if (subId) {
          return {
            ...n,
            subDepartments: (n.subDepartments ?? []).map((s) =>
              s.id === subId
                ? {
                    ...s,
                    fields: (s.fields ?? []).map((f) =>
                      f.id === fieldId ? { ...f, ...patch } : f
                    ),
                  }
                : s
            ),
          };
        }
        return {
          ...n,
          customFields: (n.customFields ?? []).map((f) =>
            f.id === fieldId ? { ...f, ...patch } : f
          ),
        };
      }),
    }));
  };

  const handleDeleteOrgCustomField = (nodeId: string, fieldId: string, subId?: string) => {
    onUpdateState((prev) => ({
      ...prev,
      orgChart: (prev.orgChart ?? []).map((n) => {
        if (n.id !== nodeId) return n;
        if (subId) {
          return {
            ...n,
            subDepartments: (n.subDepartments ?? []).map((s) =>
              s.id === subId
                ? { ...s, fields: (s.fields ?? []).filter((f) => f.id !== fieldId) }
                : s
            ),
          };
        }
        return {
          ...n,
          customFields: (n.customFields ?? []).filter((f) => f.id !== fieldId),
        };
      }),
    }));
  };

  const handleUpdateDirectory = (id: string, patch: Partial<DirectoryEntry>) => {
    onUpdateState((prev) => ({
      ...prev,
      directory: prev.directory.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
    notifySaved(lang === 'es' ? 'Contacto actualizado.' : 'Contact updated.');
  };

  const handleDeleteDirectory = (id: string) => {
    onUpdateState((prev) => ({
      ...prev,
      directory: prev.directory.filter((d) => d.id !== id),
    }));
  };

  const handleAddDirectory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirOrg.trim() || !newDirContact.trim()) return;
    const entry: DirectoryEntry = {
      id: `dir-${Date.now()}`,
      portId,
      category: newDirCategory,
      organization: newDirOrg.trim(),
      contactName: newDirContact.trim(),
      role: newDirRole.trim() || 'Contacto Operativo',
      roleEn: newDirRole.trim() || 'Operational Contact',
      email: newDirEmail.trim() || 'ops@iss-shipping.example',
      phone: newDirPhone.trim() || '+52 000 000 0000',
      accessLevel: 'Público Operativo',
      notes: 'Contacto agregado desde Content Manager.',
      notesEn: 'Added via Content Manager.',
    };
    onUpdateState((prev) => ({
      ...prev,
      directory: [...prev.directory, entry],
    }));
    setNewDirOrg('');
    setNewDirContact('');
    setNewDirRole('');
    setNewDirEmail('');
    setNewDirPhone('');
    notifySaved(lang === 'es' ? 'Contacto agregado.' : 'Contact added.');
  };

  // SOPs, Optic, Apps Script
  const handleUpdateProcedure = (id: string, patch: Partial<OperationalProcedure>) => {
    onUpdateState((prev) => ({
      ...prev,
      procedures: prev.procedures.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    notifySaved(lang === 'es' ? 'Protocolo actualizado.' : 'SOP updated.');
  };

  const handleUpdateOptic = (id: string, patch: Partial<OpticConcept>) => {
    onUpdateState((prev) => ({
      ...prev,
      opticGlossary: prev.opticGlossary.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
    notifySaved(lang === 'es' ? 'Término Optic actualizado.' : 'Optic term updated.');
  };

  const handleUpdateAppScript = (id: string, patch: Partial<AppsScriptTool>) => {
    onUpdateState((prev) => ({
      ...prev,
      appsScripts: prev.appsScripts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
    notifySaved(lang === 'es' ? 'Enlace Apps Script guardado.' : 'Apps Script link saved.');
  };

  // Product Technical Dossiers CRUD
  const editingDossier =
    portDossiers.find((d) => d.id === selectedDossierId) ?? portDossiers[0];

  const handleAddProductDossier = () => {
    const newId = `prod-${portId}-${Date.now()}`;
    const newDossier: ProductTechnicalDossier = {
      id: newId,
      portId,
      code: `${activePort.shortCode}-PROD-NEW`,
      name: 'Nuevo Producto Portuario',
      nameEn: 'New Port Commodity',
      cargoGroup: 'Petroquímica y Líquidos',
      unNumber: 'N/A',
      imoClass: 'No peligroso / Por confirmar',
      coatzacoalcosBerths: 'Por asignar',
      concessionaires: 'ASIPONA / Cesionario',
      summary: 'Ficha técnica operativa creada desde Content Manager.',
      summaryEn: 'Operational technical dossier created in Content Manager.',
      identity: 'Identidad química/física del producto portuario.',
      identityEn: 'Chemical/physical identity of port commodity.',
      stateAndHazard: 'Estado de agregación y clasificación de riesgo operativo.',
      stateAndHazardEn: 'Physical state and operational hazard classification.',
      compatibility: 'Verificar compatibilidad con líneas y tanques receptores.',
      compatibilityEn: 'Verify compatibility with receiving lines and tanks.',
      qualityControl: 'Certificado de origen y muestreo inicial de línea/tanque.',
      qualityControlEn: 'Certificate of origin and initial line/tank sampling.',
      temperatureLimits: 'Temperatura ambiente o rango contractual.',
      temperatureLimitsEn: 'Ambient temperature or contractual range.',
      connectionSpecs: 'Brida ANSI 150# o equipo de descarga dedicado.',
      connectionSpecsEn: 'ANSI 150# flange or dedicated transfer gear.',
      transferRates: 'Por confirmar con terminal.',
      transferRatesEn: 'To be confirmed with terminal.',
      stabilityControl: 'Control operativo estándar MARPOL / terminal.',
      stabilityControlEn: 'Standard MARPOL / terminal operational control.',
      terminationProcedure: 'Barrido / drenaje completo al concluir descarga.',
      terminationProcedureEn: 'Complete line draining / purging at completion.',
      rejectionCriteria: 'Contaminación cruzada, fuera de especificación o falla de seguridad.',
      rejectionCriteriaEn: 'Cross-contamination, off-spec parameter or safety non-compliance.',
      referenceSource: 'Content Manager · Registro operativo ISS',
      verificationStatus: 'pending_validation',
    };
    onUpdateState((prev) => ({
      ...prev,
      productDossiers: [newDossier, ...(prev.productDossiers ?? [])],
    }));
    setSelectedDossierId(newId);
    notifySaved(lang === 'es' ? 'Nueva ficha técnica de producto creada.' : 'New product dossier created.');
  };

  const handleUpdateProductDossier = (
    dossierId: string,
    patch: Partial<ProductTechnicalDossier>
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      productDossiers: (prev.productDossiers ?? []).map((d) =>
        d.id === dossierId ? { ...d, ...patch } : d
      ),
    }));
    notifySaved(lang === 'es' ? 'Ficha de producto actualizada.' : 'Product dossier updated.');
  };

  const handleDeleteProductDossier = (dossierId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      productDossiers: (prev.productDossiers ?? []).filter((d) => d.id !== dossierId),
    }));
  };

  const generalInfo = getDefaultGeneralInfo(activePort);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-manager-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#e5e5ea]">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium text-[#0066cc]">
              {lang === 'es'
                ? 'Edición Integral · Datos y Fotografías'
                : 'Master Content & Photo Manager'}
            </p>
            <h3
              id="content-manager-title"
              className="font-display text-[19px] sm:text-[20px] font-semibold text-[#1d1d1f]"
            >
              Content Manager · {activePort.name} ({activePort.shortCode})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onResetSeed();
                notifySaved(
                  lang === 'es'
                    ? 'Datos restaurados a valores base.'
                    : 'Restored default seed data.'
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#424245] bg-[#f5f5f7] hover:bg-[#e5e5ea] rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {lang === 'es' ? 'Restaurar base' : 'Reset defaults'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={lang === 'es' ? 'Cerrar Content Manager' : 'Close Content Manager'}
              className="w-9 h-9 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-[#1d1d1f]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {savedNotice && (
            <div className="px-4 py-2.5 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] text-[13px] font-medium text-[#065f46]">
              {savedNotice}
            </div>
          )}

          {/* 10 Manager Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#f5f5f7] rounded-xl border border-[#e5e5ea]">
            {(
              [
                ['port', lang === 'es' ? 'Puerto y Fotos' : 'Port & Photos'],
                ['weather', lang === 'es' ? 'Clima e Histórico' : 'Weather & History'],
                ['channels', lang === 'es' ? 'Canales / Fondeo / Físicas' : 'Channels & Specs'],
                ['terminals', lang === 'es' ? 'Terminales y Muelles' : 'Terminals & Berths'],
                ['products', lang === 'es' ? 'Productos y Fichas' : 'Products & Sheets'],
                ['restrictions', lang === 'es' ? 'Restricciones' : 'Restrictions'],
                ['services', lang === 'es' ? 'Servicios' : 'Services'],
                ['lineup', lang === 'es' ? 'Line-Up' : 'Line-Up'],
                ['tariffs', lang === 'es' ? 'Tarifas y PDA' : 'Tariffs & PDA'],
                ['authorities', lang === 'es' ? 'Autoridades y Crew' : 'Authorities & Crew'],
                ['directory', lang === 'es' ? 'Organigrama y Dir.' : 'Org & Directory'],
                ['apps', lang === 'es' ? 'SOPs / Optic / Apps' : 'SOPs / Optic / Apps'],
              ] as [ManagerTab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                  tab === id ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* TAB 1: PORT PROFILE & PHOTOS */}
          {tab === 'port' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUploaderField
                  id="cm-hero-photo"
                  label={lang === 'es' ? 'Fotografía Principal (Hero)' : 'Hero Cover Photo'}
                  value={activePort.heroImageUrl}
                  lang={lang}
                  onChange={(heroImageUrl) => handleUpdatePortProfile({ heroImageUrl })}
                />
                <ImageUploaderField
                  id="cm-channel-photo"
                  label={lang === 'es' ? 'Fotografía de Canal / Maniobra' : 'Navigation Channel Photo'}
                  value={activePort.channelImageUrl}
                  lang={lang}
                  onChange={(channelImageUrl) => handleUpdatePortProfile({ channelImageUrl })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cm-port-name" className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Nombre del puerto' : 'Port name'}
                  </label>
                  <input
                    id="cm-port-name"
                    type="text"
                    value={activePort.name}
                    onChange={(e) => handleUpdatePortProfile({ name: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="cm-port-coords" className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Coordenadas oficiales' : 'Official coordinates'}
                  </label>
                  <input
                    id="cm-port-coords"
                    type="text"
                    value={activePort.coordinates}
                    onChange={(e) => handleUpdatePortProfile({ coordinates: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="cm-port-vhf" className="block text-[12px] font-medium text-[#424245] mb-1">
                    VHF
                  </label>
                  <input
                    id="cm-port-vhf"
                    type="text"
                    value={activePort.vhfChannel}
                    onChange={(e) => handleUpdatePortProfile({ vhfChannel: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="cm-port-auth" className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Autoridad portuaria' : 'Port authority'}
                  </label>
                  <input
                    id="cm-port-auth"
                    type="text"
                    value={activePort.authority}
                    onChange={(e) => handleUpdatePortProfile({ authority: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Titular principal (ES)' : 'Hero headline (ES)'}
                  </label>
                  <input
                    type="text"
                    value={activePort.heroHeadline}
                    onChange={(e) => handleUpdatePortProfile({ heroHeadline: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Titular principal (EN)' : 'Hero headline (EN)'}
                  </label>
                  <input
                    type="text"
                    value={activePort.heroHeadlineEn}
                    onChange={(e) => handleUpdatePortProfile({ heroHeadlineEn: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Resumen operativo (ES)' : 'Operational overview (ES)'}
                  </label>
                  <textarea
                    rows={3}
                    value={activePort.overview}
                    onChange={(e) => handleUpdatePortProfile({ overview: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Resumen operativo (EN)' : 'Operational overview (EN)'}
                  </label>
                  <textarea
                    rows={3}
                    value={activePort.overviewEn}
                    onChange={(e) => handleUpdatePortProfile({ overviewEn: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Reglas de operación (ES)' : 'Operating rules (ES)'}
                  </label>
                  <textarea
                    rows={2}
                    value={activePort.operatingRulesSummary ?? ''}
                    onChange={(e) =>
                      handleUpdatePortProfile({ operatingRulesSummary: e.target.value })
                    }
                    className="w-full px-3 py-2 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Reglas de operación (EN)' : 'Operating rules (EN)'}
                  </label>
                  <textarea
                    rows={2}
                    value={activePort.operatingRulesSummaryEn ?? ''}
                    onChange={(e) =>
                      handleUpdatePortProfile({ operatingRulesSummaryEn: e.target.value })
                    }
                    className="w-full px-3 py-2 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
              </div>

              {/* General Info Particulars */}
              <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3">
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es'
                    ? 'Datos Generales (Posición Geográfica / ISPS / Turnos / Festivos)'
                    : 'General Particulars (Geo Position / ISPS / Shifts / Holidays)'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={generalInfo.ispsLevel}
                    onChange={(e) => handleUpdateGeneralInfo({ ispsLevel: e.target.value })}
                    aria-label="ISPS Level"
                    className="px-3 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="text"
                    value={generalInfo.utcOffset}
                    onChange={(e) => handleUpdateGeneralInfo({ utcOffset: e.target.value })}
                    aria-label="UTC Offset"
                    className="px-3 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="url"
                    value={activePort.lineupSourceUrl}
                    onChange={(e) =>
                      handleUpdatePortProfile({ lineupSourceUrl: e.target.value })
                    }
                    aria-label="Official Line-Up URL"
                    className="px-3 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={generalInfo.workingHours}
                    onChange={(e) => handleUpdateGeneralInfo({ workingHours: e.target.value })}
                    aria-label="Working hours ES"
                    className="px-3 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="text"
                    value={generalInfo.workingHoursEn}
                    onChange={(e) =>
                      handleUpdateGeneralInfo({ workingHoursEn: e.target.value })
                    }
                    aria-label="Working hours EN"
                    className="px-3 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEATHER & STATUS HISTORY */}
          {tab === 'weather' && activeWeather && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-4">
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es'
                    ? 'Estatus actual y condiciones meteorológicas (al cambiar estatus se registra automáticamente en el histórico)'
                    : 'Current Port Status & Marine Weather (changing status automatically appends to Status History)'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="cm-wx-status" className="block text-[12px] font-medium text-[#424245] mb-1">
                      {lang === 'es' ? 'Estatus oficial de puerto' : 'Official port status'}
                    </label>
                    <select
                      id="cm-wx-status"
                      value={activeWeather.portStatus}
                      onChange={(e) =>
                        handleUpdateWeather({
                          portStatus: e.target.value as OfficialPortStatus,
                        })
                      }
                      className="w-full px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                    >
                      {OFFICIAL_PORT_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {translatePortStatus(st, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="cm-wx-dir" className="block text-[12px] font-medium text-[#424245] mb-1">
                      {lang === 'es' ? 'Dirección de viento' : 'Wind direction'}
                    </label>
                    <input
                      id="cm-wx-dir"
                      type="text"
                      value={activeWeather.windDirection}
                      onChange={(e) =>
                        handleUpdateWeather({ windDirection: e.target.value })
                      }
                      className="w-full px-3 py-2 text-[13px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="cm-wx-wind" className="block text-[12px] font-medium text-[#424245] mb-1">
                      {lang === 'es' ? 'Velocidad viento (kt)' : 'Wind speed (kt)'}
                    </label>
                    <input
                      id="cm-wx-wind"
                      type="number"
                      value={activeWeather.windKnots}
                      onChange={(e) =>
                        handleUpdateWeather({ windKnots: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 text-[13px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="cm-wx-wave" className="block text-[12px] font-medium text-[#424245] mb-1">
                      {lang === 'es' ? 'Oleaje barra (m)' : 'Bar swell (m)'}
                    </label>
                    <input
                      id="cm-wx-wave"
                      type="number"
                      step="0.1"
                      value={activeWeather.waveHeightM}
                      onChange={(e) =>
                        handleUpdateWeather({ waveHeightM: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 text-[13px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="cm-wx-curr" className="block text-[12px] font-medium text-[#424245] mb-1">
                      {lang === 'es' ? 'Corriente río/acceso (kt)' : 'Bar current (kt)'}
                    </label>
                    <input
                      id="cm-wx-curr"
                      type="number"
                      step="0.1"
                      value={activeWeather.barCurrentKnots}
                      onChange={(e) =>
                        handleUpdateWeather({
                          barCurrentKnots: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 text-[13px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="cm-wx-url" className="block text-[12px] font-medium text-[#424245] mb-1">
                      {lang === 'es' ? 'URL Sistema Meteorológico' : 'Weather System URL'}
                    </label>
                    <input
                      id="cm-wx-url"
                      type="url"
                      value={activeWeather.externalWeatherUrl}
                      onChange={(e) =>
                        handleUpdateWeather({ externalWeatherUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#424245] mb-1">
                      {lang === 'es' ? 'Aviso operativo (ES)' : 'Operational advisory (ES)'}
                    </label>
                    <textarea
                      rows={2}
                      value={activeWeather.advisory}
                      onChange={(e) => handleUpdateWeather({ advisory: e.target.value })}
                      className="w-full px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#424245] mb-1">
                      {lang === 'es' ? 'Aviso operativo (EN)' : 'Operational advisory (EN)'}
                    </label>
                    <textarea
                      rows={2}
                      value={activeWeather.advisoryEn}
                      onChange={(e) => handleUpdateWeather({ advisoryEn: e.target.value })}
                      className="w-full px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Status History Log */}
              <div className="space-y-2.5">
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es'
                    ? `Histórico de Cierres y Aperturas (${portHistory.length} / 10 máx.)`
                    : `Port Closures & Openings History (${portHistory.length} / 10 max)`}
                </div>
                <div className="divide-y divide-[#e5e5ea] border border-[#e5e5ea] rounded-xl overflow-hidden">
                  {portHistory.map((ev) => (
                    <div key={ev.id} className="p-3.5 bg-white space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          aria-label="Event status"
                          value={ev.status}
                          onChange={(e) => {
                            const next = e.target.value as OfficialPortStatus;
                            const meta = PORT_STATUS_META[next];
                            handleUpdateStatusEvent(ev.id, {
                              status: next,
                              navigationScope: meta.scopeEs,
                              navigationScopeEn: meta.scopeEn,
                            });
                          }}
                          className="px-2.5 py-1 text-[12px] font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                        >
                          {OFFICIAL_PORT_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {translatePortStatus(st, lang)}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={ev.timestamp}
                          onChange={(e) =>
                            handleUpdateStatusEvent(ev.id, { timestamp: e.target.value })
                          }
                          aria-label="Timestamp"
                          className="w-36 px-2.5 py-1 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteStatusEvent(ev.id)}
                          aria-label="Delete event"
                          className="ml-auto p-1.5 text-[#6e6e73] hover:text-[#dc2626] rounded-md hover:bg-[#fef2f2]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={lang === 'es' ? ev.navigationScope : ev.navigationScopeEn}
                        onChange={(e) =>
                          handleUpdateStatusEvent(
                            ev.id,
                            lang === 'es'
                              ? { navigationScope: e.target.value }
                              : { navigationScopeEn: e.target.value }
                          )
                        }
                        aria-label="Navigation scope"
                        className="w-full px-2.5 py-1 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHANNELS, ANCHORAGES & PHYSICAL SPECS */}
          {tab === 'channels' && (
            <div className="space-y-6">
              {/* Channels */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-[#1d1d1f]">
                    {lang === 'es'
                      ? `Canales y Dársenas de Ciaboga (${activePort.channels.length})`
                      : `Navigation Channels & Turning Basins (${activePort.channels.length})`}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddChannel}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-white bg-[#0066cc] rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {lang === 'es' ? 'Agregar canal' : 'Add channel'}
                  </button>
                </div>
                <div className="space-y-2.5">
                  {activePort.channels.map((ch) => (
                    <div
                      key={ch.id}
                      className="p-3.5 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                        <input
                          type="text"
                          value={ch.name}
                          onChange={(e) =>
                            handleUpdateChannel(ch.id, { name: e.target.value })
                          }
                          aria-label="Channel name ES"
                          className="sm:col-span-2 px-2.5 py-1.5 text-[12px] font-medium bg-white border border-[#d2d2d7] rounded-md"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={ch.lengthNm}
                          onChange={(e) =>
                            handleUpdateChannel(ch.id, {
                              lengthNm: Number(e.target.value) || 0,
                            })
                          }
                          aria-label="Length NM"
                          className="px-2.5 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                        />
                        <input
                          type="number"
                          value={ch.widthM}
                          onChange={(e) =>
                            handleUpdateChannel(ch.id, {
                              widthM: Number(e.target.value) || 0,
                            })
                          }
                          aria-label="Width meters"
                          className="px-2.5 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={ch.operationalDraftM}
                          onChange={(e) =>
                            handleUpdateChannel(ch.id, {
                              operationalDraftM: Number(e.target.value) || 0,
                            })
                          }
                          aria-label="Operational Draft m"
                          className="px-2.5 py-1.5 text-[12px] font-mono font-semibold bg-white border border-[#d2d2d7] rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteChannel(ch.id)}
                          aria-label="Delete channel"
                          className="justify-self-end p-1.5 text-[#6e6e73] hover:text-[#dc2626]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={lang === 'es' ? ch.squatAllowanceNote : ch.squatAllowanceNoteEn ?? ch.squatAllowanceNote}
                        onChange={(e) =>
                          handleUpdateChannel(
                            ch.id,
                            lang === 'es'
                              ? { squatAllowanceNote: e.target.value }
                              : { squatAllowanceNoteEn: e.target.value }
                          )
                        }
                        aria-label="Channel notes"
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Anchorages */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-[#1d1d1f]">
                    {lang === 'es'
                      ? `Zonas de Fondeo Autorizadas (${(activePort.anchorageZones ?? []).length})`
                      : `Authorized Anchorage Zones (${(activePort.anchorageZones ?? []).length})`}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAnchorage}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {lang === 'es' ? 'Agregar fondeo' : 'Add anchorage'}
                  </button>
                </div>
                <div className="space-y-2">
                  {(activePort.anchorageZones ?? []).map((az) => (
                    <div
                      key={az.id}
                      className="p-3 rounded-xl border border-[#e5e5ea] bg-white grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={az.name}
                        onChange={(e) =>
                          handleUpdateAnchorage(az.id, { name: e.target.value })
                        }
                        aria-label="Anchorage name"
                        className="sm:col-span-3 px-2.5 py-1.5 text-[12px] font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                      />
                      <input
                        type="text"
                        value={az.purpose}
                        onChange={(e) =>
                          handleUpdateAnchorage(az.id, { purpose: e.target.value })
                        }
                        aria-label="Anchorage purpose"
                        className="sm:col-span-3 px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                      />
                      <input
                        type="text"
                        value={az.coordinates}
                        onChange={(e) =>
                          handleUpdateAnchorage(az.id, { coordinates: e.target.value })
                        }
                        aria-label="Anchorage coords"
                        className="sm:col-span-3 px-2.5 py-1.5 text-[11px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                      />
                      <input
                        type="text"
                        value={az.depthM ?? ''}
                        onChange={(e) =>
                          handleUpdateAnchorage(az.id, { depthM: e.target.value })
                        }
                        aria-label="Anchorage depth"
                        className="sm:col-span-2 px-2.5 py-1.5 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteAnchorage(az.id)}
                        aria-label="Delete anchorage"
                        className="sm:col-span-1 justify-self-end p-1.5 text-[#6e6e73] hover:text-[#dc2626]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical Specs */}
              <div className="space-y-2.5">
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es'
                    ? `Tabla de Restricciones Físicas y Operativas (${activePhysicalSpecs.length})`
                    : `Physical & Operational Navigation Parameters (${activePhysicalSpecs.length})`}
                </div>
                <div className="space-y-2">
                  {activePhysicalSpecs.map((spec) => (
                    <div
                      key={spec.id}
                      className="p-3 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={lang === 'es' ? spec.label : spec.labelEn}
                        onChange={(e) =>
                          handleUpdatePhysicalSpec(
                            spec.id,
                            lang === 'es'
                              ? { label: e.target.value }
                              : { labelEn: e.target.value }
                          )
                        }
                        aria-label="Spec label"
                        className="sm:col-span-3 px-2.5 py-1.5 text-[12px] font-medium bg-white border border-[#d2d2d7] rounded-md"
                      />
                      <input
                        type="text"
                        value={lang === 'es' ? spec.value : spec.valueEn}
                        onChange={(e) =>
                          handleUpdatePhysicalSpec(
                            spec.id,
                            lang === 'es'
                              ? { value: e.target.value }
                              : { valueEn: e.target.value }
                          )
                        }
                        aria-label="Spec value"
                        className="sm:col-span-3 px-2.5 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                      />
                      <input
                        type="text"
                        value={lang === 'es' ? spec.remarks : spec.remarksEn}
                        onChange={(e) =>
                          handleUpdatePhysicalSpec(
                            spec.id,
                            lang === 'es'
                              ? { remarks: e.target.value }
                              : { remarksEn: e.target.value }
                          )
                        }
                        aria-label="Spec remarks"
                        className="sm:col-span-5 px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePhysicalSpec(spec.id)}
                        aria-label="Delete spec"
                        className="sm:col-span-1 justify-self-end p-1.5 text-[#6e6e73] hover:text-[#dc2626]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TERMINALS, PHOTOS & BERTHS */}
          {tab === 'terminals' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <label htmlFor="cm-select-term" className="text-[12px] font-semibold text-[#1d1d1f] shrink-0">
                    {lang === 'es' ? 'Editar terminal:' : 'Select terminal:'}
                  </label>
                  <select
                    id="cm-select-term"
                    value={editingTerminal?.id ?? ''}
                    onChange={(e) => setSelectedEditTermId(e.target.value)}
                    className="w-full max-w-md px-3 py-2 text-[13px] font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  >
                    {portTerminals.map((t) => (
                      <option key={t.id} value={t.id}>
                        {lang === 'es' ? t.name : t.nameEn ?? t.name} ({t.berths.length} {lang === 'es' ? 'muelles' : 'berths'})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewTermForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === 'es' ? 'Nueva terminal' : 'Add new terminal'}
                </button>
              </div>

              {showNewTermForm && (
                <form
                  onSubmit={handleAddTerminal}
                  className="p-4 rounded-xl bg-[#f0f7ff] border border-[#bae6fd] space-y-3"
                >
                  <div className="text-[13px] font-semibold text-[#0369a1]">
                    {lang === 'es' ? 'Alta de nueva terminal' : 'Register new terminal'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={termName}
                      onChange={(e) => setTermName(e.target.value)}
                      placeholder={lang === 'es' ? 'Nombre de terminal' : 'Terminal name'}
                      className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                    />
                    <input
                      type="text"
                      required
                      value={termOperator}
                      onChange={(e) => setTermOperator(e.target.value)}
                      placeholder={lang === 'es' ? 'Operador' : 'Operator'}
                      className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                    />
                    <select
                      value={termAreaId}
                      onChange={(e) => setTermAreaId(e.target.value)}
                      aria-label="Port area"
                      className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                    >
                      {portAreas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {lang === 'es' ? a.name : a.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={termBerthName}
                      onChange={(e) => setTermBerthName(e.target.value)}
                      placeholder="Muelle 1"
                      className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                    />
                    <input
                      type="number"
                      value={termMaxLoa}
                      onChange={(e) => setTermMaxLoa(Number(e.target.value) || 180)}
                      placeholder="Max LOA"
                      className="px-3 py-2 text-[13px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={termMaxDraft}
                      onChange={(e) => setTermMaxDraft(Number(e.target.value) || 11)}
                      placeholder="Max Draft"
                      className="px-3 py-2 text-[13px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                    />
                    <input
                      type="text"
                      value={termProducts}
                      onChange={(e) => setTermProducts(e.target.value)}
                      placeholder="Productos..."
                      className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 text-[13px] font-medium text-white bg-[#1d1d1f] rounded-lg"
                  >
                    {lang === 'es' ? 'Publicar terminal' : 'Publish terminal'}
                  </button>
                </form>
              )}

              {editingTerminal && (
                <div className="p-4 rounded-xl border border-[#e5e5ea] bg-white space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e5e5ea]">
                    <div className="text-[14px] font-semibold text-[#1d1d1f]">
                      {editingTerminal.name}
                    </div>
                    {portTerminals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTerminal(editingTerminal.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] text-[#b91c1c] hover:bg-[#fef2f2] rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {lang === 'es' ? 'Eliminar terminal' : 'Delete terminal'}
                      </button>
                    )}
                  </div>

                  <ImageUploaderField
                    id={`cm-term-photo-${editingTerminal.id}`}
                    label={lang === 'es' ? 'Fotografía de esta Terminal / Minisitio' : 'Terminal Mini-Site Photo'}
                    value={editingTerminal.imageUrl}
                    lang={lang}
                    onChange={(imageUrl) =>
                      handleUpdateTerminal(editingTerminal.id, { imageUrl })
                    }
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Nombre (ES)' : 'Name (ES)'}
                      </label>
                      <input
                        type="text"
                        value={editingTerminal.name}
                        onChange={(e) =>
                          handleUpdateTerminal(editingTerminal.id, { name: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Nombre (EN)' : 'Name (EN)'}
                      </label>
                      <input
                        type="text"
                        value={editingTerminal.nameEn ?? editingTerminal.name}
                        onChange={(e) =>
                          handleUpdateTerminal(editingTerminal.id, { nameEn: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Operador' : 'Operator'}
                      </label>
                      <input
                        type="text"
                        value={editingTerminal.operator}
                        onChange={(e) =>
                          handleUpdateTerminal(editingTerminal.id, { operator: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Coordenadas' : 'Coordinates'}
                      </label>
                      <input
                        type="text"
                        value={editingTerminal.coordinates}
                        onChange={(e) =>
                          handleUpdateTerminal(editingTerminal.id, { coordinates: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">Map X (%)</label>
                      <input
                        type="number"
                        value={editingTerminal.mapX}
                        onChange={(e) =>
                          handleUpdateTerminal(editingTerminal.id, {
                            mapX: Number(e.target.value) || 50,
                          })
                        }
                        className="w-full px-3 py-1.5 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">Map Y (%)</label>
                      <input
                        type="number"
                        value={editingTerminal.mapY}
                        onChange={(e) =>
                          handleUpdateTerminal(editingTerminal.id, {
                            mapY: Number(e.target.value) || 50,
                          })
                        }
                        className="w-full px-3 py-1.5 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Recinto' : 'Area'}
                      </label>
                      <select
                        value={editingTerminal.areaId}
                        onChange={(e) =>
                          handleUpdateTerminal(editingTerminal.id, { areaId: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      >
                        {portAreas.map((a) => (
                          <option key={a.id} value={a.id}>
                            {lang === 'es' ? a.name : a.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <textarea
                      rows={2}
                      value={editingTerminal.shortDesc}
                      onChange={(e) =>
                        handleUpdateTerminal(editingTerminal.id, { shortDesc: e.target.value })
                      }
                      aria-label="Short description ES"
                      className="px-3 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                    />
                    <textarea
                      rows={2}
                      value={editingTerminal.shortDescEn}
                      onChange={(e) =>
                        handleUpdateTerminal(editingTerminal.id, {
                          shortDescEn: e.target.value,
                        })
                      }
                      aria-label="Short description EN"
                      className="px-3 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                    />
                  </div>

                  {/* Commercial Profile & Storage Summary Editor */}
                  <div className="pt-2 border-t border-[#e5e5ea]">
                    <button
                      type="button"
                      onClick={() => setShowCommercialEditor((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#042447] bg-[#eef8fd] hover:bg-[#dceffb] border border-[#b9e3f9] rounded-lg transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#0066cc]" />
                      {showCommercialEditor
                        ? lang === 'es'
                          ? 'Ocultar Perfil Comercial, Aduana y Almacenaje'
                          : 'Hide Commercial Profile, Customs & Storage'
                        : lang === 'es'
                        ? 'Editar Perfil Comercial, Aduana, Conectividad y Almacenaje'
                        : 'Edit Commercial Profile, Customs, Connectivity & Storage'}
                      {showCommercialEditor ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {showCommercialEditor && (
                      <div className="mt-3 p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-4">
                        <div className="text-[12px] font-semibold text-[#1d1d1f]">
                          {lang === 'es'
                            ? 'Almacenaje y Patios (m²)'
                            : 'Storage & Yard Footprint (m²)'}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                              {lang === 'es' ? 'Bodegas Techadas (m²)' : 'Covered Warehouses (m²)'}
                            </label>
                            <input
                              type="number"
                              value={editingTerminal.storageSummary?.coveredSqm ?? 0}
                              onChange={(e) =>
                                handleUpdateTerminalStorage(editingTerminal.id, {
                                  coveredSqm: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2.5 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                              {lang === 'es' ? 'Patios Abiertos (m²)' : 'Open Yards (m²)'}
                            </label>
                            <input
                              type="number"
                              value={editingTerminal.storageSummary?.openYardSqm ?? 0}
                              onChange={(e) =>
                                handleUpdateTerminalStorage(editingTerminal.id, {
                                  openYardSqm: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2.5 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                              {lang === 'es' ? 'Patio Contenedores (m²)' : 'Container Yard (m²)'}
                            </label>
                            <input
                              type="number"
                              value={editingTerminal.storageSummary?.containerYardSqm ?? 0}
                              onChange={(e) =>
                                handleUpdateTerminalStorage(editingTerminal.id, {
                                  containerYardSqm: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2.5 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <textarea
                            rows={2}
                            value={editingTerminal.storageSummary?.warehousesBreakdown ?? ''}
                            onChange={(e) =>
                              handleUpdateTerminalStorage(editingTerminal.id, {
                                warehousesBreakdown: e.target.value,
                              })
                            }
                            placeholder={lang === 'es' ? 'Detalle de almacenaje (ES)' : 'Storage breakdown (ES)'}
                            className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                          />
                          <textarea
                            rows={2}
                            value={editingTerminal.storageSummary?.warehousesBreakdownEn ?? ''}
                            onChange={(e) =>
                              handleUpdateTerminalStorage(editingTerminal.id, {
                                warehousesBreakdownEn: e.target.value,
                              })
                            }
                            placeholder={lang === 'es' ? 'Detalle de almacenaje (EN)' : 'Storage breakdown (EN)'}
                            className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                          />
                        </div>

                        <div className="pt-3 border-t border-[#d2d2d7]/70 space-y-2.5">
                          <div className="text-[12px] font-semibold text-[#1d1d1f]">
                            {lang === 'es'
                              ? 'Perfil Comercial, Aduana y Conectividad'
                              : 'Commercial Profile, Customs & Connectivity'}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={editingTerminal.commercialProfile?.positioningHeadline ?? ''}
                              onChange={(e) =>
                                handleUpdateTerminalCommercial(editingTerminal.id, {
                                  positioningHeadline: e.target.value,
                                })
                              }
                              placeholder={lang === 'es' ? 'Titular comercial (ES)' : 'Positioning headline (ES)'}
                              className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                            />
                            <input
                              type="text"
                              value={editingTerminal.commercialProfile?.positioningHeadlineEn ?? ''}
                              onChange={(e) =>
                                handleUpdateTerminalCommercial(editingTerminal.id, {
                                  positioningHeadlineEn: e.target.value,
                                })
                              }
                              placeholder={lang === 'es' ? 'Titular comercial (EN)' : 'Positioning headline (EN)'}
                              className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                            />
                            <input
                              type="text"
                              value={editingTerminal.commercialProfile?.customsRegime ?? ''}
                              onChange={(e) =>
                                handleUpdateTerminalCommercial(editingTerminal.id, {
                                  customsRegime: e.target.value,
                                })
                              }
                              placeholder={lang === 'es' ? 'Régimen aduanal (ES)' : 'Customs regime (ES)'}
                              className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                            />
                            <input
                              type="text"
                              value={editingTerminal.commercialProfile?.customsRegimeEn ?? ''}
                              onChange={(e) =>
                                handleUpdateTerminalCommercial(editingTerminal.id, {
                                  customsRegimeEn: e.target.value,
                                })
                              }
                              placeholder={lang === 'es' ? 'Régimen aduanal (EN)' : 'Customs regime (EN)'}
                              className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                            />
                          </div>

                          <input
                            type="text"
                            value={editingTerminal.commercialProfile?.address ?? ''}
                            onChange={(e) =>
                              handleUpdateTerminalCommercial(editingTerminal.id, {
                                address: e.target.value,
                              })
                            }
                            placeholder={lang === 'es' ? 'Dirección física de la terminal' : 'Physical terminal address'}
                            className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <textarea
                              rows={2}
                              value={editingTerminal.commercialProfile?.connectivity ?? ''}
                              onChange={(e) =>
                                handleUpdateTerminalCommercial(editingTerminal.id, {
                                  connectivity: e.target.value,
                                })
                              }
                              placeholder={lang === 'es' ? 'Conectividad multimodal (ES)' : 'Connectivity (ES)'}
                              className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                            />
                            <textarea
                              rows={2}
                              value={editingTerminal.commercialProfile?.connectivityEn ?? ''}
                              onChange={(e) =>
                                handleUpdateTerminalCommercial(editingTerminal.id, {
                                  connectivityEn: e.target.value,
                                })
                              }
                              placeholder={lang === 'es' ? 'Conectividad multimodal (EN)' : 'Connectivity (EN)'}
                              className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Servicios comerciales (ES · uno por línea)'
                                  : 'Commercial services (ES · one per line)'}
                              </label>
                              <textarea
                                rows={3}
                                value={(editingTerminal.commercialProfile?.commercialServices ?? []).join('\n')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    commercialServices: e.target.value
                                      .split('\n')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Servicios comerciales (EN · uno por línea)'
                                  : 'Commercial services (EN · one per line)'}
                              </label>
                              <textarea
                                rows={3}
                                value={(editingTerminal.commercialProfile?.commercialServicesEn ?? []).join('\n')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    commercialServicesEn: e.target.value
                                      .split('\n')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>

                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Infraestructura clave (ES · uno por línea)'
                                  : 'Infrastructure highlights (ES · one per line)'}
                              </label>
                              <textarea
                                rows={3}
                                value={(editingTerminal.commercialProfile?.infrastructureHighlights ?? []).join('\n')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    infrastructureHighlights: e.target.value
                                      .split('\n')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Infraestructura clave (EN · uno por línea)'
                                  : 'Infrastructure highlights (EN · one per line)'}
                              </label>
                              <textarea
                                rows={3}
                                value={(editingTerminal.commercialProfile?.infrastructureHighlightsEn ?? []).join('\n')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    infrastructureHighlightsEn: e.target.value
                                      .split('\n')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>

                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Embarcaciones atendidas (ES · una por línea)'
                                  : 'Vessel types served (ES · one per line)'}
                              </label>
                              <textarea
                                rows={2}
                                value={(editingTerminal.commercialProfile?.vesselTypesServed ?? []).join('\n')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    vesselTypesServed: e.target.value
                                      .split('\n')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Embarcaciones atendidas (EN · una por línea)'
                                  : 'Vessel types served (EN · one per line)'}
                              </label>
                              <textarea
                                rows={2}
                                value={(editingTerminal.commercialProfile?.vesselTypesServedEn ?? []).join('\n')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    vesselTypesServedEn: e.target.value
                                      .split('\n')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>

                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Flujo aduanal / pasos (ES · uno por línea)'
                                  : 'Customs clearance steps (ES · one per line)'}
                              </label>
                              <textarea
                                rows={2}
                                value={(editingTerminal.commercialProfile?.customsProcess ?? []).join('\n')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    customsProcess: e.target.value
                                      .split('\n')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Flujo aduanal / pasos (EN · uno por línea)'
                                  : 'Customs clearance steps (EN · one per line)'}
                              </label>
                              <textarea
                                rows={2}
                                value={(editingTerminal.commercialProfile?.customsProcessEn ?? []).join('\n')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    customsProcessEn: e.target.value
                                      .split('\n')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>

                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Ventajas operativas (ES · una por línea)'
                                  : 'Operational advantages (ES · one per line)'}
                              </label>
                              <textarea
                                rows={2}
                                value={(editingTerminal.commercialProfile?.operationalAdvantages ?? []).join('\n')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    operationalAdvantages: e.target.value
                                      .split('\n')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Ventajas operativas (EN · una por línea)'
                                  : 'Operational advantages (EN · one per line)'}
                              </label>
                              <textarea
                                rows={2}
                                value={(editingTerminal.commercialProfile?.operationalAdvantagesEn ?? []).join('\n')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    operationalAdvantagesEn: e.target.value
                                      .split('\n')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Clientes / Líneas clave (separados por coma)'
                                  : 'Key clients / lines (comma-separated)'}
                              </label>
                              <input
                                type="text"
                                value={(editingTerminal.commercialProfile?.keyClientsOrTrades ?? []).join(', ')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    keyClientsOrTrades: e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] text-[#6e6e73] mb-0.5">
                                {lang === 'es'
                                  ? 'Certificaciones (separadas por coma)'
                                  : 'Certifications (comma-separated)'}
                              </label>
                              <input
                                type="text"
                                value={(editingTerminal.commercialProfile?.certifications ?? []).join(', ')}
                                onChange={(e) =>
                                  handleUpdateTerminalCommercial(editingTerminal.id, {
                                    certifications: e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Berths inside Terminal */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-[#1d1d1f]">
                        {lang === 'es'
                          ? `Muelles / Posiciones de atraque (${editingTerminal.berths.length})`
                          : `Berths / Positions (${editingTerminal.berths.length})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddBerthToTerminal(editingTerminal.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-md"
                      >
                        <Plus className="w-3 h-3" />
                        {lang === 'es' ? 'Agregar muelle' : 'Add berth'}
                      </button>
                    </div>
                    {editingTerminal.berths.map((berth) => (
                      <div
                        key={berth.id}
                        className="p-3 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] space-y-2"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
                          <input
                            type="text"
                            value={berth.name}
                            onChange={(e) =>
                              handleUpdateBerth(editingTerminal.id, berth.id, {
                                name: e.target.value,
                              })
                            }
                            aria-label="Berth name"
                            className="col-span-2 px-2.5 py-1 text-[12px] font-medium bg-white border border-[#d2d2d7] rounded-md"
                          />
                          <input
                            type="number"
                            value={berth.maxLoaM}
                            onChange={(e) =>
                              handleUpdateBerth(editingTerminal.id, berth.id, {
                                maxLoaM: Number(e.target.value) || 0,
                              })
                            }
                            aria-label="Berth Max LOA"
                            title="Max LOA (m)"
                            className="px-2.5 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                          />
                          <input
                            type="number"
                            value={berth.maxBeamM}
                            onChange={(e) =>
                              handleUpdateBerth(editingTerminal.id, berth.id, {
                                maxBeamM: Number(e.target.value) || 0,
                              })
                            }
                            aria-label="Berth Max Beam"
                            title="Max Beam (m)"
                            className="px-2.5 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={berth.maxDraftM}
                            onChange={(e) =>
                              handleUpdateBerth(editingTerminal.id, berth.id, {
                                maxDraftM: Number(e.target.value) || 0,
                              })
                            }
                            aria-label="Berth Max Draft"
                            title="Max Draft (m)"
                            className="px-2.5 py-1 text-[12px] font-mono font-semibold bg-white border border-[#d2d2d7] rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteBerthFromTerminal(editingTerminal.id, berth.id)
                            }
                            aria-label="Delete berth"
                            className="justify-self-end p-1 text-[#6e6e73] hover:text-[#dc2626]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={berth.products.join(', ')}
                            onChange={(e) =>
                              handleUpdateBerth(editingTerminal.id, berth.id, {
                                products: e.target.value
                                  .split(',')
                                  .map((x) => x.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="Productos (separados por coma)"
                            aria-label="Berth products"
                            className="px-2.5 py-1 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                          />
                          <input
                            type="text"
                            value={berth.loadingRate}
                            onChange={(e) =>
                              handleUpdateBerth(editingTerminal.id, berth.id, {
                                loadingRate: e.target.value,
                              })
                            }
                            placeholder="Rendimiento / Loading Rate"
                            aria-label="Loading rate"
                            className="px-2.5 py-1 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={
                              lang === 'es'
                                ? berth.muellajeTariff ?? ''
                                : berth.muellajeTariffEn ?? berth.muellajeTariff ?? ''
                            }
                            onChange={(e) =>
                              handleUpdateBerth(
                                editingTerminal.id,
                                berth.id,
                                lang === 'es'
                                  ? { muellajeTariff: e.target.value }
                                  : { muellajeTariffEn: e.target.value }
                              )
                            }
                            placeholder={lang === 'es' ? 'Tarifa de muellaje' : 'Wharfage tariff'}
                            aria-label="Berth wharfage tariff"
                            className="px-2.5 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                          />
                          <input
                            type="text"
                            value={
                              lang === 'es'
                                ? berth.restrictions ?? ''
                                : berth.restrictionsEn ?? berth.restrictions ?? ''
                            }
                            onChange={(e) =>
                              handleUpdateBerth(
                                editingTerminal.id,
                                berth.id,
                                lang === 'es'
                                  ? { restrictions: e.target.value }
                                  : { restrictionsEn: e.target.value }
                              )
                            }
                            placeholder={
                              lang === 'es' ? 'Restricciones del muelle' : 'Berth restrictions'
                            }
                            aria-label="Berth restrictions"
                            className="px-2.5 py-1 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                          />
                          <input
                            type="text"
                            value={
                              lang === 'es'
                                ? berth.maneuvers ?? ''
                                : berth.maneuversEn ?? berth.maneuvers ?? ''
                            }
                            onChange={(e) =>
                              handleUpdateBerth(editingTerminal.id, berth.id, {
                                ...(lang === 'es'
                                  ? { maneuvers: e.target.value }
                                  : { maneuversEn: e.target.value }),
                              })
                            }
                            placeholder={lang === 'es' ? 'Maniobras operativas' : 'Maneuvers'}
                            aria-label="Berth maneuvers"
                            className="px-2.5 py-1 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                          />
                        </div>

                        {/* Expand / Edit Visual Pier Specification Sheet + Photo */}
                        <div className="pt-2 border-t border-[#d2d2d7]/60">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!berth.pierSheet) {
                                  handleEnsurePierSheet(editingTerminal.id, berth.id);
                                } else {
                                  setExpandedPierSheetBerthId((prev) =>
                                    prev === berth.id ? null : berth.id
                                  );
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold text-[#042447] bg-[#eef8fd] hover:bg-[#dceffb] border border-[#b9e3f9] rounded-md transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#0066cc]" />
                              {berth.pierSheet
                                ? expandedPierSheetBerthId === berth.id
                                  ? lang === 'es'
                                    ? 'Ocultar Editor de Ficha Visual y Foto'
                                    : 'Hide Visual Pier Sheet & Photo Editor'
                                  : lang === 'es'
                                  ? `Editar Ficha Visual y Foto (${berth.pierSheet.pierNumber} ${berth.pierSheet.pierTitle} ${berth.pierSheet.pierSide})`
                                  : `Edit Visual Pier Sheet & Photo (${berth.pierSheet.pierNumber} ${berth.pierSheet.pierTitle})`
                                : lang === 'es'
                                ? 'Crear / Editar Ficha Visual Individual y Foto'
                                : 'Create / Edit Individual Pier Sheet & Photo'}
                              {expandedPierSheetBerthId === berth.id ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {berth.pierSheet && expandedPierSheetBerthId === berth.id && (
                            <div className="mt-3 p-4 rounded-xl bg-white border border-[#b9e3f9] space-y-4">
                              <ImageUploaderField
                                id={`cm-pier-photo-${berth.id}`}
                                label={
                                  lang === 'es'
                                    ? `Fotografía Individual de Ficha: ${berth.pierSheet.pierNumber} ${berth.pierSheet.pierTitle} ${berth.pierSheet.pierSide}`
                                    : `Individual Berth Sheet Photo: ${berth.pierSheet.pierNumber} ${berth.pierSheet.pierTitle}`
                                }
                                value={berth.pierSheet.bannerImageUrl ?? editingTerminal.imageUrl}
                                lang={lang}
                                onChange={(bannerImageUrl) =>
                                  handleUpdatePierSheet(editingTerminal.id, berth.id, {
                                    bannerImageUrl,
                                  })
                                }
                              />

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div>
                                  <label className="block text-[10.5px] text-[#6e6e73] mb-1">
                                    Pier # (ej. 01, 05)
                                  </label>
                                  <input
                                    type="text"
                                    value={berth.pierSheet.pierNumber}
                                    onChange={(e) =>
                                      handleUpdatePierSheet(editingTerminal.id, berth.id, {
                                        pierNumber: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-[12px] font-mono font-bold bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10.5px] text-[#6e6e73] mb-1">
                                    Pier Title (ej. Pier 1 / Marginal 5)
                                  </label>
                                  <input
                                    type="text"
                                    value={berth.pierSheet.pierTitle}
                                    onChange={(e) =>
                                      handleUpdatePierSheet(editingTerminal.id, berth.id, {
                                        pierTitle: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-[12px] font-semibold bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10.5px] text-[#6e6e73] mb-1">
                                    Side / Label (ej. East Side)
                                  </label>
                                  <input
                                    type="text"
                                    value={berth.pierSheet.pierSide}
                                    onChange={(e) =>
                                      handleUpdatePierSheet(editingTerminal.id, berth.id, {
                                        pierSide: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10.5px] text-[#6e6e73] mb-1">
                                    Subtitle
                                  </label>
                                  <input
                                    type="text"
                                    value={berth.pierSheet.subtitle}
                                    onChange={(e) =>
                                      handleUpdatePierSheet(editingTerminal.id, berth.id, {
                                        subtitle: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[10.5px] text-[#6e6e73] mb-1">
                                    B.C.M. height note (optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={berth.pierSheet.bcmMaxHeightNote ?? ''}
                                    onChange={(e) =>
                                      handleUpdatePierSheet(editingTerminal.id, berth.id, {
                                        bcmMaxHeightNote: e.target.value,
                                      })
                                    }
                                    placeholder="B.C.M. maximum height: 11.40 m."
                                    className="w-full px-2.5 py-1 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10.5px] text-[#6e6e73] mb-1">
                                    Measurement note
                                  </label>
                                  <input
                                    type="text"
                                    value={berth.pierSheet.measurementNote}
                                    onChange={(e) =>
                                      handleUpdatePierSheet(editingTerminal.id, berth.id, {
                                        measurementNote: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                                  />
                                </div>
                              </div>

                              {/* 8 Navigation Parameters */}
                              <div>
                                <div className="text-[11px] font-semibold text-[#042447] mb-1.5">
                                  Navigation Parameters (8 cards)
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {(
                                    [
                                      ['maxDwt', 'Max DWT'],
                                      ['maxDisplacement', 'Max Displacement'],
                                      ['berthingVelocity', 'Berthing Velocity'],
                                      ['maxTransverseWindage', 'Transverse Windage'],
                                      ['maxLongitudinalWindage', 'Longitudinal Windage'],
                                      ['operatingDraftDisplay', 'Operating Draft'],
                                      ['maxAcceptedLoa', 'Max LOA'],
                                      ['maxAcceptedBeam', 'Max Beam'],
                                    ] as [keyof PierSpecificationSheet, string][]
                                  ).map(([fieldKey, fieldLabel]) => (
                                    <div key={fieldKey}>
                                      <label className="block text-[10px] text-[#6e6e73] mb-0.5">
                                        {fieldLabel}
                                      </label>
                                      <input
                                        type="text"
                                        value={String(berth.pierSheet?.[fieldKey] ?? '')}
                                        onChange={(e) =>
                                          handleUpdatePierSheet(editingTerminal.id, berth.id, {
                                            [fieldKey]: e.target.value,
                                          })
                                        }
                                        className="w-full px-2 py-1 text-[12px] font-mono font-semibold bg-[#eef8fd] border border-[#b9e3f9] rounded-md"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Products & Operating Conditions Table Rows */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-[#042447]">
                                    Products & Operating Conditions ({berth.pierSheet.conditions.length})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddPierCondition(editingTerminal.id, berth.id)
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#0066cc] bg-[#eef8fd] hover:bg-[#dceffb] border border-[#b9e3f9] rounded-md"
                                  >
                                    <Plus className="w-3 h-3" />
                                    {lang === 'es' ? 'Agregar fila' : 'Add row'}
                                  </button>
                                </div>

                                <div className="space-y-1.5">
                                  {berth.pierSheet.conditions.map((cond) => (
                                    <div
                                      key={cond.id}
                                      className="p-2 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] grid grid-cols-2 sm:grid-cols-12 gap-1.5 items-center"
                                    >
                                      <input
                                        type="text"
                                        value={cond.product}
                                        onChange={(e) =>
                                          handleUpdatePierCondition(
                                            editingTerminal.id,
                                            berth.id,
                                            cond.id,
                                            { product: e.target.value }
                                          )
                                        }
                                        placeholder="Product"
                                        aria-label="Condition product"
                                        className="col-span-2 sm:col-span-3 px-2 py-1 text-[11.5px] font-medium bg-white border border-[#d2d2d7] rounded"
                                      />
                                      <input
                                        type="text"
                                        value={cond.line}
                                        onChange={(e) =>
                                          handleUpdatePierCondition(
                                            editingTerminal.id,
                                            berth.id,
                                            cond.id,
                                            { line: e.target.value }
                                          )
                                        }
                                        placeholder="Line"
                                        aria-label="Line"
                                        className="sm:col-span-1 px-2 py-1 text-[11.5px] font-mono bg-white border border-[#d2d2d7] rounded"
                                      />
                                      <input
                                        type="text"
                                        value={cond.connectionType}
                                        onChange={(e) =>
                                          handleUpdatePierCondition(
                                            editingTerminal.id,
                                            berth.id,
                                            cond.id,
                                            { connectionType: e.target.value }
                                          )
                                        }
                                        placeholder="Type"
                                        aria-label="Connection type"
                                        className="sm:col-span-2 px-2 py-1 text-[11.5px] bg-white border border-[#d2d2d7] rounded"
                                      />
                                      <input
                                        type="text"
                                        value={cond.connection}
                                        onChange={(e) =>
                                          handleUpdatePierCondition(
                                            editingTerminal.id,
                                            berth.id,
                                            cond.id,
                                            { connection: e.target.value }
                                          )
                                        }
                                        placeholder="Conn"
                                        aria-label="Connection size"
                                        className="sm:col-span-1 px-2 py-1 text-[11.5px] font-mono bg-white border border-[#d2d2d7] rounded"
                                      />
                                      <input
                                        type="text"
                                        value={cond.maxAvgPerHour}
                                        onChange={(e) =>
                                          handleUpdatePierCondition(
                                            editingTerminal.id,
                                            berth.id,
                                            cond.id,
                                            { maxAvgPerHour: e.target.value }
                                          )
                                        }
                                        placeholder="Max/hr"
                                        aria-label="Max avg hour"
                                        className="sm:col-span-1 px-2 py-1 text-[11.5px] font-mono bg-white border border-[#d2d2d7] rounded"
                                      />
                                      <input
                                        type="text"
                                        value={cond.minAvgPerHour}
                                        onChange={(e) =>
                                          handleUpdatePierCondition(
                                            editingTerminal.id,
                                            berth.id,
                                            cond.id,
                                            { minAvgPerHour: e.target.value }
                                          )
                                        }
                                        placeholder="Min/hr"
                                        aria-label="Min avg hour"
                                        className="sm:col-span-1 px-2 py-1 text-[11.5px] font-mono bg-white border border-[#d2d2d7] rounded"
                                      />
                                      <input
                                        type="text"
                                        value={cond.mergedRateNote ?? ''}
                                        onChange={(e) =>
                                          handleUpdatePierCondition(
                                            editingTerminal.id,
                                            berth.id,
                                            cond.id,
                                            { mergedRateNote: e.target.value }
                                          )
                                        }
                                        placeholder="Merged note (optional)"
                                        aria-label="Merged rate note"
                                        className="sm:col-span-2 px-2 py-1 text-[11.5px] bg-white border border-[#d2d2d7] rounded"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeletePierCondition(
                                            editingTerminal.id,
                                            berth.id,
                                            cond.id
                                          )
                                        }
                                        aria-label="Delete row"
                                        className="justify-self-end p-1 text-[#6e6e73] hover:text-[#dc2626]"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Brand & Footer Text */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={berth.pierSheet.brandPrimary ?? 'INCHCAPE'}
                                  onChange={(e) =>
                                    handleUpdatePierSheet(editingTerminal.id, berth.id, {
                                      brandPrimary: e.target.value,
                                    })
                                  }
                                  placeholder="Brand Primary"
                                  aria-label="Brand primary"
                                  className="px-2.5 py-1 text-[11.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                                />
                                <input
                                  type="text"
                                  value={berth.pierSheet.footerLocation ?? ''}
                                  onChange={(e) =>
                                    handleUpdatePierSheet(editingTerminal.id, berth.id, {
                                      footerLocation: e.target.value,
                                    })
                                  }
                                  placeholder="Footer location"
                                  aria-label="Footer location"
                                  className="px-2.5 py-1 text-[11.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                                />
                                <input
                                  type="text"
                                  value={berth.pierSheet.footerOffice ?? ''}
                                  onChange={(e) =>
                                    handleUpdatePierSheet(editingTerminal.id, berth.id, {
                                      footerOffice: e.target.value,
                                    })
                                  }
                                  placeholder="Footer office"
                                  aria-label="Footer office"
                                  className="px-2.5 py-1 text-[11.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Product Specs (Rates, Muellaje & Restrictions) */}
                  <div className="space-y-2.5 pt-3 border-t border-[#e5e5ea]">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-[#1d1d1f]">
                        {lang === 'es'
                          ? `Productos, Rates de Descarga y Muellaje (${(editingTerminal.productSpecs ?? []).length})`
                          : `Commodities, Discharge Rates & Wharfage (${(editingTerminal.productSpecs ?? []).length})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddProductSpec(editingTerminal.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-md"
                      >
                        <Plus className="w-3 h-3" />
                        {lang === 'es' ? 'Agregar producto' : 'Add commodity'}
                      </button>
                    </div>
                    {(editingTerminal.productSpecs ?? []).map((ps) => (
                      <div
                        key={ps.id}
                        className="p-3 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] space-y-2"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={lang === 'es' ? ps.product : ps.productEn}
                            onChange={(e) =>
                              handleUpdateProductSpec(
                                editingTerminal.id,
                                ps.id,
                                lang === 'es'
                                  ? { product: e.target.value }
                                  : { productEn: e.target.value }
                              )
                            }
                            aria-label="Commodity name"
                            className="sm:col-span-5 px-2.5 py-1 text-[12px] font-medium bg-white border border-[#d2d2d7] rounded-md"
                          />
                          <input
                            type="text"
                            value={lang === 'es' ? ps.dischargeRate : ps.dischargeRateEn}
                            onChange={(e) =>
                              handleUpdateProductSpec(
                                editingTerminal.id,
                                ps.id,
                                lang === 'es'
                                  ? { dischargeRate: e.target.value }
                                  : { dischargeRateEn: e.target.value }
                              )
                            }
                            aria-label="Commodity rate"
                            className="sm:col-span-3 px-2.5 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                          />
                          <input
                            type="text"
                            value={lang === 'es' ? ps.muellajeTariff : ps.muellajeTariffEn}
                            onChange={(e) =>
                              handleUpdateProductSpec(
                                editingTerminal.id,
                                ps.id,
                                lang === 'es'
                                  ? { muellajeTariff: e.target.value }
                                  : { muellajeTariffEn: e.target.value }
                              )
                            }
                            aria-label="Commodity muellaje"
                            className="sm:col-span-3 px-2.5 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteProductSpec(editingTerminal.id, ps.id)}
                            aria-label="Delete product spec"
                            className="sm:col-span-1 justify-self-end p-1 text-[#6e6e73] hover:text-[#dc2626]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={lang === 'es' ? ps.restrictions : ps.restrictionsEn}
                          onChange={(e) =>
                            handleUpdateProductSpec(
                              editingTerminal.id,
                              ps.id,
                              lang === 'es'
                                ? { restrictions: e.target.value }
                                : { restrictionsEn: e.target.value }
                            )
                          }
                          aria-label="Commodity restrictions"
                          placeholder={lang === 'es' ? 'Restricciones del producto' : 'Product restrictions'}
                          className="w-full px-2.5 py-1 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Concessionaires & Storage Summary */}
                  <div className="space-y-3 pt-3 border-t border-[#e5e5ea]">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-[#1d1d1f]">
                        {lang === 'es'
                          ? `Cesionarios / Terminales Internas y Almacenaje (${(editingTerminal.concessionaires ?? []).length})`
                          : `Concessionaires & Storage Summary (${(editingTerminal.concessionaires ?? []).length})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddConcessionaire(editingTerminal.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-md"
                      >
                        <Plus className="w-3 h-3" />
                        {lang === 'es' ? 'Agregar cesionario' : 'Add concessionaire'}
                      </button>
                    </div>

                    {editingTerminal.storageSummary && (
                      <div className="p-3 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-[#6e6e73] mb-0.5">
                              {lang === 'es' ? 'Bodegas techadas (m²)' : 'Covered (m²)'}
                            </label>
                            <input
                              type="number"
                              value={editingTerminal.storageSummary.coveredSqm}
                              onChange={(e) =>
                                handleUpdateTerminal(editingTerminal.id, {
                                  storageSummary: {
                                    ...editingTerminal.storageSummary!,
                                    coveredSqm: Number(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-full px-2 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#6e6e73] mb-0.5">
                              {lang === 'es' ? 'Patios / Tanques (m²)' : 'Open / Tank Farm (m²)'}
                            </label>
                            <input
                              type="number"
                              value={editingTerminal.storageSummary.openYardSqm}
                              onChange={(e) =>
                                handleUpdateTerminal(editingTerminal.id, {
                                  storageSummary: {
                                    ...editingTerminal.storageSummary!,
                                    openYardSqm: Number(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-full px-2 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#6e6e73] mb-0.5">
                              {lang === 'es' ? 'Patio contenedores (m²)' : 'Container Yard (m²)'}
                            </label>
                            <input
                              type="number"
                              value={editingTerminal.storageSummary.containerYardSqm}
                              onChange={(e) =>
                                handleUpdateTerminal(editingTerminal.id, {
                                  storageSummary: {
                                    ...editingTerminal.storageSummary!,
                                    containerYardSqm: Number(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-full px-2 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded"
                            />
                          </div>
                        </div>
                        <textarea
                          rows={2}
                          value={
                            lang === 'es'
                              ? editingTerminal.storageSummary.warehousesBreakdown
                              : editingTerminal.storageSummary.warehousesBreakdownEn
                          }
                          onChange={(e) =>
                            handleUpdateTerminal(editingTerminal.id, {
                              storageSummary: {
                                ...editingTerminal.storageSummary!,
                                ...(lang === 'es'
                                  ? { warehousesBreakdown: e.target.value }
                                  : { warehousesBreakdownEn: e.target.value }),
                              },
                            })
                          }
                          aria-label="Storage breakdown"
                          className="w-full px-2.5 py-1 text-[12px] bg-white border border-[#d2d2d7] rounded"
                        />
                      </div>
                    )}

                    {(editingTerminal.concessionaires ?? []).map((conc) => (
                      <div
                        key={conc.id}
                        className="p-3 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] space-y-2"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={conc.name}
                            onChange={(e) =>
                              handleUpdateConcessionaire(editingTerminal.id, conc.id, {
                                name: e.target.value,
                              })
                            }
                            aria-label="Concessionaire name"
                            placeholder={lang === 'es' ? 'Nombre cesionario' : 'Concessionaire name'}
                            className="sm:col-span-4 px-2 py-1 text-[12px] font-medium bg-white border border-[#d2d2d7] rounded"
                          />
                          <input
                            type="text"
                            value={lang === 'es' ? conc.cargoCategory : conc.cargoCategoryEn}
                            onChange={(e) =>
                              handleUpdateConcessionaire(
                                editingTerminal.id,
                                conc.id,
                                lang === 'es'
                                  ? { cargoCategory: e.target.value }
                                  : { cargoCategoryEn: e.target.value }
                              )
                            }
                            aria-label="Concessionaire cargo"
                            placeholder={lang === 'es' ? 'Categoría de carga' : 'Cargo category'}
                            className="sm:col-span-3 px-2 py-1 text-[12px] bg-white border border-[#d2d2d7] rounded"
                          />
                          <input
                            type="text"
                            value={conc.berthsUsed}
                            onChange={(e) =>
                              handleUpdateConcessionaire(editingTerminal.id, conc.id, {
                                berthsUsed: e.target.value,
                              })
                            }
                            aria-label="Concessionaire berths"
                            placeholder={lang === 'es' ? 'Muelles asignados' : 'Berths used'}
                            className="sm:col-span-4 px-2 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteConcessionaire(editingTerminal.id, conc.id)
                            }
                            aria-label="Delete concessionaire"
                            className="sm:col-span-1 justify-self-end p-1 text-[#6e6e73] hover:text-[#dc2626]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={
                              lang === 'es'
                                ? conc.subdivision ?? ''
                                : conc.subdivisionEn ?? conc.subdivision ?? ''
                            }
                            onChange={(e) =>
                              handleUpdateConcessionaire(
                                editingTerminal.id,
                                conc.id,
                                lang === 'es'
                                  ? { subdivision: e.target.value }
                                  : { subdivisionEn: e.target.value }
                              )
                            }
                            placeholder={
                              lang === 'es'
                                ? 'Subdivisión (ej. Subdivisión Ergon)'
                                : 'Subdivision (e.g. Ergon Subdivision)'
                            }
                            className="px-2 py-1 text-[11.5px] bg-white border border-[#d2d2d7] rounded"
                          />
                          <input
                            type="text"
                            value={
                              lang === 'es'
                                ? conc.connectionSpecs ?? ''
                                : conc.connectionSpecsEn ?? conc.connectionSpecs ?? ''
                            }
                            onChange={(e) =>
                              handleUpdateConcessionaire(
                                editingTerminal.id,
                                conc.id,
                                lang === 'es'
                                  ? { connectionSpecs: e.target.value }
                                  : { connectionSpecsEn: e.target.value }
                              )
                            }
                            placeholder={
                              lang === 'es'
                                ? 'Conexiones / Bridas / Líneas'
                                : 'Connections / Flanges / Lines'
                            }
                            className="px-2 py-1 text-[11.5px] bg-white border border-[#d2d2d7] rounded"
                          />
                          <input
                            type="text"
                            value={
                              lang === 'es'
                                ? conc.dischargeMethod ?? ''
                                : conc.dischargeMethodEn ?? conc.dischargeMethod ?? ''
                            }
                            onChange={(e) =>
                              handleUpdateConcessionaire(
                                editingTerminal.id,
                                conc.id,
                                lang === 'es'
                                  ? { dischargeMethod: e.target.value }
                                  : { dischargeMethodEn: e.target.value }
                              )
                            }
                            placeholder={
                              lang === 'es'
                                ? 'Método descarga / transferencia'
                                : 'Discharge / transfer method'
                            }
                            className="px-2 py-1 text-[11.5px] bg-white border border-[#d2d2d7] rounded"
                          />
                        </div>

                        <ImageUploaderField
                          id={`cm-conc-photo-${conc.id}`}
                          label={
                            lang === 'es'
                              ? `Fotografía de Terminal Interna: ${conc.name}`
                              : `Inner Terminal Photo: ${conc.name}`
                          }
                          value={conc.imageUrl ?? editingTerminal.imageUrl}
                          lang={lang}
                          onChange={(imageUrl) =>
                            handleUpdateConcessionaire(editingTerminal.id, conc.id, {
                              imageUrl,
                            })
                          }
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={conc.coordinates ?? ''}
                            onChange={(e) =>
                              handleUpdateConcessionaire(editingTerminal.id, conc.id, {
                                coordinates: e.target.value,
                              })
                            }
                            placeholder={
                              lang === 'es'
                                ? "Coordenadas (ej. 18°08'22\"N · 94°24'55\"W)"
                                : 'Coordinates'
                            }
                            className="px-2 py-1 text-[11.5px] font-mono bg-white border border-[#d2d2d7] rounded"
                          />
                          <input
                            type="text"
                            value={
                              lang === 'es'
                                ? conc.storageCapacity ?? ''
                                : conc.storageCapacityEn ?? conc.storageCapacity ?? ''
                            }
                            onChange={(e) =>
                              handleUpdateConcessionaire(
                                editingTerminal.id,
                                conc.id,
                                lang === 'es'
                                  ? { storageCapacity: e.target.value }
                                  : { storageCapacityEn: e.target.value }
                              )
                            }
                            placeholder={
                              lang === 'es'
                                ? 'Capacidad de almacenaje / vínculo'
                                : 'Storage capacity / tie-in'
                            }
                            className="px-2 py-1 text-[11.5px] bg-white border border-[#d2d2d7] rounded"
                          />
                          <input
                            type="text"
                            value={(conc.productsList ?? []).join(', ')}
                            onChange={(e) =>
                              handleUpdateConcessionaire(editingTerminal.id, conc.id, {
                                productsList: e.target.value
                                  .split(',')
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder={
                              lang === 'es'
                                ? 'Productos (separados por coma)'
                                : 'Products (comma separated)'
                            }
                            className="px-2 py-1 text-[11.5px] bg-white border border-[#d2d2d7] rounded"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <textarea
                            rows={2}
                            value={lang === 'es' ? conc.infrastructure : conc.infrastructureEn}
                            onChange={(e) =>
                              handleUpdateConcessionaire(
                                editingTerminal.id,
                                conc.id,
                                lang === 'es'
                                  ? { infrastructure: e.target.value }
                                  : { infrastructureEn: e.target.value }
                              )
                            }
                            placeholder={
                              lang === 'es'
                                ? 'Infraestructura y equipamiento'
                                : 'Infrastructure & equipment'
                            }
                            className="px-2 py-1 text-[11.5px] bg-white border border-[#d2d2d7] rounded"
                          />
                          <textarea
                            rows={2}
                            value={
                              lang === 'es'
                                ? conc.restrictions ?? ''
                                : conc.restrictionsEn ?? conc.restrictions ?? ''
                            }
                            onChange={(e) =>
                              handleUpdateConcessionaire(
                                editingTerminal.id,
                                conc.id,
                                lang === 'es'
                                  ? { restrictions: e.target.value }
                                  : { restrictionsEn: e.target.value }
                              )
                            }
                            placeholder={
                              lang === 'es'
                                ? 'Restricciones específicas del cesionario'
                                : 'Specific concessionaire restrictions'
                            }
                            className="px-2 py-1 text-[11.5px] bg-white border border-[#d2d2d7] rounded"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <textarea
                            rows={2}
                            value={(lang === 'es'
                              ? conc.procedures ?? []
                              : conc.proceduresEn ?? conc.procedures ?? []
                            ).join('\n')}
                            onChange={(e) => {
                              const lines = e.target.value.split('\n');
                              handleUpdateConcessionaire(
                                editingTerminal.id,
                                conc.id,
                                lang === 'es'
                                  ? { procedures: lines }
                                  : { proceduresEn: lines }
                              );
                            }}
                            placeholder={
                              lang === 'es'
                                ? 'Procedimientos (uno por línea)'
                                : 'Procedures (one per line)'
                            }
                            className="px-2 py-1 text-[11.5px] bg-white border border-[#d2d2d7] rounded"
                          />
                          <input
                            type="text"
                            value={conc.auditSource ?? ''}
                            onChange={(e) =>
                              handleUpdateConcessionaire(editingTerminal.id, conc.id, {
                                auditSource: e.target.value,
                              })
                            }
                            placeholder={
                              lang === 'es' ? 'Fuente de referencia' : 'Reference source'
                            }
                            className="px-2 py-1 text-[11.5px] bg-white border border-[#d2d2d7] rounded self-start"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Terminal Restrictions Summary & Procedures */}
                  <div className="space-y-2.5 pt-3 border-t border-[#e5e5ea]">
                    <div className="text-[12px] font-semibold text-[#1d1d1f]">
                      {lang === 'es'
                        ? 'Procedimientos Operativos y Resumen de Restricciones de la Terminal'
                        : 'Terminal Procedures & Restrictions Summary'}
                    </div>
                    <input
                      type="text"
                      value={
                        lang === 'es'
                          ? editingTerminal.restrictionsSummary
                          : editingTerminal.restrictionsSummaryEn ??
                            editingTerminal.restrictionsSummary
                      }
                      onChange={(e) =>
                        handleUpdateTerminal(
                          editingTerminal.id,
                          lang === 'es'
                            ? { restrictionsSummary: e.target.value }
                            : { restrictionsSummaryEn: e.target.value }
                        )
                      }
                      aria-label="Terminal restrictions summary"
                      className="w-full px-3 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                    <textarea
                      rows={3}
                      value={(lang === 'es'
                        ? editingTerminal.procedures
                        : editingTerminal.proceduresEn ?? editingTerminal.procedures
                      ).join('\n')}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n');
                        handleUpdateTerminal(
                          editingTerminal.id,
                          lang === 'es'
                            ? { procedures: lines }
                            : { proceduresEn: lines }
                        );
                      }}
                      placeholder={
                        lang === 'es'
                          ? 'Un procedimiento por línea...'
                          : 'One procedure per line...'
                      }
                      aria-label="Terminal procedures"
                      className="w-full px-3 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RESTRICTIONS */}
          {tab === 'restrictions' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddRestriction}
                className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3"
              >
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es' ? 'Agregar nueva restricción' : 'Add new restriction'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={restTitle}
                    onChange={(e) => setRestTitle(e.target.value)}
                    placeholder={lang === 'es' ? 'Título de la restricción' : 'Restriction title'}
                    className="sm:col-span-2 px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="text"
                    value={restLimit}
                    onChange={(e) => setRestLimit(e.target.value)}
                    placeholder={lang === 'es' ? 'Valor límite (ej. LOA 220 m)' : 'Limit value'}
                    className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <select
                    value={restCategory}
                    onChange={(e) =>
                      setRestCategory(e.target.value as PortRestriction['category'])
                    }
                    aria-label="Category"
                    className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                  >
                    <option value="Física">Física</option>
                    <option value="Operativa">Operativa</option>
                    <option value="Practicaje y Remolque">Practicaje y Remolque</option>
                    <option value="Seguridad y Aduana">Seguridad y Aduana</option>
                  </select>
                  <label className="inline-flex items-center gap-2 text-[13px] text-[#1d1d1f] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restVerified}
                      onChange={(e) => setRestVerified(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    {lang === 'es' ? 'Verificada con Capitanía' : 'Verified with Harbor Master'}
                  </label>
                </div>
                <textarea
                  required
                  rows={2}
                  value={restDetail}
                  onChange={(e) => setRestDetail(e.target.value)}
                  placeholder={lang === 'es' ? 'Detalle operativo...' : 'Operational detail...'}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[#0066cc] rounded-lg"
                >
                  <Save className="w-4 h-4" />
                  {lang === 'es' ? 'Guardar restricción' : 'Save restriction'}
                </button>
              </form>

              {/* Edit Existing Restrictions */}
              <div className="space-y-2.5">
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es'
                    ? `Restricciones cargadas (${portRestrictions.length})`
                    : `Loaded restrictions (${portRestrictions.length})`}
                </div>
                {portRestrictions.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-[#e5e5ea] bg-white space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={lang === 'es' ? r.title : r.titleEn}
                        onChange={(e) =>
                          handleUpdateRestriction(
                            r.id,
                            lang === 'es'
                              ? { title: e.target.value }
                              : { titleEn: e.target.value }
                          )
                        }
                        aria-label="Restriction title"
                        className="sm:col-span-5 px-2.5 py-1.5 text-[12px] font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                      />
                      <input
                        type="text"
                        value={r.limitValue}
                        onChange={(e) =>
                          handleUpdateRestriction(r.id, { limitValue: e.target.value })
                        }
                        aria-label="Restriction limit"
                        className="sm:col-span-3 px-2.5 py-1.5 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                      />
                      <select
                        value={r.verificationStatus}
                        onChange={(e) =>
                          handleUpdateRestriction(r.id, {
                            verificationStatus: e.target
                              .value as PortRestriction['verificationStatus'],
                          })
                        }
                        aria-label="Verification status"
                        className="sm:col-span-3 px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                      >
                        <option value="verified">
                          {lang === 'es' ? 'Verificado' : 'Verified'}
                        </option>
                        <option value="pending_validation">
                          {lang === 'es' ? 'Por confirmar' : 'Pending'}
                        </option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDeleteRestriction(r.id)}
                        aria-label="Delete restriction"
                        className="sm:col-span-1 justify-self-end p-1 text-[#6e6e73] hover:text-[#dc2626]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={lang === 'es' ? r.detail : r.detailEn}
                      onChange={(e) =>
                        handleUpdateRestriction(
                          r.id,
                          lang === 'es'
                            ? { detail: e.target.value }
                            : { detailEn: e.target.value }
                        )
                      }
                      aria-label="Restriction detail"
                      className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MARINE SERVICES */}
          {tab === 'services' && (
            <div className="space-y-5">
              {/* Carpeta Drive de Servicios Técnicos */}
              <div className="p-4 rounded-xl bg-[#eef6ff] border border-[#cde3ff] space-y-2">
                <div className="text-[13px] font-semibold text-[#042447]">
                  {lang === 'es'
                    ? 'Carpeta Drive de Servicios Técnicos (Tarifas oficiales, Acuerdos y Restricciones)'
                    : 'Technical Services Google Drive Folder (Official Tariffs, Agreements & Restrictions)'}
                </div>
                <p className="text-[11.5px] text-[#424245]">
                  {lang === 'es'
                    ? 'Enlaza tu carpeta general de Drive y/o pega enlaces de archivos de Google Drive directamente dentro de cada servicio técnico para habilitar su descarga directa.'
                    : 'Link your main Drive folder and/or attach Google Drive file links inside each technical service for 1-click direct download.'}
                </p>
                <input
                  type="url"
                  value={hubState.servicesDriveFolderUrl ?? ''}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      servicesDriveFolderUrl: e.target.value,
                    }))
                  }
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                />
              </div>

              <form
                onSubmit={handleAddService}
                className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
              >
                <input
                  type="text"
                  required
                  value={newSrvName}
                  onChange={(e) => setNewSrvName(e.target.value)}
                  placeholder={lang === 'es' ? 'Nuevo servicio (ES)' : 'New service (ES)'}
                  className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                />
                <input
                  type="text"
                  value={newSrvNameEn}
                  onChange={(e) => setNewSrvNameEn(e.target.value)}
                  placeholder="Service name (EN)"
                  className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                />
                <input
                  type="text"
                  value={newSrvDetail}
                  onChange={(e) => setNewSrvDetail(e.target.value)}
                  placeholder={lang === 'es' ? 'Alcance / nota' : 'Scope / detail'}
                  className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#0066cc] rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  {lang === 'es' ? 'Agregar servicio' : 'Add service'}
                </button>
              </form>

              <div className="space-y-3">
                {activeServices.map((srv) => {
                  const docs = srv.documentLinks ?? [];
                  return (
                    <div
                      key={srv.id}
                      className="p-3.5 rounded-xl border border-[#e5e5ea] bg-white space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <label className="sm:col-span-2 inline-flex items-center gap-2 text-[12px] font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={srv.available}
                            onChange={(e) =>
                              handleUpdateService(srv.id, { available: e.target.checked })
                            }
                            className="w-4 h-4 rounded"
                          />
                          {srv.available
                            ? lang === 'es'
                              ? 'Habilitado'
                              : 'Available'
                            : lang === 'es'
                            ? 'Restringido'
                            : 'Restricted'}
                        </label>
                        <input
                          type="text"
                          value={lang === 'es' ? srv.name : srv.nameEn}
                          onChange={(e) =>
                            handleUpdateService(
                              srv.id,
                              lang === 'es'
                                ? { name: e.target.value }
                                : { nameEn: e.target.value }
                            )
                          }
                          aria-label="Service name"
                          className="sm:col-span-4 px-2.5 py-1.5 text-[12px] font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                        />
                        <input
                          type="text"
                          value={lang === 'es' ? srv.detail : srv.detailEn}
                          onChange={(e) =>
                            handleUpdateService(
                              srv.id,
                              lang === 'es'
                                ? { detail: e.target.value }
                                : { detailEn: e.target.value }
                            )
                          }
                          aria-label="Service detail"
                          className="sm:col-span-5 px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteService(srv.id)}
                          aria-label="Delete service"
                          className="sm:col-span-1 justify-self-end p-1 text-[#6e6e73] hover:text-[#dc2626]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Per-service Official Tariff / Agreement / Restriction Drive Links */}
                      <div className="pt-2 border-t border-[#f0f0f3] space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-[#1d1d1f]">
                            {lang === 'es'
                              ? 'Documentos oficiales en Drive (Tarifas, Acuerdos, Restricciones)'
                              : 'Official Drive Documents (Tariffs, Agreements, Restrictions)'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateService(srv.id, {
                                documentLinks: [
                                  ...docs,
                                  {
                                    id: `srvdoc-${Date.now()}`,
                                    label: lang === 'es' ? 'Tarifa / Acuerdo Oficial' : 'Official Tariff / Agreement',
                                    url:
                                      hubState.servicesDriveFolderUrl?.trim() ||
                                      'https://drive.google.com/file/d/',
                                    docType: 'Tarifa oficial',
                                  },
                                ],
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#0066cc] bg-[#eef6ff] hover:bg-[#dcebff] border border-[#cde3ff] rounded-md transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            {lang === 'es' ? 'Agregar documento / Drive' : 'Add Drive doc'}
                          </button>
                        </div>

                        {docs.map((lnk) => {
                          const resolved = resolveDocumentLinkUrl(lnk.url);
                          return (
                            <div
                              key={lnk.id}
                              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                            >
                              <input
                                type="text"
                                value={lnk.label}
                                onChange={(e) =>
                                  handleUpdateService(srv.id, {
                                    documentLinks: docs.map((d) =>
                                      d.id === lnk.id ? { ...d, label: e.target.value } : d
                                    ),
                                  })
                                }
                                placeholder={
                                  lang === 'es'
                                    ? 'Nombre del documento (ej. Tarifa oficial 2026)'
                                    : 'Document label'
                                }
                                className="md:col-span-4 px-2.5 py-1 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                              />
                              <div className="md:col-span-5 space-y-0.5">
                                <input
                                  type="url"
                                  value={lnk.url}
                                  onChange={(e) =>
                                    handleUpdateService(srv.id, {
                                      documentLinks: docs.map((d) =>
                                        d.id === lnk.id ? { ...d, url: e.target.value } : d
                                      ),
                                    })
                                  }
                                  placeholder="https://drive.google.com/file/d/.../view"
                                  className="w-full px-2.5 py-1 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                                />
                                {resolved.isDrive && resolved.isDirectDownload && (
                                  <div className="text-[10px] font-medium text-[#0066cc]">
                                    {lang === 'es'
                                      ? '↓ Enlace Drive detectado: descarga directa automática'
                                      : '↓ Drive file detected: direct download enabled'}
                                  </div>
                                )}
                              </div>
                              <select
                                value={lnk.docType ?? 'Tarifa oficial'}
                                onChange={(e) =>
                                  handleUpdateService(srv.id, {
                                    documentLinks: docs.map((d) =>
                                      d.id === lnk.id ? { ...d, docType: e.target.value } : d
                                    ),
                                  })
                                }
                                aria-label="Service document type"
                                className="md:col-span-2 px-2 py-1 text-[11.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                              >
                                <option value="Tarifa oficial">Tarifa oficial</option>
                                <option value="Acuerdo">Acuerdo</option>
                                <option value="Restricción">Restricción</option>
                                <option value="Circular / Oficio">Circular / Oficio</option>
                                <option value="Drive / PDF">Drive / PDF</option>
                              </select>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateService(srv.id, {
                                    documentLinks: docs.filter((d) => d.id !== lnk.id),
                                  })
                                }
                                aria-label={`Remove ${lnk.label}`}
                                className="md:col-span-1 flex justify-center p-1 text-[#dc2626] hover:bg-[#fef2f2] rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: VESSEL LINE-UP */}
          {tab === 'lineup' && (
            <div className="space-y-5">
              <form
                onSubmit={handleAddLineupVessel}
                className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3"
              >
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es'
                    ? `Agregar buque a ${activePort.name}`
                    : `Add vessel to ${activePort.name}`}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={luVesselName}
                    onChange={(e) => setLuVesselName(e.target.value)}
                    placeholder="Ej. MV Golfo Horizon"
                    className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="text"
                    value={luImo}
                    onChange={(e) => setLuImo(e.target.value)}
                    placeholder="IMO (ej. 9812345)"
                    className="px-3 py-2 text-[13px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <select
                    value={luStatus}
                    onChange={(e) => setLuStatus(e.target.value as VesselStatus)}
                    aria-label="Vessel status"
                    className="px-3 py-2 text-[13px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                  >
                    {VESSEL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={luTerminal}
                    onChange={(e) => setLuTerminal(e.target.value)}
                    placeholder="Terminal / Muelle"
                    className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="text"
                    value={luCargo}
                    onChange={(e) => setLuCargo(e.target.value)}
                    placeholder="Carga / Producto"
                    className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="text"
                    value={luEta}
                    onChange={(e) => setLuEta(e.target.value)}
                    placeholder="ETA / ETD"
                    className="px-3 py-2 text-[13px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="text"
                    value={luAgency}
                    onChange={(e) => setLuAgency(e.target.value)}
                    placeholder="Agencia"
                    className="px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[#0066cc] rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  {lang === 'es' ? 'Agregar al Line-Up' : 'Add to Line-Up'}
                </button>
              </form>

              {/* Editable Current Lineup */}
              <div className="space-y-2">
                {portLineup.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl border border-[#e5e5ea] bg-white grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <input
                      type="text"
                      value={v.vesselName}
                      onChange={(e) =>
                        handleUpdateLineupEntry(v.id, { vesselName: e.target.value })
                      }
                      aria-label="Vessel name"
                      className="sm:col-span-3 px-2.5 py-1.5 text-[12px] font-semibold bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                    <input
                      type="text"
                      value={v.terminalOrBerth}
                      onChange={(e) =>
                        handleUpdateLineupEntry(v.id, { terminalOrBerth: e.target.value })
                      }
                      aria-label="Terminal or berth"
                      className="sm:col-span-3 px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                    <input
                      type="text"
                      value={v.cargo}
                      onChange={(e) =>
                        handleUpdateLineupEntry(v.id, { cargo: e.target.value })
                      }
                      aria-label="Cargo"
                      className="sm:col-span-2 px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                    <input
                      type="text"
                      value={v.etaOrEtd}
                      onChange={(e) =>
                        handleUpdateLineupEntry(v.id, { etaOrEtd: e.target.value })
                      }
                      aria-label="ETA ETD"
                      className="sm:col-span-2 px-2.5 py-1.5 text-[11px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                    <select
                      aria-label={`Status ${v.vesselName}`}
                      value={v.status}
                      onChange={(e) =>
                        handleUpdateLineupEntry(v.id, {
                          status: e.target.value as VesselStatus,
                        })
                      }
                      className="sm:col-span-1 px-1.5 py-1.5 text-[11px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    >
                      {VESSEL_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDeleteLineupVessel(v.id)}
                      aria-label={`Delete ${v.vesselName}`}
                      className="sm:col-span-1 justify-self-end p-1 text-[#6e6e73] hover:text-[#dc2626]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-2.5">
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es' ? 'Importación masiva' : 'Bulk paste import'}
                </div>
                <textarea
                  rows={2}
                  value={bulkLineupText}
                  onChange={(e) => setBulkLineupText(e.target.value)}
                  placeholder="MT Veracruz Tanker | 9765432 | Muelle Petroquímico | Diésel | 2026-11-22 10:00 | EXPECTED | ISS México"
                  className="w-full p-2.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleImportBulkLineup(false)}
                    className="px-3.5 py-1.5 text-[12px] font-medium text-white bg-[#1d1d1f] rounded-lg"
                  >
                    {lang === 'es' ? 'Agregar filas' : 'Append rows'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImportBulkLineup(true)}
                    className="px-3.5 py-1.5 text-[12px] font-medium text-[#1d1d1f] bg-white border border-[#d2d2d7] rounded-lg"
                  >
                    {lang === 'es' ? 'Reemplazar puerto' : 'Replace port rows'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: TARIFFS, FORMULAS, PDA FORMATS & BANK DETAILS */}
          {tab === 'tariffs' && (
            <div className="space-y-6">
              {/* Add New Formula-Driven Tariff */}
              <form
                onSubmit={handleAddTariff}
                className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3"
              >
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es'
                    ? 'Agregar concepto tarifario y fórmula PDA'
                    : 'Add tariff concept & PDA formula'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                  <input
                    type="text"
                    value={newTariffCode}
                    onChange={(e) => setNewTariffCode(e.target.value)}
                    placeholder="Código"
                    className="px-2.5 py-2 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="text"
                    required
                    value={newTariffConcept}
                    onChange={(e) => setNewTariffConcept(e.target.value)}
                    placeholder={lang === 'es' ? 'Concepto nuevo' : 'New concept'}
                    className="sm:col-span-2 px-2.5 py-2 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="text"
                    value={newTariffProvider}
                    onChange={(e) => setNewTariffProvider(e.target.value)}
                    placeholder="Proveedor"
                    className="px-2.5 py-2 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <select
                    value={newTariffSection}
                    onChange={(e) => setNewTariffSection(e.target.value as PdaChargeSection)}
                    className="px-2.5 py-2 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  >
                    <option value="port">Port Charges</option>
                    <option value="crew">Crew Charges</option>
                    <option value="husbandry">Husbandry Charges</option>
                    <option value="agency">Agency Charges</option>
                  </select>
                  <select
                    value={newTariffUnit}
                    onChange={(e) => setNewTariffUnit(e.target.value as TariffUnit)}
                    className="px-2.5 py-2 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  >
                    <option value="flat">Cuota Fija</option>
                    <option value="per_gt">Per GT / GRT</option>
                    <option value="per_loa_m">Per LOA m</option>
                    <option value="per_tug_hour">Per Tug Hr</option>
                    <option value="per_day">Per Day</option>
                    <option value="per_ton">Per MT</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 items-center">
                  <select
                    value={newTariffFormula}
                    onChange={(e) => setNewTariffFormula(e.target.value as PdaFormulaType)}
                    className="sm:col-span-2 px-2.5 py-2 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  >
                    {PDA_FORMULA_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={newTariffRate}
                    onChange={(e) => setNewTariffRate(Number(e.target.value) || 0)}
                    placeholder="Rate"
                    className="px-2.5 py-2 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <select
                    value={newTariffCurrency}
                    onChange={(e) => setNewTariffCurrency(e.target.value as 'USD' | 'MXN')}
                    aria-label="Currency"
                    className="px-2.5 py-2 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  >
                    <option value="USD">USD</option>
                    <option value="MXN">MXN</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={newTariffVatPct}
                    onChange={(e) => setNewTariffVatPct(Number(e.target.value) || 0)}
                    placeholder="IVA %"
                    className="px-2.5 py-2 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-[12px] font-medium text-white bg-[#0066cc] rounded-lg"
                  >
                    {lang === 'es' ? '+ Tarifa / Fórmula' : '+ Add Tariff'}
                  </button>
                </div>

                {newTariffFormula === 'custom_expression' && (
                  <input
                    type="text"
                    value={newTariffCustomFormula}
                    onChange={(e) => setNewTariffCustomFormula(e.target.value)}
                    placeholder="Fórmula: (grt * 0.52 + basefixed) * vat"
                    className="w-full px-3 py-2 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                  />
                )}
              </form>

              {/* Existing Tariffs Editor */}
              <div className="space-y-3">
                {portTariffs.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-[#e5e5ea] bg-white space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={lang === 'es' ? t.concept : t.conceptEn}
                        onChange={(e) =>
                          handleUpdateTariff(
                            t.id,
                            lang === 'es'
                              ? { concept: e.target.value }
                              : { conceptEn: e.target.value }
                          )
                        }
                        aria-label="Tariff concept"
                        className="sm:col-span-4 px-2.5 py-1.5 text-[12px] font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                      />
                      <input
                        type="text"
                        value={t.provider}
                        onChange={(e) =>
                          handleUpdateTariff(t.id, { provider: e.target.value })
                        }
                        aria-label="Provider"
                        className="sm:col-span-2 px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                      />
                      <input
                        id={`rate-${t.id}`}
                        type="number"
                        step="0.01"
                        min={0}
                        value={t.rate}
                        onChange={(e) =>
                          handleUpdateTariff(t.id, {
                            rate: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        aria-label="Tariff rate"
                        className="sm:col-span-2 px-2.5 py-1.5 font-mono text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md text-right"
                      />
                      <select
                        value={t.currency}
                        onChange={(e) =>
                          handleUpdateTariff(t.id, {
                            currency: e.target.value as 'USD' | 'MXN',
                          })
                        }
                        className="sm:col-span-1 px-1.5 py-1.5 text-[11px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                      >
                        <option value="USD">USD</option>
                        <option value="MXN">MXN</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleUpdateTariff(t.id, { active: !t.active })}
                        className={`sm:col-span-2 px-2.5 py-1.5 text-[11px] font-medium rounded-md border ${
                          t.active
                            ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]'
                            : 'bg-[#f5f5f7] border-[#d2d2d7] text-[#6e6e73]'
                        }`}
                      >
                        {t.active ? (lang === 'es' ? 'Activa' : 'Active') : lang === 'es' ? 'Inactiva' : 'Off'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTariff(t.id)}
                        aria-label="Delete tariff"
                        className="sm:col-span-1 justify-self-end p-1 text-[#6e6e73] hover:text-[#dc2626]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Formula, VAT, Fixed Base & Vessel Types Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 pt-2 border-t border-[#f1f5f9] text-[11px] items-center">
                      <select
                        value={normalizeChargeSection(t.chargeSection)}
                        onChange={(e) =>
                          handleUpdateTariff(t.id, {
                            chargeSection: e.target.value as PdaChargeSection,
                          })
                        }
                        aria-label="Charge section"
                        className="sm:col-span-2 px-2 py-1 bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                      >
                        <option value="port">Port Charges</option>
                        <option value="crew">Crew Charges</option>
                        <option value="husbandry">Husbandry Charges</option>
                        <option value="agency">Agency Charges</option>
                      </select>

                      <select
                        value={t.formulaType ?? 'standard'}
                        onChange={(e) =>
                          handleUpdateTariff(t.id, {
                            formulaType: e.target.value as PdaFormulaType,
                          })
                        }
                        aria-label="Formula type"
                        className="sm:col-span-3 px-2 py-1 bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                      >
                        {PDA_FORMULA_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <div className="sm:col-span-2 flex items-center gap-1">
                        <span className="text-[#6e6e73]">Fijo:</span>
                        <input
                          type="number"
                          step="1"
                          value={t.baseFixed ?? 0}
                          onChange={(e) =>
                            handleUpdateTariff(t.id, {
                              baseFixed: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-1.5 py-1 font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-1">
                        <span className="text-[#6e6e73]">IVA%:</span>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={Math.round((t.vatRate ?? 0) * 100)}
                          onChange={(e) =>
                            handleUpdateTariff(t.id, {
                              vatRate: Math.max(0, (Number(e.target.value) || 0) / 100),
                            })
                          }
                          className="w-full px-1.5 py-1 font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                        />
                      </div>

                      <select
                        value={
                          !t.applicableVesselTypes || t.applicableVesselTypes === 'ALL'
                            ? 'ALL'
                            : t.applicableVesselTypes[0] ?? 'ALL'
                        }
                        onChange={(e) =>
                          handleUpdateTariff(t.id, {
                            applicableVesselTypes:
                              e.target.value === 'ALL'
                                ? 'ALL'
                                : [e.target.value as PdaVesselType],
                          })
                        }
                        aria-label="Applicable vessel type"
                        className="sm:col-span-3 px-2 py-1 bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                      >
                        <option value="ALL">
                          {lang === 'es' ? 'Buques: Todos' : 'Vessels: ALL'}
                        </option>
                        {PDA_VESSEL_TYPE_OPTIONS.map((vt) => (
                          <option key={vt} value={vt}>
                            {vt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {t.formulaType === 'custom_expression' && (
                      <input
                        type="text"
                        value={t.customFormula ?? ''}
                        onChange={(e) =>
                          handleUpdateTariff(t.id, { customFormula: e.target.value })
                        }
                        placeholder="Expresión personalizada (grt, loa, portstayhours, tughours, tugs, movements, rate, basefixed, vat)"
                        className="w-full px-2.5 py-1.5 text-[11.5px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                      />
                    )}

                    <div className="pt-2 border-t border-[#f1f5f9] space-y-2">
                      {t.subItems && t.subItems.length > 0 && (
                        <>
                          <div className="text-[11px] font-semibold text-[#6e6e73]">
                            {lang === 'es'
                              ? 'Sub-servicios incluidos (tarifa unitaria y cantidad base):'
                              : 'Included sub-services (unit rate & default qty):'}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {t.subItems.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center gap-1.5 p-1.5 rounded bg-[#f5f5f7] border border-[#e5e5ea] text-[11px]"
                              >
                                <span className="flex-1 truncate font-medium text-[#1d1d1f]">
                                  {lang === 'es' ? sub.label : sub.labelEn}
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={sub.rate}
                                  onChange={(e) => {
                                    const nextRate = Math.max(0, Number(e.target.value) || 0);
                                    handleUpdateTariff(t.id, {
                                      subItems: t.subItems?.map((s) =>
                                        s.id === sub.id ? { ...s, rate: nextRate } : s
                                      ),
                                    });
                                  }}
                                  aria-label={`Rate for ${sub.label}`}
                                  className="w-20 px-1.5 py-0.5 text-right font-mono bg-white border border-[#d2d2d7] rounded"
                                />
                                <input
                                  type="number"
                                  step="0.5"
                                  min={0}
                                  value={sub.defaultQty}
                                  onChange={(e) => {
                                    const nextQty = Math.max(0, Number(e.target.value) || 0);
                                    handleUpdateTariff(t.id, {
                                      subItems: t.subItems?.map((s) =>
                                        s.id === sub.id ? { ...s, defaultQty: nextQty } : s
                                      ),
                                    });
                                  }}
                                  aria-label={`Default qty for ${sub.label}`}
                                  className="w-14 px-1.5 py-0.5 text-right font-mono bg-white border border-[#d2d2d7] rounded"
                                  title={lang === 'es' ? 'Cant. base' : 'Default qty'}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateTariff(t.id, {
                                      subItems: t.subItems?.filter((s) => s.id !== sub.id),
                                    })
                                  }
                                  aria-label={`Remove ${sub.label}`}
                                  className="p-0.5 text-[#6e6e73] hover:text-[#dc2626]"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <TariffSubItemAdder
                        tariff={t}
                        lang={lang}
                        onAdd={(newSub) => {
                          const existing = t.subItems ?? [];
                          const baseList: PdaSubItemDef[] =
                            existing.length > 0
                              ? existing
                              : [
                                  {
                                    id: `sub-base-${t.id}`,
                                    label: `${t.concept} (Base)`,
                                    labelEn: `${t.conceptEn} (Base)`,
                                    unitLabel: lang === 'es' ? 'Base' : 'Base',
                                    rate: t.rate,
                                    calcMode: 'per_qty',
                                    defaultQty: 1,
                                  },
                                ];
                          handleUpdateTariff(t.id, {
                            formulaType: 'sub_items_breakdown',
                            showZeroAmount: true,
                            subItems: [...baseList, newSub],
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* PDA Format Presets Manager */}
              <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3">
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es'
                    ? 'Formatos / Plantillas PDA disponibles'
                    : 'Available PDA Format Presets'}
                </div>
                <form onSubmit={handleAddPdaFormat} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    required
                    value={newFormatName}
                    onChange={(e) => setNewFormatName(e.target.value)}
                    placeholder={lang === 'es' ? 'Nombre del formato PDA' : 'Preset name'}
                    className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <select
                    value={newFormatVesselType}
                    onChange={(e) => setNewFormatVesselType(e.target.value as PdaVesselType)}
                    className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  >
                    {PDA_VESSEL_TYPE_OPTIONS.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newFormatPurpose}
                    onChange={(e) => setNewFormatPurpose(e.target.value as PdaPurpose)}
                    className="px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  >
                    {PDA_PURPOSE_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newFormatCargo}
                      onChange={(e) => setNewFormatCargo(e.target.value)}
                      placeholder="Cargo"
                      className="flex-1 min-w-0 px-2 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                    />
                    <input
                      type="number"
                      value={newFormatQty}
                      onChange={(e) => setNewFormatQty(Number(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-[12px] font-medium text-white bg-[#1d1d1f] rounded-lg"
                  >
                    {lang === 'es' ? '+ Formato PDA' : '+ Add Preset'}
                  </button>
                </form>

                <div className="space-y-1.5">
                  {(hubState.pdaFormats ?? []).map((fmt) => (
                    <div
                      key={fmt.id}
                      className="px-3 py-2 bg-white border border-[#e5e5ea] rounded-lg flex items-center justify-between gap-2 text-[12px]"
                    >
                      <div>
                        <span className="font-semibold text-[#1d1d1f]">
                          {lang === 'es' ? fmt.name : fmt.nameEn}
                        </span>
                        <span className="text-[#6e6e73] ml-2">
                          {fmt.vesselType} · {fmt.purpose} · {fmt.defaultCargo} ({fmt.defaultQuantity.toLocaleString('en-US')} MT)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePdaFormat(fmt.id)}
                        className="p-1 text-[#6e6e73] hover:text-[#dc2626]"
                        aria-label="Delete preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ISS Office Full Style & Bank Details Editor */}
              {(() => {
                const prof =
                  hubState.pdaOfficeProfile ?? INITIAL_HUB_STATE.pdaOfficeProfile!;
                return (
                  <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3">
                    <div className="text-[13px] font-semibold text-[#1d1d1f]">
                      {lang === 'es'
                        ? 'Datos de Oficina ISS y Cuenta Bancaria (Pie del PDF PDA)'
                        : 'ISS Office Full Style & Bank Details (PDA PDF Footer)'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px]">
                      <input
                        type="text"
                        value={prof.officeTitle}
                        onChange={(e) => handleUpdateOfficeProfile({ officeTitle: e.target.value })}
                        placeholder="Office Title"
                        className="px-2.5 py-1.5 bg-white border border-[#d2d2d7] rounded-lg"
                      />
                      <input
                        type="text"
                        value={prof.telephone}
                        onChange={(e) => handleUpdateOfficeProfile({ telephone: e.target.value })}
                        placeholder="Telephone"
                        className="px-2.5 py-1.5 bg-white border border-[#d2d2d7] rounded-lg"
                      />
                      <input
                        type="text"
                        value={prof.addressLine1}
                        onChange={(e) => handleUpdateOfficeProfile({ addressLine1: e.target.value })}
                        placeholder="Address Line 1"
                        className="px-2.5 py-1.5 bg-white border border-[#d2d2d7] rounded-lg"
                      />
                      <input
                        type="text"
                        value={prof.addressLine2}
                        onChange={(e) => handleUpdateOfficeProfile({ addressLine2: e.target.value })}
                        placeholder="Address Line 2"
                        className="px-2.5 py-1.5 bg-white border border-[#d2d2d7] rounded-lg"
                      />
                      <input
                        type="text"
                        value={prof.bankName}
                        onChange={(e) => handleUpdateOfficeProfile({ bankName: e.target.value })}
                        placeholder="Bank Name"
                        className="px-2.5 py-1.5 bg-white border border-[#d2d2d7] rounded-lg"
                      />
                      <input
                        type="text"
                        value={prof.accountNo}
                        onChange={(e) => handleUpdateOfficeProfile({ accountNo: e.target.value })}
                        placeholder="IBAN / Account No."
                        className="px-2.5 py-1.5 font-mono bg-white border border-[#d2d2d7] rounded-lg"
                      />
                      <input
                        type="text"
                        value={prof.swiftNumber}
                        onChange={(e) => handleUpdateOfficeProfile({ swiftNumber: e.target.value })}
                        placeholder="SWIFT"
                        className="px-2.5 py-1.5 font-mono bg-white border border-[#d2d2d7] rounded-lg"
                      />
                      <input
                        type="text"
                        value={prof.accountOwner}
                        onChange={(e) => handleUpdateOfficeProfile({ accountOwner: e.target.value })}
                        placeholder="Account Owner"
                        className="px-2.5 py-1.5 bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 9: ORG CHART & DIRECTORY */}
          {tab === 'directory' && (
            <div className="space-y-6">
              {/* Full Hierarchical Org Chart Editor */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[14px] font-semibold text-[#1d1d1f]">
                      {lang === 'es'
                        ? 'Editor completo del Organigrama Empresarial'
                        : 'Full Corporate Org Chart Editor'}
                    </div>
                    <p className="text-[12px] text-[#6e6e73]">
                      {lang === 'es'
                        ? 'Reordena nodos, agrega cargos en la misma línea o en un subnivel, y añade subdepartamentos o campos por tarjeta.'
                        : 'Reorder nodes, add sibling or child positions, and manage nested sub-departments and custom fields.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(hubState.orgChart ?? []).map((node, idx, arr) => (
                    <div
                      key={node.id}
                      className="p-4 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] space-y-3"
                    >
                      {/* Primary Node Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#e5e5ea]">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveOrgNode(node.id, -1)}
                              disabled={idx === 0}
                              aria-label="Move node up"
                              className="p-1 bg-white border border-[#d2d2d7] rounded disabled:opacity-40"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrgNode(node.id, 1)}
                              disabled={idx === arr.length - 1}
                              aria-label="Move node down"
                              className="p-1 bg-white border border-[#d2d2d7] rounded disabled:opacity-40"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <select
                            value={node.level}
                            onChange={(e) =>
                              handleUpdateOrgNode(node.id, {
                                level: Number(e.target.value) as 1 | 2 | 3,
                              })
                            }
                            aria-label="Node tier level"
                            className="px-2 py-1 text-[11px] font-mono font-semibold text-[#0066cc] bg-white border border-[#d2d2d7] rounded"
                          >
                            <option value={1}>L1 Dirección</option>
                            <option value={2}>L2 Gerencia / Área</option>
                            <option value={3}>L3 Coordinación / Turno</option>
                          </select>

                          <select
                            value={node.reportsTo ?? ''}
                            onChange={(e) =>
                              handleUpdateOrgNode(node.id, {
                                reportsTo: e.target.value || undefined,
                              })
                            }
                            aria-label="Reports to"
                            className="px-2 py-1 text-[11px] bg-white border border-[#d2d2d7] rounded max-w-[190px]"
                          >
                            <option value="">
                              {lang === 'es' ? 'Sin superior (Raíz)' : 'No parent (Root)'}
                            </option>
                            {arr
                              .filter((candidate) => candidate.id !== node.id)
                              .map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  → {lang === 'es' ? candidate.title : candidate.titleEn}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddOrgNodeRelative(node, 'sibling')}
                            className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded"
                          >
                            + {lang === 'es' ? 'En la misma línea' : 'Same-level node'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddOrgNodeRelative(node, 'child')}
                            className="px-2.5 py-1 text-[11px] font-medium text-[#0066cc] bg-white hover:bg-[#eef6ff] border border-[#cde3ff] rounded"
                          >
                            + {lang === 'es' ? 'Subnodo / Subnivel' : 'Child sub-node'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrgNode(node.id)}
                            aria-label="Delete org node"
                            className="p-1 text-[#6e6e73] hover:text-[#dc2626]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={lang === 'es' ? node.department : node.departmentEn}
                          onChange={(e) =>
                            handleUpdateOrgNode(
                              node.id,
                              lang === 'es'
                                ? { department: e.target.value }
                                : { departmentEn: e.target.value }
                            )
                          }
                          placeholder={lang === 'es' ? 'Departamento' : 'Department'}
                          className="sm:col-span-3 px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                        />
                        <input
                          type="text"
                          value={lang === 'es' ? node.title : node.titleEn}
                          onChange={(e) =>
                            handleUpdateOrgNode(
                              node.id,
                              lang === 'es'
                                ? { title: e.target.value }
                                : { titleEn: e.target.value }
                            )
                          }
                          placeholder={lang === 'es' ? 'Cargo / Puesto' : 'Role / Title'}
                          className="sm:col-span-3 px-2.5 py-1.5 text-[12px] font-medium bg-white border border-[#d2d2d7] rounded-md"
                        />
                        <input
                          type="text"
                          value={node.holderOrTeam}
                          onChange={(e) =>
                            handleUpdateOrgNode(node.id, { holderOrTeam: e.target.value })
                          }
                          placeholder={lang === 'es' ? 'Titular o equipo' : 'Holder / Team'}
                          className="sm:col-span-3 px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-md"
                        />
                        <input
                          type="email"
                          value={node.email ?? ''}
                          onChange={(e) =>
                            handleUpdateOrgNode(node.id, { email: e.target.value })
                          }
                          placeholder="Email"
                          className="sm:col-span-3 px-2.5 py-1.5 text-[11px] font-mono bg-white border border-[#d2d2d7] rounded-md"
                        />
                      </div>

                      {/* Node Custom Fields */}
                      <div className="pl-3 border-l-2 border-[#d2d2d7] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#424245]">
                          <span>
                            {lang === 'es' ? 'Campos del nodo' : 'Node custom fields'} (
                            {node.customFields?.length ?? 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddOrgCustomField(node.id)}
                            className="inline-flex items-center gap-1 text-[#0066cc] hover:underline"
                          >
                            <Plus className="w-3 h-3" />
                            {lang === 'es' ? 'Agregar campo' : 'Add field'}
                          </button>
                        </div>
                        {(node.customFields ?? []).map((cf) => (
                          <div key={cf.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={cf.label}
                              onChange={(e) =>
                                handleUpdateOrgCustomField(node.id, cf.id, {
                                  label: e.target.value,
                                })
                              }
                              className="w-40 px-2 py-1 text-[11px] font-medium bg-white border border-[#d2d2d7] rounded"
                            />
                            <input
                              type="text"
                              value={cf.value}
                              onChange={(e) =>
                                handleUpdateOrgCustomField(node.id, cf.id, {
                                  value: e.target.value,
                                })
                              }
                              className="flex-1 px-2 py-1 text-[11px] bg-white border border-[#d2d2d7] rounded"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteOrgCustomField(node.id, cf.id)}
                              className="p-1 text-[#6e6e73] hover:text-[#dc2626]"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Node Nested Sub-Departments */}
                      <div className="pl-3 border-l-2 border-[#0066cc]/40 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#0066cc]">
                          <span>
                            {lang === 'es' ? 'Subdepartamentos' : 'Sub-departments'} (
                            {node.subDepartments?.length ?? 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddOrgSubDept(node.id)}
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3 h-3" />
                            {lang === 'es' ? 'Agregar subdepartamento' : 'Add sub-department'}
                          </button>
                        </div>

                        {(node.subDepartments ?? []).map((sub) => (
                          <div
                            key={sub.id}
                            className="p-2.5 bg-white border border-[#d2d2d7] rounded-lg space-y-2"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
                              <input
                                type="text"
                                value={lang === 'es' ? sub.name : sub.nameEn ?? sub.name}
                                onChange={(e) =>
                                  handleUpdateOrgSubDept(
                                    node.id,
                                    sub.id,
                                    lang === 'es'
                                      ? { name: e.target.value }
                                      : { nameEn: e.target.value }
                                  )
                                }
                                placeholder="Subdepartamento"
                                className="sm:col-span-4 px-2 py-1 text-[11.5px] font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                              />
                              <input
                                type="text"
                                value={sub.leadOrTeam}
                                onChange={(e) =>
                                  handleUpdateOrgSubDept(node.id, sub.id, {
                                    leadOrTeam: e.target.value,
                                  })
                                }
                                placeholder="Responsable"
                                className="sm:col-span-4 px-2 py-1 text-[11.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                              />
                              <input
                                type="email"
                                value={sub.email ?? ''}
                                onChange={(e) =>
                                  handleUpdateOrgSubDept(node.id, sub.id, {
                                    email: e.target.value,
                                  })
                                }
                                placeholder="Email"
                                className="sm:col-span-3 px-2 py-1 text-[11px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteOrgSubDept(node.id, sub.id)}
                                className="sm:col-span-1 justify-self-end p-1 text-[#6e6e73] hover:text-[#dc2626]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-[10.5px] text-[#6e6e73]">
                              <span>
                                {lang === 'es' ? 'Campos internos:' : 'Nested fields:'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddOrgCustomField(node.id, sub.id)}
                                className="text-[#0066cc] hover:underline"
                              >
                                + {lang === 'es' ? 'Campo' : 'Field'}
                              </button>
                            </div>

                            {(sub.fields ?? []).map((sf) => (
                              <div key={sf.id} className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={sf.label}
                                  onChange={(e) =>
                                    handleUpdateOrgCustomField(
                                      node.id,
                                      sf.id,
                                      { label: e.target.value },
                                      sub.id
                                    )
                                  }
                                  className="w-36 px-2 py-0.5 text-[11px] bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                                />
                                <input
                                  type="text"
                                  value={sf.value}
                                  onChange={(e) =>
                                    handleUpdateOrgCustomField(
                                      node.id,
                                      sf.id,
                                      { value: e.target.value },
                                      sub.id
                                    )
                                  }
                                  className="flex-1 px-2 py-0.5 text-[11px] bg-[#f5f5f7] border border-[#d2d2d7] rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteOrgCustomField(node.id, sf.id, sub.id)
                                  }
                                  className="p-0.5 text-[#6e6e73] hover:text-[#dc2626]"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Directory Contact */}
              <form
                onSubmit={handleAddDirectory}
                className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3"
              >
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es' ? 'Agregar contacto al directorio' : 'Add directory contact'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <select
                    value={newDirCategory}
                    onChange={(e) => setNewDirCategory(e.target.value as DirectoryCategory)}
                    aria-label="Directory category"
                    className="px-3 py-2 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  >
                    {DIR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {DIR_CATEGORY_LABELS[c][lang]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={newDirOrg}
                    onChange={(e) => setNewDirOrg(e.target.value)}
                    placeholder="Organización / Empresa"
                    className="px-3 py-2 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="text"
                    required
                    value={newDirContact}
                    onChange={(e) => setNewDirContact(e.target.value)}
                    placeholder="Nombre de contacto / área"
                    className="px-3 py-2 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    value={newDirRole}
                    onChange={(e) => setNewDirRole(e.target.value)}
                    placeholder="Cargo / Rol"
                    className="px-3 py-2 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="email"
                    value={newDirEmail}
                    onChange={(e) => setNewDirEmail(e.target.value)}
                    placeholder="Email"
                    className="px-3 py-2 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <input
                    type="text"
                    value={newDirPhone}
                    onChange={(e) => setNewDirPhone(e.target.value)}
                    placeholder="Teléfono"
                    className="px-3 py-2 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-[12px] font-medium text-white bg-[#0066cc] rounded-lg"
                  >
                    {lang === 'es' ? '+ Contacto' : '+ Contact'}
                  </button>
                </div>
              </form>

              {/* Edit Existing Contacts */}
              <div className="space-y-2">
                {portDirectory.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl border border-[#e5e5ea] bg-white grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <input
                      type="text"
                      value={d.organization}
                      onChange={(e) =>
                        handleUpdateDirectory(d.id, { organization: e.target.value })
                      }
                      aria-label="Organization"
                      className="sm:col-span-3 px-2.5 py-1.5 text-[12px] font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                    <input
                      type="text"
                      value={d.contactName}
                      onChange={(e) =>
                        handleUpdateDirectory(d.id, { contactName: e.target.value })
                      }
                      aria-label="Contact name"
                      className="sm:col-span-3 px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                    <input
                      type="email"
                      value={d.email}
                      onChange={(e) =>
                        handleUpdateDirectory(d.id, { email: e.target.value })
                      }
                      aria-label="Contact email"
                      className="sm:col-span-3 px-2.5 py-1.5 text-[11px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                    <input
                      type="text"
                      value={d.phone}
                      onChange={(e) =>
                        handleUpdateDirectory(d.id, { phone: e.target.value })
                      }
                      aria-label="Contact phone"
                      className="sm:col-span-2 px-2.5 py-1.5 text-[11px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteDirectory(d.id)}
                      aria-label="Delete contact"
                      className="sm:col-span-1 justify-self-end p-1 text-[#6e6e73] hover:text-[#dc2626]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: SOPs, OPTIC & APPS SCRIPT */}
          {tab === 'apps' && (
            <div className="space-y-6">
              <div className="space-y-2.5">
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  Apps Script (3)
                </div>
                {hubState.appsScripts.map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    <input
                      type="text"
                      value={lang === 'es' ? app.name : app.nameEn ?? app.name}
                      onChange={(e) =>
                        handleUpdateAppScript(
                          app.id,
                          lang === 'es' ? { name: e.target.value } : { nameEn: e.target.value }
                        )
                      }
                      aria-label="App name"
                      className="px-3 py-2 text-[13px] font-medium bg-white border border-[#d2d2d7] rounded-lg"
                    />
                    <input
                      type="url"
                      value={app.url}
                      onChange={(e) =>
                        handleUpdateAppScript(app.id, {
                          url: e.target.value,
                          status: 'Enlace activo',
                        })
                      }
                      aria-label="Apps Script URL"
                      placeholder="https://script.google.com/macros/s/..."
                      className="px-3 py-2 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es' ? 'Protocolos y SOPs' : 'Operational SOPs'}
                </div>
                {hubState.procedures.map((proc) => (
                  <div
                    key={proc.id}
                    className="p-3.5 rounded-xl border border-[#e5e5ea] bg-white space-y-2"
                  >
                    <input
                      type="text"
                      value={lang === 'es' ? proc.title : proc.titleEn}
                      onChange={(e) =>
                        handleUpdateProcedure(
                          proc.id,
                          lang === 'es'
                            ? { title: e.target.value }
                            : { titleEn: e.target.value }
                        )
                      }
                      aria-label="Procedure title"
                      className="w-full px-3 py-1.5 text-[13px] font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                    />
                    <textarea
                      rows={2}
                      value={lang === 'es' ? proc.summary : proc.summaryEn ?? proc.summary}
                      onChange={(e) =>
                        handleUpdateProcedure(
                          proc.id,
                          lang === 'es'
                            ? { summary: e.target.value }
                            : { summaryEn: e.target.value }
                        )
                      }
                      aria-label="Procedure summary"
                      className="w-full px-3 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                <div className="text-[13px] font-semibold text-[#1d1d1f]">
                  {lang === 'es' ? 'Diccionario Optic' : 'Optic Dictionary'}
                </div>
                {hubState.opticGlossary.map((opt) => (
                  <div
                    key={opt.id}
                    className="p-3 rounded-xl border border-[#e5e5ea] bg-white grid grid-cols-1 sm:grid-cols-12 gap-2"
                  >
                    <input
                      type="text"
                      value={opt.code}
                      onChange={(e) => handleUpdateOptic(opt.id, { code: e.target.value })}
                      aria-label="Optic code"
                      className="sm:col-span-2 px-2.5 py-1.5 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                    <input
                      type="text"
                      value={lang === 'es' ? opt.term : opt.termEn ?? opt.term}
                      onChange={(e) =>
                        handleUpdateOptic(
                          opt.id,
                          lang === 'es' ? { term: e.target.value } : { termEn: e.target.value }
                        )
                      }
                      aria-label="Optic term"
                      className="sm:col-span-4 px-2.5 py-1.5 text-[12px] font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                    <input
                      type="text"
                      value={lang === 'es' ? opt.definition : opt.definitionEn ?? opt.definition}
                      onChange={(e) =>
                        handleUpdateOptic(
                          opt.id,
                          lang === 'es'
                            ? { definition: e.target.value }
                            : { definitionEn: e.target.value }
                        )
                      }
                      aria-label="Optic definition"
                      className="sm:col-span-6 px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* TAB: PRODUCT TECHNICAL DOSSIERS */}
          {tab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={editingDossier?.id ?? ''}
                    onChange={(e) => setSelectedDossierId(e.target.value)}
                    aria-label={lang === 'es' ? 'Seleccionar producto' : 'Select commodity'}
                    className="px-3 py-2 text-[13px] font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg max-w-md"
                  >
                    {portDossiers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} · {lang === 'es' ? d.name : d.nameEn}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddProductDossier}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-white bg-[#0066cc] rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {lang === 'es' ? 'Nueva ficha de producto' : 'New product dossier'}
                  </button>
                </div>

                {editingDossier && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProductDossier(editingDossier.id)}
                    className="inline-flex items-center gap-1 text-[12px] text-[#dc2626] hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {lang === 'es' ? 'Eliminar ficha' : 'Delete dossier'}
                  </button>
                )}
              </div>

              {editingDossier ? (
                <div className="p-4 rounded-xl border border-[#e5e5ea] bg-white space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Código' : 'Code'}
                      </label>
                      <input
                        type="text"
                        value={editingDossier.code}
                        onChange={(e) =>
                          handleUpdateProductDossier(editingDossier.id, {
                            code: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Nombre del producto (ES)' : 'Commodity Name (EN)'}
                      </label>
                      <input
                        type="text"
                        value={lang === 'es' ? editingDossier.name : editingDossier.nameEn}
                        onChange={(e) =>
                          handleUpdateProductDossier(
                            editingDossier.id,
                            lang === 'es'
                              ? { name: e.target.value }
                              : { nameEn: e.target.value }
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-[13px] font-semibold bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        UN / IMO
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={editingDossier.unNumber ?? ''}
                          onChange={(e) =>
                            handleUpdateProductDossier(editingDossier.id, {
                              unNumber: e.target.value,
                            })
                          }
                          placeholder="UN"
                          className="w-24 px-2 py-1.5 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                        />
                        <input
                          type="text"
                          value={editingDossier.imoClass ?? ''}
                          onChange={(e) =>
                            handleUpdateProductDossier(editingDossier.id, {
                              imoClass: e.target.value,
                            })
                          }
                          placeholder="IMO"
                          className="flex-1 px-2 py-1.5 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Muelles en puerto' : 'Authorized Berths'}
                      </label>
                      <input
                        type="text"
                        value={editingDossier.coatzacoalcosBerths}
                        onChange={(e) =>
                          handleUpdateProductDossier(editingDossier.id, {
                            coatzacoalcosBerths: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Terminales / Cesionarios' : 'Terminals / Concessionaires'}
                      </label>
                      <input
                        type="text"
                        value={editingDossier.concessionaires}
                        onChange={(e) =>
                          handleUpdateProductDossier(editingDossier.id, {
                            concessionaires: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  {/* HDS / PEMEX Safety Sheet Fields */}
                  <div className="p-3 rounded-lg bg-[#fffbeb] border border-[#fde68a] space-y-2.5">
                    <div className="text-[11.5px] font-semibold text-[#92400e]">
                      {lang === 'es'
                        ? 'Hoja de Datos de Seguridad (HDS PEMEX / SGA NOM-018)'
                        : 'Safety Data Sheet (PEMEX HDS / GHS)'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10.5px] text-[#6e6e73] mb-1">
                          CAS
                        </label>
                        <input
                          type="text"
                          value={editingDossier.casNumber ?? ''}
                          onChange={(e) =>
                            handleUpdateProductDossier(editingDossier.id, {
                              casNumber: e.target.value,
                            })
                          }
                          placeholder="ej. 67-64-1"
                          className="w-full px-2 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] text-[#6e6e73] mb-1">
                          {lang === 'es' ? 'Punto de Inflamación' : 'Flash Point'}
                        </label>
                        <input
                          type="text"
                          value={
                            lang === 'es'
                              ? editingDossier.flashPoint ?? ''
                              : editingDossier.flashPointEn ?? editingDossier.flashPoint ?? ''
                          }
                          onChange={(e) =>
                            handleUpdateProductDossier(
                              editingDossier.id,
                              lang === 'es'
                                ? { flashPoint: e.target.value }
                                : { flashPointEn: e.target.value }
                            )
                          }
                          placeholder="ej. -43 °C (copa cerrada)"
                          className="w-full px-2 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] text-[#6e6e73] mb-1">
                          NFPA 704 (S / I / R / E)
                        </label>
                        <input
                          type="text"
                          value={editingDossier.nfpa704 ?? ''}
                          onChange={(e) =>
                            handleUpdateProductDossier(editingDossier.id, {
                              nfpa704: e.target.value,
                            })
                          }
                          placeholder="ej. Salud 2 · Inflam. 3 · React. 0"
                          className="w-full px-2 py-1 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10.5px] text-[#6e6e73] mb-1">
                          {lang === 'es' ? 'Resumen HDS / Toxicidad' : 'HDS / Toxicity Summary'}
                        </label>
                        <textarea
                          rows={2}
                          value={
                            lang === 'es'
                              ? editingDossier.hdsPemexSummary ?? ''
                              : editingDossier.hdsPemexSummaryEn ??
                                editingDossier.hdsPemexSummary ??
                                ''
                          }
                          onChange={(e) =>
                            handleUpdateProductDossier(
                              editingDossier.id,
                              lang === 'es'
                                ? { hdsPemexSummary: e.target.value }
                                : { hdsPemexSummaryEn: e.target.value }
                            )
                          }
                          className="w-full px-2 py-1 text-[12px] bg-white border border-[#d2d2d7] rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] text-[#6e6e73] mb-1">
                          {lang === 'es' ? 'EPP Obligatorio' : 'Required PPE'}
                        </label>
                        <textarea
                          rows={2}
                          value={
                            lang === 'es'
                              ? editingDossier.ppeRequired ?? ''
                              : editingDossier.ppeRequiredEn ??
                                editingDossier.ppeRequired ??
                                ''
                          }
                          onChange={(e) =>
                            handleUpdateProductDossier(
                              editingDossier.id,
                              lang === 'es'
                                ? { ppeRequired: e.target.value }
                                : { ppeRequiredEn: e.target.value }
                            )
                          }
                          className="w-full px-2 py-1 text-[12px] bg-white border border-[#d2d2d7] rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? '01. Identidad del Producto' : '01. Commodity Identity'}
                      </label>
                      <textarea
                        rows={2}
                        value={
                          lang === 'es'
                            ? editingDossier.identity
                            : editingDossier.identityEn
                        }
                        onChange={(e) =>
                          handleUpdateProductDossier(
                            editingDossier.id,
                            lang === 'es'
                              ? { identity: e.target.value }
                              : { identityEn: e.target.value }
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? '02. Estado y Riesgo' : '02. Physical State & Hazard'}
                      </label>
                      <textarea
                        rows={2}
                        value={
                          lang === 'es'
                            ? editingDossier.stateAndHazard
                            : editingDossier.stateAndHazardEn
                        }
                        onChange={(e) =>
                          handleUpdateProductDossier(
                            editingDossier.id,
                            lang === 'es'
                              ? { stateAndHazard: e.target.value }
                              : { stateAndHazardEn: e.target.value }
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? '03. Compatibilidad' : '03. Compatibility'}
                      </label>
                      <textarea
                        rows={2}
                        value={
                          lang === 'es'
                            ? editingDossier.compatibility
                            : editingDossier.compatibilityEn
                        }
                        onChange={(e) =>
                          handleUpdateProductDossier(
                            editingDossier.id,
                            lang === 'es'
                              ? { compatibility: e.target.value }
                              : { compatibilityEn: e.target.value }
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? '04. Calidad y Muestreo' : '04. Quality & Sampling'}
                      </label>
                      <textarea
                        rows={2}
                        value={
                          lang === 'es'
                            ? editingDossier.qualityControl
                            : editingDossier.qualityControlEn
                        }
                        onChange={(e) =>
                          handleUpdateProductDossier(
                            editingDossier.id,
                            lang === 'es'
                              ? { qualityControl: e.target.value }
                              : { qualityControlEn: e.target.value }
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? '05. Temperatura y Presión' : '05. Temperature & Pressure'}
                      </label>
                      <textarea
                        rows={2}
                        value={
                          lang === 'es'
                            ? editingDossier.temperatureLimits
                            : editingDossier.temperatureLimitsEn
                        }
                        onChange={(e) =>
                          handleUpdateProductDossier(
                            editingDossier.id,
                            lang === 'es'
                              ? { temperatureLimits: e.target.value }
                              : { temperatureLimitsEn: e.target.value }
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? '06. Conexiones / Bridas' : '06. Connection Specs'}
                      </label>
                      <textarea
                        rows={2}
                        value={
                          lang === 'es'
                            ? editingDossier.connectionSpecs
                            : editingDossier.connectionSpecsEn
                        }
                        onChange={(e) =>
                          handleUpdateProductDossier(
                            editingDossier.id,
                            lang === 'es'
                              ? { connectionSpecs: e.target.value }
                              : { connectionSpecsEn: e.target.value }
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? '07. Método y Rates de Transferencia' : '07. Transfer Method & Rates'}
                      </label>
                      <textarea
                        rows={2}
                        value={
                          lang === 'es'
                            ? editingDossier.transferRates
                            : editingDossier.transferRatesEn
                        }
                        onChange={(e) =>
                          handleUpdateProductDossier(
                            editingDossier.id,
                            lang === 'es'
                              ? { transferRates: e.target.value }
                              : { transferRatesEn: e.target.value }
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? '08. Estabilidad / Inhibidores / Riesgos' : '08. Stability & Hazards'}
                      </label>
                      <textarea
                        rows={2}
                        value={
                          lang === 'es'
                            ? editingDossier.stabilityControl
                            : editingDossier.stabilityControlEn
                        }
                        onChange={(e) =>
                          handleUpdateProductDossier(
                            editingDossier.id,
                            lang === 'es'
                              ? { stabilityControl: e.target.value }
                              : { stabilityControlEn: e.target.value }
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-[#6e6e73] mb-1">
                        {lang === 'es' ? '09. Terminación y Purga de Línea' : '09. Termination & Line Purging'}
                      </label>
                      <textarea
                        rows={2}
                        value={
                          lang === 'es'
                            ? editingDossier.terminationProcedure
                            : editingDossier.terminationProcedureEn
                        }
                        onChange={(e) =>
                          handleUpdateProductDossier(
                            editingDossier.id,
                            lang === 'es'
                              ? { terminationProcedure: e.target.value }
                              : { terminationProcedureEn: e.target.value }
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#991b1b] mb-1">
                      {lang === 'es'
                        ? '10. Criterios de Rechazo / Parada de Emergencia'
                        : '10. Rejection / Emergency Stop Criteria'}
                    </label>
                    <textarea
                      rows={2}
                      value={
                        lang === 'es'
                          ? editingDossier.rejectionCriteria
                          : editingDossier.rejectionCriteriaEn
                      }
                      onChange={(e) =>
                        handleUpdateProductDossier(
                          editingDossier.id,
                          lang === 'es'
                            ? { rejectionCriteria: e.target.value }
                            : { rejectionCriteriaEn: e.target.value }
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-[12px] bg-[#fef2f2] border border-[#fecaca] rounded-lg text-[#7f1d1d]"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-[13px] text-[#6e6e73] bg-[#f5f5f7] rounded-xl">
                  {lang === 'es'
                    ? 'Aún no hay fichas técnicas individuales para este puerto. Pulsa "Nueva ficha de producto" para crear una.'
                    : 'No individual product dossiers for this port yet. Click "New product dossier" to add one.'}
                </div>
              )}
            </div>
          )}

          {/* TAB: AUTHORITIES & CREW CHANGE PROCEDURE */}
          {tab === 'authorities' && (() => {
            const authoritiesList = hubState.authorities ?? INITIAL_HUB_STATE.authorities ?? [];
            const crewCfg: CrewChangeGuideConfig =
              hubState.crewChangeProcedure ?? INITIAL_HUB_STATE.crewChangeProcedure!;
            const spareCfg: SparePartsProcedureConfig =
              hubState.sparePartsProcedure ?? INITIAL_HUB_STATE.sparePartsProcedure!;
            const AGENCY_CHOICES: AuthorityAgency[] = [
              'Aduana',
              'ASIPONA',
              'Capitanía de Puerto',
              'INM',
              'Sanidad Internacional',
              'SENASICA',
            ];

            const parseLines = (raw: string) =>
              raw
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean);

            const updateAuthoritiesList = (
              next: AuthorityRequirement[],
              msgEs = 'Autoridades actualizadas.',
              msgEn = 'Authorities updated.'
            ) => {
              onUpdateState((prev) => ({ ...prev, authorities: next }));
              notifySaved(lang === 'es' ? msgEs : msgEn);
            };

            const updateCrewCfg = (patch: Partial<CrewChangeGuideConfig>) => {
              onUpdateState((prev) => ({
                ...prev,
                crewChangeProcedure: {
                  ...(prev.crewChangeProcedure ?? crewCfg),
                  ...patch,
                  updatedAt: new Date().toISOString().slice(0, 10),
                },
              }));
              notifySaved(
                lang === 'es'
                  ? 'Crew Change Procedure actualizado.'
                  : 'Crew Change Procedure updated.'
              );
            };

            const updateSpareCfg = (patch: Partial<SparePartsProcedureConfig>) => {
              onUpdateState((prev) => ({
                ...prev,
                sparePartsProcedure: {
                  ...(prev.sparePartsProcedure ?? spareCfg),
                  ...patch,
                  updatedAt: new Date().toISOString().slice(0, 10),
                },
              }));
              notifySaved(
                lang === 'es'
                  ? 'Spare Parts Procedure actualizado.'
                  : 'Spare Parts Procedure updated.'
              );
            };

            return (
              <div className="space-y-6">
                {/* Drive Folder Shortcuts */}
                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3">
                  <div className="text-[13px] font-semibold text-[#1d1d1f]">
                    {lang === 'es'
                      ? 'Carpetas Drive de Respaldo y Formatos (Accesos Directos)'
                      : 'Backup & Formats Google Drive Folders (Direct Links)'}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        {lang === 'es'
                          ? 'Carpeta Drive para PDAs Generadas'
                          : 'Drive Folder for Generated PDAs'}
                      </label>
                      <input
                        type="url"
                        value={hubState.pdaDriveFolderUrl ?? ''}
                        onChange={(e) => {
                          onUpdateState((prev) => ({
                            ...prev,
                            pdaDriveFolderUrl: e.target.value,
                          }));
                        }}
                        placeholder="https://drive.google.com/drive/folders/..."
                        className="w-full px-3 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        {lang === 'es'
                          ? 'Carpeta Drive de Formatos de Autoridades'
                          : 'Authorities Formats Drive Folder URL'}
                      </label>
                      <input
                        type="url"
                        value={hubState.authoritiesDriveFolderUrl ?? ''}
                        onChange={(e) => {
                          onUpdateState((prev) => ({
                            ...prev,
                            authoritiesDriveFolderUrl: e.target.value,
                          }));
                        }}
                        placeholder="https://drive.google.com/drive/folders/..."
                        className="w-full px-3 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Maritime Authorities Cards */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[15px] font-display font-semibold text-[#1d1d1f]">
                        {lang === 'es'
                          ? 'Requerimientos, Circulares y Formatos de Autoridades'
                          : 'Authority Requirements, Notices & Downloadable Formats'}
                      </h4>
                      <p className="text-[12px] text-[#6e6e73]">
                        {lang === 'es'
                          ? 'Edita Aduana, ASIPONA, Capitanía de Puerto, INM, Sanidad Internacional y SENASICA; carga nuevas circulares o ligas de descarga.'
                          : 'Edit Customs, ASIPONA, Harbor Master, INM, International Health & SENASICA; add new notices or download links.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newItem: AuthorityRequirement = {
                          id: `auth-${Date.now()}`,
                          agency: 'SENASICA',
                          portId: 'ALL',
                          title: 'Nueva Circular / Requerimiento Operativo',
                          titleEn: 'New Operational Notice / Requirement',
                          summary: 'Descripción del requerimiento emitido por la autoridad.',
                          summaryEn: 'Summary of the newly issued authority requirement.',
                          newCircularNotice: 'Nueva circular vigente — verificar formatos antes de pre-arribo.',
                          newCircularNoticeEn: 'New notice active — verify required templates prior to arrival.',
                          effectiveDate: new Date().toISOString().slice(0, 10),
                          requiredDocuments: ['Formato oficial de autoridad'],
                          requiredDocumentsEn: ['Official authority template'],
                          restrictions: 'Aplicable previo a libre plática / inicio de maniobras.',
                          restrictionsEn: 'Applicable prior to free pratique / cargo operations.',
                          driveFolderUrl: hubState.authoritiesDriveFolderUrl ?? '',
                          formatLinks: [],
                          updatedAt: new Date().toISOString().slice(0, 10),
                        };
                        updateAuthoritiesList(
                          [newItem, ...authoritiesList],
                          'Nueva circular agregada.',
                          'New authority notice added.'
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {lang === 'es'
                        ? 'Nueva circular / requerimiento'
                        : 'New circular / requirement'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {authoritiesList.map((auth) => (
                      <div
                        key={auth.id}
                        className="p-4 rounded-xl bg-white border border-[#e5e5ea] space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={auth.agency}
                              onChange={(e) =>
                                updateAuthoritiesList(
                                  authoritiesList.map((item) =>
                                    item.id === auth.id
                                      ? { ...item, agency: e.target.value as AuthorityAgency }
                                      : item
                                  )
                                )
                              }
                              className="px-2.5 py-1 text-[12px] font-semibold bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                            >
                              {AGENCY_CHOICES.map((ag) => (
                                <option key={ag} value={ag}>
                                  {ag}
                                </option>
                              ))}
                            </select>
                            <select
                              value={auth.portId}
                              onChange={(e) =>
                                updateAuthoritiesList(
                                  authoritiesList.map((item) =>
                                    item.id === auth.id
                                      ? { ...item, portId: e.target.value }
                                      : item
                                  )
                                )
                              }
                              className="px-2.5 py-1 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                            >
                              <option value="ALL">
                                {lang === 'es' ? 'Todos los puertos' : 'All ports'}
                              </option>
                              <option value={portId}>{activePort?.name ?? portId}</option>
                            </select>
                            <input
                              type="date"
                              value={auth.effectiveDate}
                              onChange={(e) =>
                                updateAuthoritiesList(
                                  authoritiesList.map((item) =>
                                    item.id === auth.id
                                      ? { ...item, effectiveDate: e.target.value }
                                      : item
                                  )
                                )
                              }
                              className="px-2.5 py-1 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateAuthoritiesList(
                                authoritiesList.filter((item) => item.id !== auth.id),
                                'Requerimiento eliminado.',
                                'Requirement removed.'
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#dc2626] hover:bg-[#fef2f2] rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {lang === 'es' ? 'Eliminar' : 'Delete'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-[#6e6e73] mb-1">
                              {lang === 'es' ? 'Título (ES)' : 'Title (ES)'}
                            </label>
                            <input
                              type="text"
                              value={auth.title}
                              onChange={(e) =>
                                updateAuthoritiesList(
                                  authoritiesList.map((item) =>
                                    item.id === auth.id
                                      ? { ...item, title: e.target.value }
                                      : item
                                  )
                                )
                              }
                              className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-[#6e6e73] mb-1">
                              {lang === 'es' ? 'Aviso / Circular Reciente' : 'Recent Notice / Circular'}
                            </label>
                            <input
                              type="text"
                              value={auth.newCircularNotice ?? ''}
                              onChange={(e) =>
                                updateAuthoritiesList(
                                  authoritiesList.map((item) =>
                                    item.id === auth.id
                                      ? { ...item, newCircularNotice: e.target.value }
                                      : item
                                  )
                                )
                              }
                              className="w-full px-2.5 py-1.5 text-[12px] bg-[#fffbeb] border border-[#fde68a] rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-[#6e6e73] mb-1">
                              {lang === 'es' ? 'Resumen operativo' : 'Operational summary'}
                            </label>
                            <textarea
                              rows={2}
                              value={auth.summary}
                              onChange={(e) =>
                                updateAuthoritiesList(
                                  authoritiesList.map((item) =>
                                    item.id === auth.id
                                      ? { ...item, summary: e.target.value }
                                      : item
                                  )
                                )
                              }
                              className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-[#6e6e73] mb-1">
                              {lang === 'es' ? 'Restricciones / Horarios' : 'Restrictions / Hours'}
                            </label>
                            <textarea
                              rows={2}
                              value={auth.restrictions}
                              onChange={(e) =>
                                updateAuthoritiesList(
                                  authoritiesList.map((item) =>
                                    item.id === auth.id
                                      ? { ...item, restrictions: e.target.value }
                                      : item
                                  )
                                )
                              }
                              className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#6e6e73] mb-1">
                            {lang === 'es'
                              ? 'Documentos requeridos (uno por línea)'
                              : 'Required documents (one per line)'}
                          </label>
                          <textarea
                            rows={3}
                            value={auth.requiredDocuments.join('\n')}
                            onChange={(e) =>
                              updateAuthoritiesList(
                                authoritiesList.map((item) =>
                                  item.id === auth.id
                                    ? {
                                        ...item,
                                        requiredDocuments: parseLines(e.target.value),
                                      }
                                    : item
                                )
                              )
                            }
                            className="w-full px-2.5 py-1.5 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#6e6e73] mb-1">
                            {lang === 'es'
                              ? 'Carpeta Drive específica de esta autoridad (opcional)'
                              : 'Authority-specific Google Drive Folder URL (optional)'}
                          </label>
                          <input
                            type="url"
                            value={auth.driveFolderUrl ?? ''}
                            onChange={(e) =>
                              updateAuthoritiesList(
                                authoritiesList.map((item) =>
                                  item.id === auth.id
                                    ? { ...item, driveFolderUrl: e.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="w-full px-2.5 py-1.5 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                          />
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[#f0f0f3]">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-semibold text-[#1d1d1f]">
                                {lang === 'es'
                                  ? 'Ligas de Descarga / Justificaciones / Archivos Oficiales (Drive)'
                                  : 'Downloadable Files / Justifications / Official Links (Drive)'}
                              </span>
                              <p className="text-[10.5px] text-[#6e6e73]">
                                {lang === 'es'
                                  ? 'Pega cualquier enlace de archivo de Google Drive y el botón de la tarjeta lo descargará directo.'
                                  : 'Paste any Google Drive file URL and the card chip will trigger a direct download.'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                updateAuthoritiesList(
                                  authoritiesList.map((item) =>
                                    item.id === auth.id
                                      ? {
                                          ...item,
                                          formatLinks: [
                                            ...item.formatLinks,
                                            {
                                              id: `fmt-${Date.now()}`,
                                              label: lang === 'es' ? 'Documento / Justificación Oficial' : 'Official Document / Justification',
                                              url:
                                                auth.driveFolderUrl?.trim() ||
                                                hubState.authoritiesDriveFolderUrl?.trim() ||
                                                'https://drive.google.com/file/d/',
                                              docType: 'Archivo oficial',
                                            },
                                          ],
                                        }
                                      : item
                                  )
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#0066cc] bg-[#eef6ff] hover:bg-[#dcebff] border border-[#cde3ff] rounded-md"
                            >
                              <Plus className="w-3 h-3" />
                              {lang === 'es' ? 'Agregar archivo / Drive' : 'Add Drive file'}
                            </button>
                          </div>

                          {auth.formatLinks.map((lnk) => {
                            const resolved = resolveDocumentLinkUrl(lnk.url);
                            return (
                              <div key={lnk.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                                <input
                                  type="text"
                                  value={lnk.label}
                                  onChange={(e) =>
                                    updateAuthoritiesList(
                                      authoritiesList.map((item) =>
                                        item.id === auth.id
                                          ? {
                                              ...item,
                                              formatLinks: item.formatLinks.map((f) =>
                                                f.id === lnk.id
                                                  ? { ...f, label: e.target.value }
                                                  : f
                                              ),
                                            }
                                          : item
                                      )
                                    )
                                  }
                                  placeholder="Nombre del archivo o justificación"
                                  className="md:col-span-4 px-2.5 py-1 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                                />
                                <div className="md:col-span-5 space-y-0.5">
                                  <input
                                    type="url"
                                    value={lnk.url}
                                    onChange={(e) =>
                                      updateAuthoritiesList(
                                        authoritiesList.map((item) =>
                                          item.id === auth.id
                                            ? {
                                                ...item,
                                                formatLinks: item.formatLinks.map((f) =>
                                                  f.id === lnk.id
                                                    ? { ...f, url: e.target.value }
                                                    : f
                                                ),
                                              }
                                            : item
                                        )
                                      )
                                    }
                                    placeholder="https://drive.google.com/file/d/.../view"
                                    className="w-full px-2.5 py-1 text-[12px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                                  />
                                  {resolved.isDrive && resolved.isDirectDownload && (
                                    <div className="text-[10px] font-medium text-[#0066cc]">
                                      {lang === 'es'
                                        ? '↓ Enlace Drive detectado: descarga directa automática'
                                        : '↓ Drive file detected: direct download enabled'}
                                    </div>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  list="auth-doctype-presets"
                                  value={lnk.docType ?? ''}
                                  onChange={(e) =>
                                    updateAuthoritiesList(
                                      authoritiesList.map((item) =>
                                        item.id === auth.id
                                          ? {
                                              ...item,
                                              formatLinks: item.formatLinks.map((f) =>
                                                f.id === lnk.id
                                                  ? { ...f, docType: e.target.value }
                                                  : f
                                              ),
                                            }
                                          : item
                                      )
                                    )
                                  }
                                  placeholder="Justificación / PDF"
                                  className="md:col-span-2 px-2.5 py-1 text-[12px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAuthoritiesList(
                                      authoritiesList.map((item) =>
                                        item.id === auth.id
                                          ? {
                                              ...item,
                                              formatLinks: item.formatLinks.filter(
                                                (f) => f.id !== lnk.id
                                              ),
                                            }
                                          : item
                                      )
                                    )
                                  }
                                  className="md:col-span-1 flex justify-center p-1 text-[#dc2626] hover:bg-[#fef2f2] rounded-md"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                          <datalist id="auth-doctype-presets">
                            <option value="Justificación" />
                            <option value="Archivo oficial" />
                            <option value="Formato oficial" />
                            <option value="Circular / Oficio" />
                            <option value="Restricción" />
                            <option value="Portal" />
                          </datalist>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full Crew Change Procedure Editor (integrated under INM / Migración) */}
                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-4">
                  <div>
                    <h4 className="text-[14px] font-display font-semibold text-[#1d1d1f]">
                      Crew Change Procedure — INM (Migración)
                    </h4>
                    <p className="text-[12px] text-[#6e6e73]">
                      {lang === 'es'
                        ? 'Edita todos los apartados del procedimiento migratorio, buscador de nacionalidades (Appendix A) e información de Información Pre-Arribo.'
                        : 'Edit all Crew Change Procedure immigration sections, Appendix A nationality list, and Pre-Arrival Information export fields.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Título Principal' : 'Main Title'}
                      </label>
                      <input
                        type="text"
                        value={crewCfg.title}
                        onChange={(e) => updateCrewCfg({ title: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Subtítulo' : 'Subtitle'}
                      </label>
                      <input
                        type="text"
                        value={crewCfg.subtitle}
                        onChange={(e) => updateCrewCfg({ subtitle: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                      01 · Entry Advisory
                    </label>
                    <textarea
                      rows={2}
                      value={crewCfg.entryAdvisory}
                      onChange={(e) => updateCrewCfg({ entryAdvisory: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        {lang === 'es'
                          ? 'Nacionalidades Exentas (1 por línea)'
                          : 'Visa-Exempt Notes (1 per line)'}
                      </label>
                      <textarea
                        rows={3}
                        value={crewCfg.visaExemptNotes.join('\n')}
                        onChange={(e) =>
                          updateCrewCfg({ visaExemptNotes: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        {lang === 'es'
                          ? 'Alternativas Calificadas de Visa (1 por línea)'
                          : 'Qualifying Visa Alternatives (1 per line)'}
                      </label>
                      <textarea
                        rows={3}
                        value={crewCfg.qualifyingAlternatives.join('\n')}
                        onChange={(e) =>
                          updateCrewCfg({ qualifyingAlternatives: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        02 · U.S. Visa Focus (C1/D1) (1 por línea)
                      </label>
                      <textarea
                        rows={3}
                        value={crewCfg.usC1d1Focus.join('\n')}
                        onChange={(e) =>
                          updateCrewCfg({ usC1d1Focus: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        03 · Risk Advisory & OK-to-Board Limits (1 por línea)
                      </label>
                      <textarea
                        rows={3}
                        value={crewCfg.riskAdvisoryBullets.join('\n')}
                        onChange={(e) =>
                          updateCrewCfg({ riskAdvisoryBullets: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        {lang === 'es'
                          ? 'Documentos Obligatorios Arribo Aéreo (1 por línea)'
                          : 'Mandatory Air Arrival Docs (1 per line)'}
                      </label>
                      <textarea
                        rows={3}
                        value={crewCfg.airArrivalMandatoryDocs.join('\n')}
                        onChange={(e) =>
                          updateCrewCfg({ airArrivalMandatoryDocs: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        04 · Required Pre-Arrival Docs List (1 por línea)
                      </label>
                      <textarea
                        rows={3}
                        value={crewCfg.requiredDocsList.join('\n')}
                        onChange={(e) =>
                          updateCrewCfg({ requiredDocsList: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                      Minimum Lead Time Notice
                    </label>
                    <input
                      type="text"
                      value={crewCfg.minimumLeadTimeNotice}
                      onChange={(e) =>
                        updateCrewCfg({ minimumLeadTimeNotice: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        05 · On-Signers Steps (1 por línea)
                      </label>
                      <textarea
                        rows={3}
                        value={crewCfg.onSignerSteps.join('\n')}
                        onChange={(e) =>
                          updateCrewCfg({ onSignerSteps: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        05 · Off-Signers Steps (1 por línea)
                      </label>
                      <textarea
                        rows={3}
                        value={crewCfg.offSignerSteps.join('\n')}
                        onChange={(e) =>
                          updateCrewCfg({ offSignerSteps: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        06 · Working Hours & Permits (1 por línea)
                      </label>
                      <textarea
                        rows={3}
                        value={crewCfg.workingHoursBullets.join('\n')}
                        onChange={(e) =>
                          updateCrewCfg({ workingHoursBullets: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        07 · Customs & Baggage Rules (1 por línea)
                      </label>
                      <textarea
                        rows={3}
                        value={crewCfg.customsBaggageBullets.join('\n')}
                        onChange={(e) =>
                          updateCrewCfg({ customsBaggageBullets: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                      Appendix A · Intro & Nationality Lists (1 país/línea)
                    </label>
                    <input
                      type="text"
                      value={crewCfg.appendixIntro}
                      onChange={(e) => updateCrewCfg({ appendixIntro: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg mb-2"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                          A – C Countries
                        </label>
                        <textarea
                          rows={4}
                          value={crewCfg.appendixAC.join('\n')}
                          onChange={(e) =>
                            updateCrewCfg({ appendixAC: parseLines(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                          D – M Countries
                        </label>
                        <textarea
                          rows={4}
                          value={crewCfg.appendixDM.join('\n')}
                          onChange={(e) =>
                            updateCrewCfg({ appendixDM: parseLines(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                          N – Z Countries
                        </label>
                        <textarea
                          rows={4}
                          value={crewCfg.appendixNZ.join('\n')}
                          onChange={(e) =>
                            updateCrewCfg({ appendixNZ: parseLines(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PDF / Sedna Download-only ISS Office Block */}
                  <div className="pt-3 border-t border-[#e5e5ea] space-y-3">
                    <div className="text-[12px] font-semibold text-[#1d1d1f]">
                      {lang === 'es'
                        ? 'Datos de Oficina ISS (Solo incluidos en el PDF y Sedna descargable; ocultos en la página web)'
                        : 'ISS Office Contact Block (Included ONLY in downloadable PDF & Sedna; hidden on webpage)'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                          Office Address (PDF / Sedna)
                        </label>
                        <input
                          type="text"
                          value={crewCfg.officeAddress}
                          onChange={(e) => updateCrewCfg({ officeAddress: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                          24/7 Regional Phone (PDF / Sedna)
                        </label>
                        <input
                          type="text"
                          value={crewCfg.regionalPhone}
                          onChange={(e) => updateCrewCfg({ regionalPhone: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                          Key Personnel (1 per line — PDF / Sedna)
                        </label>
                        <textarea
                          rows={2}
                          value={crewCfg.keyPersonnel.join('\n')}
                          onChange={(e) =>
                            updateCrewCfg({ keyPersonnel: parseLines(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                          Port Email Directory (1 per line — PDF / Sedna)
                        </label>
                        <textarea
                          rows={2}
                          value={crewCfg.emailDirectory.join('\n')}
                          onChange={(e) =>
                            updateCrewCfg({ emailDirectory: parseLines(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Spare Parts Procedure Editor (integrated under Aduana / Customs) */}
                <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-4">
                  <div>
                    <h4 className="text-[14px] font-display font-semibold text-[#1d1d1f]">
                      Spare Parts Procedure — Aduana (Customs)
                    </h4>
                    <p className="text-[12px] text-[#6e6e73]">
                      {lang === 'es'
                        ? 'Edita reglas aduanales de importación de refacciones, consignatario, tiempos de despacho, artículos restringidos y datos ISS para PDF/Sedna.'
                        : 'Edit customs spare parts importation guidelines, consignee formatting, clearance timelines, restricted items, and PDF/Sedna office block.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Título Principal' : 'Main Title'}
                      </label>
                      <input
                        type="text"
                        value={spareCfg.title}
                        onChange={(e) => updateSpareCfg({ title: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        {lang === 'es' ? 'Subtítulo' : 'Subtitle'}
                      </label>
                      <input
                        type="text"
                        value={spareCfg.subtitle}
                        onChange={(e) => updateSpareCfg({ subtitle: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Importation Notice (ES)
                      </label>
                      <textarea
                        rows={2}
                        value={spareCfg.importationNotice}
                        onChange={(e) => updateSpareCfg({ importationNotice: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Importation Notice (EN)
                      </label>
                      <textarea
                        rows={2}
                        value={spareCfg.importationNoticeEn}
                        onChange={(e) => updateSpareCfg({ importationNoticeEn: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Consignee Formulation
                      </label>
                      <input
                        type="text"
                        value={spareCfg.consigneeFormulation}
                        onChange={(e) => updateSpareCfg({ consigneeFormulation: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Customs Hours Note
                      </label>
                      <input
                        type="text"
                        value={spareCfg.customsHoursNote}
                        onChange={(e) => updateSpareCfg({ customsHoursNote: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Itemized Listing Note
                      </label>
                      <textarea
                        rows={2}
                        value={spareCfg.itemizedListingNote}
                        onChange={(e) => updateSpareCfg({ itemizedListingNote: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Detailed Explanation Required
                      </label>
                      <textarea
                        rows={2}
                        value={spareCfg.detailedExplanationNote}
                        onChange={(e) => updateSpareCfg({ detailedExplanationNote: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Routing: Small Packages (&lt;$500 USD)
                      </label>
                      <textarea
                        rows={2}
                        value={spareCfg.smallPackageRouting}
                        onChange={(e) => updateSpareCfg({ smallPackageRouting: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Routing: Large Shipments (&gt;$500 USD)
                      </label>
                      <textarea
                        rows={2}
                        value={spareCfg.largePackageRouting}
                        onChange={(e) => updateSpareCfg({ largePackageRouting: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Restricted Items Col. 1 (1 per line)
                      </label>
                      <textarea
                        rows={3}
                        value={spareCfg.restrictedItemsCol1.join('\n')}
                        onChange={(e) =>
                          updateSpareCfg({ restrictedItemsCol1: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Restricted Items Col. 2 (1 per line)
                      </label>
                      <textarea
                        rows={3}
                        value={spareCfg.restrictedItemsCol2.join('\n')}
                        onChange={(e) =>
                          updateSpareCfg({ restrictedItemsCol2: parseLines(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Pre-Approval &amp; Waybill Verification
                      </label>
                      <textarea
                        rows={2}
                        value={spareCfg.preApprovalNote}
                        onChange={(e) => updateSpareCfg({ preApprovalNote: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                        Invoice Address Footnote
                      </label>
                      <textarea
                        rows={2}
                        value={spareCfg.invoiceAddressFootnote}
                        onChange={(e) =>
                          updateSpareCfg({ invoiceAddressFootnote: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                      />
                    </div>
                  </div>

                  {/* PDF / Sedna Download-only ISS Consignee Block */}
                  <div className="pt-3 border-t border-[#e5e5ea] space-y-3">
                    <div className="text-[12px] font-semibold text-[#1d1d1f]">
                      {lang === 'es'
                        ? 'Consignatario y Dirección ISS (Solo incluidos en el PDF y Sedna descargable; ocultos en la página web)'
                        : 'ISS Consignee & Office Address (Included ONLY in downloadable PDF & Sedna; hidden on webpage)'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                          Office Company (PDF / Sedna)
                        </label>
                        <input
                          type="text"
                          value={spareCfg.officeCompany}
                          onChange={(e) => updateSpareCfg({ officeCompany: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                          Office Address (PDF / Sedna)
                        </label>
                        <input
                          type="text"
                          value={spareCfg.officeAddress}
                          onChange={(e) => updateSpareCfg({ officeAddress: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                          Office Phones (PDF / Sedna)
                        </label>
                        <input
                          type="text"
                          value={spareCfg.officePhones}
                          onChange={(e) => updateSpareCfg({ officePhones: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                          Office Website (PDF / Sedna)
                        </label>
                        <input
                          type="text"
                          value={spareCfg.officeWebsite}
                          onChange={(e) => updateSpareCfg({ officeWebsite: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#d2d2d7] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function TariffSubItemAdder({
  tariff,
  lang,
  onAdd,
}: {
  tariff: TariffItem;
  lang: Language;
  onAdd: (sub: PdaSubItemDef) => void;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [calcMode, setCalcMode] = useState<PdaSubItemCalcMode>('per_qty');
  const [rate, setRate] = useState<number>(0);
  const [defaultQty, setDefaultQty] = useState<number>(1);

  const handleSubmit = () => {
    const clean = label.trim();
    if (!clean) return;
    onAdd({
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: clean,
      labelEn: clean,
      unitLabel: calcMode === 'fixed' ? 'Cuota fija' : 'Por servicio',
      rate: Math.max(0, Number.isFinite(rate) ? rate : 0),
      calcMode,
      defaultQty: Math.max(0, Number.isFinite(defaultQty) ? defaultQty : 1),
    });
    setLabel('');
    setRate(0);
    setDefaultQty(1);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#0066cc] bg-[#eef6ff] hover:bg-[#dcebff] border border-[#cde3ff] rounded-md transition-colors"
      >
        <Plus className="w-3 h-3" />
        {lang === 'es' ? 'Agregar sub-servicio / valor al desplegable' : 'Add sub-service value'}
      </button>
    );
  }

  return (
    <div className="p-2.5 rounded-lg bg-[#f5f5f7] border border-[#d2d2d7] grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center text-[11px]">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={lang === 'es' ? 'Sub-servicio (ej. Lancha Autoridades)' : 'Sub-service label'}
        className="sm:col-span-4 px-2 py-1 bg-white border border-[#d2d2d7] rounded"
      />
      <select
        value={calcMode}
        onChange={(e) => setCalcMode(e.target.value as PdaSubItemCalcMode)}
        aria-label="Sub-service calculation mode"
        className="sm:col-span-3 px-2 py-1 bg-white border border-[#d2d2d7] rounded"
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
        value={rate}
        onChange={(e) => setRate(Number(e.target.value) || 0)}
        placeholder={tariff.currency}
        aria-label={`Rate (${tariff.currency})`}
        className="sm:col-span-2 px-2 py-1 text-right font-mono bg-white border border-[#d2d2d7] rounded"
      />
      <input
        type="number"
        step="0.5"
        min={0}
        value={defaultQty}
        onChange={(e) => setDefaultQty(Number(e.target.value) || 0)}
        placeholder="Qty"
        aria-label="Default quantity"
        className="sm:col-span-1 px-1.5 py-1 text-center font-mono bg-white border border-[#d2d2d7] rounded"
      />
      <div className="sm:col-span-2 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-2.5 py-1 font-medium text-white bg-[#042447] hover:bg-[#0b315d] rounded"
        >
          {lang === 'es' ? 'Agregar' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-1.5 py-1 text-[#6e6e73] hover:text-[#1d1d1f]"
        >
          ×
        </button>
      </div>
    </div>
  );
}

