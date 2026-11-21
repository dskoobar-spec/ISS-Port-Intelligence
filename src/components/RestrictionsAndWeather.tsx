import { useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  CheckCircle2,
  ExternalLink,
  FileText,
  Info,
  Ruler,
  ShieldAlert,
  Waves,
} from 'lucide-react';
import {
  formatDepthRangeMAndFt,
  formatDraftMAndFt,
  getDefaultPhysicalSpecs,
  RESTRICTION_CATEGORY_LABELS,
} from '../utils/i18n';
import type { Language, PortProfile, PortRestriction } from '../types/port';

interface RestrictionsAndWeatherProps {
  port: PortProfile;
  restrictions: PortRestriction[];
  lang: Language;
}

export function RestrictionsAndWeather({
  port,
  restrictions,
  lang,
}: RestrictionsAndWeatherProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const portRestrictions = restrictions.filter((r) => r.portId === port.id);
  const anchorageZones = port.anchorageZones ?? [];
  const physicalSpecs = getDefaultPhysicalSpecs(port);
  const categories: PortRestriction['category'][] = [
    'Física',
    'Operativa',
    'Practicaje y Remolque',
    'Seguridad y Aduana',
  ];

  const filtered = portRestrictions.filter(
    (r) => categoryFilter === 'ALL' || r.category === categoryFilter
  );

  return (
    <section
      id="restrictions"
      className="bg-[#060a13] text-white py-20 lg:py-24 border-b border-white/10"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        {/* 03. Calados, Zonas de Fondeo y Reglas de Operación */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#7dd3fc] mb-2">
                {lang === 'es'
                  ? '03. Calados, Zonas de Fondeo y Reglas de Operación'
                  : '03. Drafts, Anchorages & Official Operating Rules'}
              </p>
              <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.65rem)] font-semibold tracking-tight text-white [text-wrap:balance]">
                {lang === 'es'
                  ? 'Precisión náutica: canales, dársenas de ciaboga y zonas de fondeo.'
                  : 'Nautical precision: channels, turning basins & authorized anchorages.'}
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-[#cbd5e1]">
                {lang === 'es'
                  ? 'Parámetros técnicos extraídos de ASIPONA y Capitanía de Puerto en metros y pies (m / ft), manteniendo diferenciados canal principal, accesos por recinto, dársenas de ciaboga y polígonos de fondeo.'
                  : 'Technical parameters compiled from ASIPONA & Harbor Master rules in metric and imperial units (m / ft), distinguishing main channels, terminal branches, turning basins and anchorage polygons.'}
              </p>
            </div>

            {port.operatingRulesSummary && (
              <div className="mt-8 rounded-2xl bg-[#0b1322] border border-white/12 p-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[#7dd3fc]">
                    <FileText className="w-4 h-4" />
                    <span>
                      {lang === 'es'
                        ? 'Reglas de Operación Vigentes (ASIPONA / Capitanía)'
                        : 'Official Port Operating Rules (ASIPONA / Harbor Master)'}
                    </span>
                  </div>
                  {port.operatingRulesUrl && (
                    <a
                      href={port.operatingRulesUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#93c5fd] hover:underline whitespace-nowrap"
                    >
                      {lang === 'es' ? 'Documento oficial' : 'Official PDF'}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-[14px] leading-relaxed text-[#e2e8f0]">
                  {lang === 'es'
                    ? port.operatingRulesSummary
                    : port.operatingRulesSummaryEn ?? port.operatingRulesSummary}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/12 min-h-[320px]">
            <img
              src={port.channelImageUrl}
              alt={
                lang === 'es'
                  ? 'Maniobra de remolcadores en canal de navegación'
                  : 'Harbor tugboats escorting vessel through navigation channel'
              }
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060a13] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-6 right-6 text-white">
              <div className="text-[12px] text-[#93c5fd]">
                {lang === 'es' ? 'Practicaje, Tráfico y Remolque' : 'Pilotage, VTS & Towage'}
              </div>
              <div className="mt-1 font-display text-[20px] font-semibold">
                {port.vhfChannel}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Channels & Turning Basin Dimensions (dual m / ft) */}
        <div className="mt-12 rounded-2xl bg-[#0b1322] border border-white/12 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Waves className="w-5 h-5 text-[#7dd3fc]" />
              <h3 className="font-display text-[18px] font-semibold">
                {lang === 'es'
                  ? 'Canales de navegación y dársenas de ciaboga'
                  : 'Navigation Channels & Turning Basin Dimensions'}
              </h3>
            </div>
            <span className="text-[12px] text-[#94a3b8]">
              {lang === 'es'
                ? 'Profundidad teórica y calado máximo en m / ft'
                : 'Theoretical depth & max authorized draft in m / ft'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-white/10 text-[12px] text-[#94a3b8]">
                  <th className="py-3.5 px-6 font-medium">
                    {lang === 'es' ? 'Área de Navegación' : 'Navigation Area'}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-right">
                    {lang === 'es' ? 'Longitud' : 'Length'}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-right">
                    {lang === 'es' ? 'Ancho / Diám.' : 'Width / Diam.'}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-right">
                    {lang === 'es' ? 'Prof. Canal (m / ft)' : 'Channel Depth (m / ft)'}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-right">
                    {lang === 'es' ? 'Calado Máx. (m / ft)' : 'Max Draft (m / ft)'}
                  </th>
                  <th className="py-3.5 px-6 font-medium">
                    {lang === 'es' ? 'Observaciones operativas' : 'Operational Remarks'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {port.channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-white/3">
                    <td className="py-4 px-6 font-medium text-white">
                      {lang === 'es' ? ch.name : ch.nameEn ?? ch.name}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-[#cbd5e1] whitespace-nowrap">
                      {ch.lengthNm.toFixed(2)} NM ({Math.round(ch.lengthNm * 1852).toLocaleString()} m)
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-[#cbd5e1] whitespace-nowrap">
                      {ch.widthM} m
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-[#cbd5e1] whitespace-nowrap">
                      {formatDraftMAndFt(ch.channelDepthM)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-[#7dd3fc] whitespace-nowrap">
                      {formatDraftMAndFt(ch.operationalDraftM)}
                    </td>
                    <td className="py-4 px-6 text-[13px] text-[#cbd5e1]">
                      {lang === 'es'
                        ? ch.squatAllowanceNote
                        : ch.squatAllowanceNoteEn ?? ch.squatAllowanceNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Authorized Anchorage Zones (dual m / ft) */}
        {anchorageZones.length > 0 && (
          <div className="mt-8 rounded-2xl bg-[#0b1322] border border-white/12 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Anchor className="w-5 h-5 text-[#7dd3fc]" />
                <h3 className="font-display text-[18px] font-semibold">
                  {lang === 'es'
                    ? 'Zonas de fondeo autorizadas y espera de prácticos'
                    : 'Authorized Anchorage Zones & Pilot Boarding Areas'}
                </h3>
              </div>
              <span className="text-[12px] text-[#94a3b8]">
                {anchorageZones.length} {lang === 'es' ? 'zonas registradas' : 'registered zones'} · WGS84
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="border-b border-white/10 text-[12px] text-[#94a3b8]">
                    <th className="py-3.5 px-6 font-medium">
                      {lang === 'es' ? 'Zona de Fondeo' : 'Anchorage Zone'}
                    </th>
                    <th className="py-3.5 px-4 font-medium">
                      {lang === 'es' ? 'Uso / Segmento' : 'Purpose / Vessel Class'}
                    </th>
                    <th className="py-3.5 px-4 font-medium">
                      {lang === 'es' ? 'Coordenadas' : 'Coordinates'}
                    </th>
                    <th className="py-3.5 px-4 font-medium">
                      {lang === 'es' ? 'Profundidad (m / ft)' : 'Depth (m / ft)'}
                    </th>
                    <th className="py-3.5 px-6 font-medium">
                      {lang === 'es' ? 'Reglas y observaciones' : 'Rules & Notes'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {anchorageZones.map((az) => (
                    <tr key={az.id} className="hover:bg-white/3">
                      <td className="py-4 px-6 font-medium text-white">
                        {lang === 'es' ? az.name : az.nameEn ?? az.name}
                      </td>
                      <td className="py-4 px-4 text-[13px] text-[#93c5fd]">
                        {lang === 'es' ? az.purpose : az.purposeEn ?? az.purpose}
                      </td>
                      <td className="py-4 px-4 font-mono text-[12px] text-[#cbd5e1]">
                        {az.coordinates}
                      </td>
                      <td className="py-4 px-4 font-mono text-[13px] text-[#7dd3fc] whitespace-nowrap">
                        {formatDepthRangeMAndFt(az.depthM)}
                      </td>
                      <td className="py-4 px-6 text-[13px] text-[#cbd5e1]">
                        {lang === 'es'
                          ? az.maxVesselOrNotes
                          : az.maxVesselOrNotesEn ?? az.maxVesselOrNotes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 04. Restricciones Físicas y Operativas — Apple Dark-Mode Architectural Spec Grid */}
        <div className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-[13px] font-medium text-[#7dd3fc] mb-1">
                {lang === 'es'
                  ? '04. Restricciones Físicas y Operativas de Navegación'
                  : '04. Physical & Operational Navigation Restrictions'}
              </p>
              <div className="flex items-center gap-2.5">
                <Ruler className="w-5 h-5 text-[#7dd3fc]" />
                <h3 className="font-display text-[22px] sm:text-[26px] font-semibold tracking-tight">
                  {lang === 'es'
                    ? 'Límites dimensionales, UKC, densidad y marea'
                    : 'Dimensional limits, UKC, water density & tide'}
                </h3>
              </div>
            </div>
            <span className="text-[12px] font-mono text-[#94a3b8]">
              {physicalSpecs.length}{' '}
              {lang === 'es' ? 'parámetros críticos' : 'critical parameters'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {physicalSpecs.map((spec) => {
              const isDanger = spec.highlight === 'danger';
              const isWarning = spec.highlight === 'warning';
              const isSuccess = spec.highlight === 'success';

              const valueTone = isDanger
                ? 'text-[#f87171]'
                : isWarning
                ? 'text-[#fbbf24]'
                : isSuccess
                ? 'text-[#86efac]'
                : 'text-[#7dd3fc]';

              const cardBorder = isDanger
                ? 'border-[#f87171]/30'
                : isWarning
                ? 'border-[#fbbf24]/25'
                : isSuccess
                ? 'border-[#86efac]/25'
                : 'border-white/10';

              return (
                <div
                  key={spec.id}
                  className={`rounded-2xl bg-[#0b1322] border ${cardBorder} p-5 flex flex-col justify-between gap-3`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[12px] text-[#94a3b8]">
                      <span>{lang === 'es' ? spec.label : spec.labelEn}</span>
                      {isDanger ? (
                        <AlertTriangle
                          className="w-3.5 h-3.5 text-[#f87171] shrink-0"
                          aria-label={lang === 'es' ? 'Alerta crítica' : 'Critical alert'}
                        />
                      ) : isWarning ? (
                        <AlertTriangle
                          className="w-3.5 h-3.5 text-[#fbbf24] shrink-0"
                          aria-label={lang === 'es' ? 'Precaución operativa' : 'Operational caution'}
                        />
                      ) : isSuccess ? (
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-[#86efac] shrink-0"
                          aria-label={lang === 'es' ? 'Sin restricción' : 'Unrestricted'}
                        />
                      ) : (
                        <Info
                          className="w-3.5 h-3.5 text-[#64748b] shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div
                      className={`mt-2 font-mono text-[17px] font-semibold leading-snug tabular-nums ${valueTone}`}
                    >
                      {lang === 'es' ? spec.value : spec.valueEn}
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[#cbd5e1] border-t border-white/8 pt-3">
                    {lang === 'es' ? spec.remarks : spec.remarksEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categorized Restrictions Cards */}
        <div className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-[#fbbf24]" />
              <h3 className="font-display text-[19px] font-semibold">
                {lang === 'es'
                  ? 'Disposiciones operativas, practicaje y despacho aduanal'
                  : 'Detailed operational, pilotage & port clearance rules'}
              </h3>
            </div>

            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#0b1322] rounded-lg border border-white/12">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  categoryFilter === 'ALL'
                    ? 'bg-white text-[#060a13]'
                    : 'text-[#cbd5e1] hover:text-white'
                }`}
              >
                {lang === 'es' ? 'Todas' : 'All'}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-white text-[#060a13]'
                      : 'text-[#cbd5e1] hover:text-white'
                  }`}
                >
                  {RESTRICTION_CATEGORY_LABELS[cat][lang]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#0b1322] border border-white/12 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="text-[#93c5fd]">
                      {RESTRICTION_CATEGORY_LABELS[item.category][lang]}
                    </span>
                    <span
                      className={
                        item.verificationStatus === 'verified'
                          ? 'text-[#86efac]'
                          : 'text-[#fcd34d]'
                      }
                    >
                      {item.verificationStatus === 'verified'
                        ? lang === 'es'
                          ? 'Verificado'
                          : 'Verified'
                        : lang === 'es'
                        ? 'Pendiente validación'
                        : 'Pending validation'}
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between gap-4">
                    <h4 className="font-display text-[17px] font-semibold text-white">
                      {lang === 'es' ? item.title : item.titleEn}
                    </h4>
                    <span className="font-mono text-[14px] font-semibold text-[#7dd3fc] whitespace-nowrap shrink-0 tabular-nums">
                      {item.limitValue}
                    </span>
                  </div>

                  <p className="mt-2.5 text-[14px] leading-relaxed text-[#cbd5e1]">
                    {lang === 'es' ? item.detail : item.detailEn}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-[12px] text-[#94a3b8]">
                  {lang === 'es' ? 'Fuente: ' : 'Source: '}
                  {item.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
