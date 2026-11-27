import { useState } from 'react';
import { Anchor, ArrowUpRight, Lock } from 'lucide-react';
import { formatDraftMAndFt, REGION_LABELS, translatePortStatus } from '../utils/i18n';
import { formatShareExpirationDate, type ShareSectionKey } from '../utils/shareLink';
import type { Language, PortArea, PortProfile, PortRegion, WeatherStatus } from '../types/port';

interface HeroSectionProps {
  port: PortProfile;
  allPorts: PortProfile[];
  areas: PortArea[];
  weather?: WeatherStatus;
  lang: Language;
  isExclusiveMode?: boolean;
  exclusiveExpiresAtMs?: number;
  allowedSections?: ShareSectionKey[];
  onSelectPort: (portId: string) => void;
  onOpenPreArrivalGenerator?: () => void;
}

const REGION_ORDER: PortRegion[] = [
  'GOLFO DE MÉXICO',
  'MAR CARIBE',
  'PACÍFICO NORTE',
  'PACÍFICO CENTRO',
  'PACÍFICO SUR',
];

export function HeroSection({
  port,
  allPorts,
  areas,
  weather,
  lang,
  isExclusiveMode = false,
  exclusiveExpiresAtMs,
  allowedSections,
  onSelectPort,
  onOpenPreArrivalGenerator,
}: HeroSectionProps) {
  const [imgError, setImgError] = useState(false);

  const canShow = (key: ShareSectionKey) =>
    !allowedSections || allowedSections.includes(key);

  const portAreas = areas.filter((a) => a.portId === port.id);
  const maxOperationalDraft =
    portAreas.length > 0
      ? Math.max(...portAreas.map((a) => a.operationalDraftM))
      : 0;

  return (
    <section id="top" className="bg-[#060a13] text-white">
      <div className="relative min-h-[540px] lg:min-h-[600px] flex items-end overflow-hidden">
        {!imgError ? (
          <img
            src={port.heroImageUrl}
            alt={port.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#081224] via-[#0c1d38] to-[#050911] flex items-center justify-center">
            <Anchor className="w-24 h-24 text-white/15" />
          </div>
        )}

        <div
          className="absolute inset-0 bg-gradient-to-t from-[#060a13] via-[#060a13]/65 to-[#060a13]/25"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-[1200px] w-full mx-auto px-6 pt-24 pb-16">
          <p className="text-[13px] font-medium tracking-wide text-[#a1c4fd] mb-4">
            {port.country} · {lang === 'es' ? port.state : port.stateEn ?? port.state} · UN/LOCODE{' '}
            {port.unLocode}
          </p>

          <h1 className="font-display text-[clamp(2.35rem,4.8vw,4.15rem)] font-semibold tracking-tight leading-[1.06] text-white max-w-4xl [text-wrap:balance]">
            {lang === 'es' ? port.heroHeadline : port.heroHeadlineEn}
          </h1>

          <p className="mt-5 text-[17px] lg:text-[19px] leading-relaxed text-[#d2d7e0] max-w-2xl">
            {lang === 'es' ? port.heroSubheadline : port.heroSubheadlineEn}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {canShow('terminals') && (
              <a
                href="#terminals"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-medium text-[#060a13] bg-white hover:bg-[#f5f5f7] rounded-lg transition-colors duration-150 whitespace-nowrap"
              >
                {lang === 'es' ? 'Explorar terminales y muelles' : 'Explore terminals & berths'}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}

            {onOpenPreArrivalGenerator && (
              <button
                type="button"
                onClick={onOpenPreArrivalGenerator}
                className="inline-flex items-center justify-center px-6 py-3 text-[15px] font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] rounded-lg transition-colors duration-150 whitespace-nowrap"
              >
                {lang === 'es' ? 'Información Pre-Arribo' : 'Pre-Arrival Information'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4-Column Apple-Style Specification Strip */}
      <div className="border-t border-white/12 bg-[#080d18]">
        <div className="max-w-[1200px] mx-auto px-6 py-7 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="border-r-0 lg:border-r border-white/10 pr-4">
            <div className="text-[12px] text-[#98a2b3] mb-1">
              {lang === 'es' ? 'Coordenadas de acceso' : 'Access Coordinates'}
            </div>
            <div className="font-mono text-[14px] sm:text-[15px] font-medium text-white tabular-nums">
              {port.coordinates}
            </div>
          </div>

          <div className="border-r-0 lg:border-r border-white/10 pr-2 sm:pr-4">
            <div className="text-[12px] text-[#98a2b3] mb-1">
              {lang === 'es' ? 'Calado operativo máx. (Ref.)' : 'Max Operational Draft (Ref.)'}
            </div>
            <div className="font-mono text-[13px] sm:text-[15px] font-medium text-white tabular-nums whitespace-nowrap">
              {formatDraftMAndFt(maxOperationalDraft)}
            </div>
          </div>

          <div className="border-r-0 lg:border-r border-white/10 pr-2 sm:pr-4">
            <div className="text-[12px] text-[#98a2b3] mb-1">
              {lang === 'es' ? 'Recintos y comunicación' : 'Port Enclosures & VHF'}
            </div>
            <div className="text-[13px] sm:text-[15px] font-medium text-white">
              {portAreas.length}{' '}
              {lang === 'es'
                ? portAreas.length === 1
                  ? 'recinto'
                  : 'recintos'
                : portAreas.length === 1
                ? 'enclosure'
                : 'enclosures'}{' '}
              · {port.vhfChannel.split('(')[0].trim()}
            </div>
          </div>

          <div>
            <div className="text-[12px] text-[#98a2b3] mb-1">
              {lang === 'es' ? 'Estatus portuario y clima' : 'Port & Weather Status'}
            </div>
            <div className="text-[13px] sm:text-[15px] font-medium text-[#7dd3fc]">
              {weather
                ? `${translatePortStatus(weather.portStatus, lang)} · ${weather.windKnots} kt`
                : port.authority}
            </div>
          </div>
        </div>
      </div>

      {/* Clean Port Context Bar below hero fold */}
      <div className="bg-[#f5f5f7] text-[#1d1d1f] border-b border-[#d2d2d7]/70">
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {!isExclusiveMode ? (
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="hero-port-select" className="text-[12px] font-medium text-[#6e6e73]">
                {lang === 'es'
                  ? `Puerto activo (${allPorts.length}):`
                  : `Active port (${allPorts.length}):`}
              </label>
              <select
                id="hero-port-select"
                value={port.id}
                onChange={(e) => onSelectPort(e.target.value)}
                className="max-w-full px-3 py-1.5 text-[13px] font-medium text-[#1d1d1f] bg-white border border-[#d2d2d7] rounded-lg focus:outline-2 focus:outline-[#0066cc]"
              >
                {REGION_ORDER.map((region) => {
                  const regionPorts = allPorts.filter((p) => p.region === region);
                  if (regionPorts.length === 0) return null;
                  return (
                    <optgroup key={region} label={REGION_LABELS[region][lang]}>
                      {regionPorts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name.replace('Puerto de ', '')} ({p.shortCode} · {p.unLocode})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <a
                href="#port-status"
                className="text-[13px] font-medium text-[#0066cc] hover:underline whitespace-nowrap"
              >
                {lang === 'es' ? 'Ver clima e histórico' : 'Weather & status log'}
              </a>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-[13px]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <Lock className="w-3.5 h-3.5 text-[#0066cc]" />
                {lang === 'es' ? 'Vista exclusiva autorizada:' : 'Authorized Exclusive View:'}{' '}
                {port.name} ({port.unLocode})
              </span>
              {exclusiveExpiresAtMs && (
                <span className="text-[12px] text-[#6e6e73] font-mono tabular-nums">
                  {lang === 'es' ? 'Vigente hasta' : 'Valid until'}{' '}
                  {formatShareExpirationDate(exclusiveExpiresAtMs, lang)}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-[12.5px] text-[#6e6e73]">
            <span>{port.authority}</span>
            {canShow('authorities') && (
              <a
                href="#authorities-crew"
                className="font-medium text-[#0066cc] hover:underline whitespace-nowrap"
              >
                {lang === 'es' ? 'Autoridades y Migración' : 'Authorities & Immigration'}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
