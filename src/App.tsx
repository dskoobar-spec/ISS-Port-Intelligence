import { useEffect, useMemo, useState } from 'react';
import { Clock, Lock } from 'lucide-react';
import { INITIAL_HUB_STATE } from './data/coatzacoalcosSeed';
import { normalizeChargeSection } from './utils/pdaEngine';
import {
  formatShareExpirationDate,
  parseExclusiveShareLink,
  type ShareSectionKey,
} from './utils/shareLink';
import type {
  AuthorityAgency,
  AuthorityRequirement,
  HubState,
  Language,
  PdaFormatPreset,
  PdaHistoryRecord,
  TariffItem,
  TariffSheetSyncConfig,
  Terminal,
  VesselStatus,
} from './types/port';
import { TopNav } from './components/TopNav';
import { HeroSection } from './components/HeroSection';
import { PortStatusHistorySection } from './components/PortStatusHistorySection';
import { PortGeneralPositionSection } from './components/PortGeneralPositionSection';
import { RestrictionsAndWeather } from './components/RestrictionsAndWeather';
import { InteractivePortMap } from './components/InteractivePortMap';
import { TerminalsShowcase } from './components/TerminalsShowcase';
import { TerminalMinisiteModal } from './components/TerminalMinisiteModal';
import { CargoMatrixSection } from './components/CargoMatrixSection';
import { PortServicesSection } from './components/PortServicesSection';
import { VesselLineupSection } from './components/VesselLineupSection';
import { TariffsAndPdaSection } from './components/TariffsAndPdaSection';
import { AuthoritiesAndCrewSection } from './components/AuthoritiesAndCrewSection';
import { DirectoryAndKnowledgeSection } from './components/DirectoryAndKnowledgeSection';
import { DocumentCenterModal } from './components/DocumentCenterModal';
import { PreArrivalPackageModal } from './components/PreArrivalPackageModal';
import { ContentManagerModal, type ManagerTab } from './components/ContentManagerModal';

const STORAGE_KEY = 'iss_port_intelligence_hub_v9';

function mergeAuthorities(saved?: AuthorityRequirement[]): AuthorityRequirement[] {
  const defaults = INITIAL_HUB_STATE.authorities ?? [];
  if (!saved || saved.length === 0) return defaults;

  const defaultById = new Map(defaults.map((d) => [d.id, d]));
  const normalized: AuthorityRequirement[] = saved.map((item) => {
    const rawAgency = item.agency as string;
    const mappedAgency: AuthorityAgency =
      rawAgency === 'Capitanía / ASIPONA' ? 'ASIPONA' : item.agency;
    const normalizedItem: AuthorityRequirement = { ...item, agency: mappedAgency };
    const seedMatch = defaultById.get(normalizedItem.id);
    const needsBackfill =
      seedMatch &&
      (!normalizedItem.documentGroups ||
        normalizedItem.documentGroups.length === 0 ||
        normalizedItem.requiredDocuments.length < seedMatch.requiredDocuments.length ||
        normalizedItem.effectiveDate !== seedMatch.effectiveDate);
    if (needsBackfill && seedMatch) {
      return {
        ...seedMatch,
        newCircularNotice:
          normalizedItem.newCircularNotice &&
          normalizedItem.newCircularNotice !== seedMatch.newCircularNotice
            ? normalizedItem.newCircularNotice
            : seedMatch.newCircularNotice,
        formatLinks:
          normalizedItem.formatLinks.length > seedMatch.formatLinks.length
            ? normalizedItem.formatLinks
            : seedMatch.formatLinks,
      };
    }
    return normalizedItem;
  });

  const existingAgencies = new Set(normalized.map((item) => item.agency));
  const missingDefaults = defaults.filter((d) => !existingAgencies.has(d.agency));
  return [...normalized, ...missingDefaults];
}

