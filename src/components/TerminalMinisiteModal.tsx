import { useEffect, useState } from 'react';
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  Copy,
  Download,
  FileCode2,
  FileText,
  MapPin,
  Package,
  Pencil,
  Printer,
  ShieldAlert,
  Warehouse,
  X,
} from 'lucide-react';
import { formatDraftMAndFt } from '../utils/i18n';
import {
  buildDefaultPierSheetFromBerth,
  downloadPierSheetHtml,
  downloadPierSheetPng,
} from '../utils/pierSheetExporter';
import { matchDossierForProductLabel } from './CargoMatrixSection';
import { PierSpecificationCard } from './PierSpecificationCard';
import { ProductDossierModal } from './ProductDossierModal';
import type {
  ConcessionaireTerminal,
  Language,
  PortArea,
  ProductHandlingSpec,
  ProductTechnicalDossier,
  Terminal,
} from '../types/port';

interface TerminalMinisiteModalProps {
  terminal: Terminal | null;
  area?: PortArea;
  portName?: string;
  productDossiers?: ProductTechnicalDossier[];
  initialTab?: MinisiteTab;
  lang: Language;
  disableDownloads?: boolean;
  onEditTerminal?: (terminalId: string, berthId?: string) => void;
  onOpenProductManager?: (dossierId: string) => void;
  onClose: () => void;
}

type MinisiteTab = 'berths' | 'sheets' | 'products' | 'concessionaires' | 'commercial';

