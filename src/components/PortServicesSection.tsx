import {
  CheckCircle2,
  ExternalLink,
  FileDown,
  FolderOpen,
  SlidersHorizontal,
  Wrench,
  XCircle,
} from 'lucide-react';
import { resolveDocumentLinkUrl } from '../utils/driveLinks';
import { getDefaultMarineServices } from '../utils/i18n';
import type { Language, PortProfile } from '../types/port';

interface PortServicesSectionProps {
  port: PortProfile;
  lang: Language;
  servicesDriveFolderUrl?: string;
  disableDownloads?: boolean;
  onOpenServicesManager?: () => void;
}

export function PortServicesSection({
  port,
  lang,
  servicesDriveFolderUrl = '',
  disableDownloads = false,
  onOpenServicesManager,
}: PortServicesSectionProps) {
  const isEs = lang === 'es';
  const services = getDefaultMarineServices(port);
  const availableCount = services.filter((s) => s.available).length;

  return (
    <section id="services" className="bg-[#f5f5f7] py-20 lg:py-24 border-b border-[#e5e5ea]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium text-[#0066cc] mb-2">
              {isEs
                ? '07. Servicios Portuarios Disponibles (Marítimos y Avituallamiento)'
                : '07. Available Marine & Husbandry Services'}
            </p>
            <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.65rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
              {isEs
                ? `Servicios técnicos y logísticos autorizados en ${port.name.replace('Puerto de ', '')}.`
                : `Authorized technical & husbandry services — ${port.name.replace('Puerto de ', '')}.`}
            </h2>
            <p className="mt-3 text-[15px] text-[#424245]">
              {isEs
                ? 'Cobertura operativa para armadores y fletadores conforme a prestadores autorizados por ASIPONA y Capitanía de Puerto, con documentos oficiales de tarifas, acuerdos y restricciones.'
                : 'Technical and logistics husbandry services available to shipowners and charterers per authorized ASIPONA & Harbor Master permits, including official tariff sheets, agreements & restrictions.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {!disableDownloads && servicesDriveFolderUrl.trim() && (
              <a
                href={servicesDriveFolderUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap"
              >
                <FolderOpen className="w-4 h-4 text-[#0066cc]" />
                {isEs ? 'Carpeta Drive Servicios' : 'Services Drive Folder'}
              </a>
            )}
            {!disableDownloads && onOpenServicesManager && (
              <button
                type="button"
                onClick={onOpenServicesManager}
                className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#0066cc]" />
                {isEs ? 'Enlazar Docs / Tarifas Drive' : 'Manage Service Docs / Drive'}
              </button>
            )}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#e5e5ea] text-[13px] font-medium text-[#1d1d1f] whitespace-nowrap">
              <Wrench className="w-4 h-4 text-[#0066cc]" />
              <span>
                {availableCount} / {services.length}{' '}
                {isEs ? 'servicios habilitados' : 'permitted services'}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Structured Services Grid */}
        <div className="mt-8 bg-white rounded-2xl border border-[#e5e5ea] p-6 sm:p-8 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {services.map((srv) => {
              const visibleDocs = (srv.documentLinks ?? []).filter((lnk) => {
                if (!lnk.url?.trim()) return false;
                const resolved = resolveDocumentLinkUrl(lnk.url);
                return !(disableDownloads && resolved.isDirectDownload);
              });

              return (
                <div
                  key={srv.id}
                  className={`flex items-start gap-3.5 pb-4 border-b border-[#e5e5ea] last:border-b-0 ${
                    !srv.available ? 'opacity-65' : ''
                  }`}
                >
                  {srv.available ? (
                    <CheckCircle2 className="w-5 h-5 text-[#15803d] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-display text-[15px] font-semibold text-[#1d1d1f]">
                        {isEs ? srv.name : srv.nameEn}:
                      </span>
                      <span className="text-[11px] font-medium text-[#0066cc]">
                        {isEs ? srv.category : srv.categoryEn}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#424245]">
                      {isEs ? srv.detail : srv.detailEn}
                    </p>

                    {visibleDocs.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {visibleDocs.map((lnk) => {
                          const resolved = resolveDocumentLinkUrl(lnk.url);
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
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