function migrateTariffs(saved?: TariffItem[]): TariffItem[] {
  const defaults = INITIAL_HUB_STATE.tariffs;
  if (!saved || saved.length === 0) return defaults;

  const seedById = new Map(defaults.map((d) => [d.id, d]));
  const migrated = saved.map((t) => {
    const seedMatch = seedById.get(t.id);
    const normalizedSection = normalizeChargeSection(t.chargeSection);
    if (!seedMatch) {
      return { ...t, chargeSection: normalizedSection };
    }
    const hasCustomSubs = t.subItems && t.subItems.length > 0;
    return {
      ...t,
      chargeSection:
        t.chargeSection && (t.chargeSection as string) !== 'crew_port'
          ? normalizedSection
          : seedMatch.chargeSection ?? normalizedSection,
      formulaType:
        !t.formulaType || (!hasCustomSubs && seedMatch.formulaType === 'sub_items_breakdown')
          ? seedMatch.formulaType
          : t.formulaType,
      subItems: hasCustomSubs ? t.subItems : seedMatch.subItems,
      remarksTemplate: t.remarksTemplate ?? seedMatch.remarksTemplate,
      showZeroAmount:
        t.showZeroAmount !== undefined ? t.showZeroAmount : seedMatch.showZeroAmount,
    };
  });

  const existingIds = new Set(migrated.map((t) => t.id));
  const missingSeeds = defaults.filter((d) => !existingIds.has(d.id));
  return [...migrated, ...missingSeeds];
}

const REMOVED_LEGACY_PRESET_IDS = new Set([
  'fmt-coa-lpg',
  'fmt-coa-bulk',
  'fmt-coa-rail',
  'fmt-coa-steel',
]);

function migratePdaFormats(saved?: PdaFormatPreset[]): PdaFormatPreset[] {
  const defaults = INITIAL_HUB_STATE.pdaFormats ?? [];
  if (!saved || saved.length === 0) return defaults;
  const cleaned = saved.filter((f) => !REMOVED_LEGACY_PRESET_IDS.has(f.id));
  return cleaned.length > 0 ? cleaned : defaults;
}

function mergeTerminals(saved?: Terminal[]): Terminal[] {
  const defaults = INITIAL_HUB_STATE.terminals;
  if (!saved || saved.length === 0) return defaults;

  const seedById = new Map(defaults.map((d) => [d.id, d]));
  const merged = saved.map((t) => {
    const seedMatch = seedById.get(t.id);
    if (!seedMatch) return t;
    if (!t.commercialProfile && seedMatch.commercialProfile) {
      return {
        ...t,
        commercialProfile: seedMatch.commercialProfile,
        storageSummary: t.storageSummary ?? seedMatch.storageSummary,
        concessionaires:
          t.concessionaires && t.concessionaires.length >= (seedMatch.concessionaires?.length ?? 0)
            ? t.concessionaires
            : seedMatch.concessionaires,
        berths:
          t.berths && t.berths.length >= seedMatch.berths.length
            ? t.berths
            : seedMatch.berths,
      };
    }
    return t;
  });

  const existingIds = new Set(merged.map((t) => t.id));
  const missingSeeds = defaults.filter((d) => !existingIds.has(d.id));
  return [...merged, ...missingSeeds];
}

