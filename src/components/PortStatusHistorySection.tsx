import { CloudRainWind, ExternalLink, History, SlidersHorizontal } from 'lucide-react';
import {
  MAX_STATUS_HISTORY_PER_PORT,
  PORT_STATUS_META,
  translatePortStatus,
} from '../utils/i18n';
import type {
  Language,
  OfficialPortStatus,
  PortProfile,
  PortStatusEvent,
  WeatherStatus,
} from '../types/port';

interface PortStatusHistorySectionProps {
  port: PortProfile;
  weather?: WeatherStatus;
  statusHistory: PortStatusEvent[];
  lang: Language;
  onOpenWeatherManager: () => void;
}

function getStatusColorClass(status: OfficialPortStatus): string {
  const tone = PORT_STATUS_META[status]?.tone ?? 'open';
  if (tone === 'closed') return 'text-[#f87171]';
  if (tone === 'restricted') return 'text-[#fbbf24]';
  return 'text-[#86efac]';
}

function getHistoryLightBadgeClass(status: OfficialPortStatus): string {
  const tone = PORT_STATUS_META[status]?.tone ?? 'open';
  if (tone === 'closed') return 'text-[#b91c1c]';
  if (tone === 'restricted') return 'text-[#b45309]';
  return 'text-[#15803d]';
}

export function PortStatusHistorySection({
  port,
  weather,
  statusHistory,
  lang,
  onOpenWeatherManager,
}: PortStatusHistorySectionProps) {
  const portEvents = statusHistory
    .filter((ev) => ev.portId === port.id)
    .slice(0, MAX_STATUS_HISTORY_PER_PORT);

  return (
    <section id="port-status" className="bg-white py-14 lg:py-16 border-b border-[#e5e5ea]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[13px] font-medium text-[#0066cc] mb-1.5">
              {lang === 'es'
                ? '01. Estatus Portuario, Histórico y Meteorología'
                : '01. Port Status History & Marine Weather'}
            </p>
            <h2 className="font-display text-[clamp(1.65rem,2.8vw,2.25rem)] font-semibold tracking-tight text-[#1d1d1f]">
              {lang === 'es'
                ? `Bitácora de cierres/aperturas y clima en ${port.name.replace('Puerto de ', '')}.`
                : `Closures/Openings Log & Live Weather — ${port.name.replace('Puerto de ', '')}.`}
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenWeatherManager}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {lang === 'es' ? 'Actualizar estatus / clima' : 'Update status / weather'}
          </button>
        </div>

        {/* Equal-height 50/50 Split: Left = Last 10 Transitions | Right = Weather & Port Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT: Status Transition History (Last 10 real transitions) */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#d2d2d7]/70">
                <div className="flex items-center gap-2.5">
                  <History className="w-5 h-5 text-[#0066cc]" />
                  <h3 className="font-display text-[17px] font-semibold text-[#1d1d1f]">
                    {lang === 'es'
                      ? 'Histórico de Cierres y Aperturas de Puerto'
                      : 'Port Closures & Openings Log'}
                  </h3>
                </div>
                <span className="font-mono text-[12px] text-[#6e6e73] tabular-nums">
                  {portEvents.length} / {MAX_STATUS_HISTORY_PER_PORT}
                </span>
              </div>

              {portEvents.length > 0 ? (
                <div className="mt-4 divide-y divide-[#d2d2d7]/60">
                  {portEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-4"
                    >
                      <div className="min-w-0">
                        <div
                          className={`text-[13px] font-semibold ${getHistoryLightBadgeClass(ev.status)}`}
                        >
                          {translatePortStatus(ev.status, lang)}
                        </div>
                        <div className="text-[12px] text-[#424245] mt-0.5">
                          {lang === 'es' ? ev.navigationScope : ev.navigationScopeEn}
                        </div>
                        {(ev.notes || ev.notesEn) && (
                          <div className="text-[11px] text-[#6e6e73] mt-0.5">
                            {lang === 'es' ? ev.notes : ev.notesEn ?? ev.notes}
                          </div>
                        )}
                      </div>
                      <div className="font-mono text-[12px] text-[#1d1d1f] font-medium tabular-nums shrink-0">
                        {ev.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-[13px] text-[#6e6e73]">
                  {lang === 'es'
                    ? 'Aún no se han registrado transiciones de estatus para este puerto.'
                    : 'No port status changes recorded yet for this port.'}
                </p>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[#d2d2d7]/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6e6e73]">
              <span>
                {lang === 'es'
                  ? 'Registra automáticamente solo cuando cambia el estatus (últimos 10 eventos).'
                  : 'Logs automatically only upon status changes Open ↔ Closed (last 10 events).'}
              </span>
              <span className="font-mono">{port.unLocode}</span>
            </div>
          </div>

          {/* RIGHT: Dark Marine Weather & Port Status Card (Matching Image 1 Layout) */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl bg-[#0b1322] border border-[#1d2b44] p-6 text-white">
            {weather ? (
              <>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <CloudRainWind className="w-5 h-5 text-[#7dd3fc]" />
                      <h3 className="font-display text-[17px] font-semibold text-white">
                        {lang === 'es' ? 'Clima y Estatus Portuario' : 'Weather & Port Status'}
                      </h3>
                    </div>
                    <span
                      className={`text-[13px] font-medium ${getStatusColorClass(weather.portStatus)}`}
                    >
                      {translatePortStatus(weather.portStatus, lang)}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div>
                      <div className="text-[12px] text-[#94a3b8]">
                        {lang === 'es' ? 'Viento' : 'Wind'}
                      </div>
                      <div className="mt-1 font-mono text-[16px] font-semibold tabular-nums text-white">
                        {weather.windDirection} {weather.windKnots} kt
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#94a3b8]">
                        {lang === 'es' ? 'Oleaje barra' : 'Bar swell'}
                      </div>
                      <div className="mt-1 font-mono text-[16px] font-semibold tabular-nums text-white">
                        {weather.waveHeightM.toFixed(1)} m
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#94a3b8]">
                        {lang === 'es' ? 'Corriente río' : 'River current'}
                      </div>
                      <div className="mt-1 font-mono text-[16px] font-semibold tabular-nums text-white">
                        {weather.barCurrentKnots.toFixed(1)} kt
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-[#94a3b8]">
                        {lang === 'es' ? 'Visibilidad' : 'Visibility'}
                      </div>
                      <div className="mt-1 font-mono text-[15px] font-medium text-white">
                        {lang === 'es'
                          ? weather.visibilityNm
                          : weather.visibilityNmEn ?? weather.visibilityNm}
                      </div>
                    </div>
                  </div>

                  <p className="mt-6 text-[14px] leading-relaxed text-[#cbd5e1]">
                    {lang === 'es' ? weather.advisory : weather.advisoryEn}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10 space-y-2">
                  <div className="text-[12px] text-[#94a3b8]">
                    {lang === 'es'
                      ? weather.lastChecked
                      : weather.lastCheckedEn ?? weather.lastChecked}
                  </div>
                  <a
                    href={weather.externalWeatherUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#7dd3fc] hover:underline"
                  >
                    {lang === 'es'
                      ? 'Abrir sistema meteorológico'
                      : 'Open meteorological system'}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </>
            ) : (
              <div className="text-[14px] text-[#94a3b8]">
                {lang === 'es'
                  ? 'Sin datos meteorológicos registrados.'
                  : 'No weather telemetry registered.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
