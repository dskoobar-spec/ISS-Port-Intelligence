import { useState } from 'react';
import { Anchor, ArrowRight, Building2 } from 'lucide-react';
import { formatDraftMAndFt } from '../utils/i18n';
import type { Language, PortArea, PortProfile, Terminal } from '../types/port';

interface TerminalsShowcaseProps {
  port: PortProfile;
  areas: PortArea[];
  terminals: Terminal[];
  lang: Language;
  onSelectTerminal: (terminal: Terminal) => void;
  onOpenConcessionaires?: (terminal: Terminal) => void;
}

export function TerminalsShowcase({
  port,
  areas,
  terminals,
  lang,
  onSelectTerminal,
  onOpenConcessionaires,
}: TerminalsShowcaseProps) {
  const portAreas = areas.filter((a) => a.portId === port.id);
  const portTerminals = terminals.filter((t) => t.portId === port.id);
  const areasWithTerminals = portAreas.filter((a) =>
    portTerminals.some((t) => t.areaId === a.id)
  );
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const effectiveAreaId =
    selectedAreaId === 'ALL' || areasWithTerminals.some((a) => a.id === selectedAreaId)
      ? selectedAreaId
      : 'ALL';

  const filteredTerminals = portTerminals.filter(
    (t) => effectiveAreaId === 'ALL' || t.areaId === effectiveAreaId
  );

  const areaById = new Map(portAreas.map((a) => [a.id, a]));

  return (
    <section id="terminals" className="bg-[#f5f5f7] py-20 lg:py-24 border-b border-[#e5e5ea]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium text-[#0066cc] mb-2">
              {lang === 'es'
                ? '06. Recintos Portuarios y Minisitios de Terminales'
                : '06. Port Enclosures & Individual Terminal Mini-Sites'}
            </p>
            <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
              {lang === 'es'
                ? 'Cada terminal con su propio minisitio técnico y ficha de muelles.'
                : 'Every terminal has its own technical mini-site and berth sheet.'}
            </h2>
          </div>

          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-white rounded-lg border border-[#d2d2d7] self-start lg:self-auto max-w-full">
            <button
              type="button"
              onClick={() => setSelectedAreaId('ALL')}
              className={`px-3.5 py-1.5 text-[13px] font-medium rounded-md transition-colors text-left ${
                effectiveAreaId === 'ALL'
                  ? 'bg-[#1d1d1f] text-white'
                  : 'text-[#424245] hover:text-[#1d1d1f]'
              }`}
            >
              {lang === 'es' ? 'Todas las terminales' : 'All terminals'} ({portTerminals.length})
            </button>
            {areasWithTerminals.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedAreaId(area.id)}
                className={`px-3.5 py-1.5 text-[12px] sm:text-[13px] font-medium rounded-md transition-colors text-left leading-snug ${
                  effectiveAreaId === area.id
                    ? 'bg-[#1d1d1f] text-white'
                    : 'text-[#424245] hover:text-[#1d1d1f]'
                }`}
              >
                {lang === 'es' ? area.name : area.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Mini-Site Cards with Photos + Corrected Title, Operator & Coordinates */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTerminals.map((terminal) => {
            const area = areaById.get(terminal.areaId);
            const maxDraft =
              terminal.berths.length > 0
                ? Math.max(...terminal.berths.map((b) => b.maxDraftM))
                : 0;
            const maxLoa =
              terminal.berths.length > 0
                ? Math.max(...terminal.berths.map((b) => b.maxLoaM))
                : 0;
            const areaLabel = area ? (lang === 'es' ? area.name : area.nameEn) : port.name;
            const imgFailed = failedImages[terminal.id] || !terminal.imageUrl;

            return (
              <article
                key={terminal.id}
                className="group bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div>
                  <div className="aspect-[16/9] bg-[#0c1220] relative overflow-hidden">
                    {!imgFailed ? (
                      <img
                        src={terminal.imageUrl}
                        alt={lang === 'es' ? terminal.name : terminal.nameEn ?? terminal.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [terminal.id]: true }))
                        }
                        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d192b] to-[#1a2c4a]">
                        <Anchor className="w-10 h-10 text-white/25" />
                      </div>
                    )}
                  </div>

                  <div className="p-6 pb-0">
                    <div className="flex items-center justify-between gap-3 text-[12px] text-[#6e6e73]">
                      <span className="truncate">{areaLabel}</span>
                      <span className="font-medium text-[#92400e] shrink-0">
                        {terminal.audit.verificationStatus === 'verified'
                          ? lang === 'es'
                            ? 'Verificado'
                            : 'Verified'
                          : lang === 'es'
                          ? 'Por validar'
                          : 'Pending'}
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-[20px] font-semibold tracking-tight text-[#1d1d1f] leading-snug">
                      {lang === 'es' ? terminal.name : terminal.nameEn ?? terminal.name}
                    </h3>

                    <div className="mt-1.5 text-[12.5px] font-medium text-[#0066cc] leading-snug">
                      <span>{terminal.operator}</span>
                      <span className="mx-1.5 text-[#9ca3af]" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono text-[#1d1d1f] tabular-nums">
                        {terminal.coordinates}
                      </span>
                    </div>

                    <p className="mt-3 text-[14px] leading-relaxed text-[#424245]">
                      {lang === 'es' ? terminal.shortDesc : terminal.shortDescEn}
                    </p>

                    {(terminal.commercialProfile || terminal.storageSummary) && (
                      <div className="mt-3 pt-2.5 border-t border-[#f0f0f3] text-[12px] text-[#6e6e73] leading-snug space-y-1">
                        {terminal.commercialProfile && (
                          <div className="text-[#1d1d1f] font-medium truncate">
                            {lang === 'es'
                              ? terminal.commercialProfile.customsRegime
                              : terminal.commercialProfile.customsRegimeEn}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
                          {terminal.commercialProfile && (
                            <span>
                              {terminal.commercialProfile.commercialServices.length}{' '}
                              {lang === 'es' ? 'servicios comerciales' : 'commercial services'}
                            </span>
                          )}
                          {terminal.commercialProfile &&
                            terminal.storageSummary &&
                            (terminal.storageSummary.coveredSqm > 0 ||
                              terminal.storageSummary.openYardSqm > 0) && (
                              <span aria-hidden="true">·</span>
                            )}
                          {terminal.storageSummary &&
                            (terminal.storageSummary.coveredSqm > 0 ||
                              terminal.storageSummary.openYardSqm > 0) && (
                              <span className="font-mono">
                                {terminal.storageSummary.coveredSqm > 0
                                  ? `${terminal.storageSummary.coveredSqm.toLocaleString()} m² ${
                                      lang === 'es' ? 'tech.' : 'cov.'
                                    }`
                                  : `${terminal.storageSummary.openYardSqm.toLocaleString()} m² ${
                                      lang === 'es' ? 'patio' : 'yard'
                                    }`}
                              </span>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-6">
                  <div className="pt-4 border-t border-[#e5e5ea] grid grid-cols-3 gap-3 text-[13px]">
                    <div>
                      <div className="text-[11px] text-[#6e6e73]">
                        {lang === 'es' ? 'Calado Muelle' : 'Berth Draft'}
                      </div>
                      <div className="font-mono text-[12px] font-semibold text-[#0066cc] tabular-nums">
                        {formatDraftMAndFt(maxDraft)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#6e6e73]">
                        {lang === 'es' ? 'Eslora Máx.' : 'Max LOA'}
                      </div>
                      <div className="font-mono font-semibold text-[#1d1d1f] tabular-nums">
                        {maxLoa} m
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#6e6e73]">
                        {lang === 'es' ? 'Posiciones' : 'Berths'}
                      </div>
                      <div className="font-mono font-semibold text-[#1d1d1f] tabular-nums">
                        {terminal.berths.length}{' '}
                        {terminal.berths.length === 1
                          ? lang === 'es'
                            ? 'muelle'
                            : 'berth'
                          : lang === 'es'
                          ? 'muelles'
                          : 'berths'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <button
                      type="button"
                      onClick={() => onSelectTerminal(terminal)}
                      className="w-full inline-flex items-center justify-between px-4 py-2.5 text-[13.5px] font-medium text-[#0066cc] bg-[#f5f5f7] hover:bg-[#e8f0fe] rounded-lg transition-colors"
                    >
                      <span>
                        {lang === 'es'
                          ? 'Abrir minisitio de terminal'
                          : 'Open terminal mini-site'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {terminal.concessionaires && terminal.concessionaires.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenConcessionaires
                            ? onOpenConcessionaires(terminal)
                            : onSelectTerminal(terminal)
                        }
                        className="w-full inline-flex items-center justify-between px-4 py-2 text-[12.5px] font-medium text-[#1d1d1f] bg-white hover:bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg transition-colors"
                      >
                        <span className="inline-flex items-center gap-2 text-left">
                          <Building2 className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                          <span>
                            {lang === 'es'
                              ? `Terminales internas y cesionarios (${terminal.concessionaires.length})`
                              : `Inner terminals & concessionaires (${terminal.concessionaires.length})`}
                          </span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#6e6e73] shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