function loadInitialState(): HubState {
  if (typeof window === 'undefined') return INITIAL_HUB_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_HUB_STATE;
    const parsed = JSON.parse(raw) as Partial<HubState>;
    if (
      parsed &&
      Array.isArray(parsed.ports) &&
      parsed.ports.length >= INITIAL_HUB_STATE.ports.length &&
      Array.isArray(parsed.terminals) &&
      Array.isArray(parsed.lineup)
    ) {
      const savedCrew = parsed.crewChangeProcedure;
      const cleanedCrew = savedCrew
        ? {
            ...INITIAL_HUB_STATE.crewChangeProcedure!,
            ...savedCrew,
            title:
              savedCrew.title && savedCrew.title.toUpperCase().includes('SOP 2026')
                ? 'CREW CHANGE PROCEDURE'
                : savedCrew.title || INITIAL_HUB_STATE.crewChangeProcedure!.title,
          }
        : INITIAL_HUB_STATE.crewChangeProcedure;

      return {
        ...INITIAL_HUB_STATE,
        ...parsed,
        orgChart:
          parsed.orgChart && parsed.orgChart.length > 0
            ? parsed.orgChart
            : INITIAL_HUB_STATE.orgChart,
        statusHistory:
          parsed.statusHistory && parsed.statusHistory.length > 0
            ? parsed.statusHistory
            : INITIAL_HUB_STATE.statusHistory,
        productDossiers:
          parsed.productDossiers &&
          parsed.productDossiers.length >= (INITIAL_HUB_STATE.productDossiers?.length ?? 0)
            ? parsed.productDossiers
            : INITIAL_HUB_STATE.productDossiers,
        tariffs: migrateTariffs(parsed.tariffs),
        terminals: mergeTerminals(parsed.terminals),
        pdaFormats: migratePdaFormats(parsed.pdaFormats),
        pdaOfficeProfile:
          parsed.pdaOfficeProfile ?? INITIAL_HUB_STATE.pdaOfficeProfile,
        pdaDriveFolderUrl:
          parsed.pdaDriveFolderUrl || INITIAL_HUB_STATE.pdaDriveFolderUrl,
        pdaHistory: Array.isArray(parsed.pdaHistory)
          ? parsed.pdaHistory
          : INITIAL_HUB_STATE.pdaHistory ?? [],
        authorities: mergeAuthorities(parsed.authorities),
        authoritiesDriveFolderUrl:
          parsed.authoritiesDriveFolderUrl ?? INITIAL_HUB_STATE.authoritiesDriveFolderUrl,
        servicesDriveFolderUrl:
          parsed.servicesDriveFolderUrl ?? INITIAL_HUB_STATE.servicesDriveFolderUrl,
        crewChangeProcedure: cleanedCrew,
        sparePartsProcedure:
          parsed.sparePartsProcedure ?? INITIAL_HUB_STATE.sparePartsProcedure,
        tariffSheetSync: parsed.tariffSheetSync ?? INITIAL_HUB_STATE.tariffSheetSync,
      } as HubState;
    }
  } catch {
    // ignore malformed storage
  }
  return INITIAL_HUB_STATE;
}

function getInitialPortId(state: HubState): string {
  if (typeof window === 'undefined') return 'mxcoa';
  try {
    const shareState = parseExclusiveShareLink(window.location.search, state.ports);
    if (shareState.isExclusive && shareState.portId) {
      return shareState.portId;
    }
    const params = new URLSearchParams(window.location.search);
    const param = params.get('port')?.trim().toLowerCase();
    if (param) {
      const matched = state.ports.find(
        (p) =>
          p.id.toLowerCase() === param ||
          p.shortCode.toLowerCase() === param ||
          p.unLocode.toLowerCase() === param
      );
      if (matched) return matched.id;
    }
  } catch {
    // ignore query parse errors
  }
  return 'mxcoa';
}

