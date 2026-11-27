import { useState } from 'react';
import { Compass, Layers, MapPin, Navigation } from 'lucide-react';
import { formatDraftMAndFt } from '../utils/i18n';
import type { Language, PortArea, PortProfile, Terminal } from '../types/port';

interface InteractivePortMapProps {
  port: PortProfile;
  areas: PortArea[];
  terminals: Terminal[];
  lang: Language;
  onSelectTerminal: (terminal: Terminal) => void;
}

export function InteractivePortMap({
  port,
  areas,
  terminals,
  lang,
  onSelectTerminal,
}: InteractivePortMapProps) {
  const portAreas = areas.filter((a) => a.portId === port.id);
  const portTerminals = terminals.filter((t) => t.portId === port.id);
  const areasWithTerminals = portAreas.filter((a) =>
    portTerminals.some((t) => t.areaId === a.id)
  );
  const [layerFilter, setLayerFilter] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string>(portTerminals[0]?.id ?? '');

  const effectiveLayerFilter =
    layerFilter === 'ALL' || areasWithTerminals.some((a) => a.id === layerFilter)
      ? layerFilter
      : 'ALL';

  const visibleTerminals = portTerminals.filter(
    (t) => effectiveLayerFilter === 'ALL' || t.areaId === effectiveLayerFilter
  );

  const activeTerminal =
    visibleTerminals.find((t) => t.id === selectedId) ?? visibleTerminals[0] ?? null;

  const activeArea = portAreas.find((a) => a.id === activeTerminal?.areaId);

  return (
    <section id="overview" className="bg-white py-20 lg:py-24 border-b border-[#e5e5ea]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-3xl">
          <p className="text-[13px] font-medium text-[#0066cc] mb-2">
            {lang === 'es'
              ? '05. Terminales y Mapa Geográfico del Puerto'
              : '05. Port Terminals & Geographic Layout'}
          </p>
          <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
            {port.id === 'mxcoa'
              ? lang === 'es'
                ? `Las ${portTerminals.length} terminales estratégicas de Coatzacoalcos en su ubicación real.`
                : `Coatzacoalcos’ ${portTerminals.length} strategic terminals across river and lagoon docks.`
              : areasWithTerminals.length > 1
              ? lang === 'es'
                ? `${areasWithTerminals.length} recintos estratégicos en una sola vista geográfica.`
                : `${areasWithTerminals.length} strategic port enclosures in a single geographic view.`
              : lang === 'es'
              ? 'Recinto portuario y terminales en una sola vista geográfica.'
              : 'Port enclosure and terminals in a single geographic view.'}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#424245]">
            {lang === 'es' ? port.overview : port.overviewEn}
          </p>
        </div>

        {/* Layer filter controls */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea] max-w-full">
            <button
              type="button"
              onClick={() => setLayerFilter('ALL')}
              className={`px-3.5 py-1.5 text-[13px] font-medium rounded-md transition-colors text-left ${
                effectiveLayerFilter === 'ALL'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              {lang === 'es' ? 'Todo el complejo' : 'Full Complex'} ({portTerminals.length})
            </button>
            {areasWithTerminals.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => setLayerFilter(area.id)}
                className={`px-3.5 py-1.5 text-[12px] sm:text-[13px] font-medium rounded-md transition-colors text-left leading-snug ${
                  effectiveLayerFilter === area.id
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                {lang === 'es' ? area.name : area.nameEn}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[13px] text-[#6e6e73] font-mono">
            <Compass className="w-4 h-4 text-[#0066cc]" />
            <span>{port.coordinates}</span>
          </div>
        </div>

        {/* Interactive Chart + Selected Pin Inspector */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden bg-[#081222] border border-[#1d2b44] min-h-[540px] flex flex-col justify-between p-5 sm:p-6 text-white">
            {/* Nautical vector schematic faithful to Image 4 coastline & Pajaritos basin geometry */}
            <svg
              viewBox="0 0 800 500"
              className="absolute inset-0 w-full h-full object-cover opacity-95"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#081b33" />
                  <stop offset="100%" stopColor="#050b16" />
                </linearGradient>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="rgba(148,163,184,0.08)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="800" height="500" fill="url(#seaGrad)" />
              <rect width="800" height="500" fill="url(#grid)" />

              {port.id === 'mxcoa' ? (
                <>
                  {/* West Bank: Coatzacoalcos city & ASIPONA Coatzacoalcos docks */}
                  <path
                    d="M 0 115 L 258 98 L 284 195 L 254 275 L 200 412 L 155 500 L 0 500 Z"
                    fill="#0e1b2e"
                    stroke="#243f66"
                    strokeWidth="1.5"
                  />

                  {/* East Bank + Indented Laguna de Pajaritos Basin */}
                  <path
                    d="M 340 94 L 800 72 L 800 500 L 218 500 L 245 450 L 315 390 L 352 440 L 420 445 L 495 418 L 578 386 L 615 338 L 598 292 L 548 272 L 455 270 L 392 260 L 396 226 L 348 190 Z"
                    fill="#0e1b2e"
                    stroke="#243f66"
                    strokeWidth="1.5"
                  />

                  {/* Escolleras (Breakwaters extending NNW just like Image 4) */}
                  <line x1="258" y1="98" x2="255" y2="54" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                  <line x1="340" y1="94" x2="300" y2="26" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />

                  {/* Submerged Tunnel Crossing (Túnel Sumergido) */}
                  <line
                    x1="274"
                    y1="196"
                    x2="375"
                    y2="180"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeOpacity="0.6"
                  />
                  <text x="382" y="177" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                    {lang === 'es' ? 'TÚNEL SUMERGIDO' : 'SUBMERGED TUNNEL'}
                  </text>

                  {/* Interior Laguna de Pajaritos Water Highlight */}
                  <path
                    d="M 332 252 Q 415 266 530 272 Q 610 282 618 338 Q 585 405 455 436 Q 368 446 332 405 L 330 285 Z"
                    fill="#0a203e"
                    fillOpacity="0.65"
                    stroke="#38bdf8"
                    strokeOpacity="0.3"
                    strokeWidth="1.2"
                  />

                  {/* Finger Jetties inside Laguna de Pajaritos (Image 4 detail) */}
                  <line x1="425" y1="272" x2="425" y2="294" stroke="#475569" strokeWidth="2.5" />
                  <line x1="482" y1="272" x2="482" y2="298" stroke="#475569" strokeWidth="2.5" />
                  <line x1="598" y1="315" x2="572" y2="315" stroke="#475569" strokeWidth="2.5" />
                  <line x1="592" y1="362" x2="564" y2="352" stroke="#475569" strokeWidth="2.5" />
                  <line x1="498" y1="418" x2="484" y2="392" stroke="#475569" strokeWidth="2.5" />
                  <line x1="395" y1="438" x2="395" y2="412" stroke="#475569" strokeWidth="2.5" />

                  {/* Main River Channel & Pajaritos Channel Centerlines */}
                  <path
                    d="M 285 18 L 298 180 L 285 330 L 185 495"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    strokeOpacity="0.7"
                  />
                  <path
                    d="M 294 268 Q 375 305 468 338 Q 528 355 562 342"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    strokeOpacity="0.75"
                  />

                  {/* Nautical Chart Labels */}
                  <text x="24" y="42" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                    {lang === 'es'
                      ? "GOLFO DE MÉXICO · BOYAS DE RECALADA (18°10'N)"
                      : "GULF OF MEXICO · SEA BUOYS (18°10'N)"}
                  </text>
                  <text x="36" y="218" fill="#cbd5e1" fontSize="12" fontWeight="600">
                    COATZACOALCOS
                  </text>
                  <text x="36" y="236" fill="#60a5fa" fontSize="10" fontFamily="monospace">
                    {lang === 'es'
                      ? 'Dársena Fiscal · 11.28 m / 37.0 ft'
                      : 'Fiscal Basin · 11.28 m / 37.0 ft'}
                  </text>
                  <text x="435" y="138" fill="#cbd5e1" fontSize="12" fontWeight="600">
                    ALLENDE / MARGEN ESTE
                  </text>
                  <text x="442" y="252" fill="#93c5fd" fontSize="10.5" fontWeight="600">
                    LAGUNA DE PAJARITOS (11.88 m / 39.0 ft)
                  </text>
                </>
              ) : (
                <>
                  <path
                    d="M 0 295 Q 190 270 310 215 L 495 215 Q 610 275 800 290 L 800 500 L 0 500 Z"
                    fill="#0e1b2e"
                    stroke="#1e3556"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="415"
                    cy="225"
                    r="105"
                    fill="#091d38"
                    stroke="#2563eb"
                    strokeOpacity="0.45"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 415 35 L 415 225"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                    strokeOpacity="0.75"
                  />
                  <text x="24" y="42" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                    {port.region} · {port.unLocode} ({port.coordinates})
                  </text>
                  <text x="58" y="360" fill="#cbd5e1" fontSize="14" fontWeight="600">
                    {port.name.toUpperCase()}
                  </text>
                  <text x="58" y="382" fill="#60a5fa" fontSize="11" fontFamily="monospace">
                    {lang === 'es'
                      ? `Dársena de maniobras y zona de terminales · ${port.shortCode}`
                      : `Maneuvering basin & terminal zone · ${port.shortCode}`}
                  </text>
                </>
              )}
            </svg>

            <div className="relative z-10 flex items-center justify-between text-[12px] text-[#cbd5e1]">
              <span className="inline-flex items-center gap-1.5 bg-[#060a13]/75 px-3 py-1.5 rounded-md border border-white/10">
                <Layers className="w-3.5 h-3.5 text-[#38bdf8]" />
                {port.id === 'mxcoa'
                  ? lang === 'es'
                    ? 'Cartografía Operativa · Río Coatzacoalcos y Laguna de Pajaritos'
                    : 'Operational Chart · Coatzacoalcos River & Pajaritos Lagoon'
                  : `${lang === 'es' ? 'Esquema Náutico' : 'Nautical Schematic'} · ${port.name.replace('Puerto de ', '')}`}
              </span>
              <span className="font-mono bg-[#060a13]/75 px-2.5 py-1 rounded-md border border-white/10">
                {visibleTerminals.length} {lang === 'es' ? 'terminales' : 'terminals'}
              </span>
            </div>

            {/* Interactive Terminal Pins */}
            <div className="relative z-10 flex-1 my-3 min-h-[380px]">
              {visibleTerminals.map((terminal) => {
                const isSelected = activeTerminal?.id === terminal.id;
                const pinLabel =
                  lang === 'es'
                    ? terminal.name.split('·')[0].split('(')[0].trim()
                    : (terminal.nameEn ?? terminal.name).split('·')[0].split('(')[0].trim();

                return (
                  <button
                    key={terminal.id}
                    type="button"
                    onClick={() => setSelectedId(terminal.id)}
                    style={{ left: `${terminal.mapX}%`, top: `${terminal.mapY}%` }}
                    aria-label={terminal.name}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group flex items-center gap-1 px-2 py-1 rounded-md text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-white ${
                      isSelected
                        ? 'bg-[#0066cc] text-white shadow-lg scale-105 z-20 border border-white/60'
                        : 'bg-[#0b1628]/92 text-[#e2e8f0] hover:bg-[#162744] border border-white/25 z-10'
                    }`}
                  >
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="text-[11px] font-medium whitespace-nowrap max-w-[140px] truncate">
                      {pinLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] text-[#94a3b8] border-t border-white/10 pt-3">
              <span>
                {lang === 'es'
                  ? 'Selecciona cualquier terminal en el mapa para inspeccionar calados y muelles.'
                  : 'Select any terminal marker on the chart to inspect drafts and berths.'}
              </span>
              <span className="font-mono">WGS84</span>
            </div>
          </div>

          {/* Inspector Card */}
          <div className="lg:col-span-5 bg-[#f5f5f7] rounded-2xl border border-[#e5e5ea] p-6 lg:p-7 flex flex-col justify-between">
            {activeTerminal ? (
              <div>
                <div className="text-[12px] font-medium text-[#0066cc]">
                  {activeArea
                    ? lang === 'es'
                      ? activeArea.name
                      : activeArea.nameEn
                    : port.name}
                </div>
                <h3 className="mt-1.5 font-display text-[22px] font-semibold tracking-tight text-[#1d1d1f]">
                  {lang === 'es'
                    ? activeTerminal.name
                    : activeTerminal.nameEn ?? activeTerminal.name}
                </h3>
                <p className="mt-1 text-[13px] text-[#6e6e73]">
                  {activeTerminal.operator} ·{' '}
                  <span className="font-mono">{activeTerminal.coordinates}</span>
                </p>

                <p className="mt-4 text-[15px] leading-relaxed text-[#424245]">
                  {lang === 'es' ? activeTerminal.shortDesc : activeTerminal.shortDescEn}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3 py-4 border-y border-[#d2d2d7]/70">
                  <div>
                    <div className="text-[11px] text-[#6e6e73]">
                      {lang === 'es' ? 'Prof. Canal' : 'Channel Depth'}
                    </div>
                    <div className="font-mono text-[14px] font-semibold text-[#1d1d1f] tabular-nums">
                      {activeArea ? formatDraftMAndFt(activeArea.channelDepthM, 1) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6e6e73]">
                      {lang === 'es' ? 'Calado Op.' : 'Op. Draft'}
                    </div>
                    <div className="font-mono text-[14px] font-semibold text-[#0066cc] tabular-nums">
                      {activeArea ? formatDraftMAndFt(activeArea.operationalDraftM) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#6e6e73]">
                      {lang === 'es' ? 'Muelles' : 'Berths'}
                    </div>
                    <div className="font-mono text-[16px] font-semibold text-[#1d1d1f] tabular-nums">
                      {activeTerminal.berths.length}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-[13px] text-[#424245]">
                  <div>
                    <span className="font-medium text-[#1d1d1f]">
                      {lang === 'es' ? 'Productos principales: ' : 'Primary commodities: '}
                    </span>
                    {activeTerminal.berths
                      .flatMap((b) =>
                        lang === 'es' ? b.products : b.productsEn ?? b.products
                      )
                      .slice(0, 6)
                      .join(', ')}
                  </div>
                  <div className="text-[12px] text-[#6e6e73]">
                    {lang === 'es' ? 'Fuente: ' : 'Source: '}
                    {activeTerminal.audit.source}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[14px] text-[#6e6e73]">
                {lang === 'es'
                  ? 'No hay terminales en esta capa.'
                  : 'No terminals in this layer.'}
              </div>
            )}

            {activeTerminal && (
              <div className="mt-6 pt-4">
                <button
                  type="button"
                  onClick={() => onSelectTerminal(activeTerminal)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-[14px] font-medium text-white bg-[#1d1d1f] hover:bg-[#333336] rounded-lg transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  {lang === 'es' ? 'Abrir minisitio de terminal' : 'Open terminal mini-site'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
