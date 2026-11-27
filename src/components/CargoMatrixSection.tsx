import { useState } from 'react';
import {
  Anchor,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileText,
  PackageCheck,
  PackageSearch,
  Pencil,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { CARGO_GROUP_LABELS, formatDraftMAndFt } from '../utils/i18n';
import {
  findBerthsByProduct,
  matchesSemanticCargo,
  normalizeSearchText,
} from '../utils/pdaEngine';
import { exportAllProductsCatalogToPdf } from '../utils/pdfExporter';
import { FilenamePromptModal } from './FilenamePromptModal';
import { ProductDossierModal } from './ProductDossierModal';
import type {
  CargoGroup,
  Language,
  PortArea,
  PortProfile,
  ProductTechnicalDossier,
  Terminal,
} from '../types/port';

interface CargoMatrixSectionProps {
  port: PortProfile;
  areas: PortArea[];
  terminals: Terminal[];
  productDossiers: ProductTechnicalDossier[];
  lang: Language;
  disableDownloads?: boolean;
  onSelectTerminal: (terminal: Terminal) => void;
  onOpenProductManager?: (dossierId?: string) => void;
}

const CARGO_GROUPS: CargoGroup[] = [
  'Petroquímica y Líquidos',
  'Hidrocarburos y Gas',
  'Granel Agrícola',
  'Granel Mineral',
  'Carga General y Contenedores',
  'Carga Proyecto',
];

export function matchDossierForProductLabel(
  label: string,
  dossiers: ProductTechnicalDossier[]
): ProductTechnicalDossier | undefined {
  const norm = normalizeSearchText(label).replace(/\(.*?\)/g, '').trim();
  if (!norm || norm.length < 3) return undefined;
  return dossiers.find((d) => {
    const nEs = normalizeSearchText(d.name);
    const nEn = normalizeSearchText(d.nameEn);
    if (nEs.includes(norm) || nEn.includes(norm)) return true;
    const firstWordEs = nEs.split(/[\s(/,—-]+/)[0];
    return firstWordEs.length >= 4 && norm.includes(firstWordEs);
  });
}

export function CargoMatrixSection({
  port,
  areas,
  terminals,
  productDossiers,
  lang,
  disableDownloads = false,
  onSelectTerminal,
  onOpenProductManager,
}: CargoMatrixSectionProps) {
  const [viewMode, setViewMode] = useState<'dossiers' | 'berths'>('dossiers');
  const [selectedGroup, setSelectedGroup] = useState<CargoGroup | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [showAllDossiers, setShowAllDossiers] = useState(false);
  const [selectedQuickDossierId, setSelectedQuickDossierId] = useState('');
  const [activeDossier, setActiveDossier] = useState<ProductTechnicalDossier | null>(null);
  const [catalogPdfPromptOpen, setCatalogPdfPromptOpen] = useState(false);

  const isEs = lang === 'es';
  const portDossiers = productDossiers.filter((d) => d.portId === port.id);
  const trimmedQuery = query.trim();

  const filteredDossiers = portDossiers.filter((d) => {
    const groupMatch = selectedGroup === 'ALL' || d.cargoGroup === selectedGroup;
    if (!groupMatch) return false;
    if (!trimmedQuery) return true;
    const haystack = [
      d.code,
      d.name,
      d.nameEn,
      d.cargoGroup,
      d.unNumber,
      d.casNumber ?? '',
      d.imoClass,
      d.coatzacoalcosBerths,
      d.concessionaires,
      d.summary,
      d.summaryEn,
      d.hdsPemexSummary ?? '',
      d.hdsPemexSummaryEn ?? '',
      d.connectionSpecs,
      d.transferRates,
      d.compatibility,
      d.rejectionCriteria,
    ].join(' ');
    return matchesSemanticCargo(haystack, trimmedQuery);
  });

  const matches = findBerthsByProduct(terminals, areas, port.id, selectedGroup, query);
  const areaById = new Map(areas.map((a) => [a.id, a]));

  const hasDossiers = portDossiers.length > 0;
  const effectiveView = !hasDossiers && viewMode === 'dossiers' ? 'berths' : viewMode;

  const isDossierGridVisible =
    showAllDossiers || selectedGroup !== 'ALL' || trimmedQuery.length > 0;

  const groupedDossiers = CARGO_GROUPS.map((group) => ({
    group,
    items: portDossiers.filter((d) => d.cargoGroup === group),
  })).filter((g) => g.items.length > 0);

  const handleQuickSelectDossier = (dossierId: string) => {
    setSelectedQuickDossierId(dossierId);
    const found = portDossiers.find((d) => d.id === dossierId);
    if (found) {
      setActiveDossier(found);
    }
  };

  return (
    <section id="cargo" className="bg-white py-20 lg:py-24 border-b border-[#e5e5ea]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium text-[#0066cc] mb-2">
              {disableDownloads
                ? isEs
                  ? '06B. Productos, HDS PEMEX y Conexiones'
                  : '06B. Commodities, PEMEX SDS & Connections'
                : isEs
                ? '06B. Productos, HDS PEMEX, Conexiones y Fichas Descargables'
                : '06B. Commodities, PEMEX SDS, Connections & Downloadable Sheets'}
            </p>
            <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
              {isEs
                ? 'Productos manejados bajo demanda y matriz de muelles.'
                : 'On-demand commodity sheets & qualified berth matrix.'}
            </h2>
            <p className="mt-2.5 text-[15px] text-[#424245]">
              {isEs
                ? 'Selecciona un producto manejado o busca por nombre, grupo (ej. maíz, trigo, acero, aceites vegetales, granel agrícola) o UN para desplegar su ficha técnica y HDS oficial.'
                : 'Pick a handled commodity or search by product, category (e.g. maize, wheat, steel, vegetable oils, agricultural bulk) or UN number to open its technical sheet and SDS.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#6e6e73] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <label htmlFor="cargo-search-input" className="sr-only">
                {isEs ? 'Buscar producto, categoría, UN o terminal' : 'Search commodity, category, UN or terminal'}
              </label>
              <input
                id="cargo-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isEs
                    ? 'Ej. Maíz, Trigo, Etano, Magna, Acero...'
                    : 'e.g. Corn, Wheat, Ethane, Steel...'
                }
                className="w-full pl-10 pr-4 py-2.5 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg focus:outline-2 focus:outline-[#0066cc]"
              />
            </div>

            {onOpenProductManager && (
              <button
                type="button"
                onClick={() => onOpenProductManager()}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5 text-[#0066cc]" />
                {isEs ? 'Editar productos' : 'Edit commodities'}
              </button>
            )}
          </div>
        </div>

        {/* View Switcher + Catalog PDF Download */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="inline-flex items-center gap-1 p-1 bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] w-fit">
            {hasDossiers && (
              <button
                type="button"
                onClick={() => setViewMode('dossiers')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
                  effectiveView === 'dossiers'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <FileText className="w-4 h-4 text-[#0066cc]" />
                <span>
                  {isEs
                    ? `Productos Manejados (${filteredDossiers.length})`
                    : `Handled Commodities (${filteredDossiers.length})`}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('berths')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
                effectiveView === 'berths'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              <Anchor className="w-4 h-4 text-[#0066cc]" />
              <span>
                {isEs
                  ? `Matriz por Muelle (${matches.length})`
                  : `Berth Matrix (${matches.length})`}
              </span>
            </button>
          </div>

          {hasDossiers && !disableDownloads && (
            <button
              type="button"
              onClick={() => setCatalogPdfPromptOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#042447] hover:bg-[#0a3668] rounded-lg transition-colors w-fit"
            >
              <Download className="w-4 h-4" />
              {isEs
                ? `Descargar Catálogo Completo PDF (${filteredDossiers.length})`
                : `Download Full Product Catalog PDF (${filteredDossiers.length})`}
            </button>
          )}
        </div>

        {/* Cargo Group Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 p-1 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea] w-fit max-w-full">
          <button
            type="button"
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedGroup === 'ALL'
                ? 'bg-white text-[#1d1d1f] shadow-xs'
                : 'text-[#6e6e73] hover:text-[#1d1d1f]'
            }`}
          >
            {isEs ? 'Todos los grupos' : 'All groups'}
          </button>
          {CARGO_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedGroup === group
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              {CARGO_GROUP_LABELS[group][lang]}
            </button>
          ))}
        </div>

        {/* VIEW 1: ON-DEMAND PRODUCT DOSSIERS SELECTOR + COLLAPSIBLE GRID */}
        {effectiveView === 'dossiers' && (
          <div className="mt-6 space-y-6">
            {/* Compact On-Demand Selector Strip */}
            <div className="rounded-2xl border border-[#e5e5ea] bg-[#f5f5f7] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="product-dossier-quick-select"
                  className="block text-[12px] font-semibold text-[#1d1d1f] mb-1.5"
                >
                  {isEs
                    ? `Consultar producto manejado (${portDossiers.length} fichas individuales con HDS PEMEX / GHS):`
                    : `Call individual commodity sheet (${portDossiers.length} products with PEMEX / GHS SDS):`}
                </label>
                <div className="relative">
                  <select
                    id="product-dossier-quick-select"
                    value={selectedQuickDossierId}
                    onChange={(e) => handleQuickSelectDossier(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-10 py-2.5 text-[14px] font-medium text-[#1d1d1f] bg-white border border-[#d2d2d7] rounded-xl focus:outline-2 focus:outline-[#0066cc]"
                  >
                    <option value="">
                      {isEs
                        ? '— Selecciona un producto para abrir su ficha técnica y HDS —'
                        : '— Select a commodity to open its technical sheet & SDS —'}
                    </option>
                    {groupedDossiers.map(({ group, items }) => (
                      <optgroup
                        key={group}
                        label={`${CARGO_GROUP_LABELS[group][lang]} (${items.length})`}
                      >
                        {items.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.code} · {isEs ? d.name : d.nameEn} (UN {d.unNumber})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#6e6e73] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0 lg:self-end">
                {selectedQuickDossierId && (
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDossier(selectedQuickDossierId)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-xl transition-colors"
                  >
                    <PackageCheck className="w-4 h-4" />
                    {isEs ? 'Abrir ficha seleccionada' : 'Open selected sheet'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowAllDossiers((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-white hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-xl transition-colors"
                >
                  {isDossierGridVisible ? (
                    <>
                      <EyeOff className="w-4 h-4 text-[#6e6e73]" />
                      {isEs ? 'Ocultar tarjetas' : 'Hide cards'}
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-[#0066cc]" />
                      {isEs
                        ? `Mostrar todos (${portDossiers.length})`
                        : `Show all (${portDossiers.length})`}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Render full cards ONLY when called via search, group filter, or explicit toggle */}
            {isDossierGridVisible ? (
              filteredDossiers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredDossiers.map((dossier) => (
                    <div
                      key={dossier.id}
                      className="rounded-2xl border border-[#e5e5ea] bg-[#f5f5f7] p-5 flex flex-col justify-between hover:border-[#0066cc]/60 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#0066cc]">
                          <span className="font-semibold">{dossier.code}</span>
                          <span className="text-[#6e6e73]">
                            UN {dossier.unNumber}
                            {dossier.casNumber ? ` · CAS ${dossier.casNumber}` : ''}
                          </span>
                        </div>

                        <h3 className="mt-2 font-display text-[17px] font-semibold text-[#1d1d1f] leading-snug">
                          {isEs ? dossier.name : dossier.nameEn}
                        </h3>

                        <div className="mt-1.5 text-[12px] font-medium text-[#042447]">
                          {dossier.imoClass}
                        </div>

                        {(dossier.flashPoint || dossier.nfpa704) && (
                          <div className="mt-2 text-[11.5px] font-mono text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-md px-2.5 py-1 flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-[#d97706]" />
                            <span className="truncate">
                              {[
                                isEs
                                  ? dossier.flashPoint
                                  : dossier.flashPointEn ?? dossier.flashPoint,
                                dossier.nfpa704,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </div>
                        )}

                        <p className="mt-3 text-[13px] text-[#424245] leading-relaxed line-clamp-3">
                          {isEs ? dossier.summary : dossier.summaryEn}
                        </p>

                        <div className="mt-4 pt-3 border-t border-[#d2d2d7]/70 space-y-1.5 text-[12px] text-[#424245]">
                          <div>
                            <span className="font-semibold text-[#1d1d1f]">
                              {isEs ? 'Muelles: ' : 'Berths: '}
                            </span>
                            {dossier.coatzacoalcosBerths}
                          </div>
                          <div>
                            <span className="font-semibold text-[#1d1d1f]">
                              {isEs ? 'Terminales: ' : 'Terminals: '}
                            </span>
                            {dossier.concessionaires}
                          </div>
                          <div>
                            <span className="font-semibold text-[#1d1d1f]">
                              {isEs ? 'Conexión: ' : 'Connection: '}
                            </span>
                            <span className="line-clamp-2 inline">
                              {isEs ? dossier.connectionSpecs : dossier.connectionSpecsEn}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#d2d2d7]/70 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveDossier(dossier)}
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0066cc] hover:underline"
                        >
                          <PackageCheck className="w-4 h-4" />
                          {isEs ? 'Abrir ficha + HDS' : 'Open sheet + SDS'}
                        </button>

                        {!disableDownloads && (
                          <button
                            type="button"
                            onClick={() => setActiveDossier(dossier)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-white bg-[#1d1d1f] hover:bg-[#042447] rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#e5e5ea] bg-[#f5f5f7] p-10 text-center">
                  <PackageSearch className="w-8 h-8 text-[#6e6e73] mx-auto mb-3" />
                  <p className="text-[15px] font-medium text-[#1d1d1f]">
                    {isEs
                      ? 'Sin fichas técnicas coincidentes para esta búsqueda.'
                      : 'No product technical sheets match this filter.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroup('ALL');
                      setQuery('');
                    }}
                    className="mt-3 text-[13px] font-medium text-[#0066cc] hover:underline"
                  >
                    {isEs ? 'Restablecer búsqueda' : 'Reset search'}
                  </button>
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d2d2d7] bg-white p-8 text-center">
                <p className="text-[14px] text-[#424245]">
                  {isEs
                    ? `Las ${portDossiers.length} fichas individuales (incluyendo todos los productos PEMEX TASP / TQPM con HDS, químicos, graneles y carga proyecto) permanecen contraídas para mantener limpia la vista principal. Selecciona un producto arriba, elige un grupo de carga o escribe en el buscador para desplegarlas.`
                    : `All ${portDossiers.length} individual technical sheets (including PEMEX TASP / TQPM HDS data, chemicals, dry bulks & project cargo) stay collapsed to keep the main page uncluttered. Pick a commodity above, select a cargo group, or search to reveal them.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: BERTH QUALIFICATION TABLE */}
        {effectiveView === 'berths' && (
          <>
            {matches.length > 0 ? (
              <div className="mt-8 overflow-x-auto rounded-2xl border border-[#e5e5ea]">
                <table className="w-full text-left border-collapse text-[14px]">
                  <thead>
                    <tr className="bg-[#f5f5f7] border-b border-[#e5e5ea] text-[12px] text-[#6e6e73]">
                      <th className="py-3.5 px-5 font-medium">
                        {isEs ? 'Recinto / Terminal' : 'Area / Terminal'}
                      </th>
                      <th className="py-3.5 px-4 font-medium">
                        {isEs ? 'Muelle' : 'Berth'}
                      </th>
                      <th className="py-3.5 px-4 font-medium">
                        {isEs ? 'Productos manejados (clic para abrir ficha)' : 'Handled commodities (click for sheet)'}
                      </th>
                      <th className="py-3.5 px-4 font-medium text-right">
                        {isEs ? 'Calado máx.' : 'Max draft'}
                      </th>
                      <th className="py-3.5 px-4 font-medium">
                        {isEs ? 'Rendimiento' : 'Rate'}
                      </th>
                      <th className="py-3.5 px-5 font-medium text-right">
                        {isEs ? 'Ficha' : 'Sheet'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5ea] bg-white">
                    {matches.map(({ terminal, areaName, berth }) => {
                      const areaObj = areaById.get(terminal.areaId);
                      const displayArea = areaObj
                        ? isEs
                          ? areaObj.name
                          : areaObj.nameEn
                        : areaName;
                      const displayProducts = isEs
                        ? berth.products
                        : berth.productsEn ?? berth.products;

                      return (
                        <tr key={`${terminal.id}-${berth.id}`} className="hover:bg-[#f5f5f7]/60">
                          <td className="py-4 px-5">
                            <div className="text-[12px] text-[#6e6e73]">{displayArea}</div>
                            <div className="font-medium text-[#1d1d1f]">
                              {isEs ? terminal.name : terminal.nameEn ?? terminal.name}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-medium text-[#1d1d1f]">
                            {isEs ? berth.name : berth.nameEn ?? berth.name}
                          </td>
                          <td className="py-4 px-4 text-[#424245]">
                            <div className="flex flex-wrap gap-1.5">
                              {displayProducts.map((prodLabel, idx) => {
                                const esLabel = berth.products[idx] ?? prodLabel;
                                const matchedDossier = matchDossierForProductLabel(
                                  esLabel,
                                  portDossiers
                                );
                                return matchedDossier ? (
                                  <button
                                    key={`${prodLabel}-${idx}`}
                                    type="button"
                                    onClick={() => setActiveDossier(matchedDossier)}
                                    className="text-left text-[12.5px] font-medium text-[#0066cc] hover:underline bg-[#f0f7ff] border border-[#bae6fd] rounded-md px-2 py-0.5"
                                    title={
                                      isEs
                                        ? `Abrir ficha técnica ${matchedDossier.code}`
                                        : `Open technical sheet ${matchedDossier.code}`
                                    }
                                  >
                                    {prodLabel}
                                  </button>
                                ) : (
                                  <span
                                    key={`${prodLabel}-${idx}`}
                                    className="text-[12.5px] text-[#424245] bg-[#f5f5f7] border border-[#e5e5ea] rounded-md px-2 py-0.5"
                                  >
                                    {prodLabel}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-[#0066cc] whitespace-nowrap">
                            {formatDraftMAndFt(berth.maxDraftM)}
                          </td>
                          <td className="py-4 px-4 font-mono text-[13px] text-[#424245]">
                            <div>
                              {isEs
                                ? berth.loadingRate
                                : berth.loadingRateEn ?? berth.loadingRate}
                            </div>
                            {(berth.muellajeTariff || berth.muellajeTariffEn) && (
                              <div className="mt-0.5 text-[11px] text-[#6e6e73]">
                                {isEs
                                  ? berth.muellajeTariff
                                  : berth.muellajeTariffEn ?? berth.muellajeTariff}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => onSelectTerminal(terminal)}
                              className="text-[13px] font-medium text-[#0066cc] hover:underline whitespace-nowrap"
                            >
                              {isEs ? 'Ver terminal' : 'View terminal'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-[#e5e5ea] bg-[#f5f5f7] p-10 text-center">
                <PackageSearch className="w-8 h-8 text-[#6e6e73] mx-auto mb-3" />
                <p className="text-[15px] font-medium text-[#1d1d1f]">
                  {isEs
                    ? 'Sin coincidencias para este filtro de carga.'
                    : 'No berths match this commodity filter.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroup('ALL');
                    setQuery('');
                  }}
                  className="mt-3 text-[13px] font-medium text-[#0066cc] hover:underline"
                >
                  {isEs ? 'Restablecer búsqueda' : 'Reset search'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ProductDossierModal
        dossier={activeDossier}
        portName={port.name}
        lang={lang}
        disableDownloads={disableDownloads}
        onEditDossier={
          onOpenProductManager
            ? (id) => {
                setActiveDossier(null);
                onOpenProductManager(id);
              }
            : undefined
        }
        onClose={() => setActiveDossier(null)}
      />

      {!disableDownloads && (
        <FilenamePromptModal
          open={catalogPdfPromptOpen}
          defaultFilename={`Catalogo-Productos-${port.shortCode}-${new Date().toISOString().slice(0, 10)}`}
          title={isEs ? 'Descargar Catálogo Completo de Productos' : 'Download Complete Product Catalog'}
          subtitle={
            isEs
              ? `Se generará un compendio PDF de ${filteredDossiers.length} fichas técnicas con sus 10 criterios operativos y HDS.`
              : `Generates a ${filteredDossiers.length}-sheet PDF compendium covering all 10 operational criteria & SDS.`
          }
          lang={lang}
          onConfirm={(customName) => {
            exportAllProductsCatalogToPdf({
              filename: customName,
              dossiers: filteredDossiers,
              portName: port.name,
              lang,
            });
            setCatalogPdfPromptOpen(false);
          }}
          onClose={() => setCatalogPdfPromptOpen(false)}
        />
      )}
    </section>
  );
}