export default function App() {
  const [hubState, setHubState] = useState<HubState>(loadInitialState);
  const [selectedPortId, setSelectedPortId] = useState<string>(() =>
    getInitialPortId(INITIAL_HUB_STATE)
  );
  const [lang, setLang] = useState<Language>('es');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [activeTerminalTab, setActiveTerminalTab] = useState<
    'berths' | 'sheets' | 'products' | 'concessionaires' | 'commercial'
  >('berths');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [preArrivalModalOpen, setPreArrivalModalOpen] = useState(false);
  const [contentManagerOpen, setContentManagerOpen] = useState(false);
  const [managerTab, setManagerTab] = useState<ManagerTab>('port');
  const [managerTerminalId, setManagerTerminalId] = useState<string | undefined>(undefined);
  const [managerBerthId, setManagerBerthId] = useState<string | undefined>(undefined);
  const [managerDossierId, setManagerDossierId] = useState<string | undefined>(undefined);

  const exclusiveShare = useMemo(
    () =>
      parseExclusiveShareLink(
        typeof window !== 'undefined' ? window.location.search : '',
        hubState.ports,
        nowMs
      ),
    [hubState.ports, nowMs]
  );

  useEffect(() => {
    if (!exclusiveShare.isExclusive) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [exclusiveShare.isExclusive]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(hubState));
    } catch {
      // ignore storage quota errors
    }
  }, [hubState]);

  const effectivePortId =
    exclusiveShare.isExclusive && exclusiveShare.portId
      ? exclusiveShare.portId
      : selectedPortId;

  const activePort =
    hubState.ports.find((p) => p.id === effectivePortId) ?? hubState.ports[0];

  const activeWeather = hubState.weather.find((w) => w.portId === activePort.id);

  const sharedTerminals = useMemo(() => {
    if (!exclusiveShare.isExclusive) return hubState.terminals;
    const allowedTerms = exclusiveShare.allowedTerminalIds;
    const allowedSubs = exclusiveShare.allowedSubterminalIds;

    return hubState.terminals
      .filter((t) => {
        if (t.portId !== activePort.id) return true;
        if (!allowedTerms) return true;
        return allowedTerms.includes(t.id);
      })
      .map((t) => {
        if (t.portId !== activePort.id || !allowedSubs || !t.concessionaires) {
          return t;
        }
        return {
          ...t,
          concessionaires: t.concessionaires.filter((c) => allowedSubs.includes(c.id)),
        };
      });
  }, [
    exclusiveShare.isExclusive,
    exclusiveShare.allowedTerminalIds,
    exclusiveShare.allowedSubterminalIds,
    hubState.terminals,
    activePort.id,
  ]);

  const activeTerminal = activeTerminalId
    ? sharedTerminals.find((t) => t.id === activeTerminalId) ?? null
    : null;
  const activeTerminalArea = activeTerminal
    ? hubState.areas.find((a) => a.id === activeTerminal.areaId)
    : undefined;

  const handleSelectPort = (portId: string) => {
    if (exclusiveShare.isExclusive) return;
    setSelectedPortId(portId);
    setActiveTerminalId(null);
    setActiveTerminalTab('berths');
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('port', portId);
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore URL update issues
      }
    }
  };

  const handleUpdateVesselStatus = (vesselId: string, status: VesselStatus) => {
    setHubState((prev) => ({
      ...prev,
      lineup: (prev.lineup ?? []).map((v) =>
        v.id === vesselId
          ? { ...v, status, updatedAt: new Date().toISOString().slice(0, 10) }
          : v
      ),
    }));
  };

  const openManager = (
    tab: ManagerTab,
    termId?: string,
    berthId?: string,
    dossierId?: string
  ) => {
    if (exclusiveShare.isExclusive) return;
    setManagerTab(tab);
    setManagerTerminalId(termId);
    setManagerBerthId(berthId);
    setManagerDossierId(dossierId);
    setContentManagerOpen(true);
  };

  const handleSyncTariffsFromSheet = ({
    items,
    formats,
    replacePortTariffs,
    config,
  }: {
    items: TariffItem[];
    formats?: PdaFormatPreset[];
    replacePortTariffs: boolean;
    config: TariffSheetSyncConfig;
  }) => {
    setHubState((prev) => {
      const affectedPortIds = new Set(items.map((item) => item.portId));
      const preserved =
        replacePortTariffs && items.length > 0
          ? prev.tariffs.filter((t) => !affectedPortIds.has(t.portId))
          : prev.tariffs;
      const existingFormats = prev.pdaFormats ?? [];
      const mergedFormats =
        formats && formats.length > 0
          ? [
              ...existingFormats.filter(
                (ef) => !formats.some((nf) => nf.id === ef.id || nf.name === ef.name)
              ),
              ...formats,
            ]
          : existingFormats;
      return {
        ...prev,
        tariffs: [...preserved, ...items],
        pdaFormats: mergedFormats,
        tariffSheetSync: config,
      };
    });
  };

  const handleAddTariffConcept = (tariff: TariffItem) => {
    setHubState((prev) => ({
      ...prev,
      tariffs: [...prev.tariffs, tariff],
    }));
  };

  const handleUpdateTariffConcept = (tariffId: string, patch: Partial<TariffItem>) => {
    setHubState((prev) => ({
      ...prev,
      tariffs: prev.tariffs.map((t) => (t.id === tariffId ? { ...t, ...patch } : t)),
    }));
  };

  const handleSavePdaFormat = (fmt: PdaFormatPreset) => {
    setHubState((prev) => {
      const existing = prev.pdaFormats ?? [];
      const exists = existing.some((f) => f.id === fmt.id);
      return {
        ...prev,
        pdaFormats: exists
          ? existing.map((f) => (f.id === fmt.id ? fmt : f))
          : [...existing, fmt],
      };
    });
  };

  const handleSavePdaHistoryRecord = (record: PdaHistoryRecord) => {
    setHubState((prev) => {
      const existing = prev.pdaHistory ?? [];
      const exists = existing.some((item) => item.id === record.id);
      const nextHistory = exists
        ? existing.map((item) => (item.id === record.id ? record : item))
        : [record, ...existing];
      return {
        ...prev,
        pdaHistory: nextHistory,
      };
    });
  };

  const handleDeletePdaHistoryRecord = (id: string) => {
    setHubState((prev) => ({
      ...prev,
      pdaHistory: (prev.pdaHistory ?? []).filter((item) => item.id !== id),
    }));
  };

  const handleResetSeed = () => {
    setHubState(INITIAL_HUB_STATE);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  if (exclusiveShare.isExclusive && exclusiveShare.isExpired) {
    const expiredLabel = exclusiveShare.expiresAtMs
      ? formatShareExpirationDate(exclusiveShare.expiresAtMs, lang)
      : null;

    return (
      <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-[#e5e5ea] rounded-2xl p-8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#6e6e73]">
              <Lock className="w-4 h-4 text-[#b91c1c]" />
              ISS Port Intelligence Hub
            </div>
            <div className="inline-flex items-center p-0.5 bg-[#f5f5f7] rounded-lg border border-[#d2d2d7]">
              <button
                type="button"
                onClick={() => setLang('es')}
                className={`px-2 py-1 text-[11.5px] font-medium rounded-md transition-colors ${
                  lang === 'es' ? 'bg-[#0066cc] text-white' : 'text-[#424245]'
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 text-[11.5px] font-medium rounded-md transition-colors ${
                  lang === 'en' ? 'bg-[#0066cc] text-white' : 'text-[#424245]'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-[26px] font-semibold tracking-tight text-[#1d1d1f]">
              {exclusiveShare.isTampered
                ? lang === 'es'
                  ? 'Enlace de Acceso Inválido'
                  : 'Invalid Shared Access Link'
                : lang === 'es'
                ? 'Enlace de Acceso Expirado'
                : 'Shared Access Link Expired'}
            </h1>
            <p className="text-[14.5px] leading-relaxed text-[#424245]">
              {exclusiveShare.isTampered
                ? lang === 'es'
                  ? 'La firma de verificación de este enlace exclusivo no coincide o está incompleta. Solicita a tu coordinador operativo en ISS México un nuevo enlace autorizado.'
                  : 'The verification signature on this exclusive port link is invalid or incomplete. Please request a newly authorized link from your ISS Mexico coordinator.'
                : lang === 'es'
                ? 'La vigencia temporal asignada a este enlace exclusivo por puerto ha concluido. Por seguridad operativa, la consulta pública ha sido cerrada.'
                : 'The temporary access window assigned to this single-port link has ended. Public portal viewing is now closed for operational security.'}
            </p>
          </div>

          {expiredLabel && !exclusiveShare.isTampered && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[13px] text-[#424245]">
              <Clock className="w-4 h-4 text-[#b91c1c] shrink-0" />
              <span>
                {lang === 'es' ? 'Vigencia expirada el:' : 'Access expired on:'}{' '}
                <strong className="font-mono text-[#1d1d1f]">{expiredLabel}</strong>
              </span>
            </div>
          )}

          <p className="text-[12px] text-[#6e6e73] border-t border-[#e5e5ea] pt-4">
            {lang === 'es'
              ? 'Contacto operativo: solicita la renovación del enlace exclusivo indicando el puerto requerido.'
              : 'Operational support: request an updated exclusive port link specifying the required Mexican port.'}
          </p>
        </div>
      </div>
    );
  }

  const canShowSection = (key: ShareSectionKey) =>
    !exclusiveShare.isExclusive || exclusiveShare.allowedSections.includes(key);

  const sharedSectionsArg = exclusiveShare.isExclusive
    ? exclusiveShare.allowedSections
    : undefined;

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <TopNav
        ports={hubState.ports}
        activePortId={activePort.id}
        lang={lang}
        isExclusiveMode={exclusiveShare.isExclusive}
        exclusiveExpiresAtMs={exclusiveShare.expiresAtMs}
        allowedSections={sharedSectionsArg}
        onToggleLang={setLang}
        onSelectPort={handleSelectPort}
        onOpenContentManager={() => openManager('port')}
        onOpenShareCenter={() => setShareModalOpen(true)}
        onOpenPreArrivalGenerator={() => setPreArrivalModalOpen(true)}
      />

      <main>
        <HeroSection
          port={activePort}
          allPorts={hubState.ports}
          areas={hubState.areas}
          weather={activeWeather}
          lang={lang}
          isExclusiveMode={exclusiveShare.isExclusive}
          exclusiveExpiresAtMs={exclusiveShare.expiresAtMs}
          allowedSections={sharedSectionsArg}
          onSelectPort={handleSelectPort}
          onOpenPreArrivalGenerator={() => setPreArrivalModalOpen(true)}
        />

        {exclusiveShare.isExclusive && exclusiveShare.allowedSections.length === 0 && (
          <section className="bg-[#f5f5f7] py-16 border-b border-[#e5e5ea]">
            <div className="max-w-xl mx-auto px-6 text-center space-y-2">
              <h2 className="font-display text-[20px] font-semibold text-[#1d1d1f]">
                {lang === 'es'
                  ? 'Vista pública configurada sin secciones visibles'
                  : 'Public shared view has no sections enabled'}
              </h2>
              <p className="text-[14px] text-[#424245]">
                {lang === 'es'
                  ? 'Este enlace exclusivo fue generado únicamente con el encabezado de puerto e Información Pre-Arribo.'
                  : 'This exclusive link was generated with port header and Pre-Arrival Information access only.'}
              </p>
            </div>
          </section>
        )}

        {/* 01. Estatus Portuario, Histórico de Cierres/Aperturas (izq) + Meteorología (der) */}
        {canShowSection('status_weather') && (
          <PortStatusHistorySection
            port={activePort}
            weather={activeWeather}
            statusHistory={hubState.statusHistory ?? []}
            lang={lang}
            onOpenWeatherManager={() => openManager('weather')}
          />
        )}

        {/* 02. Posición Geográfica y Datos Generales */}
        {canShowSection('general_info') && (
          <PortGeneralPositionSection
            port={activePort}
            areas={hubState.areas}
            lang={lang}
          />
        )}

        {/* 03 & 04. Calados, Zonas de Fondeo, Reglas de Operación y Restricciones Físicas */}
        {canShowSection('restrictions') && (
          <RestrictionsAndWeather
            port={activePort}
            restrictions={hubState.restrictions}
            lang={lang}
          />
        )}

        {/* 05. Panorama Portuario */}
        {canShowSection('port_map') && (
          <InteractivePortMap
            port={activePort}
            areas={hubState.areas}
            terminals={sharedTerminals}
            lang={lang}
            onSelectTerminal={(term) => {
              setActiveTerminalTab('berths');
              setActiveTerminalId(term.id);
            }}
          />
        )}

        {/* 06. Recintos Portuarios y Minisitios individuales por terminal */}
        {canShowSection('terminals') && (
          <TerminalsShowcase
            port={activePort}
            areas={hubState.areas}
            terminals={sharedTerminals}
            lang={lang}
            onSelectTerminal={(term) => {
              setActiveTerminalTab('berths');
              setActiveTerminalId(term.id);
            }}
            onOpenConcessionaires={(term) => {
              setActiveTerminalTab('concessionaires');
              setActiveTerminalId(term.id);
            }}
          />
        )}

        {/* 06B. Productos que se manejan */}
        {canShowSection('cargo_matrix') && (
          <CargoMatrixSection
            port={activePort}
            areas={hubState.areas}
            terminals={sharedTerminals}
            productDossiers={hubState.productDossiers ?? []}
            lang={lang}
            disableDownloads={exclusiveShare.isExclusive}
            onSelectTerminal={(term) => {
              setActiveTerminalTab('berths');
              setActiveTerminalId(term.id);
            }}
            onOpenProductManager={
              exclusiveShare.isExclusive
                ? undefined
                : (dossierId) => openManager('products', undefined, undefined, dossierId)
            }
          />
        )}

        {/* 07. Servicios Portuarios Disponibles */}
        {canShowSection('port_services') && (
          <PortServicesSection
            port={activePort}
            lang={lang}
            servicesDriveFolderUrl={hubState.servicesDriveFolderUrl}
            disableDownloads={exclusiveShare.isExclusive}
            onOpenServicesManager={() => openManager('services')}
          />
        )}

        {/* 08. Line-Up de Buques */}
        {canShowSection('lineup') && (
          <VesselLineupSection
            port={activePort}
            lineup={hubState.lineup ?? []}
            lang={lang}
            disableDownloads={exclusiveShare.isExclusive}
            onUpdateVesselStatus={handleUpdateVesselStatus}
            onOpenLineupManager={() => openManager('lineup')}
          />
        )}

        {/* 09. Tarifas Maestras y Calculador PDA */}
        {canShowSection('tariffs_pda') && (
          <TariffsAndPdaSection
            port={activePort}
            allPorts={hubState.ports}
            areas={hubState.areas}
            tariffs={hubState.tariffs}
            pdaFormats={hubState.pdaFormats}
            pdaOfficeProfile={hubState.pdaOfficeProfile}
            pdaDriveFolderUrl={hubState.pdaDriveFolderUrl}
            pdaHistory={hubState.pdaHistory ?? []}
            tariffSheetSync={hubState.tariffSheetSync}
            lang={lang}
            disableDownloads={exclusiveShare.isExclusive}
            onSyncTariffsFromSheet={handleSyncTariffsFromSheet}
            onAddTariffConcept={handleAddTariffConcept}
            onUpdateTariffConcept={handleUpdateTariffConcept}
            onSavePdaFormat={handleSavePdaFormat}
            onSavePdaHistoryRecord={handleSavePdaHistoryRecord}
            onDeletePdaHistoryRecord={handleDeletePdaHistoryRecord}
            onSelectPort={handleSelectPort}
            onOpenContentManager={() => openManager('tariffs')}
          />
        )}

        {/* 10. Autoridades Marítimas, Spare Parts (Aduana) y Crew Change (Migración / INM) */}
        {canShowSection('authorities') && (
          <AuthoritiesAndCrewSection
            port={activePort}
            authorities={hubState.authorities ?? INITIAL_HUB_STATE.authorities ?? []}
            authoritiesDriveFolderUrl={hubState.authoritiesDriveFolderUrl}
            crewGuide={hubState.crewChangeProcedure ?? INITIAL_HUB_STATE.crewChangeProcedure!}
            sparePartsGuide={
              hubState.sparePartsProcedure ?? INITIAL_HUB_STATE.sparePartsProcedure!
            }
            lang={lang}
            disableDownloads={exclusiveShare.isExclusive}
            onOpenPreArrivalGenerator={() => setPreArrivalModalOpen(true)}
            onOpenAuthoritiesManager={() => openManager('authorities')}
          />
        )}

        {/* 11. Organigrama Empresarial, Directorios, Protocolos, Optic y Apps Script */}
        {canShowSection('directory_knowledge') && (
          <DirectoryAndKnowledgeSection
            port={activePort}
            orgChart={hubState.orgChart ?? []}
            directory={hubState.directory}
            procedures={hubState.procedures}
            opticGlossary={hubState.opticGlossary}
            appsScripts={hubState.appsScripts}
            lang={lang}
            onOpenContentManager={(requestedTab) => openManager(requestedTab ?? 'apps')}
          />
        )}
      </main>

      <footer className="bg-[#f5f5f7] border-t border-[#e5e5ea] py-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-[13px] text-[#6e6e73]">
          <div>
            <div className="font-display font-semibold text-[#1d1d1f]">
              {exclusiveShare.isExclusive
                ? `ISS Port Intelligence Hub · ${activePort.name}`
                : `ISS Port Intelligence Hub · ${hubState.ports.length} ${
                    lang === 'es' ? 'Puertos de México' : 'Mexican Ports'
                  }`}
            </div>
            <p className="mt-1 max-w-xl">
              {lang === 'es'
                ? 'Arquitectura unificada de consulta operativa, histórico de cierres/aperturas, Line-Up nacional, tarifarios, cálculos PDA e Información Pre-Arribo.'
                : 'Unified port intelligence, status transition history, National Vessel Line-Up, shared tariff catalog, PDA estimation and Pre-Arrival Information.'}
            </p>
          </div>

          {!exclusiveShare.isExclusive && (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="font-medium text-[#0066cc] hover:underline"
              >
                {lang === 'es' ? 'Compartir y Sedna' : 'Share & Sedna'}
              </button>
              <button
                type="button"
                onClick={() => openManager('port')}
                className="font-medium text-[#1d1d1f] hover:underline"
              >
                Content Manager
              </button>
            </div>
          )}
        </div>
      </footer>

      {(canShowSection('terminals') || canShowSection('cargo_matrix')) && (
        <TerminalMinisiteModal
          terminal={activeTerminal}
          area={activeTerminalArea}
          portName={activePort.name}
          productDossiers={hubState.productDossiers ?? []}
          initialTab={activeTerminalTab}
          lang={lang}
          disableDownloads={exclusiveShare.isExclusive}
          onEditTerminal={
            exclusiveShare.isExclusive
              ? undefined
              : (termId, berthId) => {
                  setActiveTerminalId(null);
                  openManager('terminals', termId, berthId);
                }
          }
          onOpenProductManager={
            exclusiveShare.isExclusive
              ? undefined
              : (dossierId) => {
                  setActiveTerminalId(null);
                  openManager('products', undefined, undefined, dossierId);
                }
          }
          onClose={() => setActiveTerminalId(null)}
        />
      )}

      {!exclusiveShare.isExclusive && (
        <DocumentCenterModal
          open={shareModalOpen}
          port={activePort}
          areas={hubState.areas}
          terminals={hubState.terminals}
          restrictions={hubState.restrictions}
          weather={activeWeather}
          hubState={hubState}
          lang={lang}
          onOpenPreArrivalGenerator={() => {
            setShareModalOpen(false);
            setPreArrivalModalOpen(true);
          }}
          onClose={() => setShareModalOpen(false)}
        />
      )}

      <PreArrivalPackageModal
        open={preArrivalModalOpen}
        port={activePort}
        areas={hubState.areas}
        terminals={sharedTerminals}
        restrictions={hubState.restrictions}
        weather={activeWeather}
        statusHistory={hubState.statusHistory ?? []}
        productDossiers={hubState.productDossiers ?? []}
        authorities={hubState.authorities ?? INITIAL_HUB_STATE.authorities ?? []}
        crewGuide={hubState.crewChangeProcedure ?? INITIAL_HUB_STATE.crewChangeProcedure!}
        sparePartsGuide={
          hubState.sparePartsProcedure ?? INITIAL_HUB_STATE.sparePartsProcedure!
        }
        lineup={hubState.lineup ?? []}
        procedures={hubState.procedures}
        directory={hubState.directory}
        lang={lang}
        disableDownloads={exclusiveShare.isExclusive}
        onClose={() => setPreArrivalModalOpen(false)}
      />

      {!exclusiveShare.isExclusive && (
        <ContentManagerModal
          open={contentManagerOpen}
          portId={activePort.id}
          hubState={hubState}
          lang={lang}
          initialTab={managerTab}
          initialTerminalId={managerTerminalId}
          initialBerthId={managerBerthId}
          initialDossierId={managerDossierId}
          onUpdateState={setHubState}
          onResetSeed={handleResetSeed}
          onClose={() => setContentManagerOpen(false)}
        />
      )}
    </div>
  );
}
