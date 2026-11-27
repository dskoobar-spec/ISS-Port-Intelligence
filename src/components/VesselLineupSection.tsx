import { useState } from 'react';
import { ExternalLink, FileDown, Plus, Ship, SlidersHorizontal } from 'lucide-react';
import { GAS_LINEUP_APP_URL } from '../data/nationalPortsSeed';
import { cleanPortShortName } from '../utils/i18n';
import { exportLineupToPdf, sanitizePdfFilename } from '../utils/pdfExporter';
import { FilenamePromptModal } from './FilenamePromptModal';
import type {
  Language,
  PortProfile,
  VesselLineupEntry,
  VesselStatus,
} from '../types/port';

interface VesselLineupSectionProps {
  port: PortProfile;
  lineup: VesselLineupEntry[];
  lang: Language;
  disableDownloads?: boolean;
  onUpdateVesselStatus: (vesselId: string, status: VesselStatus) => void;
  onOpenLineupManager: () => void;
}

const ALL_STATUSES: VesselStatus[] = [
  'EXPECTED',
  'ANCHORED',
  'BERTHED',
  'SAILED',
  'CANCELLED',
  'UNCONFIRMED',
];

const STATUS_LABELS: Record<VesselStatus, { es: string; en: string }> = {
  EXPECTED: { es: 'ESPERADO (EXPECTED)', en: 'EXPECTED' },
  ANCHORED: { es: 'FONDEADO (ANCHORED)', en: 'ANCHORED' },
  BERTHED: { es: 'ATRACADO (BERTHED)', en: 'BERTHED' },
  SAILED: { es: 'ZARPÓ (SAILED)', en: 'SAILED' },
  CANCELLED: { es: 'CANCELADO (CANCELLED)', en: 'CANCELLED' },
  UNCONFIRMED: { es: 'POR CONFIRMAR', en: 'UNCONFIRMED' },
};

