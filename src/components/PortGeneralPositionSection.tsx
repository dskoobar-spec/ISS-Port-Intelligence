import { Anchor, Compass, Warehouse } from 'lucide-react';
import {
  cleanPortShortName,
  formatDraftMAndFt,
  getDefaultGeneralInfo,
  REGION_LABELS,
} from '../utils/i18n';
import type { Language, PortArea, PortProfile } from '../types/port';

interface PortGeneralPositionSectionProps {
  port: PortProfile;
  areas: PortArea[];
  lang: Language;
}

export function PortGeneralPositionSection({
  port,
  areas,
  lang,
}: PortGeneralPositionSectionProps) {
  const info = getDefaultGeneralInfo(port);
  const portAreas = areas.filter((a) => a.portId === port.id);
  const shortName = cleanPortShortName(port.name);

  const particulars = [
    {
      label: lang === 'es' ? 'Posición Geográfica' : 'Geographical Position',
      value: lang === 'es' ? info.geographicalNote : info.geographicalNoteEn,
      mono: true,
    },
    {
      label: lang === 'es' ? 'UN/LOCODE y Nivel PBIP / ISPS' : 'UN/LOCODE & ISPS Level',
      value: info.ispsLevel,
      accent: true,
    },
    {
      label: lang === 'es' ? 'Zona Horaria Oficial' : 'Official Time Zone',
      value: info.utcOffset,
    },
    {
      label: lang === 'es' ? 'Horarios y Turnos Operativos' : 'Working Hours & Shifts',
      value: lang === 'es' ? info.workingHours : info.workingHoursEn,
    },
    {
      label: lang === 'es' ? 'Días Festivos Oficiales' : 'Official National Holidays',
      value: lang === 'es' ? info.holidays : info.holidaysEn,
    },
  ];

  const highlights = info.strategicHighlights ?? [];

  return (
    <section
      id="general-position"
      className="bg-[#f5f5f7] py-16 lg:py-20 border-b border-[#e5e5ea]"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium text-[#0066cc] mb-1.5">
              {lang === 'es'
                ? '02. Posición Geográfica y Datos Generales del Puerto'
                : '02. Port Geographical Position & General Particulars'}
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.35rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
              {lang === 'es'
                ? `Acceso marítimo, recintos y datos generales de ${shortName}.`
                : `Maritime approach, enclosures & general particulars — ${shortName}.`}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-[13px] font-mono text-[#6e6e73] tabular-nums">
            <Compass className="w-4 h-4 text-[#0066cc]" />
            <span>
              {port.unLocode} · {REGION_LABELS[port.region][lang]}
            </span>
          </div>
        </div>

        {/* Apple Asymmetric Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (5 cols): Approach Architecture + Port Enclosures in m / ft + Strategic Storage */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 sm:p-7 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-medium text-[#0066cc] mb-2">
                  <Anchor className="w-4 h-4" />
                  <span>
                    {lang === 'es'
                      ? 'Arquitectura de Acceso y Recintos'
                      : 'Approach Architecture & Enclosures'}
                  </span>
                </div>

                {info.approachNote && (
                  <p className="text-[14px] leading-relaxed text-[#424245]">
                    {lang === 'es'
                      ? info.approachNote
                      : info.approachNoteEn ?? info.approachNote}
                  </p>
                )}

                <div className="mt-5 divide-y divide-[#e5e5ea] border-t border-[#e5e5ea]">
                  {portAreas.map((area) => (
                    <div key={area.id} className="py-4 first:pt-4 last:pb-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-[15px] font-semibold text-[#1d1d1f]">
                          {lang === 'es' ? area.name : area.nameEn}
                        </h3>
                        <span className="font-mono text-[13px] font-semibold text-[#0066cc] tabular-nums whitespace-nowrap">
                          {formatDraftMAndFt(area.operationalDraftM)}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#6e6e73]">
                        {lang === 'es' ? area.summary : area.summaryEn}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-mono text-[#424245] tabular-nums">
                        <span>
                          {lang === 'es' ? 'Canal: ' : 'Channel: '}
                          {formatDraftMAndFt(area.channelDepthM, 1)}
                        </span>
                        <span>
                          {lang === 'es' ? 'Ciaboga: ' : 'Turning basin: '}
                          {area.turningBasinM} m
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {highlights.length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#e5e5ea] space-y-3">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-[#6e6e73]">
                    <Warehouse className="w-3.5 h-3.5 text-[#0066cc]" />
                    <span>
                      {lang === 'es'
                        ? 'Capacidad Logística e Intermodal'
                        : 'Logistical & Intermodal Capacity'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {highlights.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl bg-[#f5f5f7] px-4 py-3 border border-[#e5e5ea]/80"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[12px] text-[#6e6e73]">
                            {lang === 'es' ? item.label : item.labelEn}
                          </span>
                          <span className="font-mono text-[13px] font-semibold text-[#1d1d1f] tabular-nums text-right">
                            {lang === 'es' ? item.value : item.valueEn}
                          </span>
                        </div>
                        {(item.note || item.noteEn) && (
                          <p className="mt-1 text-[12px] text-[#424245] leading-snug">
                            {lang === 'es' ? item.note : item.noteEn ?? item.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (7 cols): Apple Clean Typographic General Particulars Specification Sheet */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e5e5ea] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#e5e5ea]">
                <div>
                  <div className="text-[12px] font-medium text-[#0066cc]">
                    {lang === 'es' ? 'Ficha Técnica General' : 'Master Port Particulars'}
                  </div>
                  <h3 className="mt-1 font-display text-[20px] font-semibold tracking-tight text-[#1d1d1f]">
                    {port.name} ({port.unLocode})
                  </h3>
                </div>
                <div className="text-right text-[12px] text-[#6e6e73]">
                  <div>{port.authority}</div>
                  <div className="font-mono text-[#1d1d1f] mt-0.5">{port.vhfChannel}</div>
                </div>
              </div>

              <dl className="divide-y divide-[#e5e5ea]">
                {particulars.map((row) => (
                  <div
                    key={row.label}
                    className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline"
                  >
                    <dt className="sm:col-span-4 text-[13px] font-medium text-[#6e6e73]">
                      {row.label}
                    </dt>
                    <dd
                      className={`sm:col-span-8 text-[14px] leading-relaxed ${
                        row.accent
                          ? 'font-mono font-semibold text-[#0066cc] tabular-nums'
                          : row.mono
                          ? 'font-mono text-[13px] text-[#1d1d1f] tabular-nums'
                          : 'text-[#1d1d1f]'
                      }`}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-4 pt-5 border-t border-[#e5e5ea] flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#6e6e73]">
              <span>
                {lang === 'es'
                  ? 'Referencia cartográfica y horarios sujetos a Reglas de Operación vigentes.'
                  : 'Chart datum and operating shifts subject to official Port Operating Rules.'}
              </span>
              <span className="font-mono text-[#1d1d1f]">{port.stateEn && lang === 'en' ? port.stateEn : port.state}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
