import { CheckCircle2, Wrench, XCircle } from 'lucide-react';
import { getDefaultMarineServices } from '../utils/i18n';
import type { Language, PortProfile } from '../types/port';

interface PortServicesSectionProps {
  port: PortProfile;
  lang: Language;
}

export function PortServicesSection({ port, lang }: PortServicesSectionProps) {
  const services = getDefaultMarineServices(port);
  const availableCount = services.filter((s) => s.available).length;

  return (
    <section id="services" className="bg-[#f5f5f7] py-20 lg:py-24 border-b border-[#e5e5ea]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium text-[#0066cc] mb-2">
              {lang === 'es'
                ? '07. Servicios Portuarios Disponibles (Marítimos y Avituallamiento)'
                : '07. Available Marine & Husbandry Services'}
            </p>
            <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.65rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
              {lang === 'es'
                ? `Servicios técnicos y logísticos autorizados en ${port.name.replace('Puerto de ', '')}.`
                : `Authorized technical & husbandry services — ${port.name.replace('Puerto de ', '')}.`}
            </h2>
            <p className="mt-3 text-[15px] text-[#424245]">
              {lang === 'es'
                ? 'Cobertura operativa para armadores y fletadores conforme a prestadores autorizados por ASIPONA y Capitanía de Puerto.'
                : 'Technical and logistics husbandry services available to shipowners and charterers per authorized ASIPONA & Harbor Master permits.'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#e5e5ea] text-[13px] font-medium text-[#1d1d1f] self-start lg:self-auto">
            <Wrench className="w-4 h-4 text-[#0066cc]" />
            <span>
              {availableCount} / {services.length}{' '}
              {lang === 'es' ? 'servicios habilitados' : 'permitted services'}
            </span>
          </div>
        </div>

        {/* 2-Column Structured Services Grid (Inspired by Image 5) */}
        <div className="mt-8 bg-white rounded-2xl border border-[#e5e5ea] p-6 sm:p-8 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {services.map((srv) => (
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
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-[15px] font-semibold text-[#1d1d1f]">
                      {lang === 'es' ? srv.name : srv.nameEn}:
                    </span>
                    <span className="text-[11px] font-medium text-[#0066cc]">
                      {lang === 'es' ? srv.category : srv.categoryEn}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#424245]">
                    {lang === 'es' ? srv.detail : srv.detailEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
