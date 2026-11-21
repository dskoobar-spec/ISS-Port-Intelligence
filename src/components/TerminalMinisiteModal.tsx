import { useEffect, useState } from 'react';
import {
  Anchor,
  Building2,
  Check,
  Copy,
  Download,
  FileCode2,
  FileText,
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
import { PierSpecificationCard } from './PierSpecificationCard';
import type {
  Language,
  PortArea,
  ProductHandlingSpec,
  Terminal,
} from '../types/port';

interface TerminalMinisiteModalProps {
  terminal: Terminal | null;
  area?: PortArea;
  lang: Language;
  onEditTerminal?: (terminalId: string, berthId?: string) => void;
  onClose: () => void;
}

type MinisiteTab = 'berths' | 'sheets' | 'products' | 'concessionaires';

export function TerminalMinisiteModal({
  terminal,
  area,
  lang,
  onEditTerminal,
  onClose,
}: TerminalMinisiteModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<MinisiteTab>('berths');
  const [selectedBerthId, setSelectedBerthId] = useState<string>('');
  const [exportingPng, setExportingPng] = useState(false);

  useEffect(() => {
    setActiveTab('berths');
    setSelectedBerthId(terminal?.berths[0]?.id ?? '');
  }, [terminal?.id, terminal?.berths]);

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
                {isEs ? 'Fichas de Muelles (Descarga)' : 'Pier Sheets (Download)'} (
                {terminal.berths.length})
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
                          {isEs ? 'Ver / Descargar Ficha' : 'View / Download Sheet'}
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
                        <span className="font-semibold text-[#1d1d1f]">
                          {isEs ? 'Productos autorizados: ' : 'Authorized cargo: '}
                        </span>
                        {bProducts.join(', ')}
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
                  <h4 className="font-display text-[16px] font-semibold text-[#1d1d1f] mb-3">
                    {isEs
                      ? 'Terminales y Cesionarios dentro del Recinto'
                      : 'Concessionaires & Specialized Inner Terminals'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {concessionaires.map((conc) => (
                      <div
                        key={conc.id}
                        className="rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] p-4 space-y-1.5"
                      >
                        <div className="font-display text-[14px] font-semibold text-[#1d1d1f]">
                          {conc.name}
                        </div>
                        <div className="text-[12px] font-medium text-[#0066cc]">
                          {isEs ? conc.cargoCategory : conc.cargoCategoryEn} ·{' '}
                          <span className="font-mono text-[#424245]">{conc.berthsUsed}</span>
                        </div>
                        <p className="text-[13px] text-[#424245] leading-relaxed">
                          {isEs ? conc.infrastructure : conc.infrastructureEn}
                        </p>
                      </div>
                    ))}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
