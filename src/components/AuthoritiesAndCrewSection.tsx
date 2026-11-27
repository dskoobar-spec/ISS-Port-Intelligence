import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileCheck2,
  FileCode2,
  FileDown,
  FolderOpen,
  Globe2,
  Package,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { resolveDocumentLinkUrl } from '../utils/driveLinks';
import {
  exportCrewChangeToPdf,
  exportSparePartsToPdf,
  filterVisaRequiredCountries,
  generateCrewChangeHtml,
  generateSparePartsHtml,
} from '../utils/packageExporter';
import { FilenamePromptModal } from './FilenamePromptModal';
import type {
  AuthorityAgency,
  AuthorityRequirement,
  CrewChangeGuideConfig,
  Language,
  PortProfile,
  SparePartsProcedureConfig,
} from '../types/port';

interface AuthoritiesAndCrewSectionProps {
  port: PortProfile;
  authorities: AuthorityRequirement[];
  authoritiesDriveFolderUrl?: string;
  crewGuide: CrewChangeGuideConfig;
  sparePartsGuide: SparePartsProcedureConfig;
  lang: Language;
  disableDownloads?: boolean;
  onOpenPreArrivalGenerator: () => void;
  onOpenAuthoritiesManager?: () => void;
}

const AGENCY_TABS: Array<{
  id: AuthorityAgency | 'ALL';
  labelEs: string;
  labelEn: string;
}> = [
  { id: 'ALL', labelEs: 'Todas las Autoridades', labelEn: 'All Authorities' },
  { id: 'Aduana', labelEs: 'Aduana (ANAM)', labelEn: 'Customs (ANAM)' },
  { id: 'ASIPONA', labelEs: 'ASIPONA', labelEn: 'ASIPONA' },
  { id: 'Capitanía de Puerto', labelEs: 'Capitanía de Puerto', labelEn: 'Harbor Master' },
  { id: 'INM', labelEs: 'INM (Migración)', labelEn: 'INM (Immigration)' },
  {
    id: 'Sanidad Internacional',
    labelEs: 'Sanidad Internacional',
    labelEn: 'International Health',
  },
  { id: 'SENASICA', labelEs: 'SENASICA', labelEn: 'SENASICA' },
];

