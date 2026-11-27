import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileText,
  Pencil,
  ShieldCheck,
  X,
} from 'lucide-react';
import { exportProductDossierToPdf } from '../utils/pdfExporter';
import { FilenamePromptModal } from './FilenamePromptModal';
import type { Language, ProductTechnicalDossier } from '../types/port';

interface ProductDossierModalProps {
  dossier: ProductTechnicalDossier | null;
  portName: string;
  lang: Language;
  disableDownloads?: boolean;
  onEditDossier?: (dossierId: string) => void;
  onClose: () => void;
}

export function ProductDossierModal({
  dossier,
  portName,
  lang,
  disableDownloads = false,
  onEditDossier,
  onClose,
}: ProductDossierModalProps) {
  const [copied, setCopied] = useState(false);
  const [filenameModalOpen, setFilenameModalOpen] = useState(false);

  if (!dossier) return null;

  const isEs = lang === 'es';
  const title = isEs ? dossier.name : dossier.nameEn;
  const summary = isEs ? dossier.summary : dossier.summaryEn;

  const blocks: Array<{ num: string; label: string; value: string; alert?: boolean }> = [
    {
      num: '01',
      label: isEs ? 'Identidad y Grado' : 'Identity & Grade',
      value: isEs ? dossier.identity : dossier.identityEn,
    },
    {
      num: '02',
      label: isEs ? 'Estado Físico y Riesgos' : 'Physical State & Hazards',
      value: isEs ? dossier.stateAndHazard : dossier.stateAndHazardEn,
    },
    {
      num: '03',
      label: isEs ? 'Compatibilidad de Circuito, Tanque y Sellos' : 'System, Tank & Seal Compatibility',
      value: isEs ? dossier.compatibility : dossier.compatibilityEn,
    },
    {
      num: '04',
      label: isEs ? 'Calidad, Humedad y Producto Previo' : 'Quality, Moisture & Prior Cargo',
      value: isEs ? dossier.qualityControl : dossier.qualityControlEn,
    },
    {
      num: '05',
      label: isEs ? 'Límites de Temperatura' : 'Temperature Limits',
      value: isEs ? dossier.temperatureLimits : dossier.temperatureLimitsEn,
    },
    {
      num: '06',
      label: isEs ? 'Conexión, Bridas, Mangueras y Vapores' : 'Connection, Flanges, Hoses & Vapors',
      value: isEs ? dossier.connectionSpecs : dossier.connectionSpecsEn,
    },
    {
      num: '07',
      label: isEs ? 'Método y Caudal de Transferencia' : 'Transfer Method & Rates',
      value: isEs ? dossier.transferRates : dossier.transferRatesEn,
    },
    {
      num: '08',
      label: isEs ? 'Estabilidad, Inhibidor y Atmósfera' : 'Stability, Inhibitor & Blanket',
      value: isEs ? dossier.stabilityControl : dossier.stabilityControlEn,
    },
    {
      num: '09',
      label: isEs ? 'Terminación, Drenado y Desconexión' : 'Termination, Draining & Disconnect',
      value: isEs ? dossier.terminationProcedure : dossier.terminationProcedureEn,
    },
    {
      num: '10',
      label: isEs ? 'Condiciones de Rechazo / Paro Inmediato' : 'Stop / Rejection Criteria',
      value: isEs ? dossier.rejectionCriteria : dossier.rejectionCriteriaEn,
      alert: true,
    },
  ];

  const flashPt = isEs
    ? dossier.flashPoint
    : dossier.flashPointEn ?? dossier.flashPoint;
  const hdsSummary = isEs
    ? dossier.hdsPemexSummary
    : dossier.hdsPemexSummaryEn ?? dossier.hdsPemexSummary;
  const ppeText = isEs
    ? dossier.ppeRequired
    : dossier.ppeRequiredEn ?? dossier.ppeRequired;

  const handleCopyText = async () => {
    const lines = [
      `ISS Port Intelligence — ${portName}`,
      `${dossier.code} | ${title} | UN ${dossier.unNumber} | ${dossier.imoClass}`,
      ...(dossier.casNumber || flashPt || dossier.nfpa704
        ? [
            [
              dossier.casNumber ? `CAS: ${dossier.casNumber}` : '',
              flashPt ? `${isEs ? 'P. Inflamación' : 'Flash Pt'}: ${flashPt}` : '',
              dossier.nfpa704 ? `NFPA 704: ${dossier.nfpa704}` : '',
            ]
              .filter(Boolean)
              .join(' | '),
          ]
        : []),
      `${isEs ? 'Muelles' : 'Berths'}: ${dossier.coatzacoalcosBerths}`,
      `${isEs ? 'Terminales' : 'Terminals'}: ${dossier.concessionaires}`,
      '',
      summary,
      ...(hdsSummary ? [`HDS/GHS: ${hdsSummary}`] : []),
      ...(ppeText ? [`${isEs ? 'EPP Obligatorio' : 'Required PPE'}: ${ppeText}`] : []),
      '',
      ...blocks.map((b) => `${b.num}. ${b.label}: ${b.value}`),
      '',
      `${isEs ? 'Referencia' : 'Reference'}: ${dossier.referenceSource}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const defaultPdfName = `Ficha-${dossier.code}-${title
    .slice(0, 28)
    .replace(/[^a-zA-Z0-9]+/g, '-')}`;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dossier-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      >
        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#e5e5ea]">
          {/* Header */}
          <div className="bg-[#042447] text-white px-6 py-6 sm:px-8 border-b-4 border-[#0066cc]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[12px] font-mono text-[#93c5fd]">
                  <span>{dossier.code}</span>
                  <span>·</span>
                  <span>UN {dossier.unNumber}</span>
                  {dossier.casNumber && (
                    <>
                      <span>·</span>
                      <span>CAS {dossier.casNumber}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{dossier.imoClass}</span>
                </div>
                <h3
                  id="product-dossier-title"
                  className="mt-1.5 font-display text-[22px] sm:text-[26px] font-semibold tracking-tight"
                >
                  {title}
                </h3>
                <div className="mt-2 text-[13px] text-white/85 flex flex-wrap gap-x-5 gap-y-1">
                  <span>
                    <strong className="text-[#93c5fd]">
                      {isEs ? 'Muelles habilitados: ' : 'Qualified berths: '}
                    </strong>
                    {dossier.coatzacoalcosBerths}
                  </span>
                  <span>
                    <strong className="text-[#93c5fd]">
                      {isEs ? 'Terminales: ' : 'Terminals: '}
                    </strong>
                    {dossier.concessionaires}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={isEs ? 'Cerrar ficha técnica' : 'Close product sheet'}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="px-6 py-4 sm:px-8 bg-[#f5f5f7] border-b border-[#e5e5ea] flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-[12px] font-medium text-[#1d1d1f]">
              <ShieldCheck className="w-4 h-4 text-[#0066cc]" />
              <span>{dossier.referenceSource}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium text-[#1d1d1f] bg-white hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16a34a]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied
                  ? isEs
                    ? 'Copiado'
                    : 'Copied'
                  : isEs
                  ? 'Copiar ficha'
                  : 'Copy brief'}
              </button>

              {onEditDossier && (
                <button
                  type="button"
                  onClick={() => onEditDossier(dossier.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium text-[#1d1d1f] bg-white hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#0066cc]" />
                  {isEs ? 'Editar ficha' : 'Edit sheet'}
                </button>
              )}

              {!disableDownloads && (
                <button
                  type="button"
                  onClick={() => setFilenameModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isEs ? 'Descargar Ficha PDF' : 'Download PDF Sheet'}
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="rounded-xl bg-[#f0f7ff] border border-[#bae6fd] p-4 text-[14px] leading-relaxed text-[#1d1d1f] flex items-start gap-3">
              <FileText className="w-5 h-5 text-[#0066cc] shrink-0 mt-0.5" />
              <p>{summary}</p>
            </div>

            {(dossier.casNumber || flashPt || dossier.nfpa704 || hdsSummary || ppeText) && (
              <div className="rounded-xl bg-[#fffbeb] border border-[#fde68a] p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12.5px]">
                  {dossier.casNumber && (
                    <div>
                      <span className="block text-[11px] font-semibold text-[#92400e] uppercase tracking-wide">
                        {isEs ? 'Número CAS' : 'CAS Number'}
                      </span>
                      <span className="font-mono font-semibold text-[#1d1d1f]">
                        {dossier.casNumber}
                      </span>
                    </div>
                  )}
                  {flashPt && (
                    <div>
                      <span className="block text-[11px] font-semibold text-[#92400e] uppercase tracking-wide">
                        {isEs ? 'Punto de Inflamación' : 'Flash Point'}
                      </span>
                      <span className="font-mono font-semibold text-[#1d1d1f]">{flashPt}</span>
                    </div>
                  )}
                  {dossier.nfpa704 && (
                    <div>
                      <span className="block text-[11px] font-semibold text-[#92400e] uppercase tracking-wide">
                        NFPA 704 / Rombo Seguridad
                      </span>
                      <span className="font-mono font-semibold text-[#1d1d1f]">
                        {dossier.nfpa704}
                      </span>
                    </div>
                  )}
                </div>
                {hdsSummary && (
                  <div className="text-[13px] text-[#451a03] leading-relaxed pt-2 border-t border-[#fde68a]">
                    <span className="font-semibold">
                      {isEs ? 'HDS / Hoja de Seguridad (NOM-018-STPS-2015): ' : 'SDS / Safety Sheet (GHS): '}
                    </span>
                    {hdsSummary}
                  </div>
                )}
                {ppeText && (
                  <div className="text-[12.5px] text-[#451a03] leading-relaxed">
                    <span className="font-semibold">
                      {isEs ? 'EPP Obligatorio en Maniobra: ' : 'Mandatory Handling PPE: '}
                    </span>
                    {ppeText}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blocks.map((block) => (
                <div
                  key={block.num}
                  className={`rounded-xl p-4 border space-y-1.5 ${
                    block.alert
                      ? 'bg-[#fef2f2] border-[#fecaca] md:col-span-2'
                      : 'bg-[#f5f5f7] border-[#e5e5ea]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {block.alert && <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0" />}
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        block.alert ? 'text-[#dc2626]' : 'text-[#0066cc]'
                      }`}
                    >
                      {block.num}
                    </span>
                    <h4
                      className={`font-display text-[14px] font-semibold ${
                        block.alert ? 'text-[#991b1b]' : 'text-[#1d1d1f]'
                      }`}
                    >
                      {block.label}
                    </h4>
                  </div>
                  <p
                    className={`text-[13px] leading-relaxed ${
                      block.alert ? 'text-[#7f1d1d] font-medium' : 'text-[#424245]'
                    }`}
                  >
                    {block.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!disableDownloads && (
        <FilenamePromptModal
          open={filenameModalOpen}
          defaultFilename={defaultPdfName}
          title={isEs ? 'Guardar Ficha Técnica de Producto' : 'Save Product Technical Sheet'}
          subtitle={
            isEs
              ? `Personaliza el nombre del archivo PDF antes de descargar la ficha de "${title}".`
              : `Customize the PDF filename before downloading the technical sheet for "${title}".`
          }
          lang={lang}
          onConfirm={(customName) => {
            exportProductDossierToPdf({
              filename: customName,
              dossier,
              portName,
              lang,
            });
            setFilenameModalOpen(false);
          }}
          onClose={() => setFilenameModalOpen(false)}
        />
      )}
    </>
  );
}