export function VesselLineupSection({
  port,
  lineup,
  lang,
  disableDownloads = false,
  onUpdateVesselStatus,
  onOpenLineupManager,
}: VesselLineupSectionProps) {
  const [statusFilter, setStatusFilter] = useState<VesselStatus | 'ALL'>('ALL');
  const [pdfPromptOpen, setPdfPromptOpen] = useState(false);

  const portVessels = lineup.filter((v) => v.portId === port.id);
  const filteredVessels = portVessels.filter(
    (v) => statusFilter === 'ALL' || v.status === statusFilter
  );
  const shortName = cleanPortShortName(port.name);
  const defaultLineupFilename = sanitizePdfFilename(
    `LineUp-${port.shortCode}-${new Date().toISOString().slice(0, 10)}`,
    `LineUp-${port.shortCode}`
  ).replace(/\.pdf$/i, '');

  const handleConfirmLineupPdf = (customFilename: string) => {
    exportLineupToPdf({
      filename: customFilename,
      port,
      lineup: filteredVessels.length > 0 ? filteredVessels : portVessels,
      lang,
    });
    setPdfPromptOpen(false);
  };

  return (
    <section id="lineup" className="bg-white py-16 lg:py-20 border-b border-[#e5e5ea]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-[13px] font-medium text-[#0066cc] mb-2">
              {lang === 'es'
                ? `08. Line-Up de Buques · Conector ${port.lineupConnector}`
                : `08. Vessel Line-Up · ${port.lineupConnector} Connector`}
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3.2vw,2.45rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
              {lang === 'es'
                ? `Programación de buques en ${shortName}.`
                : `Vessel Line-Up for ${shortName}.`}
            </h2>
            <p className="mt-2.5 text-[15px] text-[#424245]">
              {disableDownloads
                ? lang === 'es'
                  ? 'Sincronizado con el modelo ISS Marine National Vessel Line-Up para consulta de programación portuaria.'
                  : 'Aligned with ISS Marine National Vessel Line-Up statuses for live vessel schedule viewing.'
                : lang === 'es'
                ? 'Sincronizado con el modelo ISS Marine National Vessel Line-Up. Actualiza estatus operativos en vivo o descarga el Line-Up oficial en PDF.'
                : 'Aligned with ISS Marine National Vessel Line-Up statuses. Update vessel status live or download the official Line-Up in PDF.'}
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 self-start lg:self-auto lg:shrink-0">
            <a
              href={port.lineupSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap"
            >
              {lang === 'es' ? 'Programación oficial' : 'Official schedule'}
              <ExternalLink className="w-3.5 h-3.5 text-[#6e6e73]" />
            </a>

            <a
              href={GAS_LINEUP_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-[#0066cc] bg-[#f5f5f7] hover:bg-[#e8f0fe] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap"
            >
              <Ship className="w-3.5 h-3.5" />
              Apps Script Line-Up
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {!disableDownloads && (
              <>
                <button
                  type="button"
                  onClick={() => setPdfPromptOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] rounded-lg transition-colors whitespace-nowrap"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  {lang === 'es' ? 'Descargar Line-Up PDF' : 'Download Line-Up PDF'}
                </button>

                <button
                  type="button"
                  onClick={onOpenLineupManager}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#1d1d1f] hover:bg-[#333336] rounded-lg transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === 'es' ? 'Actualizar Line-Up' : 'Update Line-Up'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Filter Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea]">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                statusFilter === 'ALL' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#6e6e73]'
              }`}
            >
              {lang === 'es' ? 'Todos' : 'All'} ({portVessels.length})
            </button>
            {ALL_STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === st ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#6e6e73]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <span className="text-[12px] text-[#6e6e73] font-mono">
            {port.shortCode} · {port.unLocode}
          </span>
        </div>

        {/* Line-Up Table */}
        {filteredVessels.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#e5e5ea]">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f5f5f7] border-b border-[#e5e5ea] text-[12px] text-[#6e6e73]">
                  <th className="py-3.5 px-5 font-medium">
                    {lang === 'es' ? 'Buque / IMO' : 'Vessel / IMO'}
                  </th>
                  <th className="py-3.5 px-4 font-medium">
                    {lang === 'es' ? 'Terminal / Muelle' : 'Terminal / Berth'}
                  </th>
                  <th className="py-3.5 px-4 font-medium">
                    {lang === 'es' ? 'Carga / Operación' : 'Cargo / Operation'}
                  </th>
                  <th className="py-3.5 px-4 font-medium font-mono">ETA / ETD</th>
                  <th className="py-3.5 px-4 font-medium">
                    {lang === 'es' ? 'Agencia' : 'Agency'}
                  </th>
                  <th className="py-3.5 px-5 font-medium text-right">
                    {lang === 'es' ? 'Estatus' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5ea] bg-white">
                {filteredVessels.map((v) => (
                  <tr key={v.id} className="hover:bg-[#f5f5f7]/60">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#1d1d1f]">{v.vesselName}</div>
                      {v.imo && (
                        <div className="text-[11px] font-mono text-[#6e6e73]">IMO {v.imo}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#424245]">{v.terminalOrBerth}</td>
                    <td className="py-3.5 px-4 text-[#1d1d1f]">{v.cargo}</td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-[#424245]">
                      {v.etaOrEtd}
                    </td>
                    <td className="py-3.5 px-4 text-[#424245]">{v.agencyOrOperator}</td>
                    <td className="py-3.5 px-5 text-right">
                      <select
                        aria-label={`${lang === 'es' ? 'Estatus de' : 'Status for'} ${v.vesselName}`}
                        value={v.status}
                        onChange={(e) =>
                          onUpdateVesselStatus(v.id, e.target.value as VesselStatus)
                        }
                        className="px-2.5 py-1.5 text-[12px] font-mono font-medium bg-[#f5f5f7] border border-[#d2d2d7] rounded-md text-[#1d1d1f]"
                      >
                        {ALL_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {STATUS_LABELS[st][lang]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-[#e5e5ea] bg-[#f5f5f7] p-8 text-center">
            <p className="text-[14px] text-[#424245]">
              {lang === 'es'
                ? 'No hay buques registrados con este estatus para el puerto seleccionado.'
                : 'No vessels registered under this status for the selected port.'}
            </p>
            {!disableDownloads && (
              <button
                type="button"
                onClick={onOpenLineupManager}
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0066cc] hover:underline"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {lang === 'es'
                  ? 'Agregar buque o importar desde Line-Up'
                  : 'Add vessel or import Line-Up'}
              </button>
            )}
          </div>
        )}
      </div>

      {!disableDownloads && (
        <FilenamePromptModal
          open={pdfPromptOpen}
          defaultFilename={defaultLineupFilename}
          title={lang === 'es' ? 'Nombrar y descargar Line-Up en PDF' : 'Name and download Line-Up PDF'}
          subtitle={
            lang === 'es'
              ? 'El documento incluirá el logo integrado de Inchcape en el encabezado y la lista de buques filtrada.'
              : 'Includes integrated Inchcape header branding and the filtered vessel lineup table.'
          }
          lang={lang}
          onConfirm={handleConfirmLineupPdf}
          onClose={() => setPdfPromptOpen(false)}
        />
      )}
    </section>
  );
}
