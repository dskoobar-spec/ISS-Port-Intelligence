import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, FileCode2, FileDown, Package, RotateCcw, X } from 'lucide-react';
import {
  buildDefaultPreArrivalIntro,
  exportPreArrivalPackageToPdf,
  generatePreArrivalPackageHtml,
} from '../utils/packageExporter';
import { sanitizePdfFilename } from '../utils/pdfExporter';
import type {
  AuthorityAgency,
  AuthorityRequirement,
  CrewChangeGuideConfig,
  DirectoryEntry,
  Language,
  OperationalProcedure,
  PortArea,
  PortProfile,
  PortRestriction,
  PortStatusEvent,
  ProductTechnicalDossier,
  SparePartsProcedureConfig,
  Terminal,
  VesselLineupEntry,
  WeatherStatus,
} from '../types/port';

const ALL_AGENCIES: AuthorityAgency[] = [
  'Aduana',
  'ASIPONA',
  'Capitanía de Puerto',
  'INM',
  'Sanidad Internacional',
  'SENASICA',
];

interface PreArrivalPackageModalProps {
  open: boolean;
  port: PortProfile;
  areas: PortArea[];
  terminals: Terminal[];
  restrictions: PortRestriction[];
  weather?: WeatherStatus;
  statusHistory?: PortStatusEvent[];
  productDossiers: ProductTechnicalDossier[];
  authorities: AuthorityRequirement[];
  crewGuide: CrewChangeGuideConfig;
  sparePartsGuide: SparePartsProcedureConfig;
  lineup?: VesselLineupEntry[];
  procedures?: OperationalProcedure[];
  directory?: DirectoryEntry[];
  lang: Language;
  disableDownloads?: boolean;
  onClose: () => void;
}

