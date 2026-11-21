import { useEffect, useState } from 'react';
import { INITIAL_HUB_STATE } from './data/coatzacoalcosSeed';
import type { HubState, Language, VesselStatus } from './types/port';
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
import { DirectoryAndKnowledgeSection } from './components/DirectoryAndKnowledgeSection';
import { DocumentCenterModal } from './components/DocumentCenterModal';
import { ContentManagerModal, type ManagerTab } from './components/ContentManagerModal';

const STORAGE_KEY = 'iss_port_intelligence_hub_v6';

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
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [contentManagerOpen, setContentManagerOpen] = useState(false);
  const [managerTab, setManagerTab] = useState<ManagerTab>('port');
  const [managerTerminalId, setManagerTerminalId] = useState<string | undefined>(undefined);
  const [managerBerthId, setManagerBerthId] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(hubState));
    } catch {
      // ignore storage quota errors
    }
  }, [hubState]);

  const activePort =
    hubState.ports.find((p) => p.id === selectedPortId) ?? hubState.ports[0];

  const activeWeather = hubState.weather.find((w) => w.portId === activePort.id);
  const activeTerminal = activeTerminalId
    ? hubState.terminals.find((t) => t.id === activeTerminalId) ?? null
    : null;
  const activeTerminalArea = activeTerminal
    ? hubState.areas.find((a) => a.id === activeTerminal.areaId)
    : undefined;

  const handleSelectPort = (portId: string) => {
    setSelectedPortId(portId);
    setActiveTerminalId(null);
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

  const openManager = (tab: ManagerTab, termId?: string, berthId?: string) => {
    setManagerTab(tab);
    setManagerTerminalId(termId);
    setManagerBerthId(berthId);
    setContentManagerOpen(true);
  };

  const handleResetSeed = () => {
    setHubState(INITIAL_HUB_STATE);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <TopNav
        ports={hubState.ports}
        activePortId={activePort.id}
        lang={lang}
        onSelectPort={handleSelectPort}
        onOpenShareCenter={() => setShareModalOpen(true)}
      />

      <main>
        <HeroSection
          port={activePort}
          allPorts={hubState.ports}
          areas={hubState.areas}
          weather={activeWeather}
          lang={lang}
          onSelectPort={handleSelectPort}
          onToggleLang={setLang}
          onOpenContentManager={() => openManager('port')}
          onOpenShareCenter={() => setShareModalOpen(true)}
        />

        {/* 01. Estatus Portuario, Histórico de Cierres/Aperturas (izq) + Meteorología (der) */}
        <PortStatusHistorySection
          port={activePort}
          weather={activeWeather}
          statusHistory={hubState.statusHistory ?? []}
          lang={lang}
          onOpenWeatherManager={() => openManager('weather')}
        />

        {/* 02. Posición Geográfica y Datos Generales */}
        <PortGeneralPositionSection
          port={activePort}
          areas={hubState.areas}
          lang={lang}
        />

        {/* 03 & 04. Calados, Zonas de Fondeo, Reglas de Operación y Restricciones Físicas */}
        <RestrictionsAndWeather
          port={activePort}
          restrictions={hubState.restrictions}
          lang={lang}
        />

        {/* 05. Panorama Portuario (Mapa geográfico de 7 terminales reales) */}
        <InteractivePortMap
          port={activePort}
          areas={hubState.areas}
          terminals={hubState.terminals}
          lang={lang}
          onSelectTerminal={(term) => setActiveTerminalId(term.id)}
        />

        {/* 06. Recintos Portuarios y Minisitios individuales por terminal */}
        <TerminalsShowcase
          port={activePort}
          areas={hubState.areas}
          terminals={hubState.terminals}
          lang={lang}
          onSelectTerminal={(term) => setActiveTerminalId(term.id)}
        />

        {/* 06B. Productos que se manejan */}
        <CargoMatrixSection
          port={activePort}
          areas={hubState.areas}
          terminals={hubState.terminals}
          lang={lang}
          onSelectTerminal={(term) => setActiveTerminalId(term.id)}
        />

        {/* 07. Servicios Portuarios Disponibles */}
        <PortServicesSection port={activePort} lang={lang} />

        {/* 08. Line-Up de Buques */}
        <VesselLineupSection
          port={activePort}
          lineup={hubState.lineup ?? []}
          lang={lang}
          onUpdateVesselStatus={handleUpdateVesselStatus}
          onOpenLineupManager={() => openManager('lineup')}
        />

        {/* 09. Tarifas Maestras y Calculador PDA */}
        <TariffsAndPdaSection
          port={activePort}
          areas={hubState.areas}
          tariffs={hubState.tariffs}
          lang={lang}
          onOpenContentManager={() => openManager('tariffs')}
        />

        {/* 10. Organigrama Empresarial, Directorios, Protocolos, Optic y Apps Script */}
        <DirectoryAndKnowledgeSection
          port={activePort}
          orgChart={hubState.orgChart ?? []}
          directory={hubState.directory}
          procedures={hubState.procedures}
          opticGlossary={hubState.opticGlossary}
          appsScripts={hubState.appsScripts}
          lang={lang}
          onOpenContentManager={() => openManager('apps')}
        />
      </main>

      <footer className="bg-[#f5f5f7] border-t border-[#e5e5ea] py-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-[13px] text-[#6e6e73]">
          <div>
            <div className="font-display font-semibold text-[#1d1d1f]">
              ISS Port Intelligence Hub · {hubState.ports.length}{' '}
              {lang === 'es' ? 'Puertos de México' : 'Mexican Ports'}
            </div>
            <p className="mt-1 max-w-xl">
              {lang === 'es'
                ? 'Arquitectura unificada de consulta operativa, histórico de cierres/aperturas, Line-Up nacional, tarifarios, cálculos PDA y exportación documental Sedna.'
                : 'Unified port intelligence, status transition history, National Vessel Line-Up, shared tariff catalog, PDA estimation and Sedna document export.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="font-medium text-[#0066cc] hover:underline"
            >
              {lang === 'es' ? 'Exportar Sedna / PDF' : 'Export Sedna / PDF'}
            </button>
            <button
              type="button"
              onClick={() => openManager('port')}
              className="font-medium text-[#1d1d1f] hover:underline"
            >
              Content Manager
            </button>
          </div>
        </div>
      </footer>

      <TerminalMinisiteModal
        terminal={activeTerminal}
        area={activeTerminalArea}
        lang={lang}
        onEditTerminal={(termId, berthId) => {
          setActiveTerminalId(null);
          openManager('terminals', termId, berthId);
        }}
        onClose={() => setActiveTerminalId(null)}
      />

      <DocumentCenterModal
        open={shareModalOpen}
        port={activePort}
        areas={hubState.areas}
        terminals={hubState.terminals}
        restrictions={hubState.restrictions}
        weather={activeWeather}
        hubState={hubState}
        lang={lang}
        onClose={() => setShareModalOpen(false)}
      />

      <ContentManagerModal
        open={contentManagerOpen}
        portId={activePort.id}
        hubState={hubState}
        lang={lang}
        initialTab={managerTab}
        initialTerminalId={managerTerminalId}
        initialBerthId={managerBerthId}
        onUpdateState={setHubState}
        onResetSeed={handleResetSeed}
        onClose={() => setContentManagerOpen(false)}
      />
    </div>
  );
}