export function AuthoritiesAndCrewSection({
  port,
  authorities,
  authoritiesDriveFolderUrl = '',
  crewGuide,
  sparePartsGuide,
  lang,
  disableDownloads = false,
  onOpenPreArrivalGenerator,
  onOpenAuthoritiesManager,
}: AuthoritiesAndCrewSectionProps) {
  const isEs = lang === 'es';
  const [activeTab, setActiveTab] = useState<AuthorityAgency | 'ALL'>('ALL');
  const [countrySearch, setCountrySearch] = useState('');
  const [copiedCrewHtml, setCopiedCrewHtml] = useState(false);
  const [crewPdfPromptOpen, setCrewPdfPromptOpen] = useState(false);
  const [copiedSpareHtml, setCopiedSpareHtml] = useState(false);
  const [sparePdfPromptOpen, setSparePdfPromptOpen] = useState(false);

  const visibleAuthorities = useMemo(() => {
    const portScoped = authorities.filter(
      (a) => a.portId === 'ALL' || a.portId === port.id
    );
    const filtered =
      activeTab === 'ALL'
        ? portScoped
        : portScoped.filter((a) => a.agency === activeTab);

    return [...filtered].sort((a, b) =>
      a.agency.localeCompare(b.agency, 'es', { sensitivity: 'base' })
    );
  }, [authorities, port.id, activeTab]);

  const filteredCountries = useMemo(
    () => filterVisaRequiredCountries(crewGuide, countrySearch),
    [crewGuide, countrySearch]
  );

  const crewSednaHtml = useMemo(
    () => generateCrewChangeHtml({ guide: crewGuide, port, lang }),
    [crewGuide, port, lang]
  );

  const spareSednaHtml = useMemo(
    () => generateSparePartsHtml({ guide: sparePartsGuide, port, lang }),
    [sparePartsGuide, port, lang]
  );

  const handleCopyCrewHtml = async () => {
    try {
      await navigator.clipboard.writeText(crewSednaHtml);
      setCopiedCrewHtml(true);
      setTimeout(() => setCopiedCrewHtml(false), 2000);
    } catch {
      setCopiedCrewHtml(false);
    }
  };

  const handleDownloadCrewHtml = () => {
    const blob = new Blob([crewSednaHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crew-change-procedure-${port.shortCode.toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySpareHtml = async () => {
    try {
      await navigator.clipboard.writeText(spareSednaHtml);
      setCopiedSpareHtml(true);
      setTimeout(() => setCopiedSpareHtml(false), 2000);
    } catch {
      setCopiedSpareHtml(false);
    }
  };

  const handleDownloadSpareHtml = () => {
    const blob = new Blob([spareSednaHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spare-parts-procedure-${port.shortCode.toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayCrewTitle = crewGuide.title
    .replace(/&?\s*IMMIGRATION PROCEDURES\s*2026/gi, 'PROCEDURE')
    .replace(/\bSOP\s*2026\b/gi, '')
    .trim();

  const showCrewChangeInsideInm = activeTab === 'INM';
  const showSparePartsInsideAduana = activeTab === 'Aduana';

  return (
    <section
      id="authorities-crew"
      className="bg-white py-20 lg:py-24 border-b border-[#e5e5ea]"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium text-[#0066cc] mb-2">
              {isEs
                ? '10. Autoridades Marítimas y Portuarias'
                : '10. Maritime & Port Authorities'}
            </p>
            <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
              {isEs
                ? 'Aduana, ASIPONA, Capitanía, Migración, Sanidad y SENASICA.'
                : 'Customs, ASIPONA, Harbor Master, Immigration, Health & SENASICA.'}
            </h2>
            <p className="mt-3 text-[16px] text-[#424245]">
              {isEs
                ? 'Requerimientos documentales vigentes, Master Pre-Arrival Checklist, Spare Parts Procedure en Aduana y Crew Change Procedure en Migración (INM).'
                : 'Current documentary requirements, Master Pre-Arrival Checklist, Spare Parts Procedure under Customs, and Crew Change Procedure under Immigration (INM).'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {!disableDownloads && authoritiesDriveFolderUrl.trim() && (
              <a
                href={authoritiesDriveFolderUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap"
              >
                <FolderOpen className="w-4 h-4 text-[#0066cc]" />
                {isEs ? 'Carpeta de Formatos (Drive)' : 'Formats Folder (Drive)'}
              </a>
            )}
            {!disableDownloads && onOpenAuthoritiesManager && (
              <button
                type="button"
                onClick={onOpenAuthoritiesManager}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#0066cc]" />
                {isEs ? 'Enlazar Docs / Drive' : 'Manage Docs / Drive'}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenPreArrivalGenerator}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] rounded-lg transition-colors whitespace-nowrap"
            >
              <Package className="w-4 h-4" />
              {isEs ? 'Información Pre-Arribo' : 'Pre-Arrival Information'}
            </button>
          </div>
        </div>

        {/* Alphabetically Ordered Authority Tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {AGENCY_TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 text-[13px] font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]'
                    : 'bg-[#f5f5f7] text-[#424245] border-[#e5e5ea] hover:bg-[#ebebef]'
                }`}
              >
                {isEs ? t.labelEs : t.labelEn}
              </button>
            );
          })}
        </div>

        {/* Clean View-Only Agency Requirement Cards */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleAuthorities.map((auth) => {
            const isInm = auth.agency === 'INM';
            const isAduana = auth.agency === 'Aduana';
            const docs = isEs
              ? auth.requiredDocuments
              : auth.requiredDocumentsEn ?? auth.requiredDocuments;
            const docGroups = auth.documentGroups ?? [];
            const hasGroups = docGroups.length > 0;
            const spanFullWidth =
              (activeTab !== 'ALL' && visibleAuthorities.length === 1) ||
              docGroups.length >= 3;
            const useTwoCols = docs.length > 14 && activeTab !== 'ALL';
            return (
              <article
                key={auth.id}
                className={`rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] p-6 flex flex-col justify-between gap-4 ${
                  spanFullWidth ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[12px] font-medium text-[#0066cc] mb-1">
                        {auth.agency} ·{' '}
                        {auth.portId === 'ALL'
                          ? isEs
                            ? 'Todos los puertos'
                            : 'All Ports'
                          : auth.portId.toUpperCase()}
                      </div>
                      <h3 className="font-display text-[19px] font-semibold text-[#1d1d1f] leading-snug">
                        {isEs ? auth.title : auth.titleEn}
                      </h3>
                    </div>
                    <span className="font-mono text-[11px] text-[#6e6e73] shrink-0 tabular-nums">
                      {auth.effectiveDate}
                    </span>
                  </div>

                  <p className="text-[14px] text-[#424245] leading-relaxed">
                    {isEs ? auth.summary : auth.summaryEn}
                  </p>

                  {auth.newCircularNotice && (
                    <div className="p-4 rounded-xl bg-white border border-[#e5e5ea]">
                      <div className="text-[11px] font-semibold text-[#b45309] mb-1">
                        {isEs
                          ? 'Aviso / Requerimiento Vigente'
                          : 'Active Circular / Notice'}
                      </div>
                      <p className="text-[13px] text-[#1d1d1f] leading-relaxed">
                        {isEs
                          ? auth.newCircularNotice
                          : auth.newCircularNoticeEn ?? auth.newCircularNotice}
                      </p>
                    </div>
                  )}

                  {hasGroups ? (
                    <div className="space-y-4">
                      {docGroups.map((group) => (
                        <div
                          key={group.id}
                          className="rounded-xl bg-white border border-[#e5e5ea] overflow-hidden"
                        >
                          <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e5e5ea] flex items-center justify-between gap-2">
                            <h4 className="text-[12.5px] font-semibold text-[#1d1d1f]">
                              {isEs ? group.title : group.titleEn || group.title}
                            </h4>
                            <span className="font-mono text-[11px] text-[#6e6e73] tabular-nums shrink-0">
                              {group.rows.length}{' '}
                              {isEs
                                ? group.rows.length === 1
                                  ? 'concepto'
                                  : 'conceptos'
                                : group.rows.length === 1
                                ? 'item'
                                : 'items'}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-[12.5px]">
                              <thead>
                                <tr className="border-b border-[#e5e5ea] text-[11px] text-[#6e6e73] bg-white">
                                  <th className="py-2 px-3 font-semibold w-24">
                                    {isEs ? 'Cód.' : 'Code'}
                                  </th>
                                  <th className="py-2 px-3 font-semibold">
                                    {isEs ? 'Documento / Requisito' : 'Document / Requirement'}
                                  </th>
                                  <th className="py-2 px-3 font-semibold w-44">
                                    {isEs ? 'Plazo / Formato' : 'Timing / Format'}
                                  </th>
                                  <th className="py-2 px-3 font-semibold">
                                    {isEs ? 'Observaciones' : 'Remarks'}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#e5e5ea]">
                                {group.rows.map((row, rIdx) => (
                                  <tr
                                    key={`${group.id}-${row.code ?? rIdx}`}
                                    className="hover:bg-[#f9f9fb] transition-colors align-top"
                                  >
                                    <td className="py-2 px-3 font-mono text-[11.5px] font-semibold text-[#0066cc] tabular-nums whitespace-nowrap">
                                      {row.code || String(rIdx + 1).padStart(2, '0')}
                                    </td>
                                    <td className="py-2 px-3 font-medium text-[#1d1d1f] leading-snug">
                                      {isEs ? row.name : row.nameEn ?? row.name}
                                    </td>
                                    <td className="py-2 px-3 text-[#424245] leading-snug">
                                      {isEs
                                        ? row.timingOrFormat || '—'
                                        : row.timingOrFormatEn ?? row.timingOrFormat ?? '—'}
                                    </td>
                                    <td className="py-2 px-3 text-[#6e6e73] leading-snug">
                                      {isEs
                                        ? row.notes || '—'
                                        : row.notesEn ?? row.notes ?? '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="text-[12px] font-semibold text-[#1d1d1f] mb-1.5">
                        {isEs ? 'Documentación requerida:' : 'Required documents:'}
                      </div>
                      <ul
                        className={`text-[13px] text-[#424245] list-disc pl-5 ${
                          useTwoCols
                            ? 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1'
                            : 'space-y-1'
                        }`}
                      >
                        {docs.map((docItem, idx) => (
                          <li key={idx}>{docItem}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-white border border-[#e5e5ea]">
                    <div className="text-[12px] font-semibold text-[#1d1d1f] mb-0.5">
                      {isEs
                        ? 'Restricciones y criterios operativos:'
                        : 'Operational restrictions:'}
                    </div>
                    <p className="text-[13px] text-[#424245] leading-relaxed">
                      {isEs
                        ? auth.restrictions
                        : auth.restrictionsEn ?? auth.restrictions}
                    </p>
                  </div>
                </div>

                {/* Format Links & Integrated INM Crew Change Launcher */}
                <div className="pt-4 border-t border-[#e5e5ea] space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {auth.formatLinks.map((lnk) => {
                      const resolved = resolveDocumentLinkUrl(lnk.url);
                      if (disableDownloads && resolved.isDirectDownload) return null;
                      const labelText = isEs ? lnk.label : lnk.labelEn ?? lnk.label;
                      return (
                        <a
                          key={lnk.id}
                          href={resolved.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={resolved.isDirectDownload ? true : undefined}
                          className="inline-flex items-center gap-1.5 bg-white border border-[#d2d2d7] hover:border-[#0066cc] rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#0066cc] transition-colors"
                        >
                          {resolved.isDirectDownload ? (
                            <FileDown className="w-3.5 h-3.5 shrink-0" />
                          ) : resolved.isFolder ? (
                            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          )}
                          <span>{labelText}</span>
                          {lnk.docType && lnk.docType.trim() && (
                            <span className="text-[#6e6e73] font-normal">
                              · {lnk.docType.trim()}
                            </span>
                          )}
                        </a>
                      );
                    })}
                    {!disableDownloads &&
                      auth.driveFolderUrl?.trim() &&
                      auth.driveFolderUrl.trim() !== authoritiesDriveFolderUrl.trim() && (
                        <a
                          href={auth.driveFolderUrl.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-white border border-[#d2d2d7] hover:border-[#0066cc] rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#0066cc] transition-colors"
                        >
                          <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                          {isEs ? `Carpeta Drive ${auth.agency}` : `${auth.agency} Drive Folder`}
                        </a>
                      )}
                    {!disableDownloads && authoritiesDriveFolderUrl.trim() && (
                      <a
                        href={authoritiesDriveFolderUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-white border border-[#d2d2d7] hover:border-[#0066cc] rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] transition-colors"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[#0066cc]" />
                        {isEs ? 'Carpeta Drive Formatos' : 'Drive Formats Folder'}
                      </a>
                    )}
                  </div>

                  {isAduana && activeTab === 'ALL' && (
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('Aduana')}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] rounded-lg transition-colors"
                      >
                        <span>
                          {isEs
                            ? 'Ver Spare Parts Procedure (Aduana)'
                            : 'Open Spare Parts Procedure (Customs)'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      {!disableDownloads && (
                        <button
                          type="button"
                          onClick={() => setSparePdfPromptOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-medium text-[#1d1d1f] bg-white hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5 text-[#0066cc]" />
                          Spare Parts PDF
                        </button>
                      )}
                    </div>
                  )}

                  {isInm && activeTab === 'ALL' && (
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('INM')}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] rounded-lg transition-colors"
                      >
                        <span>
                          {isEs
                            ? 'Ver Crew Change Procedure (Migración)'
                            : 'Open Crew Change Procedure (INM)'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      {!disableDownloads && (
                        <button
                          type="button"
                          onClick={() => setCrewPdfPromptOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-medium text-[#1d1d1f] bg-white hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5 text-[#0066cc]" />
                          {isEs ? 'Crew Change PDF' : 'Crew Change PDF'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* REDESIGNED CREW CHANGE PROCEDURE — INTEGRATED INSIDE MIGRACIÓN (INM) */}
        {showCrewChangeInsideInm && (
          <div
            id="crew-change-procedure"
            className="mt-8 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] p-6 sm:p-8 space-y-6"
          >
            {/* Clean Minimalist Header Matching Site Aesthetic */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e5e5ea]">
              <div>
                <div className="text-[12px] font-medium text-[#0066cc]">
                  {isEs
                    ? 'Trámite Migratorio · Instituto Nacional de Migración (INM)'
                    : 'Immigration Procedure · National Migration Institute (INM)'}
                </div>
                <h3 className="font-display text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1d1d1f] mt-1">
                  {displayCrewTitle}
                </h3>
                <p className="text-[13.5px] text-[#424245] mt-1">{crewGuide.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!disableDownloads && (
                  <button
                    type="button"
                    onClick={() => setCrewPdfPromptOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FileDown className="w-4 h-4" />
                    {isEs ? 'Descargar PDF' : 'Download PDF'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyCrewHtml}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-[#1d1d1f] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap"
                >
                  {copiedCrewHtml ? (
                    <Check className="w-4 h-4 text-[#16a34a]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiedCrewHtml
                    ? isEs
                      ? 'HTML Copiado'
                      : 'HTML Copied'
                    : isEs
                    ? 'Copiar HTML Sedna'
                    : 'Copy Sedna HTML'}
                </button>
                {!disableDownloads && (
                  <button
                    type="button"
                    onClick={handleDownloadCrewHtml}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-medium text-[#424245] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FileCode2 className="w-4 h-4" />
                    .HTML
                  </button>
                )}
              </div>
            </div>

            {/* Quiet White Advisory Card (No rainbow/left-border stripes) */}
            <div className="p-5 rounded-xl bg-white border border-[#e5e5ea]">
              <div className="text-[12px] font-semibold text-[#dc2626] mb-1">
                {isEs
                  ? 'Aviso Obligatorio de Ingreso y Admisión (INM)'
                  : 'Mandatory Entry & Admission Advisory (INM)'}
              </div>
              <p className="text-[13.5px] text-[#1d1d1f] leading-relaxed">
                {crewGuide.entryAdvisory}
              </p>
            </div>

            {/* Section 1 & 2: Two Clean White Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-white border border-[#e5e5ea] space-y-5">
                <div>
                  <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-2">
                    1.1 Nationals Exempt from Mexican Visa
                  </h4>
                  <ul className="space-y-1.5 text-[13px] text-[#424245] list-disc pl-5 leading-relaxed">
                    {crewGuide.visaExemptNotes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#e5e5ea]">
                  <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-2">
                    1.2 Qualifying Alternatives to a Mexican Visa
                  </h4>
                  <ul className="space-y-1.5 text-[13px] text-[#424245] list-disc pl-5 leading-relaxed">
                    {crewGuide.qualifyingAlternatives.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#e5e5ea]">
                  <div className="text-[12.5px] font-semibold text-[#0066cc] mb-2">
                    Special Focus: U.S. C1/D1 Transit &amp; Crewmember Visas
                  </div>
                  <ul className="space-y-1.5 text-[13px] text-[#424245] list-disc pl-5 leading-relaxed">
                    {crewGuide.usC1d1Focus.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-white border border-[#e5e5ea] space-y-5">
                <div>
                  <h4 className="text-[14px] font-semibold text-[#b45309] mb-2">
                    2. Risk Advisory — Visa-Required Nationalities
                  </h4>
                  <ul className="space-y-1.5 text-[13px] text-[#424245] list-disc pl-5 leading-relaxed">
                    {crewGuide.riskAdvisoryBullets.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#e5e5ea] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-[14px] font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-[#0066cc]" />
                      3. Required Documentation (On &amp; Off-Signers)
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[12px] font-mono font-medium text-[#0066cc] tabular-nums">
                      <Clock className="w-3.5 h-3.5" />3 Working Days
                    </span>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[13px] text-[#424245] list-disc pl-5">
                    {crewGuide.requiredDocsList.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>

                  <div className="p-3.5 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] text-[12.5px] text-[#1d1d1f] leading-relaxed">
                    <strong>Minimum Lead Time:</strong> {crewGuide.minimumLeadTimeNotice}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4, 5 & 6: 3 Clean White Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-white border border-[#e5e5ea]">
                <h4 className="text-[13.5px] font-semibold text-[#0066cc] mb-2.5">
                  4.1 On-Signers (Joining Crew)
                </h4>
                <ul className="space-y-1.5 text-[13px] text-[#424245] list-disc pl-4 leading-relaxed">
                  {crewGuide.onSignerSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-white border border-[#e5e5ea]">
                <h4 className="text-[13.5px] font-semibold text-[#1d1d1f] mb-2.5">
                  4.2 Off-Signers (Repatriating Crew)
                </h4>
                <ul className="space-y-1.5 text-[13px] text-[#424245] list-disc pl-4 leading-relaxed">
                  {crewGuide.offSignerSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-white border border-[#e5e5ea] space-y-4">
                <div>
                  <h4 className="text-[13.5px] font-semibold text-[#1d1d1f] mb-2">
                    5. Working Hours &amp; Permits
                  </h4>
                  <ul className="space-y-1.5 text-[12.5px] text-[#424245] list-disc pl-4 leading-relaxed">
                    {crewGuide.workingHoursBullets.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-[#e5e5ea]">
                  <h4 className="text-[13.5px] font-semibold text-[#1d1d1f] mb-2">
                    6. Customs &amp; Baggage
                  </h4>
                  <ul className="space-y-1.5 text-[12.5px] text-[#424245] list-disc pl-4 leading-relaxed">
                    {crewGuide.customsBaggageBullets.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 7: Clean Apple-Style Checklist Table */}
            <div className="overflow-x-auto rounded-xl bg-white border border-[#e5e5ea]">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#f5f5f7] border-b border-[#e5e5ea] text-[12px] text-[#6e6e73]">
                    <th className="py-3 px-4 font-semibold text-[#1d1d1f]">
                      7. {isEs ? 'Checklist Rápido de Cliente' : 'Quick Client Checklist'}
                    </th>
                    <th className="py-3 px-4 text-center font-semibold text-[#1d1d1f]">
                      On-Signer
                    </th>
                    <th className="py-3 px-4 text-center font-semibold text-[#1d1d1f]">
                      Off-Signer
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5ea]">
                  {crewGuide.checklistRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-2.5 px-4 font-medium text-[#1d1d1f]">
                        {isEs ? row.item : row.itemEn}
                      </td>
                      <td className="py-2.5 px-4 text-center font-medium text-[#15803d] tabular-nums">
                        {row.onSigner}
                      </td>
                      <td className="py-2.5 px-4 text-center font-medium text-[#424245] tabular-nums">
                        {row.offSigner}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Appendix A: Countries Requiring a Visa + Interactive Checker */}
            <div className="p-6 rounded-xl bg-white border border-[#e5e5ea] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-display text-[16px] font-semibold text-[#1d1d1f] flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-[#0066cc]" />
                    Appendix A — Countries &amp; Regions Requiring a Mexican Visa (INM)
                  </h4>
                  <p className="text-[12.5px] text-[#6e6e73] mt-0.5">{crewGuide.appendixIntro}</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#6e6e73] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder={
                      isEs
                        ? 'Buscar nacionalidad / país...'
                        : 'Search nationality / country...'
                    }
                    className="w-full pl-9 pr-3 py-2 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg focus:outline-2 focus:outline-[#0066cc]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12.5px] text-[#1d1d1f]">
                <div className="bg-[#f5f5f7] p-4 rounded-xl border border-[#e5e5ea]">
                  <div className="font-semibold text-[#0066cc] mb-2 tabular-nums">
                    A - C ({filteredCountries.ac.length})
                  </div>
                  <ul className="space-y-1">
                    {filteredCountries.ac.map((c) => (
                      <li key={c}>· {c}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#f5f5f7] p-4 rounded-xl border border-[#e5e5ea]">
                  <div className="font-semibold text-[#0066cc] mb-2 tabular-nums">
                    D - M ({filteredCountries.dm.length})
                  </div>
                  <ul className="space-y-1">
                    {filteredCountries.dm.map((c) => (
                      <li key={c}>· {c}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#f5f5f7] p-4 rounded-xl border border-[#e5e5ea]">
                  <div className="font-semibold text-[#0066cc] mb-2 tabular-nums">
                    N - Z ({filteredCountries.nz.length})
                  </div>
                  <ul className="space-y-1">
                    {filteredCountries.nz.map((c) => (
                      <li key={c}>· {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Official INM Portals Only (ISS Address appears exclusively in Downloadable PDF) */}
            <div className="p-5 rounded-xl bg-white border border-[#e5e5ea] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[13px] font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0066cc]" />
                  Official INM Verification Portals
                </div>
                <p className="text-[12px] text-[#6e6e73] max-w-xl">{crewGuide.disclaimer}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {crewGuide.officialPortals.map((p) => (
                  <a
                    key={p.url}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f5f7] hover:bg-[#ebebef] border border-[#d2d2d7] text-[12px] font-medium text-[#0066cc] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {p.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* REDESIGNED SPARE PARTS PROCEDURE — INTEGRATED INSIDE ADUANA (CUSTOMS) */}
        {showSparePartsInsideAduana && (
          <div
            id="spare-parts-procedure"
            className="mt-8 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] p-6 sm:p-8 space-y-6"
          >
            {/* Clean Minimalist Header Matching Site Aesthetic */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e5e5ea]">
              <div>
                <div className="text-[12px] font-medium text-[#0066cc]">
                  {isEs
                    ? 'Trámite Aduanal · Agencia Nacional de Aduanas de México (ANAM)'
                    : 'Customs Procedure · National Customs Agency of Mexico (ANAM)'}
                </div>
                <h3 className="font-display text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1d1d1f] mt-1">
                  {sparePartsGuide.title}
                </h3>
                <p className="text-[13.5px] text-[#424245] mt-1">{sparePartsGuide.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!disableDownloads && (
                  <button
                    type="button"
                    onClick={() => setSparePdfPromptOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FileDown className="w-4 h-4" />
                    {isEs ? 'Descargar PDF' : 'Download PDF'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopySpareHtml}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium text-[#1d1d1f] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap"
                >
                  {copiedSpareHtml ? (
                    <Check className="w-4 h-4 text-[#16a34a]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiedSpareHtml
                    ? isEs
                      ? 'HTML Copiado'
                      : 'HTML Copied'
                    : isEs
                    ? 'Copiar HTML Sedna'
                    : 'Copy Sedna HTML'}
                </button>
                {!disableDownloads && (
                  <button
                    type="button"
                    onClick={handleDownloadSpareHtml}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-medium text-[#424245] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FileCode2 className="w-4 h-4" />
                    .HTML
                  </button>
                )}
              </div>
            </div>

            {/* Mandatory Importation Notice (Clean White Card) */}
            <div className="p-5 rounded-xl bg-white border border-[#e5e5ea]">
              <div className="text-[12px] font-semibold text-[#0066cc] mb-1">
                {isEs
                  ? sparePartsGuide.importationNoticeTitle
                  : sparePartsGuide.importationNoticeTitleEn}
              </div>
              <p className="text-[13.5px] text-[#1d1d1f] leading-relaxed">
                {isEs
                  ? sparePartsGuide.importationNotice
                  : sparePartsGuide.importationNoticeEn}
              </p>
            </div>

            {/* Section 1: Invoice & Documentation Requirements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-white border border-[#e5e5ea] space-y-4">
                <div>
                  <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-1.5">
                    1.1 Consignee Formulation
                  </h4>
                  <p className="text-[13.5px] font-medium text-[#0066cc] leading-relaxed">
                    {sparePartsGuide.consigneeFormulation}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#e5e5ea]">
                  <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-1.5">
                    1.2 Itemized Listing
                  </h4>
                  <p className="text-[13px] text-[#424245] leading-relaxed">
                    {sparePartsGuide.itemizedListingNote}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] text-[12.5px] text-[#b45309] leading-relaxed">
                  <strong>Detailed Explanation Required:</strong>{' '}
                  {sparePartsGuide.detailedExplanationNote}
                </div>
              </div>

              {/* Section 2: Shipping Logistics & Clearance Timelines */}
              <div className="p-6 rounded-xl bg-white border border-[#e5e5ea] space-y-4">
                <div>
                  <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-2">
                    2.1 Routing &amp; Package Size
                  </h4>
                  <ul className="space-y-2 text-[13px] text-[#424245] list-disc pl-5 leading-relaxed">
                    <li>{sparePartsGuide.smallPackageRouting}</li>
                    <li>{sparePartsGuide.largePackageRouting}</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#e5e5ea]">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <h4 className="text-[14px] font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#0066cc]" />
                      2.2 Customs Clearance Timelines
                    </h4>
                    <span className="text-[11.5px] font-mono text-[#dc2626] tabular-nums">
                      {sparePartsGuide.customsHoursNote}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-[#e5e5ea]">
                    <table className="w-full text-left border-collapse text-[12.5px]">
                      <tbody className="divide-y divide-[#e5e5ea]">
                        {sparePartsGuide.timelines.map((row) => (
                          <tr key={row.id} className="hover:bg-[#fafafa] transition-colors">
                            <td className="py-2 px-3 font-medium text-[#1d1d1f]">
                              {isEs ? row.label : row.labelEn}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-[#dc2626] tabular-nums">
                              {row.duration}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 & 4: Restricted Items + Pre-Approval */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-white border border-[#e5e5ea] space-y-3">
                <h4 className="text-[14px] font-semibold text-[#dc2626]">
                  3. Restricted &amp; Prohibited Items (Do Not Include)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] text-[#424245]">
                  <ul className="space-y-1.5 list-disc pl-4">
                    {sparePartsGuide.restrictedItemsCol1.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <ul className="space-y-1.5 list-disc pl-4">
                    {sparePartsGuide.restrictedItemsCol2.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-white border border-[#e5e5ea] flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <h4 className="text-[14px] font-semibold text-[#15803d] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    4. Pre-Approval &amp; Waybill Verification
                  </h4>
                  <p className="text-[13px] text-[#424245] leading-relaxed">
                    {sparePartsGuide.preApprovalNote}
                  </p>
                </div>
                <p className="text-[12px] text-[#6e6e73] border-t border-[#e5e5ea] pt-3">
                  * {sparePartsGuide.invoiceAddressFootnote}{' '}
                  {!disableDownloads &&
                    (isEs
                      ? '(La dirección física y teléfonos de consignación ISS se integran automáticamente en el PDF y HTML descargables).'
                      : '(Full ISS consignee office address and phones are included automatically in the downloadable PDF and HTML.)')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!disableDownloads && (
        <>
          <FilenamePromptModal
            open={crewPdfPromptOpen}
            defaultFilename={`Crew_Change_Procedure_${port.shortCode}`}
            title={isEs ? 'Descargar Crew Change Procedure en PDF' : 'Download Crew Change Procedure PDF'}
            lang={lang}
            onClose={() => setCrewPdfPromptOpen(false)}
            onConfirm={(name) => {
              setCrewPdfPromptOpen(false);
              exportCrewChangeToPdf({
                guide: crewGuide,
                port,
                filename: name,
                lang,
              });
            }}
          />

          <FilenamePromptModal
            open={sparePdfPromptOpen}
            defaultFilename={`Spare_Parts_Procedure_${port.shortCode}`}
            title={isEs ? 'Descargar Spare Parts Procedure en PDF' : 'Download Spare Parts Procedure PDF'}
            lang={lang}
            onClose={() => setSparePdfPromptOpen(false)}
            onConfirm={(name) => {
              setSparePdfPromptOpen(false);
              exportSparePartsToPdf({
                guide: sparePartsGuide,
                port,
                filename: name,
                lang,
              });
            }}
          />
        </>
      )}
    </section>
  );
}
