import { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode2, Printer, Share2, X } from 'lucide-react';
import { formatDraftMAndFt, translatePortStatus } from '../utils/i18n';
import { generateSednaHtml } from '../utils/pdaEngine';
import type {
  HubState,
  Language,
  PortArea,
  PortProfile,
  PortRestriction,
  Terminal,
  WeatherStatus,
} from '../types/port';

interface DocumentCenterModalProps {
  open: boolean;
  port: PortProfile;
  areas: PortArea[];
  terminals: Terminal[];
  restrictions: PortRestriction[];
  weather?: WeatherStatus;
  hubState: HubState;
  lang: Language;
  onClose: () => void;
}

export function DocumentCenterModal({
  open,
  port,
  areas,
  terminals,
  restrictions,
  weather,
  hubState,
  lang,
  onClose,
}: DocumentCenterModalProps) {
  const [docTab, setDocTab] = useState<'sedna' | 'share'>('share');
  const [copiedSedna, setCopiedSedna] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const sednaHtml = useMemo(
    () =>
      generateSednaHtml({
        port,
        areas,
        terminals,
        restrictions,
        weather,
        lang,
      }),
    [port, areas, terminals, restrictions, weather, lang]
  );

  if (!open) return null;

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?port=${port.id}`
      : '';

  const portAreas = areas.filter((a) => a.portId === port.id);
  const portTermCount = terminals.filter((t) => t.portId === port.id).length;

  const shareSummaryText =
    lang === 'es'
      ? [
          `${port.name} (${port.unLocode}) — ISS Port Intelligence`,
          `Coordenadas: ${port.coordinates} | VHF: ${port.vhfChannel}`,
          weather
            ? `Estatus de puerto: ${translatePortStatus(weather.portStatus, 'es')} (${weather.windDirection} ${weather.windKnots} kt)`
            : '',
          `Recintos: ${portAreas
            .map((a) => `${a.name} (Calado op. ${formatDraftMAndFt(a.operationalDraftM)})`)
            .join(' | ')}`,
          `Terminales publicadas: ${portTermCount}`,
          `Consulta web completa: ${shareUrl}`,
        ]
          .filter(Boolean)
          .join('\n')
      : [
          `${port.name} (${port.unLocode}) — ISS Port Intelligence`,
          `Coordinates: ${port.coordinates} | VHF: ${port.vhfChannel}`,
          weather
            ? `Port Status: ${translatePortStatus(weather.portStatus, 'en')} (${weather.windDirection} ${weather.windKnots} kt)`
            : '',
          `Enclosures: ${portAreas
            .map((a) => `${a.nameEn} (Max op. draft ${formatDraftMAndFt(a.operationalDraftM)})`)
            .join(' | ')}`,
          `Published terminals: ${portTermCount}`,
          `Full web dossier: ${shareUrl}`,
        ]
          .filter(Boolean)
          .join('\n');

  const handleCopySedna = async () => {
    try {
      await navigator.clipboard.writeText(sednaHtml);
      setCopiedSedna(true);
      setTimeout(() => setCopiedSedna(false), 2000);
    } catch {
      setCopiedSedna(false);
    }
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareSummaryText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      setCopiedShare(false);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(hubState, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iss-port-intelligence-${port.unLocode.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSednaHtml = () => {
    const blob = new Blob([sednaHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `port-restrictions-${port.unLocode.toLowerCase()}-sedna.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-center-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#e5e5ea]">
        <div className="px-6 py-5 border-b border-[#e5e5ea] flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium text-[#0066cc]">
              {lang === 'es' ? 'Centro Documental y Distribución' : 'Document Center & Sharing'}
            </p>
            <h3
              id="doc-center-title"
              className="font-display text-[20px] font-semibold text-[#1d1d1f]"
            >
              {port.name} ({port.unLocode})
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'es' ? 'Cerrar centro documental' : 'Close document center'}
            className="w-9 h-9 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] flex items-center justify-center text-[#1d1d1f]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="inline-flex items-center gap-1 p-1 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea]">
            <button
              type="button"
              onClick={() => setDocTab('share')}
              className={`px-4 py-2 text-[13px] font-medium rounded-md transition-colors ${
                docTab === 'share' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#6e6e73]'
              }`}
            >
              {lang === 'es' ? 'Compartir Ficha y PDF' : 'Share Brief & PDF'}
            </button>
            <button
              type="button"
              onClick={() => setDocTab('sedna')}
              className={`px-4 py-2 text-[13px] font-medium rounded-md transition-colors ${
                docTab === 'sedna' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#6e6e73]'
              }`}
            >
              {lang === 'es' ? 'Generador Sedna HTML (800px)' : 'Sedna HTML Generator (800px)'}
            </button>
          </div>

          {docTab === 'share' ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] p-5">
                <div className="text-[13px] font-medium text-[#1d1d1f] mb-2">
                  {lang === 'es'
                    ? 'Resumen ejecutivo listo para compartir por WhatsApp, Teams o correo'
                    : 'Executive summary ready to share via WhatsApp, Teams or email'}
                </div>
                <pre className="whitespace-pre-wrap font-mono text-[12px] text-[#424245] bg-white p-4 rounded-lg border border-[#e5e5ea]">
                  {shareSummaryText}
                </pre>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCopyShare}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-lg transition-colors"
                  >
                    {copiedShare ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {copiedShare
                      ? lang === 'es'
                        ? 'Resumen y enlace copiados'
                        : 'Copied link & brief'
                      : lang === 'es'
                      ? 'Copiar resumen y enlace'
                      : 'Copy summary & link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setTimeout(() => window.print(), 150);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    {lang === 'es' ? 'Imprimir / Guardar PDF' : 'Print / Save PDF'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {lang === 'es' ? 'Descargar base JSON' : 'Download JSON'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] text-[#424245]">
                  {lang === 'es'
                    ? 'Código HTML de 800 px optimizado para clientes de correo y Sedna, generado en vivo desde los datos actuales.'
                    : '800px email-ready HTML generated live from the current master port dataset.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopySedna}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-lg transition-colors"
                  >
                    {copiedSedna ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedSedna
                      ? lang === 'es'
                        ? 'HTML copiado'
                        : 'HTML copied'
                      : lang === 'es'
                      ? 'Copiar HTML Sedna'
                      : 'Copy Sedna HTML'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSednaHtml}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors"
                  >
                    <FileCode2 className="w-4 h-4" />
                    {lang === 'es' ? 'Descargar .html' : 'Download .html'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[12px] font-medium text-[#6e6e73] mb-1.5">
                    {lang === 'es' ? 'Vista previa Sedna (800px)' : 'Sedna Preview (800px)'}
                  </div>
                  <iframe
                    title="Sedna HTML Preview"
                    srcDoc={sednaHtml}
                    className="w-full h-80 rounded-xl border border-[#d2d2d7] bg-white"
                  />
                </div>
                <div>
                  <div className="text-[12px] font-medium text-[#6e6e73] mb-1.5">
                    {lang === 'es' ? 'Código fuente HTML' : 'HTML Source'}
                  </div>
                  <textarea
                    readOnly
                    value={sednaHtml}
                    aria-label="Sedna HTML Source"
                    className="w-full h-44 p-3 font-mono text-[11px] bg-[#0b1220] text-[#cbd5e1] rounded-xl border border-[#1e293b]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
