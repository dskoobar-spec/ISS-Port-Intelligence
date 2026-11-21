import { useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { formatDraftMAndFt } from '../utils/i18n';
import type { Language, PortArea, PortProfile, Terminal } from '../types/port';

interface TerminalsShowcaseProps {
  port: PortProfile;
  areas: PortArea[];
  terminals: Terminal[];
  lang: Language;
  onSelectTerminal: (terminal: Terminal) => void;
}

export function TerminalsShowcase({
  port,
  areas,
  terminals,
  lang,
  onSelectTerminal,
}: TerminalsShowcaseProps) {
  const portAreas = areas.filter((a) => a.portId === port.id);
  const portTerminals = terminals.filter((t) => t.portId === port.id);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');

  const effectiveAreaId =
    selectedAreaId === 'ALL' || portAreas.some((a) => a.id === selectedAreaId)
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
            {portAreas.map((area) => (
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

        {/* Comparison strip of Port Enclosures */}
        <div
          className={`mt-10 grid grid-cols-1 ${
            portAreas.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
          } gap-6`}
        >
          {portAreas.map((area) => (
            <div
              key={area.id}
              className="bg-white rounded-2xl border border-[#e5e5ea] p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4 text-[12px] text-[#6e6e73]">
                  <span>{lang === 'es' ? 'Recinto / Corredor' : 'Enclosure / Corridor'}</span>
                  <span className="font-medium text-[#92400e]">
                    {area.verificationStatus === 'verified'
                      ? lang === 'es'
                        ? 'Verificado'
                        : 'Verified'
                      : lang === 'es'
                      ? 'Pendiente validación oficial'
                      : 'Pending official validation'}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-[20px] font-semibold tracking-tight text-[#1d1d1f]">
                  {lang === 'es' ? area.name : area.nameEn}
                </h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-[#424245]">
                  {lang === 'es' ? area.summary : area.summaryEn}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#e5e5ea] grid grid-cols-3 gap-3 text-[13px]">
                <div>
                  <div className="text-[#6e6e73] text-[11px]">
                    {lang === 'es' ? 'Prof. Canal' : 'Channel Depth'}
                  </div>
                  <div className="font-mono text-[12px] font-semibold text-[#1d1d1f] tabular-nums">
                    {formatDraftMAndFt(area.channelDepthM, 1)}
                  </div>
                </div>
                <div>
                  <div className="text-[#6e6e73] text-[11px]">
                    {lang === 'es' ? 'Calado Op.' : 'Op. Draft'}
                  </div>
                  <div className="font-mono text-[12px] font-semibold text-[#0066cc] tabular-nums">
                    {formatDraftMAndFt(area.operationalDraftM)}
                  </div>
                </div>
                <div>
                  <div className="text-[#6e6e73] text-[11px]">
                    {lang === 'es' ? 'Ciaboga' : 'Turning Basin'}
                  </div>
                  <div className="font-mono font-semibold text-[#1d1d1f] tabular-nums">
                    {area.turningBasinM} m
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Separated Terminal Cards / Mini-Site Launchers */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTerminals.map((terminal, idx) => {
            const area = areaById.get(terminal.areaId);
            const maxDraft =
              terminal.berths.length > 0
                ? Math.max(...terminal.berths.map((b) => b.maxDraftM))
                : 0;
            const maxLoa =
              terminal.berths.length > 0
                ? Math.max(...terminal.berths.map((b) => b.maxLoaM))
                : 0;

            // Balanced Apple Grid: when 7 cards (1 + 6), make card 0 full-width horizontal hero showcase
            const isFullWidthHero =
              idx === 0 && filteredTerminals.length === 7;
            const isTwoColFeatured =
              idx === 0 && filteredTerminals.length === 3;

            return (
              <article
                key={terminal.id}
                className={`bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 ${
                  isFullWidthHero
                    ? 'lg:col-span-3 lg:flex-row'
                    : isTwoColFeatured
                    ? 'lg:col-span-2'
                    : ''
                }`}
              >
                <div
                  className={
                    isFullWidthHero
                      ? 'flex-1 grid grid-cols-1 lg:grid-cols-12'
                      : 'flex-1 flex flex-col justify-between'
                  }
                >
                  <div
                    className={`relative bg-[#0b1220] overflow-hidden ${
                      isFullWidthHero
                        ? 'lg:col-span-6 aspect-[16/9] lg:aspect-auto lg:min-h-[300px]'
                        : 'aspect-[16/9]'
                    }`}
                  >
                    {terminal.imageUrl ? (
                      <img
                        src={terminal.imageUrl}
                        alt={lang === 'es' ? terminal.name : terminal.nameEn ?? terminal.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/25">
                        <Building2 className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5 text-white">
                      <div className="text-[12px] text-white/80">
                        {area ? (lang === 'es' ? area.name : area.nameEn) : port.name} ·{' '}
                        {terminal.berths.length}{' '}
                        {terminal.berths.length === 1
                          ? lang === 'es'
                            ? 'muelle'
                            : 'berth'
                          : lang === 'es'
                          ? 'muelles'
                          : 'berths'}
                      </div>
                      <h3 className="mt-0.5 font-display text-[20px] font-semibold leading-snug">
                        {lang === 'es' ? terminal.name : terminal.nameEn ?? terminal.name}
                      </h3>
                    </div>
                  </div>

                  <div
                    className={`p-6 flex flex-col justify-between ${
                      isFullWidthHero ? 'lg:col-span-6 lg:p-7' : 'flex-1'
                    }`}
                  >
                    <div>
                      <div className="text-[12px] text-[#6e6e73]">
                        {terminal.operator} ·{' '}
                        <span className="font-mono">{terminal.coordinates}</span>
                      </div>
                      <p className="mt-2.5 text-[15px] leading-relaxed text-[#424245]">
                        {lang === 'es' ? terminal.shortDesc : terminal.shortDescEn}
                      </p>

                      <div className="mt-5 pt-4 border-t border-[#e5e5ea] grid grid-cols-3 gap-3 text-[13px]">
                        <div>
                          <div className="text-[11px] text-[#6e6e73]">
                            {lang === 'es' ? 'Calado Muelle' : 'Berth Draft'}
                          </div>
                          <div className="font-mono text-[12px] font-semibold text-[#1d1d1f] tabular-nums">
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
                            {lang === 'es' ? 'Validación' : 'Status'}
                          </div>
                          <div className="font-medium text-[#92400e] truncate">
                            {terminal.audit.verificationStatus === 'verified'
                              ? lang === 'es'
                                ? 'Verificado'
                                : 'Verified'
                              : lang === 'es'
                              ? 'Por validar'
                              : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => onSelectTerminal(terminal)}
                        className="w-full inline-flex items-center justify-between px-4 py-2.5 text-[14px] font-medium text-[#0066cc] bg-[#f5f5f7] hover:bg-[#e8f0fe] rounded-lg transition-colors"
                      >
                        <span>
                          {lang === 'es'
                            ? 'Abrir minisitio de terminal'
                            : 'Open terminal mini-site'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
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