export function PreArrivalPackageModal({
  open,
  port,
  areas,
  terminals,
  restrictions,
  weather,
  statusHistory = [],
  productDossiers,
  authorities,
  crewGuide,
  sparePartsGuide,
  lineup = [],
  procedures = [],
  directory = [],
  lang,
  disableDownloads = false,
  onClose,
}: PreArrivalPackageModalProps) {
  const isEs = lang === 'es';
  const portTerminals = useMemo(
    () => terminals.filter((t) => t.portId === port.id),
    [terminals, port.id]
  );
  const portProducts = useMemo(
    () => productDossiers.filter((d) => d.portId === port.id),
    [productDossiers, port.id]
  );
  const portAuthorities = useMemo(
    () => authorities.filter((a) => a.portId === 'ALL' || a.portId === port.id),
    [authorities, port.id]
  );

  const [vesselName, setVesselName] = useState('M/V TBN');
  const [voyageOrEta, setVoyageOrEta] = useState('ETA TBAD');
  const [selectedTerminalId, setSelectedTerminalId] = useState(
    portTerminals[0]?.id ?? ''
  );
  const [selectedBerthId, setSelectedBerthId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(
    portProducts[0]?.id ?? ''
  );
  const [filename, setFilename] = useState(
    `Informacion_PreArribo_${port.shortCode}_TBN`
  );
  const [welcomeMessage, setWelcomeMessage] = useState(() =>
    buildDefaultPreArrivalIntro(port, lang)
  );

  // Full selectable module flags across everything registered in the hub
  const [includePortStatusWeather, setIncludePortStatusWeather] = useState(true);
  const [includeGeneralParticulars, setIncludeGeneralParticulars] = useState(true);
  const [includePortRestrictions, setIncludePortRestrictions] = useState(true);
  const [includeTerminalSheet, setIncludeTerminalSheet] = useState(true);
  const [includeAllTerminals, setIncludeAllTerminals] = useState(false);
  const [includeProductDossier, setIncludeProductDossier] = useState(true);
  const [includePortServices, setIncludePortServices] = useState(true);
  const [includeLineup, setIncludeLineup] = useState(false);
  const [includeAuthorities, setIncludeAuthorities] = useState(true);
  const [selectedAgencies, setSelectedAgencies] =
    useState<AuthorityAgency[]>(ALL_AGENCIES);
  const [includeSpareParts, setIncludeSpareParts] = useState(true);
  const [includeCrewChange, setIncludeCrewChange] = useState(true);
  const [includeOperationalProcedures, setIncludeOperationalProcedures] =
    useState(false);
  const [includeDirectory, setIncludeDirectory] = useState(true);
  const [copiedHtml, setCopiedHtml] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedTerminalId(portTerminals[0]?.id ?? '');
      setSelectedBerthId('');
      setSelectedProductId(portProducts[0]?.id ?? '');
      setWelcomeMessage(buildDefaultPreArrivalIntro(port, lang));
      setFilename(
        `Informacion_PreArribo_${vesselName.replace(/\s+/g, '_')}_${port.shortCode}`
      );
    }
  }, [open, port.id, port.shortCode, lang, portTerminals, portProducts]);

  const selectedTerminal =
    portTerminals.find((t) => t.id === selectedTerminalId) ?? portTerminals[0];
  const selectedBerth = selectedTerminal?.berths.find(
    (b) => b.id === selectedBerthId
  );
  const selectedProduct = portProducts.find((p) => p.id === selectedProductId);

  const filteredAuthorities = useMemo(
    () => portAuthorities.filter((a) => selectedAgencies.includes(a.agency)),
    [portAuthorities, selectedAgencies]
  );

  const packageParams = useMemo(
    () => ({
      port,
      areas,
      terminals,
      restrictions,
      weather,
      statusHistory,
      selectedTerminal,
      selectedBerth,
      selectedProduct,
      authorities: filteredAuthorities,
      crewGuide,
      sparePartsGuide,
      lineup,
      procedures,
      directory,
      vesselName: vesselName.trim() || 'M/V TBN',
      voyageOrEta: voyageOrEta.trim() || undefined,
      welcomeMessage,
      includeModules: {
        portStatusWeather: includePortStatusWeather,
        generalParticulars: includeGeneralParticulars,
        portRestrictions: includePortRestrictions,
        terminalSheet:
          includeTerminalSheet &&
          (includeAllTerminals ? portTerminals.length > 0 : Boolean(selectedTerminal)),
        includeAllTerminals,
        productDossier: includeProductDossier && Boolean(selectedProduct),
        portServices: includePortServices,
        lineup: includeLineup,
        authorities: includeAuthorities && filteredAuthorities.length > 0,
        spareParts: includeSpareParts,
        crewChange: includeCrewChange,
        operationalProcedures: includeOperationalProcedures,
        directory: includeDirectory,
      },
      lang,
    }),
    [
      port,
      areas,
      terminals,
      restrictions,
      weather,
      statusHistory,
      selectedTerminal,
      selectedBerth,
      selectedProduct,
      filteredAuthorities,
      crewGuide,
      sparePartsGuide,
      lineup,
      procedures,
      directory,
      vesselName,
      voyageOrEta,
      welcomeMessage,
      includePortStatusWeather,
      includeGeneralParticulars,
      includePortRestrictions,
      includeTerminalSheet,
      includeAllTerminals,
      portTerminals.length,
      includeProductDossier,
      includePortServices,
      includeLineup,
      includeAuthorities,
      includeSpareParts,
      includeCrewChange,
      includeOperationalProcedures,
      includeDirectory,
      lang,
    ]
  );

  const packageHtml = useMemo(
    () => generatePreArrivalPackageHtml(packageParams),
    [packageParams]
  );

  if (!open) return null;

  const toggleAgency = (agency: AuthorityAgency) => {
    setSelectedAgencies((prev) =>
      prev.includes(agency)
        ? prev.filter((item) => item !== agency)
        : [...prev, agency]
    );
  };

  const handleSelectAllModules = () => {
    setIncludePortStatusWeather(true);
    setIncludeGeneralParticulars(true);
    setIncludePortRestrictions(true);
    setIncludeTerminalSheet(true);
    setIncludeProductDossier(true);
    setIncludePortServices(true);
    setIncludeLineup(true);
    setIncludeAuthorities(true);
    setSelectedAgencies(ALL_AGENCIES);
    setIncludeSpareParts(true);
    setIncludeCrewChange(true);
    setIncludeOperationalProcedures(true);
    setIncludeDirectory(true);
  };

  const handleClearAllModules = () => {
    setIncludePortStatusWeather(false);
    setIncludeGeneralParticulars(false);
    setIncludePortRestrictions(false);
    setIncludeTerminalSheet(false);
    setIncludeProductDossier(false);
    setIncludePortServices(false);
    setIncludeLineup(false);
    setIncludeAuthorities(false);
    setIncludeSpareParts(false);
    setIncludeCrewChange(false);
    setIncludeOperationalProcedures(false);
    setIncludeDirectory(false);
  };

  const handleDownloadPdf = () => {
    exportPreArrivalPackageToPdf({
      ...packageParams,
      filename: filename.trim() || `Informacion_PreArribo_${port.shortCode}`,
    });
  };

  const handleDownloadHtml = () => {
    const cleanBase = sanitizePdfFilename(
      filename,
      `Informacion_PreArribo_${port.shortCode}`
    ).replace(/\.pdf$/i, '.html');
    const blob = new Blob([packageHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanBase;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(packageHtml);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch {
      setCopiedHtml(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prearrival-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#e5e5ea]">
        <div className="px-6 py-5 bg-[#042447] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-[#93c5fd]" />
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#93c5fd]">
                ISS PORT INTELLIGENCE · PRE-ARRIVAL INFORMATION
              </p>
              <h3 id="prearrival-modal-title" className="font-display text-[19px] font-semibold">
                {isEs
                  ? `Información Pre-Arribo (${port.name})`
                  : `Pre-Arrival Information (${port.name})`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isEs ? 'Cerrar generador' : 'Close generator'}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Vessel & Target Inputs */}
          <div className={`grid grid-cols-1 ${disableDownloads ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
            <div>
              <label className="block text-[12px] font-medium text-[#424245] mb-1">
                {isEs ? 'Nombre del Buque' : 'Vessel Name'}
              </label>
              <input
                type="text"
                value={vesselName}
                onChange={(e) => {
                  const val = e.target.value;
                  setVesselName(val);
                  setFilename(
                    `Informacion_PreArribo_${(val || 'TBN').trim().replace(/\s+/g, '_')}_${port.shortCode}`
                  );
                }}
                className="w-full px-3 py-2 text-[13.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#424245] mb-1">
                ETA / Voyage Ref
              </label>
              <input
                type="text"
                value={voyageOrEta}
                onChange={(e) => setVoyageOrEta(e.target.value)}
                className="w-full px-3 py-2 text-[13.5px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
              />
            </div>

            {!disableDownloads && (
              <div>
                <label className="block text-[12px] font-medium text-[#424245] mb-1">
                  {isEs ? 'Nombre del archivo a descargar' : 'Custom Output Filename'}
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Mandatory 72h Pre-Arrival Welcome Notice */}
          <div className="p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[12px] font-semibold text-[#1d1d1f]">
                {isEs
                  ? 'Encabezado / Carta de Bienvenida Pre-Arribo (72 hrs antes)'
                  : 'Opening Pre-Arrival Notice (72 hrs prior to arrival)'}
              </label>
              <button
                type="button"
                onClick={() => setWelcomeMessage(buildDefaultPreArrivalIntro(port, lang))}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#0066cc] hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                {isEs ? 'Restablecer texto estándar' : 'Reset standard text'}
              </button>
            </div>
            <textarea
              rows={3}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              className="w-full px-3 py-2 text-[13px] text-[#1d1d1f] bg-white border border-[#d2d2d7] rounded-lg leading-relaxed"
            />
          </div>

          {/* Terminal / Berth / Product Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea]">
            <div>
              <label className="block text-[12px] font-medium text-[#424245] mb-1">
                {isEs ? 'Terminal / Recinto' : 'Terminal'}
              </label>
              <select
                value={selectedTerminalId}
                disabled={includeAllTerminals}
                onChange={(e) => {
                  setSelectedTerminalId(e.target.value);
                  setSelectedBerthId('');
                }}
                className="w-full px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg disabled:opacity-60"
              >
                {portTerminals.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isEs ? t.name : t.nameEn ?? t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#424245] mb-1">
                {isEs ? 'Muelle específico (Opcional)' : 'Specific Berth (Optional)'}
              </label>
              <select
                value={selectedBerthId}
                disabled={includeAllTerminals}
                onChange={(e) => setSelectedBerthId(e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg disabled:opacity-60"
              >
                <option value="">
                  {isEs ? 'Todos los muelles de la terminal' : 'All berths in terminal'}
                </option>
                {(selectedTerminal?.berths ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {isEs ? b.name : b.nameEn ?? b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#424245] mb-1">
                {isEs ? 'Producto / Commodity (Ficha)' : 'Product Dossier'}
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
              >
                <option value="">
                  {isEs ? '-- Sin producto específico --' : '-- None --'}
                </option>
                {portProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isEs ? p.name : p.nameEn} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggleable Registered Hub Modules */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[12.5px] font-semibold text-[#1d1d1f]">
                {isEs
                  ? 'Selecciona toda la información registrada a incluir en el documento (Logo Inchcape integrado):'
                  : 'Select all registered hub information to include (Integrated Inchcape Logo):'}
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <button
                  type="button"
                  onClick={handleSelectAllModules}
                  className="px-2.5 py-1 rounded-md bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] text-[#0066cc] font-medium"
                >
                  {isEs ? 'Seleccionar todo' : 'Select all'}
                </button>
                <button
                  type="button"
                  onClick={handleClearAllModules}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-[#f5f5f7] border border-[#d2d2d7] text-[#424245] font-medium"
                >
                  {isEs ? 'Limpiar selección' : 'Clear all'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[13px]">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePortStatusWeather}
                  onChange={(e) => setIncludePortStatusWeather(e.target.checked)}
                  className="w-4 h-4 accent-[#0066cc]"
                />
                <span>
                  {isEs
                    ? '01. Estatus Portuario, Clima e Histórico'
                    : '01. Port Status, Weather & History'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGeneralParticulars}
                  onChange={(e) => setIncludeGeneralParticulars(e.target.checked)}
                  className="w-4 h-4 accent-[#0066cc]"
                />
                <span>
                  {isEs
                    ? '02. Posición Geográfica y Datos Generales'
                    : '02. Position & General Particulars'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePortRestrictions}
                  onChange={(e) => setIncludePortRestrictions(e.target.checked)}
                  className="w-4 h-4 accent-[#0066cc]"
                />
                <span>
                  {isEs
                    ? '03. Restricciones, Calados y Fondeaderos'
                    : '03. Restrictions, Drafts & Anchorages'}
                </span>
              </label>

              <div className="p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTerminalSheet}
                    onChange={(e) => setIncludeTerminalSheet(e.target.checked)}
                    className="w-4 h-4 accent-[#0066cc]"
                  />
                  <span>
                    {isEs
                      ? '04. Ficha de Terminal y Muelles'
                      : '04. Terminal & Berth Sheet'}
                  </span>
                </label>
                {includeTerminalSheet && (
                  <label className="flex items-center gap-2 pl-6 text-[11.5px] text-[#424245] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAllTerminals}
                      onChange={(e) => setIncludeAllTerminals(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#0066cc]"
                    />
                    <span>
                      {isEs
                        ? `Incluir todas las terminales (${portTerminals.length})`
                        : `Include all port terminals (${portTerminals.length})`}
                    </span>
                  </label>
                )}
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeProductDossier}
                  onChange={(e) => setIncludeProductDossier(e.target.checked)}
                  className="w-4 h-4 accent-[#0066cc]"
                />
                <span>
                  {isEs ? '05. Ficha Técnica de Producto' : '05. Product Technical Dossier'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePortServices}
                  onChange={(e) => setIncludePortServices(e.target.checked)}
                  className="w-4 h-4 accent-[#0066cc]"
                />
                <span>
                  {isEs ? '06. Servicios Portuarios' : '06. Available Port Services'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLineup}
                  onChange={(e) => setIncludeLineup(e.target.checked)}
                  className="w-4 h-4 accent-[#0066cc]"
                />
                <span>
                  {isEs ? '07. Line-Up Actual de Buques' : '07. Current Vessel Line-Up'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOperationalProcedures}
                  onChange={(e) => setIncludeOperationalProcedures(e.target.checked)}
                  className="w-4 h-4 accent-[#0066cc]"
                />
                <span>
                  {isEs
                    ? '11. Procedimientos Operativos por Fase'
                    : '11. Operational Procedures'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDirectory}
                  onChange={(e) => setIncludeDirectory(e.target.checked)}
                  className="w-4 h-4 accent-[#0066cc]"
                />
                <span>
                  {isEs
                    ? '12. Directorio Operativo y Contactos ISS'
                    : '12. Operational Directory & Contacts'}
                </span>
              </label>

              {/* Authorities + Per-Agency Filter */}
              <div className="p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] sm:col-span-2 lg:col-span-3 space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer font-medium text-[#1d1d1f]">
                  <input
                    type="checkbox"
                    checked={includeAuthorities}
                    onChange={(e) => setIncludeAuthorities(e.target.checked)}
                    className="w-4 h-4 accent-[#0066cc]"
                  />
                  <span>
                    {isEs
                      ? '08. Autoridades Marítimas y Master Pre-Arrival Checklist (Filtrar dependencias)'
                      : '08. Maritime Authorities & Master Pre-Arrival Checklist (Filter agencies)'}
                  </span>
                </label>

                {includeAuthorities && (
                  <div className="flex flex-wrap gap-2 pl-6">
                    {ALL_AGENCIES.map((agency) => {
                      const active = selectedAgencies.includes(agency);
                      return (
                        <button
                          key={agency}
                          type="button"
                          onClick={() => toggleAgency(agency)}
                          className={`px-2.5 py-1 text-[11.5px] font-medium rounded-md border transition-colors ${
                            active
                              ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]'
                              : 'bg-white text-[#424245] border-[#d2d2d7] hover:bg-[#ebebef]'
                          }`}
                        >
                          {agency}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#eef6ff] border border-[#cde3ff] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSpareParts}
                  onChange={(e) => setIncludeSpareParts(e.target.checked)}
                  className="w-4 h-4 accent-[#0066cc]"
                />
                <span className="font-medium text-[#042447]">
                  09. Spare Parts Procedure — Aduana (Customs)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#eef6ff] border border-[#cde3ff] cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  checked={includeCrewChange}
                  onChange={(e) => setIncludeCrewChange(e.target.checked)}
                  className="w-4 h-4 accent-[#0066cc]"
                />
                <span className="font-medium text-[#042447]">
                  10. Crew Change Procedure — INM (Visa C1/D1, Lead Time, Checklist &amp; Appendix A)
                </span>
              </label>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#e5e5ea]">
            {!disableDownloads ? (
              <div className="text-[12px] font-mono text-[#6e6e73]">
                PDF: {sanitizePdfFilename(filename, `Informacion_PreArribo_${port.shortCode}`)}
              </div>
            ) : (
              <div className="text-[12px] text-[#6e6e73]">
                {isEs
                  ? 'Vista pública de consulta · Descargas deshabilitadas'
                  : 'Public shared view · File downloads disabled'}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyHtml}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-xl transition-colors"
              >
                {copiedHtml ? <Check className="w-4 h-4 text-[#16a34a]" /> : <Copy className="w-4 h-4" />}
                {copiedHtml
                  ? isEs
                    ? 'HTML Sedna copiado'
                    : 'Sedna HTML copied'
                  : isEs
                  ? 'Copiar HTML Sedna'
                  : 'Copy Sedna HTML'}
              </button>

              {!disableDownloads && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadHtml}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-white hover:bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl transition-colors"
                  >
                    <FileCode2 className="w-4 h-4" />
                    {isEs ? 'Descargar .HTML' : 'Download .HTML'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded-xl transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    {isEs ? 'Descargar Información PDF' : 'Download Information PDF'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
