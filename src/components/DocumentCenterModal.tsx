import { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Copy, Download, FileCode2, Link2, Lock, Package, Printer, Share2, X } from 'lucide-react';
import { formatDraftMAndFt, translatePortStatus } from '../utils/i18n';
import { generateSednaHtml } from '../utils/pdaEngine';
import {
  ALL_SHARE_SECTION_KEYS,
  buildExclusivePortShareUrl,
  formatShareExpirationDate,
  SHARE_SECTION_CATALOG,
  type ShareSectionKey,
} from '../utils/shareLink';
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
  onOpenPreArrivalGenerator?: () => void;
  onClose: () => void;
}

const DURATION_PRESETS = [
  { hours: 8, labelEs: '8 horas', labelEn: '8 hours' },
  { hours: 24, labelEs: '1 día (24 h)', labelEn: '1 day (24h)' },
  { hours: 72, labelEs: '3 días (72 h)', labelEn: '3 days (72h)' },
  { hours: 168, labelEs: '1 semana (7 d)', labelEn: '1 week (7d)' },
  { hours: 720, labelEs: '1 mes (30 d)', labelEn: '1 month (30d)' },
];

export function DocumentCenterModal({
  open,
  port,
  areas,
  terminals,
  restrictions,
  weather,
  hubState,
  lang,
  onOpenPreArrivalGenerator,
  onClose,
}: DocumentCenterModalProps) {
  const [docTab, setDocTab] = useState<'share' | 'sedna'>('share');
  const [copiedSedna, setCopiedSedna] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedExclusiveUrl, setCopiedExclusiveUrl] = useState(false);
  const [copiedExclusiveInvite, setCopiedExclusiveInvite] = useState(false);

  const [sharePortId, setSharePortId] = useState(port.id);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [selectedSections, setSelectedSections] = useState<ShareSectionKey[]>(
    ALL_SHARE_SECTION_KEYS
  );
  const [selectedTerminalIds, setSelectedTerminalIds] = useState<string[]>([]);
  const [selectedSubterminalIds, setSelectedSubterminalIds] = useState<string[]>([]);
  const [generatedAtMs, setGeneratedAtMs] = useState<number>(() => Date.now());

  const selectedSharePort =
    hubState.ports.find((p) => p.id === sharePortId) ?? port;

  const sharePortTerminals = useMemo(
    () => terminals.filter((t) => t.portId === selectedSharePort.id),
    [terminals, selectedSharePort.id]
  );

  const allSharePortTerminalIds = useMemo(
    () => sharePortTerminals.map((t) => t.id),
    [sharePortTerminals]
  );

  const allSharePortSubterminalIds = useMemo(
    () =>
      sharePortTerminals.flatMap((t) =>
        (t.concessionaires ?? []).map((c) => c.id)
      ),
    [sharePortTerminals]
  );

  useEffect(() => {
    if (open) {
      setSharePortId(port.id);
      const portTerms = terminals.filter((t) => t.portId === port.id);
      setSelectedTerminalIds(portTerms.map((t) => t.id));
      setSelectedSubterminalIds(
        portTerms.flatMap((t) => (t.concessionaires ?? []).map((c) => c.id))
      );
      setGeneratedAtMs(Date.now());
    }
  }, [open, port.id, terminals]);

  const handleSelectSharePort = (nextPortId: string) => {
    setSharePortId(nextPortId);
    const nextTerms = terminals.filter((t) => t.portId === nextPortId);
    setSelectedTerminalIds(nextTerms.map((t) => t.id));
    setSelectedSubterminalIds(
      nextTerms.flatMap((t) => (t.concessionaires ?? []).map((c) => c.id))
    );
    setGeneratedAtMs(Date.now());
  };

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

  const toggleShareSection = (key: ShareSectionKey) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
    setGeneratedAtMs(Date.now());
  };

  const applySectionPreset = (mode: 'all' | 'operational' | 'clear') => {
    if (mode === 'all') {
      setSelectedSections(ALL_SHARE_SECTION_KEYS);
    } else if (mode === 'operational') {
      setSelectedSections(
        SHARE_SECTION_CATALOG.filter((s) => s.defaultOperational).map((s) => s.key)
      );
    } else {
      setSelectedSections([]);
    }
    setGeneratedAtMs(Date.now());
  };

  const toggleTerminalShare = (term: Terminal) => {
    const childSubIds = (term.concessionaires ?? []).map((c) => c.id);
    const isChecked = selectedTerminalIds.includes(term.id);
    if (isChecked) {
      setSelectedTerminalIds((prev) => prev.filter((id) => id !== term.id));
      if (childSubIds.length > 0) {
        const childSet = new Set(childSubIds);
        setSelectedSubterminalIds((prev) => prev.filter((id) => !childSet.has(id)));
      }
    } else {
      setSelectedTerminalIds((prev) => [...prev, term.id]);
      if (childSubIds.length > 0) {
        setSelectedSubterminalIds((prev) =>
          Array.from(new Set([...prev, ...childSubIds]))
        );
      }
    }
    setGeneratedAtMs(Date.now());
  };

  const toggleSubterminalShare = (parentTerminalId: string, subId: string) => {
    const isChecked = selectedSubterminalIds.includes(subId);
    if (isChecked) {
      setSelectedSubterminalIds((prev) => prev.filter((id) => id !== subId));
    } else {
      setSelectedSubterminalIds((prev) => [...prev, subId]);
      setSelectedTerminalIds((prev) =>
        prev.includes(parentTerminalId) ? prev : [...prev, parentTerminalId]
      );
    }
    setGeneratedAtMs(Date.now());
  };

  const toggleAllSubterminalsForTerminal = (term: Terminal, selectAll: boolean) => {
    const childSubIds = (term.concessionaires ?? []).map((c) => c.id);
    const childSet = new Set(childSubIds);
    if (selectAll) {
      setSelectedTerminalIds((prev) =>
        prev.includes(term.id) ? prev : [...prev, term.id]
      );
      setSelectedSubterminalIds((prev) =>
        Array.from(new Set([...prev, ...childSubIds]))
      );
    } else {
      setSelectedSubterminalIds((prev) => prev.filter((id) => !childSet.has(id)));
    }
    setGeneratedAtMs(Date.now());
  };

  const applyTerminalPreset = (mode: 'all' | 'main_only' | 'clear') => {
    if (mode === 'all') {
      setSelectedTerminalIds(allSharePortTerminalIds);
      setSelectedSubterminalIds(allSharePortSubterminalIds);
    } else if (mode === 'main_only') {
      setSelectedTerminalIds(allSharePortTerminalIds);
      setSelectedSubterminalIds([]);
    } else {
      setSelectedTerminalIds([]);
      setSelectedSubterminalIds([]);
    }
    setGeneratedAtMs(Date.now());
  };

  const exclusiveLink = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://iss-port-hub.local';
    const pathname =
      typeof window !== 'undefined' ? window.location.pathname : '/';
    return buildExclusivePortShareUrl({
      origin,
      pathname,
      portId: selectedSharePort.id,
      durationHours,
      sections: selectedSections,
      terminalIds: selectedTerminalIds,
      allPortTerminalIds: allSharePortTerminalIds,
      subterminalIds: selectedSubterminalIds,
      allPortSubterminalIds: allSharePortSubterminalIds,
      nowMs: generatedAtMs,
    });
  }, [
    selectedSharePort.id,
    durationHours,
    selectedSections,
    selectedTerminalIds,
    allSharePortTerminalIds,
    selectedSubterminalIds,
    allSharePortSubterminalIds,
    generatedAtMs,
  ]);

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

  const exclusiveInviteText =
    lang === 'es'
      ? `Acceso exclusivo al portal operativo del ${selectedSharePort.name} (${selectedSharePort.unLocode}).\nVigencia hasta: ${formatShareExpirationDate(exclusiveLink.expiresAtMs, 'es')}\nEnlace directo: ${exclusiveLink.url}`
      : `Exclusive access to the operational portal for ${selectedSharePort.name} (${selectedSharePort.unLocode}).\nValid until: ${formatShareExpirationDate(exclusiveLink.expiresAtMs, 'en')}\nDirect link: ${exclusiveLink.url}`;

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

  const handleCopyExclusiveUrl = async () => {
    try {
      await navigator.clipboard.writeText(exclusiveLink.url);
      setCopiedExclusiveUrl(true);
      setTimeout(() => setCopiedExclusiveUrl(false), 2000);
    } catch {
      setCopiedExclusiveUrl(false);
    }
  };

  const handleCopyExclusiveInvite = async () => {
    try {
      await navigator.clipboard.writeText(exclusiveInviteText);
      setCopiedExclusiveInvite(true);
      setTimeout(() => setCopiedExclusiveInvite(false), 2000);
    } catch {
      setCopiedExclusiveInvite(false);
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
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#e5e5ea]">
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
              {lang === 'es' ? 'Enlace Exclusivo y Compartir' : 'Exclusive Link & Share'}
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
              {/* Time-Limited Exclusive Port Link Generator */}
              <div className="rounded-xl bg-[#f5f5f7] border border-[#d2d2d7] p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold text-[#1d1d1f] flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#0066cc]" />
                      {lang === 'es'
                        ? 'Enlace Público Exclusivo por Puerto y Vigencia Temporal'
                        : 'Time-Limited Exclusive Single-Port Share Link'}
                    </div>
                    <p className="text-[12.5px] text-[#6e6e73] mt-1">
                      {lang === 'es'
                        ? 'Genera una vista pública de solo lectura bloqueada al puerto, secciones, terminales y subterminales elegidos (sin descarga de PDFs ni Content Manager).'
                        : 'Generates a view-only public link locked to the selected port, sections, terminals, and subterminals (with PDF downloads and Content Manager disabled).'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-mono text-[#0066cc] tabular-nums">
                    <Clock className="w-3.5 h-3.5" />
                    {formatShareExpirationDate(exclusiveLink.expiresAtMs, lang)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11.5px] font-medium text-[#424245] mb-1">
                      {lang === 'es' ? 'Puerto exclusivo a compartir' : 'Exclusive Port'}
                    </label>
                    <select
                      value={selectedSharePort.id}
                      onChange={(e) => handleSelectSharePort(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] bg-white border border-[#d2d2d7] rounded-lg"
                    >
                      {hubState.ports.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.shortCode} · {p.unLocode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-medium text-[#424245] mb-1">
                      {lang === 'es' ? 'Vigencia del acceso (horas personalizadas o predefinidas)' : 'Access Duration'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DURATION_PRESETS.map((preset) => (
                        <button
                          key={preset.hours}
                          type="button"
                          onClick={() => {
                            setDurationHours(preset.hours);
                            setGeneratedAtMs(Date.now());
                          }}
                          className={`px-2.5 py-1.5 text-[12px] font-medium rounded-lg border transition-colors ${
                            durationHours === preset.hours
                              ? 'bg-[#0066cc] text-white border-[#0066cc]'
                              : 'bg-white text-[#1d1d1f] border-[#d2d2d7] hover:bg-[#ebebef]'
                          }`}
                        >
                          {lang === 'es' ? preset.labelEs : preset.labelEn}
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={8760}
                        value={durationHours}
                        onChange={(e) => {
                          setDurationHours(Math.max(1, Number(e.target.value) || 1));
                          setGeneratedAtMs(Date.now());
                        }}
                        aria-label={lang === 'es' ? 'Horas de vigencia' : 'Validity hours'}
                        className="w-20 px-2.5 py-1.5 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                {/* Selectable Public Page Sections */}
                <div className="p-4 rounded-xl bg-white border border-[#e5e5ea] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[12.5px] font-semibold text-[#1d1d1f]">
                        {lang === 'es'
                          ? `Secciones visibles en la vista pública (${selectedSections.length} / ${SHARE_SECTION_CATALOG.length})`
                          : `Visible sections in public link (${selectedSections.length} / ${SHARE_SECTION_CATALOG.length})`}
                      </div>
                      <p className="text-[11.5px] text-[#6e6e73]">
                        {lang === 'es'
                          ? 'Selecciona exactamente qué módulos de la página podrá consultar el cliente o armador.'
                          : 'Choose exactly which page modules the recipient can inspect.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11.5px]">
                      <button
                        type="button"
                        onClick={() => applySectionPreset('all')}
                        className="px-2.5 py-1 rounded-md bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] font-medium text-[#0066cc]"
                      >
                        {lang === 'es' ? 'Todo (11)' : 'All (11)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => applySectionPreset('operational')}
                        className="px-2.5 py-1 rounded-md bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] font-medium text-[#1d1d1f]"
                      >
                        {lang === 'es' ? 'Solo Operativo (Sin PDA/Dir.)' : 'Ops Only (No PDA/Dir.)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => applySectionPreset('clear')}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-[#f5f5f7] border border-[#d2d2d7] font-medium text-[#6e6e73]"
                      >
                        {lang === 'es' ? 'Limpiar' : 'Clear'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {SHARE_SECTION_CATALOG.map((sec) => {
                      const checked = selectedSections.includes(sec.key);
                      return (
                        <label
                          key={sec.key}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-[#f5f5f7] border-[#0066cc]/40'
                              : 'bg-white border-[#e5e5ea] opacity-75 hover:opacity-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleShareSection(sec.key)}
                            className="w-4 h-4 mt-0.5 accent-[#0066cc] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[12px] font-medium text-[#1d1d1f] leading-snug">
                              {lang === 'es' ? sec.labelEs : sec.labelEn}
                            </div>
                            <div className="text-[11px] text-[#6e6e73] leading-tight mt-0.5">
                              {lang === 'es' ? sec.descEs : sec.descEn}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Selectable Terminals & Subterminals (Concessionaires) */}
                {sharePortTerminals.length > 0 && (
                  <div className="p-4 rounded-xl bg-white border border-[#e5e5ea] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[12.5px] font-semibold text-[#1d1d1f]">
                          {lang === 'es'
                            ? `Terminales y subterminales a compartir (${selectedTerminalIds.length}/${allSharePortTerminalIds.length} terminales · ${selectedSubterminalIds.length}/${allSharePortSubterminalIds.length} subterminales)`
                            : `Terminals & subterminals to share (${selectedTerminalIds.length}/${allSharePortTerminalIds.length} terminals · ${selectedSubterminalIds.length}/${allSharePortSubterminalIds.length} subterminals)`}
                        </div>
                        <p className="text-[11.5px] text-[#6e6e73]">
                          {lang === 'es'
                            ? 'Elige qué terminales y terminales internas/cesionarios aparecerán en el mapa, tarjetas y minisitios del enlace compartido.'
                            : 'Select which terminals and inner concessionaires appear across the map, showcase, and mini-sites in this link.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[11.5px]">
                        <button
                          type="button"
                          onClick={() => applyTerminalPreset('all')}
                          className="px-2.5 py-1 rounded-md bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] font-medium text-[#0066cc]"
                        >
                          {lang === 'es' ? 'Todas' : 'All'}
                        </button>
                        {allSharePortSubterminalIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => applyTerminalPreset('main_only')}
                            className="px-2.5 py-1 rounded-md bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] font-medium text-[#1d1d1f]"
                          >
                            {lang === 'es' ? 'Solo principales' : 'Main only'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => applyTerminalPreset('clear')}
                          className="px-2.5 py-1 rounded-md bg-white hover:bg-[#f5f5f7] border border-[#d2d2d7] font-medium text-[#6e6e73]"
                        >
                          {lang === 'es' ? 'Ninguna' : 'None'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {sharePortTerminals.map((term) => {
                        const termChecked = selectedTerminalIds.includes(term.id);
                        const subs = term.concessionaires ?? [];
                        const selectedSubsCount = subs.filter((c) =>
                          selectedSubterminalIds.includes(c.id)
                        ).length;

                        return (
                          <div
                            key={term.id}
                            className={`rounded-lg border p-3 transition-colors ${
                              termChecked
                                ? 'bg-[#fafafa] border-[#0066cc]/35'
                                : 'bg-white border-[#e5e5ea] opacity-75'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
                                <input
                                  type="checkbox"
                                  checked={termChecked}
                                  onChange={() => toggleTerminalShare(term)}
                                  className="w-4 h-4 accent-[#0066cc] shrink-0"
                                />
                                <span className="text-[12.5px] font-semibold text-[#1d1d1f] truncate">
                                  {lang === 'es' ? term.name : term.nameEn ?? term.name}
                                </span>
                                <span className="font-mono text-[11px] text-[#6e6e73] shrink-0">
                                  ({term.berths.length}{' '}
                                  {lang === 'es' ? 'muelles' : 'berths'})
                                </span>
                              </label>

                              {subs.length > 0 && (
                                <div className="flex items-center gap-2 text-[11px] shrink-0">
                                  <span className="font-mono text-[#0066cc]">
                                    {selectedSubsCount}/{subs.length}{' '}
                                    {lang === 'es' ? 'subterminales' : 'subterminals'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleAllSubterminalsForTerminal(
                                        term,
                                        selectedSubsCount < subs.length
                                      )
                                    }
                                    className="px-2 py-0.5 rounded border border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-medium"
                                  >
                                    {selectedSubsCount < subs.length
                                      ? lang === 'es'
                                        ? 'Marcar todas'
                                        : 'Select all'
                                      : lang === 'es'
                                      ? 'Quitar todas'
                                      : 'Unselect all'}
                                  </button>
                                </div>
                              )}
                            </div>

                            {subs.length > 0 && (
                              <div className="mt-2.5 pl-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                                {subs.map((conc) => {
                                  const subChecked = selectedSubterminalIds.includes(conc.id);
                                  return (
                                    <label
                                      key={conc.id}
                                      className={`flex items-start gap-2 p-2 rounded-md border text-[11.5px] cursor-pointer transition-colors ${
                                        subChecked
                                          ? 'bg-white border-[#0066cc]/40 text-[#1d1d1f]'
                                          : 'bg-[#f5f5f7]/60 border-[#e5e5ea] text-[#6e6e73]'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={subChecked}
                                        onChange={() => toggleSubterminalShare(term.id, conc.id)}
                                        className="w-3.5 h-3.5 mt-0.5 accent-[#0066cc] shrink-0"
                                      />
                                      <span className="leading-tight min-w-0">
                                        <span className="font-medium block truncate">
                                          {conc.name}
                                        </span>
                                        {conc.subdivision && (
                                          <span className="text-[10.5px] text-[#6e6e73] block truncate">
                                            {lang === 'es'
                                              ? conc.subdivision
                                              : conc.subdivisionEn ?? conc.subdivision}
                                          </span>
                                        )}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                    {lang === 'es' ? 'URL Exclusiva Generada (con firma y expiración)' : 'Generated Signed Exclusive URL'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={exclusiveLink.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full px-3 py-2 text-[12px] font-mono bg-white border border-[#d2d2d7] rounded-lg text-[#1d1d1f]"
                  />
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyExclusiveUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-lg transition-colors"
                  >
                    {copiedExclusiveUrl ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                    {copiedExclusiveUrl
                      ? lang === 'es'
                        ? 'Enlace exclusivo copiado'
                        : 'Exclusive link copied'
                      : lang === 'es'
                      ? 'Copiar enlace exclusivo'
                      : 'Copy exclusive link'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyExclusiveInvite}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors"
                  >
                    {copiedExclusiveInvite ? <Check className="w-4 h-4 text-[#16a34a]" /> : <Copy className="w-4 h-4" />}
                    {copiedExclusiveInvite
                      ? lang === 'es'
                        ? 'Invitación copiada'
                        : 'Invite copied'
                      : lang === 'es'
                      ? 'Copiar invitación con vigencia'
                      : 'Copy invite with expiry'}
                  </button>
                </div>
              </div>

              {/* Executive Summary & Exports */}
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
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[#1d1d1f] hover:bg-[#333336] rounded-lg transition-colors"
                  >
                    {copiedShare ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {copiedShare
                      ? lang === 'es'
                        ? 'Resumen copiado'
                        : 'Summary copied'
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

                  {onOpenPreArrivalGenerator && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPreArrivalGenerator();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] rounded-lg transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      {lang === 'es' ? 'Información Pre-Arribo' : 'Pre-Arrival Information'}
                    </button>
                  )}
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
