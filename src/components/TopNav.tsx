import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Lock, MapPin, Menu, SlidersHorizontal, X } from 'lucide-react';
import { REGION_LABELS } from '../utils/i18n';
import { formatShareExpirationDate, type ShareSectionKey } from '../utils/shareLink';
import type { Language, PortProfile, PortRegion } from '../types/port';

interface TopNavProps {
  ports: PortProfile[];
  activePortId: string;
  lang: Language;
  isExclusiveMode?: boolean;
  exclusiveExpiresAtMs?: number;
  allowedSections?: ShareSectionKey[];
  onToggleLang: (lang: Language) => void;
  onSelectPort: (portId: string) => void;
  onOpenContentManager: () => void;
  onOpenShareCenter: () => void;
  onOpenPreArrivalGenerator?: () => void;
}

const REGION_ORDER: PortRegion[] = [
  'GOLFO DE MÉXICO',
  'MAR CARIBE',
  'PACÍFICO NORTE',
  'PACÍFICO CENTRO',
  'PACÍFICO SUR',
];

export function TopNav({
  ports,
  activePortId,
  lang,
  isExclusiveMode = false,
  exclusiveExpiresAtMs,
  allowedSections,
  onToggleLang,
  onSelectPort,
  onOpenContentManager,
  onOpenShareCenter,
  onOpenPreArrivalGenerator,
}: TopNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portsOpen, setPortsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activePort = ports.find((p) => p.id === activePortId) ?? ports[0];

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPortsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPortsOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const allNavLinks: Array<{ href: string; label: string; sectionKey: ShareSectionKey }> =
    lang === 'es'
      ? [
          { href: '#port-status', label: 'Estatus', sectionKey: 'status_weather' },
          { href: '#restrictions', label: 'Calados', sectionKey: 'restrictions' },
          { href: '#terminals', label: 'Terminales', sectionKey: 'terminals' },
          { href: '#tariffs-pda', label: 'Tarifas/PDA', sectionKey: 'tariffs_pda' },
          { href: '#authorities-crew', label: 'Autoridades', sectionKey: 'authorities' },
          { href: '#hub-knowledge', label: 'Directorios', sectionKey: 'directory_knowledge' },
        ]
      : [
          { href: '#port-status', label: 'Status', sectionKey: 'status_weather' },
          { href: '#restrictions', label: 'Drafts', sectionKey: 'restrictions' },
          { href: '#terminals', label: 'Terminals', sectionKey: 'terminals' },
          { href: '#tariffs-pda', label: 'Tariffs/PDA', sectionKey: 'tariffs_pda' },
          { href: '#authorities-crew', label: 'Authorities', sectionKey: 'authorities' },
          { href: '#hub-knowledge', label: 'Directories', sectionKey: 'directory_knowledge' },
        ];

  const navLinks = allowedSections
    ? allNavLinks.filter((item) => allowedSections.includes(item.sectionKey))
    : allNavLinks;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-black/8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <a
          href="#top"
          className="font-display text-[16px] font-semibold tracking-tight text-[#1d1d1f] whitespace-nowrap shrink-0"
        >
          ISS Port Intelligence
        </a>

        <nav
          aria-label={lang === 'es' ? 'Navegación principal' : 'Primary navigation'}
          className="hidden xl:flex items-center gap-4 text-[12.5px] font-medium text-[#424245]"
        >
          {!isExclusiveMode ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setPortsOpen((prev) => !prev)}
                aria-expanded={portsOpen}
                aria-haspopup="menu"
                data-testid="ports-dropdown-btn"
                className={`inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  portsOpen
                    ? 'bg-[#f5f5f7] text-[#1d1d1f]'
                    : 'hover:text-[#1d1d1f] hover:bg-[#f5f5f7]/70'
                }`}
              >
                <span>
                  {lang === 'es' ? `Puertos (${ports.length})` : `Ports (${ports.length})`}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    portsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {portsOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-[720px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-[#d2d2d7] shadow-2xl p-5 z-50"
                >
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e5e5ea]">
                    <div>
                      <div className="text-[13px] font-semibold text-[#1d1d1f]">
                        {lang === 'es'
                          ? `Red Portuaria Nacional (${ports.length} puertos · 5 zonas)`
                          : `National Port Network (${ports.length} ports · 5 zones)`}
                      </div>
                      <div className="text-[11px] text-[#6e6e73]">
                        {lang === 'es'
                          ? 'Selecciona una zona y puerto para cargar su ficha operativa completa.'
                          : 'Select any maritime zone and port to load its full operational briefing.'}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-[#0066cc]">MEXICO HUB</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[65vh] overflow-y-auto pr-1">
                    {REGION_ORDER.map((region) => {
                      const zonePorts = ports.filter((p) => p.region === region);
                      if (zonePorts.length === 0) return null;
                      return (
                        <div key={region} className="space-y-1.5">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0066cc] px-2">
                            {REGION_LABELS[region][lang]} ({zonePorts.length})
                          </div>
                          <div className="space-y-0.5">
                            {zonePorts.map((p) => {
                              const isActive = p.id === activePortId;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    onSelectPort(p.id);
                                    setPortsOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-[13px] transition-colors ${
                                    isActive
                                      ? 'bg-[#0066cc] text-white font-medium'
                                      : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                                  }`}
                                >
                                  <span className="truncate flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 shrink-0 opacity-75" />
                                    {p.name.replace('Puerto de ', '')}
                                  </span>
                                  <span
                                    className={`font-mono text-[11px] shrink-0 ${
                                      isActive ? 'text-white/90' : 'text-[#6e6e73]'
                                    }`}
                                  >
                                    {p.shortCode}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f5f5f7] text-[#1d1d1f] text-[12px] font-medium whitespace-nowrap shrink-0">
              <Lock className="w-3 h-3 text-[#0066cc]" />
              {activePort?.name.replace('Puerto de ', '')}
            </span>
          )}

          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[#1d1d1f] transition-colors duration-150 whitespace-nowrap shrink-0 py-1"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {/* ES / EN Switcher in Sticky Header */}
          <div
            className="inline-flex items-center p-0.5 bg-[#f5f5f7] rounded-lg border border-[#d2d2d7] shrink-0"
            role="group"
            aria-label={lang === 'es' ? 'Selector de idioma' : 'Language selector'}
          >
            <button
              type="button"
              onClick={() => onToggleLang('es')}
              className={`px-2 py-1 text-[11.5px] font-medium rounded-md transition-colors whitespace-nowrap ${
                lang === 'es' ? 'bg-[#0066cc] text-white' : 'text-[#424245] hover:text-[#1d1d1f]'
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => onToggleLang('en')}
              className={`px-2 py-1 text-[11.5px] font-medium rounded-md transition-colors whitespace-nowrap ${
                lang === 'en' ? 'bg-[#0066cc] text-white' : 'text-[#424245] hover:text-[#1d1d1f]'
              }`}
            >
              EN
            </button>
          </div>

          {!isExclusiveMode ? (
            <>
              <button
                type="button"
                onClick={onOpenContentManager}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Content Manager
              </button>

              <button
                type="button"
                onClick={onOpenShareCenter}
                className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 text-[12.5px] font-medium text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]"
              >
                {lang === 'es' ? 'Compartir y Sedna' : 'Share & Sedna'}
              </button>
            </>
          ) : (
            onOpenPreArrivalGenerator && (
              <button
                type="button"
                onClick={onOpenPreArrivalGenerator}
                className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 text-[12.5px] font-medium text-white bg-[#0066cc] hover:bg-[#0055b3] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {lang === 'es' ? 'Información Pre-Arribo' : 'Pre-Arrival Info'}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={
              mobileOpen
                ? lang === 'es'
                  ? 'Cerrar menú'
                  : 'Close menu'
                : lang === 'es'
                ? 'Abrir menú'
                : 'Open menu'
            }
            aria-expanded={mobileOpen}
            className="xl:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#1d1d1f] hover:bg-black/5 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="xl:hidden border-t border-black/8 bg-white px-6 py-4 space-y-3 max-h-[82vh] overflow-y-auto">
          {!isExclusiveMode ? (
            <div className="space-y-2 pb-3 border-b border-black/8">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-[#0066cc]">
                {lang === 'es'
                  ? `Puertos por Zona (${ports.length})`
                  : `Ports by Zone (${ports.length})`}
              </div>
              {REGION_ORDER.map((region) => {
                const zonePorts = ports.filter((p) => p.region === region);
                if (zonePorts.length === 0) return null;
                return (
                  <div key={region} className="pt-1">
                    <div className="text-[11px] font-semibold text-[#6e6e73] mb-1">
                      {REGION_LABELS[region][lang]}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {zonePorts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onSelectPort(p.id);
                            setMobileOpen(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-left text-[12px] truncate border ${
                            p.id === activePortId
                              ? 'bg-[#0066cc] text-white border-[#0066cc] font-medium'
                              : 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e5e5ea]'
                          }`}
                        >
                          {p.name.replace('Puerto de ', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pb-3 border-b border-black/8 text-[12.5px] text-[#424245]">
              <span className="font-semibold text-[#1d1d1f]">{activePort?.name}</span>
              {exclusiveExpiresAtMs && (
                <span className="block text-[11px] text-[#6e6e73] mt-0.5">
                  {lang === 'es' ? 'Acceso válido hasta:' : 'Access valid until:'}{' '}
                  {formatShareExpirationDate(exclusiveExpiresAtMs, lang)}
                </span>
              )}
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-[15px] font-medium text-[#1d1d1f] border-b border-black/5"
              >
                {item.label}
              </a>
            ))}
          </div>

          {!isExclusiveMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenContentManager();
                }}
                className="w-full py-2.5 px-4 text-[13.5px] font-medium text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg inline-flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Content Manager
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenShareCenter();
                }}
                className="w-full py-2.5 px-4 text-[13.5px] font-medium text-white bg-[#0066cc] rounded-lg"
              >
                {lang === 'es' ? 'Compartir y Sedna' : 'Share & Sedna'}
              </button>
            </div>
          ) : (
            onOpenPreArrivalGenerator && (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenPreArrivalGenerator();
                }}
                className="mt-2 w-full py-2.5 px-4 text-[14px] font-medium text-white bg-[#0066cc] rounded-lg"
              >
                {lang === 'es' ? 'Información Pre-Arribo' : 'Pre-Arrival Information'}
              </button>
            )
          )}
        </div>
      )}
    </header>
  );
}