export function TerminalMinisiteModal({
  terminal,
  area,
  portName = 'Puerto de Coatzacoalcos',
  productDossiers = [],
  initialTab = 'berths',
  lang,
  disableDownloads = false,
  onEditTerminal,
  onOpenProductManager,
  onClose,
}: TerminalMinisiteModalProps) {
  const [copied, setCopied] = useState(false);
  const [concCopied, setConcCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<MinisiteTab>(initialTab);
  const [selectedBerthId, setSelectedBerthId] = useState<string>('');
  const [selectedConcessionaireId, setSelectedConcessionaireId] = useState<string | null>(null);
  const [activeDossier, setActiveDossier] = useState<ProductTechnicalDossier | null>(null);
  const [exportingPng, setExportingPng] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
    setSelectedBerthId(terminal?.berths[0]?.id ?? '');
    setSelectedConcessionaireId(null);
    setActiveDossier(null);
  }, [terminal?.id, terminal?.berths, initialTab]);

  if (!terminal) return null;

  const isEs = lang === 'es';
  const displayName = isEs ? terminal.name : terminal.nameEn ?? terminal.name;
  const displayDesc = isEs ? terminal.shortDesc : terminal.shortDescEn;
  const displayRestr = isEs
    ? terminal.restrictionsSummary
    : terminal.restrictionsSummaryEn ?? terminal.restrictionsSummary;
  const displayProcedures = isEs
    ? terminal.procedures
    : terminal.proceduresEn ?? terminal.procedures;

  const concessionaires = terminal.concessionaires ?? [];
  const storage = terminal.storageSummary;
  const commercial = terminal.commercialProfile;

  const activeBerth =
    terminal.berths.find((b) => b.id === selectedBerthId) ?? terminal.berths[0];
  const activeSheet = activeBerth
    ? buildDefaultPierSheetFromBerth(activeBerth, terminal)
    : null;

  const effectiveProductSpecs: ProductHandlingSpec[] =
    terminal.productSpecs && terminal.productSpecs.length > 0
      ? terminal.productSpecs
      : terminal.berths.map((b) => ({
          id: `synth-${b.id}`,
          product: b.products.join(', '),
          productEn: (b.productsEn ?? b.products).join(', '),
          berths: b.name,
          dischargeRate: b.loadingRate,
          dischargeRateEn: b.loadingRateEn ?? b.loadingRate,
          muellajeTariff:
            b.muellajeTariff ??
            'Tarifa ASIPONA vigente según tipo de carga',
          muellajeTariffEn:
            b.muellajeTariffEn ??
            'Applicable ASIPONA tariff per cargo classification',
          restrictions:
            b.restrictions ??
            `Calado máx. ${formatDraftMAndFt(b.maxDraftM)} · Eslora máx. ${b.maxLoaM} m`,
          restrictionsEn:
            b.restrictionsEn ??
            `Max draft ${formatDraftMAndFt(b.maxDraftM)} · Max LOA ${b.maxLoaM} m`,
          maneuvers: b.maneuvers ?? b.notes,
          maneuversEn: b.maneuversEn ?? b.notesEn ?? b.notes,
        }));

  const handleCopySummary = async () => {
    const lines = [
      `ISS Port Intelligence — ${displayName}`,
      `${isEs ? 'Recinto' : 'Enclosure'}: ${
        area ? (isEs ? area.name : area.nameEn) : 'N/A'
      } | ${isEs ? 'Operador' : 'Operator'}: ${terminal.operator}`,
      `${isEs ? 'Coordenadas' : 'Coordinates'}: ${terminal.coordinates}`,
      `${isEs ? 'Restricciones' : 'Restrictions'}: ${displayRestr}`,
      `--- ${isEs ? 'Posiciones de Atraque' : 'Berth Positions'} ---`,
      ...terminal.berths.map((b) => {
        const bName = isEs ? b.name : b.nameEn ?? b.name;
        const bProducts = isEs ? b.products : b.productsEn ?? b.products;
        const bMuellaje = isEs ? b.muellajeTariff : b.muellajeTariffEn ?? b.muellajeTariff;
        return isEs
          ? `• ${bName}: Long ${b.lengthM} m | LOA máx ${b.maxLoaM} m | Prof ${formatDraftMAndFt(b.berthDepthM)} | Calado máx ${formatDraftMAndFt(b.maxDraftM)} | Productos: ${bProducts.join(', ')}${bMuellaje ? ` | Muellaje: ${bMuellaje}` : ''}`
          : `• ${bName}: Length ${b.lengthM} m | Max LOA ${b.maxLoaM} m | Depth ${formatDraftMAndFt(b.berthDepthM)} | Max Draft ${formatDraftMAndFt(b.maxDraftM)} | Commodities: ${bProducts.join(', ')}${bMuellaje ? ` | Wharfage: ${bMuellaje}` : ''}`;
      }),
      ...(effectiveProductSpecs.length > 0
        ? [
            `--- ${isEs ? 'Productos, Rates y Muellaje' : 'Commodities, Rates & Wharfage'} ---`,
            ...effectiveProductSpecs.map((ps) =>
              isEs
                ? `• ${ps.product} (${ps.berths}): Rate ${ps.dischargeRate} | Muellaje: ${ps.muellajeTariff}`
                : `• ${ps.productEn} (${ps.berths}): Rate ${ps.dischargeRateEn} | Wharfage: ${ps.muellajeTariffEn}`
            ),
          ]
        : []),
      ...(commercial
        ? [
            `--- ${isEs ? 'Perfil Comercial, Aduana y Conectividad' : 'Commercial Profile, Customs & Connectivity'} ---`,
            `${isEs ? 'Posicionamiento' : 'Positioning'}: ${isEs ? commercial.positioningHeadline : commercial.positioningHeadlineEn}`,
            `${isEs ? 'Régimen Aduanal' : 'Customs Regime'}: ${isEs ? commercial.customsRegime : commercial.customsRegimeEn}`,
            `${isEs ? 'Conectividad' : 'Connectivity'}: ${isEs ? commercial.connectivity : commercial.connectivityEn}`,
            ...(isEs ? commercial.commercialServices : commercial.commercialServicesEn).map(
              (srv) => `• ${srv}`
            ),
          ]
        : []),
      `${isEs ? 'Fuente' : 'Source'}: ${terminal.audit.source}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!activeSheet) return;
    setExportingPng(true);
    try {
      await downloadPierSheetPng(activeSheet, terminal.imageUrl);
    } finally {
      setExportingPng(false);
    }
  };

  const handlePrintPdf = () => {
    if (!activeSheet) return;
    document.body.classList.add('printing-pier-fiche');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-pier-fiche');
    }, 500);
  };

  const handleOpenBerthSheet = (berthId: string) => {
    setSelectedBerthId(berthId);
    setActiveTab('sheets');
  };

  const activeConcessionaire: ConcessionaireTerminal | null = selectedConcessionaireId
    ? concessionaires.find((c) => c.id === selectedConcessionaireId) ?? null
    : null;

  const handleCopyConcessionaire = async (conc: ConcessionaireTerminal) => {
    const subdiv = isEs ? conc.subdivision : conc.subdivisionEn ?? conc.subdivision;
    const cat = isEs ? conc.cargoCategory : conc.cargoCategoryEn;
    const infra = isEs ? conc.infrastructure : conc.infrastructureEn;
    const conn = isEs ? conc.connectionSpecs : conc.connectionSpecsEn ?? conc.connectionSpecs;
    const method = isEs ? conc.dischargeMethod : conc.dischargeMethodEn ?? conc.dischargeMethod;
    const cap = isEs ? conc.storageCapacity : conc.storageCapacityEn ?? conc.storageCapacity;
    const restr = isEs ? conc.restrictions : conc.restrictionsEn ?? conc.restrictions;
    const procs = isEs ? conc.procedures : conc.proceduresEn ?? conc.procedures;
    const text = [
      `ISS Port Intelligence — ${conc.name}`,
      subdiv ? `${isEs ? 'Subdivisión' : 'Subdivision'}: ${subdiv}` : '',
      `${isEs ? 'Terminal Base' : 'Parent Enclosure'}: ${displayName} (${conc.berthsUsed})`,
      conc.coordinates ? `${isEs ? 'Coordenadas' : 'Coordinates'}: ${conc.coordinates}` : '',
      `${isEs ? 'Categoría' : 'Cargo Category'}: ${cat}`,
      `${isEs ? 'Infraestructura' : 'Infrastructure'}: ${infra}`,
      conn ? `${isEs ? 'Conexiones y Ductos' : 'Connections'}: ${conn}` : '',
      method ? `${isEs ? 'Método de Descarga' : 'Transfer Method'}: ${method}` : '',
      cap ? `${isEs ? 'Almacenaje' : 'Storage'}: ${cap}` : '',
      conc.productsList?.length ? `${isEs ? 'Productos' : 'Products'}: ${conc.productsList.join(', ')}` : '',
      restr ? `${isEs ? 'Restricciones' : 'Restrictions'}: ${restr}` : '',
      procs?.length ? `${isEs ? 'Procedimientos' : 'Procedures'}:\n- ${procs.join('\n- ')}` : '',
      conc.auditSource ? `${isEs ? 'Fuente' : 'Source'}: ${conc.auditSource}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setConcCopied(true);
      setTimeout(() => setConcCopied(false), 2000);
    } catch {
      setConcCopied(false);
    }
  };

  const renderInteractiveProductChip = (prodLabel: string, keySuffix: string) => {
    const matched = matchDossierForProductLabel(prodLabel, productDossiers);
    if (matched) {
      return (
        <button
          key={`${prodLabel}-${keySuffix}`}
          type="button"
          onClick={() => setActiveDossier(matched)}
          title={
            isEs
              ? `Abrir ficha técnica individual de ${matched.name}`
              : `Open individual product dossier for ${matched.nameEn}`
          }
          className="px-2.5 py-1 text-[11px] font-medium bg-[#eef8fd] hover:bg-[#dceffb] border border-[#b9e3f9] rounded-md text-[#0066cc] transition-colors text-left"
        >
          {prodLabel} ↗
        </button>
      );
    }
    return (
      <span
        key={`${prodLabel}-${keySuffix}`}
        className="px-2.5 py-1 text-[11px] font-medium bg-white border border-[#d2d2d7] rounded-md text-[#1d1d1f]"
      >
        {prodLabel}
      </span>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terminal-modal-title"
      className="pier-print-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
    >
      <div className="pier-print-modal-shell bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#e5e5ea]">
        {/* Header Media (hidden during individual pier fiche print) */}
        <div className="pier-print-hide relative h-56 sm:h-64 bg-[#081222]">
          {terminal.imageUrl && (
            <img
              src={terminal.imageUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-85"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#081222] via-[#081222]/45 to-transparent" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {onEditTerminal && (
              <button
                type="button"
                onClick={() => onEditTerminal(terminal.id, activeBerth?.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/55 hover:bg-black/80 text-white text-[12px] font-medium transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                {isEs ? 'Editar terminal y fotos' : 'Edit terminal & photos'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={isEs ? 'Cerrar minisitio' : 'Close mini-site'}
              className="w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-5 left-6 right-6 text-white">
            <div className="text-[12px] text-[#93c5fd]">
              {area ? (isEs ? area.name : area.nameEn) : ''} ·{' '}
              <span className="font-mono">{terminal.coordinates}</span>
            </div>
            <h3
              id="terminal-modal-title"
              className="mt-1 font-display text-[24px] sm:text-[28px] font-semibold tracking-tight"
            >
              {displayName}
            </h3>
            <p className="text-[13px] text-white/80 mt-0.5">{terminal.operator}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="pier-print-hide flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e5e5ea]">
            <p className="text-[15px] leading-relaxed text-[#424245] max-w-3xl">
              {displayDesc}
            </p>
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-lg transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied
                ? isEs
                  ? 'Ficha copiada'
                  : 'Summary copied'
                : isEs
                ? 'Copiar ficha técnica'
                : 'Copy technical brief'}
            </button>
          </div>

          {/* Interactive Mini-Site Navigation Tabs */}
          <div
            className="pier-print-hide flex flex-wrap items-center gap-1 p-1 bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] w-fit max-w-full"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'berths'}
              onClick={() => setActiveTab('berths')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
                activeTab === 'berths'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              <Anchor className="w-4 h-4 text-[#0066cc]" />
              <span>
                {isEs ? 'Posiciones de Atraque' : 'Berth Positions'} ({terminal.berths.length})
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sheets'}
              onClick={() => setActiveTab('sheets')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
                activeTab === 'sheets'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              <FileText className="w-4 h-4 text-[#0066cc]" />
              <span>
                {disableDownloads
                  ? isEs
                    ? 'Fichas de Muelles'
                    : 'Pier Sheets'
                  : isEs
                  ? 'Fichas de Muelles (Descarga)'
                  : 'Pier Sheets (Download)'}{' '}
                ({terminal.berths.length})
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
                activeTab === 'products'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              <Package className="w-4 h-4 text-[#0066cc]" />
              <span>
                {isEs ? 'Productos, Rates y Muellaje' : 'Commodities, Rates & Wharfage'} (
                {effectiveProductSpecs.length})
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'concessionaires'}
              onClick={() => setActiveTab('concessionaires')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
                activeTab === 'concessionaires'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              <Building2 className="w-4 h-4 text-[#0066cc]" />
              <span>
                {isEs ? 'Terminales Internas y Almacenaje' : 'Concessionaires & Storage'}
                {concessionaires.length > 0 ? ` (${concessionaires.length})` : ''}
              </span>
            </button>

            {(commercial || storage) && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'commercial'}
                onClick={() => setActiveTab('commercial')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
                  activeTab === 'commercial'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <Briefcase className="w-4 h-4 text-[#0066cc]" />
                <span>
                  {isEs ? 'Perfil Comercial y Servicios' : 'Commercial & Services'}
                </span>
              </button>
            )}
          </div>

          {/* TAB 1: BERTH POSITIONS */}
          {activeTab === 'berths' && (
            <div className="pier-print-hide space-y-4">
              {terminal.berths.map((berth) => {
                const bName = isEs ? berth.name : berth.nameEn ?? berth.name;
                const bProducts = isEs
                  ? berth.products
                  : berth.productsEn ?? berth.products;
                const bEquipment = isEs
                  ? berth.equipment
                  : berth.equipmentEn ?? berth.equipment;
                const bConnections = isEs
                  ? berth.connections
                  : berth.connectionsEn ?? berth.connections;
                const bRate = isEs
                  ? berth.loadingRate
                  : berth.loadingRateEn ?? berth.loadingRate;
                const bMuellaje = isEs
                  ? berth.muellajeTariff
                  : berth.muellajeTariffEn ?? berth.muellajeTariff;
                const bRestrictions = isEs
                  ? berth.restrictions
                  : berth.restrictionsEn ?? berth.restrictions;
                const bManeuvers = isEs
                  ? berth.maneuvers
                  : berth.maneuversEn ?? berth.maneuvers;
                const bNotes = isEs ? berth.notes : berth.notesEn ?? berth.notes;

                return (
                  <div
                    key={berth.id}
                    className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#d2d2d7]/60">
                      <div className="font-display text-[16px] font-semibold text-[#1d1d1f]">
                        {bName}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[12px] font-medium text-[#92400e]">
                          {berth.verificationStatus === 'verified'
                            ? isEs
                              ? 'Parámetros verificados'
                              : 'Verified specs'
                            : isEs
                            ? 'Pendiente validación oficial'
                            : 'Pending official validation'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenBerthSheet(berth.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#0066cc] bg-white hover:bg-[#e5f1fc] border border-[#b9e3f9] rounded-lg transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {disableDownloads
                            ? isEs
                              ? 'Ver Ficha'
                              : 'View Sheet'
                            : isEs
                            ? 'Ver / Descargar Ficha'
                            : 'View / Download Sheet'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-[13px]">
                      <div>
                        <div className="text-[11px] text-[#6e6e73]">
                          {isEs ? 'Longitud muelle' : 'Berth length'}
                        </div>
                        <div className="font-mono font-semibold text-[#1d1d1f] tabular-nums">
                          {berth.lengthM} m
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#6e6e73]">
                          {isEs ? 'Eslora máx.' : 'Max LOA'}
                        </div>
                        <div className="font-mono font-semibold text-[#1d1d1f] tabular-nums">
                          {berth.maxLoaM} m
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#6e6e73]">
                          {isEs ? 'Manga máx.' : 'Max Beam'}
                        </div>
                        <div className="font-mono font-semibold text-[#1d1d1f] tabular-nums">
                          {berth.maxBeamM} m
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#6e6e73]">
                          {isEs ? 'Prof. muelle (m / ft)' : 'Berth depth (m / ft)'}
                        </div>
                        <div className="font-mono text-[13px] font-semibold text-[#1d1d1f] tabular-nums">
                          {formatDraftMAndFt(berth.berthDepthM, 1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#6e6e73]">
                          {isEs ? 'Calado máx. (m / ft)' : 'Max draft (m / ft)'}
                        </div>
                        <div className="font-mono text-[13px] font-semibold text-[#0066cc] tabular-nums">
                          {formatDraftMAndFt(berth.maxDraftM)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#d2d2d7]/60 grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[13px] text-[#424245]">
                      <div>
                        <span className="font-semibold text-[#1d1d1f] block mb-1.5">
                          {isEs ? 'Productos autorizados: ' : 'Authorized cargo: '}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {bProducts.map((p, idx) =>
                            renderInteractiveProductChip(p, `${berth.id}-${idx}`)
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-[#1d1d1f]">
                          {isEs ? 'Rate de descarga / carga: ' : 'Loading / discharge rate: '}
                        </span>
                        <span className="font-mono">{bRate}</span>
                      </div>
                      {bMuellaje && (
                        <div>
                          <span className="font-semibold text-[#1d1d1f]">
                            {isEs ? 'Tarifa de Muellaje aplicable: ' : 'Applicable Wharfage: '}
                          </span>
                          <span className="font-mono text-[#0066cc] font-medium">
                            {bMuellaje}
                          </span>
                        </div>
                      )}
                      {bRestrictions && (
                        <div>
                          <span className="font-semibold text-[#1d1d1f]">
                            {isEs ? 'Restricciones del muelle: ' : 'Berth restrictions: '}
                          </span>
                          {bRestrictions}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-[#1d1d1f]">
                          {isEs ? 'Equipos en muelle: ' : 'Berth equipment: '}
                        </span>
                        {bEquipment.join(' · ')}
                      </div>
                      <div>
                        <span className="font-semibold text-[#1d1d1f]">
                          {isEs ? 'Conexiones y servicios: ' : 'Connections & utilities: '}
                        </span>
                        {bConnections.join(' · ')}
                      </div>
                      {bManeuvers && (
                        <div className="md:col-span-2">
                          <span className="font-semibold text-[#1d1d1f]">
                            {isEs ? 'Maniobras de operación: ' : 'Cargo & berthing maneuvers: '}
                          </span>
                          {bManeuvers}
                        </div>
                      )}
                    </div>
                    {bNotes && (
                      <p className="mt-3 text-[12px] text-[#6e6e73]">{bNotes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: INDIVIDUAL PIER SPECIFICATION SHEETS + PER-BERTH DOWNLOADS */}
          {activeTab === 'sheets' && activeBerth && activeSheet && (
            <div className="space-y-5">
              {/* Berth Selector + Download Actions */}
              <div className="pier-print-hide p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[12px] font-semibold text-[#1d1d1f]">
                    {isEs
                      ? `Seleccionar ficha individual (${terminal.berths.length} posiciones):`
                      : `Select individual pier sheet (${terminal.berths.length} positions):`}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!disableDownloads && (
                      <>
                        <button
                          type="button"
                          onClick={handleDownloadPng}
                          disabled={exportingPng}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-white bg-[#042447] hover:bg-[#0a3668] rounded-lg transition-colors disabled:opacity-60"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {exportingPng
                            ? isEs
                              ? 'Generando PNG...'
                              : 'Rendering PNG...'
                            : isEs
                            ? 'Descargar PNG (1920×1080)'
                            : 'Download PNG (1920×1080)'}
                        </button>

                        <button
                          type="button"
                          onClick={handlePrintPdf}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-lg transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          {isEs ? 'Imprimir / Guardar PDF' : 'Print / Save PDF'}
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadPierSheetHtml(activeSheet, terminal.imageUrl)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium text-[#1d1d1f] bg-white hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors"
                        >
                          <FileCode2 className="w-3.5 h-3.5" />
                          {isEs ? 'Descargar HTML' : 'Download HTML'}
                        </button>
                      </>
                    )}

                    {onEditTerminal && (
                      <button
                        type="button"
                        onClick={() => onEditTerminal(terminal.id, activeBerth.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium text-[#1d1d1f] bg-white hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#0066cc]" />
                        {isEs ? 'Editar ficha y foto' : 'Edit sheet & photo'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Selector Buttons for Every Berth */}
                <div className="flex flex-wrap gap-1.5">
                  {terminal.berths.map((berth) => {
                    const sheetPreview = buildDefaultPierSheetFromBerth(berth, terminal);
                    const isSelected = berth.id === activeBerth.id;
                    const shortLabel = berth.pierSheet
                      ? `${sheetPreview.pierNumber} ${sheetPreview.pierTitle} ${sheetPreview.pierSide}`.trim()
                      : isEs
                      ? berth.name
                      : berth.nameEn ?? berth.name;
                    return (
                      <button
                        key={berth.id}
                        type="button"
                        onClick={() => setSelectedBerthId(berth.id)}
                        className={`px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-[#042447] text-white border-[#042447]'
                            : 'bg-white text-[#1d1d1f] border-[#d2d2d7] hover:bg-[#e5e5ea]/60'
                        }`}
                      >
                        {shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Individual Visual Pier Specification Card */}
              <div className="pier-print-only">
                <PierSpecificationCard
                  sheet={activeSheet}
                  fallbackBannerUrl={terminal.imageUrl}
                />
              </div>
            </div>
          )}

          {/* TAB 3: COMMODITIES, DISCHARGE RATES, RESTRICTIONS & MUELLAJE TARIFFS */}
          {activeTab === 'products' && (
            <div className="pier-print-hide space-y-4">
              {effectiveProductSpecs.map((spec) => (
                <div
                  key={spec.id}
                  className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-[#d2d2d7]/60">
                    <div>
                      <h4 className="font-display text-[16px] font-semibold text-[#1d1d1f]">
                        {isEs ? spec.product : spec.productEn}
                      </h4>
                      <div className="text-[12px] text-[#6e6e73] mt-0.5">
                        {isEs ? 'Posiciones habilitadas: ' : 'Qualified berths: '}
                        <span className="font-medium text-[#1d1d1f]">{spec.berths}</span>
                      </div>
                    </div>
                    <div className="font-mono text-[13px] font-semibold text-[#0066cc] tabular-nums">
                      {isEs ? spec.muellajeTariff : spec.muellajeTariffEn}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
                    <div>
                      <div className="text-[11px] font-medium text-[#6e6e73] mb-1">
                        {isEs ? 'Rate de descarga / carga' : 'Discharge / Loading Rate'}
                      </div>
                      <div className="font-mono text-[#1d1d1f]">
                        {isEs ? spec.dischargeRate : spec.dischargeRateEn}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-[#6e6e73] mb-1">
                        {isEs ? 'Restricciones por producto' : 'Product Restrictions'}
                      </div>
                      <div className="text-[#424245] leading-relaxed">
                        {isEs ? spec.restrictions : spec.restrictionsEn}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-[#6e6e73] mb-1">
                        {isEs ? 'Maniobras específicas' : 'Cargo Handling Maneuvers'}
                      </div>
                      <div className="text-[#424245] leading-relaxed">
                        {isEs ? spec.maneuvers : spec.maneuversEn}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: CONCESSIONAIRES, STORAGE & PROCEDURES */}
          {activeTab === 'concessionaires' && (
            <div className="pier-print-hide space-y-6">
              {activeConcessionaire ? (
                /* INDIVIDUAL CONCESSIONAIRE / INNER TERMINAL FULL VISUAL FICHA */
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedConcessionaireId(null)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {isEs
                        ? `Volver a terminales internas y cesionarios (${concessionaires.length})`
                        : `Back to inner terminals & concessionaires (${concessionaires.length})`}
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyConcessionaire(activeConcessionaire)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-lg transition-colors"
                      >
                        {concCopied ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {concCopied
                          ? isEs
                            ? 'Ficha copiada'
                            : 'Brief copied'
                          : isEs
                          ? 'Copiar ficha cesionario'
                          : 'Copy concessionaire brief'}
                      </button>

                      {onEditTerminal && (
                        <button
                          type="button"
                          onClick={() => onEditTerminal(terminal.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#0066cc]" />
                          {isEs ? 'Editar foto y datos' : 'Edit photo & data'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hero Image Banner matching Terminal Showcase */}
                  <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-[#081222] border border-[#e5e5ea]">
                    {(activeConcessionaire.imageUrl || terminal.imageUrl) && (
                      <img
                        src={activeConcessionaire.imageUrl ?? terminal.imageUrl}
                        alt={activeConcessionaire.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-85"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#081222] via-[#081222]/45 to-transparent" />
                    <div className="absolute bottom-5 left-6 right-6 text-white">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#93c5fd]">
                        <span>{displayName}</span>
                        <span>·</span>
                        <span className="font-mono">{activeConcessionaire.berthsUsed}</span>
                        {activeConcessionaire.coordinates && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 font-mono">
                              <MapPin className="w-3.5 h-3.5" />
                              {activeConcessionaire.coordinates}
                            </span>
                          </>
                        )}
                      </div>
                      <h4 className="mt-1 font-display text-[22px] sm:text-[26px] font-semibold tracking-tight">
                        {activeConcessionaire.name}
                      </h4>
                      {(isEs
                        ? activeConcessionaire.subdivision
                        : activeConcessionaire.subdivisionEn ?? activeConcessionaire.subdivision) && (
                        <p className="text-[13px] text-white/85 mt-0.5">
                          {isEs
                            ? activeConcessionaire.subdivision
                            : activeConcessionaire.subdivisionEn ??
                              activeConcessionaire.subdivision}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Structured Technical Specs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-5 space-y-2.5">
                      <div className="text-[12px] font-semibold text-[#0066cc]">
                        {isEs
                          ? activeConcessionaire.cargoCategory
                          : activeConcessionaire.cargoCategoryEn}
                      </div>
                      <div className="text-[12px] font-semibold text-[#1d1d1f]">
                        {isEs
                          ? 'Infraestructura y Capacidad Operativa'
                          : 'Infrastructure & Operational Capacity'}
                      </div>
                      <p className="text-[13px] text-[#424245] leading-relaxed">
                        {isEs
                          ? activeConcessionaire.infrastructure
                          : activeConcessionaire.infrastructureEn}
                      </p>
                      {(isEs
                        ? activeConcessionaire.storageCapacity
                        : activeConcessionaire.storageCapacityEn ??
                          activeConcessionaire.storageCapacity) && (
                        <div className="pt-2 border-t border-[#d2d2d7]/60 text-[12px] text-[#424245]">
                          <span className="font-semibold text-[#1d1d1f]">
                            {isEs ? 'Almacenaje / Vínculo: ' : 'Storage / Tie-in: '}
                          </span>
                          {isEs
                            ? activeConcessionaire.storageCapacity
                            : activeConcessionaire.storageCapacityEn ??
                              activeConcessionaire.storageCapacity}
                        </div>
                      )}
                    </div>

                    <div className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-5 space-y-3 text-[13px] text-[#424245]">
                      <div className="text-[12px] font-semibold text-[#1d1d1f]">
                        {isEs
                          ? 'Conexiones a Muelle y Método de Descarga'
                          : 'Berth Connections & Transfer Method'}
                      </div>
                      {(isEs
                        ? activeConcessionaire.connectionSpecs
                        : activeConcessionaire.connectionSpecsEn ??
                          activeConcessionaire.connectionSpecs) && (
                        <div>
                          <span className="font-semibold text-[#1d1d1f]">
                            {isEs ? 'Conexiones / Bridas / Líneas: ' : 'Connections / Lines: '}
                          </span>
                          {isEs
                            ? activeConcessionaire.connectionSpecs
                            : activeConcessionaire.connectionSpecsEn ??
                              activeConcessionaire.connectionSpecs}
                        </div>
                      )}
                      {(isEs
                        ? activeConcessionaire.dischargeMethod
                        : activeConcessionaire.dischargeMethodEn ??
                          activeConcessionaire.dischargeMethod) && (
                        <div>
                          <span className="font-semibold text-[#1d1d1f]">
                            {isEs ? 'Método de Transferencia: ' : 'Transfer Method: '}
                          </span>
                          {isEs
                            ? activeConcessionaire.dischargeMethod
                            : activeConcessionaire.dischargeMethodEn ??
                              activeConcessionaire.dischargeMethod}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-[#1d1d1f]">
                          {isEs ? 'Posiciones de Atraque: ' : 'Berths Used: '}
                        </span>
                        <span className="font-mono text-[#0066cc] font-medium">
                          {activeConcessionaire.berthsUsed}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Products Handled */}
                  {activeConcessionaire.productsList &&
                    activeConcessionaire.productsList.length > 0 && (
                      <div className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-5 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[13px] font-semibold text-[#1d1d1f]">
                            {isEs
                              ? 'Productos Manejados (pulsa para abrir ficha técnica individual)'
                              : 'Commodities Handled (click to open individual dossier)'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activeConcessionaire.productsList.map((prod, idx) =>
                            renderInteractiveProductChip(
                              prod,
                              `${activeConcessionaire.id}-${idx}`
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Restrictions & Procedures */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl p-5 border border-[#e5e5ea] space-y-2.5">
                      <h5 className="font-display text-[15px] font-semibold text-[#1d1d1f]">
                        {isEs
                          ? 'Procedimientos Operativos de la Terminal Interna'
                          : 'Inner Terminal Operating Procedures'}
                      </h5>
                      <ul className="space-y-2 text-[13px] text-[#424245] list-disc pl-5">
                        {(
                          (isEs
                            ? activeConcessionaire.procedures
                            : activeConcessionaire.proceduresEn ??
                              activeConcessionaire.procedures) ?? displayProcedures
                        ).map((proc, i) => (
                          <li key={i}>{proc}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#fef2f2] rounded-xl p-5 border border-[#fecaca] text-[13px] space-y-2">
                      <div className="flex items-center gap-2 font-display font-semibold text-[#991b1b]">
                        <ShieldAlert className="w-4 h-4 text-[#dc2626]" />
                        <span>
                          {isEs
                            ? 'Restricciones Específicas y Control'
                            : 'Specific Restrictions & Audit'}
                        </span>
                      </div>
                      <p className="text-[#7f1d1d] leading-relaxed">
                        {(isEs
                          ? activeConcessionaire.restrictions
                          : activeConcessionaire.restrictionsEn ??
                            activeConcessionaire.restrictions) || displayRestr}
                      </p>
                      <div className="pt-2 border-t border-[#fecaca] text-[12px] text-[#991b1b]/80">
                        {isEs ? 'Fuente: ' : 'Source: '}
                        {activeConcessionaire.auditSource ?? terminal.audit.source}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ALL INNER TERMINALS / CONCESSIONAIRES CARDS GRID */
                <>
                  {storage && (
                    <div className="rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] p-5 space-y-4">
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1d1d1f]">
                        <Warehouse className="w-4 h-4 text-[#0066cc]" />
                        <span>
                          {isEs
                            ? 'Capacidad de Almacenaje Techado y Patios'
                            : 'Covered Warehouses & Open Yard Capacity'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-3.5 border border-[#e5e5ea]">
                          <div className="text-[11px] text-[#6e6e73]">
                            {isEs ? 'Bodegas Techadas' : 'Covered Warehouses'}
                          </div>
                          <div className="font-mono text-[18px] font-semibold text-[#1d1d1f] tabular-nums">
                            {storage.coveredSqm.toLocaleString()} m²
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3.5 border border-[#e5e5ea]">
                          <div className="text-[11px] text-[#6e6e73]">
                            {isEs ? 'Patios Abiertos Totales' : 'Total Open Yards'}
                          </div>
                          <div className="font-mono text-[18px] font-semibold text-[#1d1d1f] tabular-nums">
                            {storage.openYardSqm.toLocaleString()} m²
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3.5 border border-[#e5e5ea]">
                          <div className="text-[11px] text-[#6e6e73]">
                            {isEs ? 'Patio Contenedores' : 'Container Patio'}
                          </div>
                          <div className="font-mono text-[18px] font-semibold text-[#0066cc] tabular-nums">
                            {storage.containerYardSqm.toLocaleString()} m²
                          </div>
                        </div>
                      </div>
                      <p className="text-[13px] text-[#424245] leading-relaxed">
                        {isEs ? storage.warehousesBreakdown : storage.warehousesBreakdownEn}
                      </p>
                    </div>
                  )}

                  {concessionaires.length > 0 && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div>
                          <h4 className="font-display text-[17px] font-semibold text-[#1d1d1f]">
                            {isEs
                              ? `Terminales Internas y Cesionarios (${concessionaires.length})`
                              : `Inner Terminals & Concessionaires (${concessionaires.length})`}
                          </h4>
                          <p className="text-[12px] text-[#6e6e73] mt-0.5">
                            {isEs
                              ? 'Cada terminal interna incluye fotografía, conexiones a muelles, método de descarga, productos y restricciones.'
                              : 'Each inner terminal includes facility photo, berth connections, transfer method, products and restrictions.'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {concessionaires.map((conc) => {
                          const subdiv = isEs
                            ? conc.subdivision
                            : conc.subdivisionEn ?? conc.subdivision;
                          const connSpecs = isEs
                            ? conc.connectionSpecs
                            : conc.connectionSpecsEn ?? conc.connectionSpecs;
                          const dischMethod = isEs
                            ? conc.dischargeMethod
                            : conc.dischargeMethodEn ?? conc.dischargeMethod;
                          const cardImage = conc.imageUrl || terminal.imageUrl;

                          return (
                            <article
                              key={conc.id}
                              className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 shadow-xs"
                            >
                              <div>
                                {/* Visual Photo Header matching TerminalsShowcase */}
                                <div className="relative aspect-[16/9] bg-[#0b1220] overflow-hidden">
                                  {cardImage ? (
                                    <img
                                      src={cardImage}
                                      alt={conc.name}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/25">
                                      <Building2 className="w-10 h-10" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                  <div className="absolute bottom-3 left-4 right-4 text-white">
                                    <div className="text-[11px] text-[#93c5fd] font-mono truncate">
                                      {conc.berthsUsed}
                                      {conc.coordinates ? ` · ${conc.coordinates}` : ''}
                                    </div>
                                    <h5 className="font-display text-[16px] font-semibold leading-snug mt-0.5">
                                      {conc.name}
                                    </h5>
                                  </div>
                                </div>

                                <div className="p-4 space-y-2.5">
                                  {subdiv && (
                                    <div className="text-[11.5px] font-semibold text-[#042447]">
                                      {subdiv}
                                    </div>
                                  )}
                                  <div className="text-[12px] font-medium text-[#0066cc]">
                                    {isEs ? conc.cargoCategory : conc.cargoCategoryEn}
                                  </div>
                                  <p className="text-[12.5px] text-[#424245] leading-relaxed line-clamp-3">
                                    {isEs ? conc.infrastructure : conc.infrastructureEn}
                                  </p>

                                  {(connSpecs || dischMethod) && (
                                    <div className="pt-2 border-t border-[#e5e5ea] space-y-1 text-[11.5px] text-[#424245]">
                                      {connSpecs && (
                                        <div className="line-clamp-2">
                                          <span className="font-semibold text-[#1d1d1f]">
                                            {isEs ? 'Conexiones: ' : 'Connections: '}
                                          </span>
                                          {connSpecs}
                                        </div>
                                      )}
                                      {dischMethod && (
                                        <div className="line-clamp-2">
                                          <span className="font-semibold text-[#1d1d1f]">
                                            {isEs ? 'Transferencia: ' : 'Transfer: '}
                                          </span>
                                          {dischMethod}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {conc.productsList && conc.productsList.length > 0 && (
                                    <div className="pt-1 flex flex-wrap gap-1">
                                      {conc.productsList
                                        .slice(0, 4)
                                        .map((prod, idx) =>
                                          renderInteractiveProductChip(
                                            prod,
                                            `${conc.id}-${idx}`
                                          )
                                        )}
                                      {conc.productsList.length > 4 && (
                                        <span className="px-2 py-0.5 text-[11px] font-medium text-[#6e6e73]">
                                          +{conc.productsList.length - 4}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="px-4 pb-4 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedConcessionaireId(conc.id)}
                                  className="w-full inline-flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-[#0066cc] bg-[#f5f5f7] hover:bg-[#e8f0fe] rounded-lg transition-colors"
                                >
                                  <span>
                                    {isEs
                                      ? 'Abrir ficha de cesionario'
                                      : 'Open concessionaire brief'}
                                  </span>
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div>
                      <h4 className="font-display text-[15px] font-semibold text-[#1d1d1f] mb-2.5">
                        {isEs ? 'Procedimientos específicos' : 'Terminal procedures'}
                      </h4>
                      <ul className="space-y-2 text-[13px] text-[#424245] list-disc pl-5">
                        {displayProcedures.map((proc, i) => (
                          <li key={i}>{proc}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#f5f5f7] rounded-xl p-5 border border-[#e5e5ea] text-[13px] space-y-2">
                      <div className="flex items-center gap-2 font-display font-semibold text-[#1d1d1f]">
                        <ShieldAlert className="w-4 h-4 text-[#0066cc]" />
                        <span>
                          {isEs ? 'Control y trazabilidad de fuente' : 'Source & Audit Trail'}
                        </span>
                      </div>
                      <p className="text-[#424245]">{displayRestr}</p>
                      <div className="pt-2 text-[12px] text-[#6e6e73] space-y-1">
                        <div>
                          {isEs ? 'Fuente: ' : 'Source: '}
                          {terminal.audit.source}
                        </div>
                        <div>
                          {isEs ? 'Última actualización: ' : 'Last updated: '}
                          <span className="font-mono">{terminal.audit.updatedAt}</span> ·{' '}
                          {terminal.audit.updatedBy}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 5: COMMERCIAL PROFILE, CUSTOMS PROCESS, CONNECTIVITY & INFRASTRUCTURE */}
          {activeTab === 'commercial' && (commercial || storage) && (
            <div className="pier-print-hide space-y-6">
              {commercial && (
                <>
                  <div className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#d2d2d7]/60">
                      <div className="space-y-1 max-w-3xl">
                        <div className="text-[12px] font-medium text-[#0066cc]">
                          {isEs ? commercial.customsRegime : commercial.customsRegimeEn}
                        </div>
                        <h4 className="font-display text-[20px] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
                          {isEs
                            ? commercial.positioningHeadline
                            : commercial.positioningHeadlineEn}
                        </h4>
                        {commercial.address && (
                          <div className="text-[12.5px] text-[#6e6e73] flex items-center gap-1.5 pt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                            <span>{commercial.address}</span>
                          </div>
                        )}
                      </div>

                      {onEditTerminal && (
                        <button
                          type="button"
                          onClick={() => onEditTerminal(terminal.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] bg-white hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors shrink-0"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#0066cc]" />
                          {isEs ? 'Editar perfil comercial' : 'Edit commercial profile'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[13.5px]">
                      <div className="space-y-1.5">
                        <div className="text-[12px] font-semibold text-[#1d1d1f]">
                          {isEs
                            ? 'Conectividad Multimodal y Accesos'
                            : 'Multimodal Connectivity & Corridors'}
                        </div>
                        <p className="text-[#424245] leading-relaxed">
                          {isEs ? commercial.connectivity : commercial.connectivityEn}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[12px] font-semibold text-[#1d1d1f]">
                          {isEs
                            ? 'Tipos de Embarcación Atendidos'
                            : 'Vessel Types & Fleet Served'}
                        </div>
                        <ul className="space-y-1 text-[#424245] list-disc pl-5">
                          {(isEs
                            ? commercial.vesselTypesServed
                            : commercial.vesselTypesServedEn
                          ).map((vt, idx) => (
                            <li key={idx}>{vt}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl border border-[#e5e5ea] p-5 space-y-3">
                      <h5 className="font-display text-[15px] font-semibold text-[#1d1d1f]">
                        {isEs
                          ? 'Portafolio de Servicios Comerciales y Maniobras'
                          : 'Commercial Services & Terminal Capabilities'}
                      </h5>
                      <ul className="space-y-2 text-[13.5px] text-[#424245] leading-relaxed list-disc pl-5">
                        {(isEs
                          ? commercial.commercialServices
                          : commercial.commercialServicesEn
                        ).map((srv, idx) => (
                          <li key={idx}>{srv}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-xl border border-[#e5e5ea] p-5 space-y-3">
                      <h5 className="font-display text-[15px] font-semibold text-[#1d1d1f]">
                        {isEs
                          ? 'Infraestructura, Grúas y Capacidades Clave'
                          : 'Infrastructure, Equipment & Key Capacities'}
                      </h5>
                      <ul className="space-y-2 text-[13.5px] text-[#424245] leading-relaxed list-disc pl-5">
                        {(isEs
                          ? commercial.infrastructureHighlights
                          : commercial.infrastructureHighlightsEn
                        ).map((inf, idx) => (
                          <li key={idx}>{inf}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {((isEs ? commercial.customsProcess : commercial.customsProcessEn)?.length ?? 0) >
                    0 && (
                    <div className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-5 space-y-3">
                      <h5 className="font-display text-[15px] font-semibold text-[#1d1d1f]">
                        {isEs
                          ? 'Flujo Aduanal y Liberación Operativa'
                          : 'Customs Clearance & Gate Dispatch Workflow'}
                      </h5>
                      <ol className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px] text-[#424245]">
                        {(
                          (isEs
                            ? commercial.customsProcess
                            : commercial.customsProcessEn ?? commercial.customsProcess) ?? []
                        ).map((step, idx) => (
                          <li
                            key={idx}
                            className="bg-white rounded-lg border border-[#e5e5ea] p-3.5 leading-relaxed"
                          >
                            <span className="font-mono text-[12px] font-semibold text-[#0066cc] mr-2 tabular-nums">
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl border border-[#e5e5ea] p-5 space-y-2.5">
                      <h5 className="font-display text-[15px] font-semibold text-[#1d1d1f]">
                        {isEs
                          ? 'Ventajas Competitivas y Operativas'
                          : 'Operational & Commercial Advantages'}
                      </h5>
                      <ul className="space-y-2 text-[13.5px] text-[#424245] leading-relaxed list-disc pl-5">
                        {(isEs
                          ? commercial.operationalAdvantages
                          : commercial.operationalAdvantagesEn
                        ).map((adv, idx) => (
                          <li key={idx}>{adv}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-xl border border-[#e5e5ea] p-5 space-y-4 text-[13px]">
                      {commercial.keyClientsOrTrades &&
                        commercial.keyClientsOrTrades.length > 0 && (
                          <div>
                            <div className="text-[12px] font-semibold text-[#1d1d1f] mb-1">
                              {isEs
                                ? 'Principales Usuarios, Líneas y Tráficos'
                                : 'Key Clients, Lines & Trade Lanes'}
                            </div>
                            <p className="text-[#424245] leading-relaxed">
                              {commercial.keyClientsOrTrades.join(' · ')}
                            </p>
                          </div>
                        )}

                      {commercial.certifications && commercial.certifications.length > 0 && (
                        <div className="pt-3 border-t border-[#e5e5ea]">
                          <div className="text-[12px] font-semibold text-[#1d1d1f] mb-1">
                            {isEs
                              ? 'Certificaciones y Cumplimiento'
                              : 'Certifications & Compliance'}
                          </div>
                          <p className="font-mono text-[12.5px] text-[#0066cc] leading-relaxed">
                            {commercial.certifications.join(' · ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {storage && (
                <div className="rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1d1d1f]">
                    <Warehouse className="w-4 h-4 text-[#0066cc]" />
                    <span>
                      {isEs
                        ? 'Resumen de Almacenaje Techado y Patios'
                        : 'Covered Storage & Open Yard Summary'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
                    <div className="bg-white rounded-lg p-3 border border-[#e5e5ea]">
                      <div className="text-[11px] text-[#6e6e73]">
                        {isEs ? 'Bodegas Techadas' : 'Covered Warehouses'}
                      </div>
                      <div className="font-mono text-[16px] font-semibold text-[#1d1d1f] tabular-nums">
                        {storage.coveredSqm.toLocaleString()} m²
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#e5e5ea]">
                      <div className="text-[11px] text-[#6e6e73]">
                        {isEs ? 'Patios Abiertos' : 'Open Yards'}
                      </div>
                      <div className="font-mono text-[16px] font-semibold text-[#1d1d1f] tabular-nums">
                        {storage.openYardSqm.toLocaleString()} m²
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#e5e5ea]">
                      <div className="text-[11px] text-[#6e6e73]">
                        {isEs ? 'Patio Contenedores' : 'Container Yard'}
                      </div>
                      <div className="font-mono text-[16px] font-semibold text-[#0066cc] tabular-nums">
                        {storage.containerYardSqm.toLocaleString()} m²
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#424245] leading-relaxed">
                    {isEs ? storage.warehousesBreakdown : storage.warehousesBreakdownEn}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Product Technical Dossier nested modal when clicking any product chip inside mini-site */}
      <ProductDossierModal
        dossier={activeDossier}
        portName={portName}
        lang={lang}
        disableDownloads={disableDownloads}
        onEditDossier={onOpenProductManager}
        onClose={() => setActiveDossier(null)}
      />
    </div>
  );
}
