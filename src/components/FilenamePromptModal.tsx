import { useEffect, useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import { sanitizePdfFilename } from '../utils/pdfExporter';
import type { Language } from '../types/port';

interface FilenamePromptModalProps {
  open: boolean;
  defaultFilename: string;
  title: string;
  subtitle?: string;
  lang: Language;
  onConfirm: (filename: string) => void;
  onClose: () => void;
}

export function FilenamePromptModal({
  open,
  defaultFilename,
  title,
  subtitle,
  lang,
  onConfirm,
  onClose,
}: FilenamePromptModalProps) {
  const [name, setName] = useState(defaultFilename);

  useEffect(() => {
    if (open) {
      setName(defaultFilename);
    }
  }, [open, defaultFilename]);

  if (!open) return null;

  const isEs = lang === 'es';
  const previewName = sanitizePdfFilename(name, defaultFilename);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(name.trim() || defaultFilename);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-filename-modal-title"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl max-w-md w-full border border-[#e5e5ea] shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-[#f5f5f7] border-b border-[#e5e5ea] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[#0066cc]" />
            <h3
              id="pdf-filename-modal-title"
              className="font-display text-[15px] font-semibold text-[#1d1d1f]"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEs ? 'Cerrar' : 'Close'}
            className="w-8 h-8 rounded-full hover:bg-[#e5e5ea] text-[#6e6e73] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {subtitle && (
            <p className="text-[13px] text-[#424245] leading-relaxed">{subtitle}</p>
          )}

          <div>
            <label
              htmlFor="pdf-custom-filename-input"
              className="block text-[12px] font-medium text-[#1d1d1f] mb-1.5"
            >
              {isEs ? 'Nombre del archivo PDF' : 'PDF filename'}
            </label>
            <input
              id="pdf-custom-filename-input"
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultFilename}
              className="w-full px-3.5 py-2.5 text-[14px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg focus:outline-2 focus:outline-[#0066cc]"
            />
            <div className="mt-2 text-[12px] text-[#6e6e73]">
              {isEs ? 'Se descargará como: ' : 'Will download as: '}
              <span className="font-mono font-semibold text-[#0066cc]">{previewName}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#f5f5f7] border-t border-[#e5e5ea] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[#424245] hover:bg-[#e5e5ea] rounded-lg transition-colors"
          >
            {isEs ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            {isEs ? 'Descargar PDF' : 'Download PDF'}
          </button>
        </div>
      </form>
    </div>
  );
}
