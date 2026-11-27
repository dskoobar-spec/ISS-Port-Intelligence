import { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  FileCheck2,
  GitFork,
  Layers,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import {
  ACCESS_LEVEL_LABELS,
  DIR_CATEGORY_LABELS,
  OPTIC_CATEGORY_LABELS,
  PHASE_LABELS,
} from '../utils/i18n';
import type {
  AppsScriptTool,
  DirectoryCategory,
  DirectoryEntry,
  Language,
  OperationalProcedure,
  OpticConcept,
  OrgChartNode,
  PortProfile,
} from '../types/port';

interface DirectoryAndKnowledgeSectionProps {
  port: PortProfile;
  orgChart: OrgChartNode[];
  directory: DirectoryEntry[];
  procedures: OperationalProcedure[];
  opticGlossary: OpticConcept[];
  appsScripts: AppsScriptTool[];
  lang: Language;
  onOpenContentManager: (tab?: 'apps' | 'directory') => void;
}

type HubTab = 'directory' | 'procedures' | 'optic' | 'apps';
type DirectoryViewFilter = 'ALL' | 'ORG' | DirectoryCategory | 'CLIENTES_DOW_JONES';

export function DirectoryAndKnowledgeSection({
  port,
  orgChart,
  directory,
  procedures,
  opticGlossary,
  appsScripts,
  lang,
  onOpenContentManager,
}: DirectoryAndKnowledgeSectionProps) {
  const [activeTab, setActiveTab] = useState<HubTab>('directory');
  const [dirFilter, setDirFilter] = useState<DirectoryViewFilter>('ALL');
  const [search, setSearch] = useState('');

  const filterButtons: { id: DirectoryViewFilter; label: string }[] = [
    {
      id: 'ALL',
      label: lang === 'es' ? 'Vista Completa' : 'All Directory',
    },
    {
      id: 'ORG',
      label: lang === 'es' ? 'Organigrama Empresarial' : 'Corporate Org Chart',
    },
    {
      id: 'ISS',
      label: DIR_CATEGORY_LABELS.ISS[lang],
    },
    {
      id: 'Subagentes',
      label: DIR_CATEGORY_LABELS.Subagentes[lang],
    },
    {
      id: 'Proveedores',
      label: DIR_CATEGORY_LABELS.Proveedores[lang],
    },
    {
      id: 'CLS_HUB',
      label: DIR_CATEGORY_LABELS.CLS_HUB[lang],
    },
    {
      id: 'CLIENTES_DOW_JONES',
      label: lang === 'es' ? 'Clientes / Dow Jones' : 'Clients / Dow Jones',
    },
  ];

  const categoryPriority: Record<DirectoryCategory, number> = {
    ISS: 1,
    Subagentes: 2,
    Proveedores: 3,
    CLS_HUB: 4,
    Clientes: 5,
    Dow_Jones: 6,
  };

  const portDirectory = directory
    .filter((d) => {
      const matchesPort =
        d.portId === port.id ||
        d.category === 'CLS_HUB' ||
        d.category === 'Dow_Jones';
      if (!matchesPort) return false;

      if (dirFilter === 'ORG') return false;
      if (dirFilter === 'CLIENTES_DOW_JONES') {
        if (d.category !== 'Clientes' && d.category !== 'Dow_Jones') return false;
      } else if (dirFilter !== 'ALL' && d.category !== dirFilter) {
        return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        d.organization.toLowerCase().includes(q) ||
        d.contactName.toLowerCase().includes(q) ||
        d.role.toLowerCase().includes(q) ||
        (d.roleEn ?? '').toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q) ||
        (d.notesEn ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (categoryPriority[a.category] ?? 99) - (categoryPriority[b.category] ?? 99));

  const level1Nodes = orgChart.filter((n) => n.level === 1);
  const level2Nodes = orgChart.filter((n) => n.level === 2);
  const level3Nodes = orgChart.filter((n) => n.level === 3);

  const filteredOptic = opticGlossary.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.term.toLowerCase().includes(q) ||
      (item.termEn ?? '').toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q) ||
      (item.definitionEn ?? '').toLowerCase().includes(q)
    );
  });

  const showOrgChart =
    (dirFilter === 'ALL' || dirFilter === 'ORG') && !search.trim() && orgChart.length > 0;

  const renderNodeExtras = (node: OrgChartNode, dark = false) => (
    <>
      {node.customFields && node.customFields.length > 0 && (
        <div
          className={`mt-3 pt-2.5 border-t grid grid-cols-1 gap-1 text-[11.5px] ${
            dark ? 'border-white/15 text-[#cbd5e1]' : 'border-[#e5e5ea] text-[#424245]'
          }`}
        >
          {node.customFields.map((cf) => (
            <div key={cf.id} className="flex items-center justify-between gap-2">
              <span className={dark ? 'text-[#94a3b8]' : 'text-[#6e6e73]'}>{cf.label}</span>
              <span className="font-mono font-medium">{cf.value}</span>
            </div>
          ))}
        </div>
      )}

      {node.subDepartments && node.subDepartments.length > 0 && (
        <div
          className={`mt-3 pt-2.5 border-t space-y-2 ${
            dark ? 'border-white/15' : 'border-[#e5e5ea]'
          }`}
        >
          <div
            className={`text-[10.5px] font-semibold uppercase tracking-wider ${
              dark ? 'text-[#93c5fd]' : 'text-[#0066cc]'
            }`}
          >
            {lang === 'es' ? 'Subdepartamentos' : 'Sub-departments'}
          </div>
          {node.subDepartments.map((sub) => (
            <div
              key={sub.id}
              className={`p-2.5 rounded-lg border text-left ${
                dark
                  ? 'bg-white/5 border-white/15 text-white'
                  : 'bg-[#f5f5f7] border-[#e5e5ea] text-[#1d1d1f]'
              }`}
            >
              <div className="text-[12px] font-semibold">
                {lang === 'es' ? sub.name : sub.nameEn ?? sub.name}
              </div>
              <div className={`text-[11.5px] ${dark ? 'text-[#cbd5e1]' : 'text-[#424245]'}`}>
                {lang === 'es' ? sub.leadOrTeam : sub.leadOrTeamEn ?? sub.leadOrTeam}
              </div>
              {sub.email && (
                <div
                  className={`text-[11px] font-mono mt-0.5 ${
                    dark ? 'text-[#7dd3fc]' : 'text-[#0066cc]'
                  }`}
                >
                  {sub.email}
                </div>
              )}
              {sub.fields && sub.fields.length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-black/10 space-y-0.5 text-[11px]">
                  {sub.fields.map((f) => (
                    <div key={f.id} className="flex justify-between gap-2">
                      <span className={dark ? 'text-[#94a3b8]' : 'text-[#6e6e73]'}>{f.label}</span>
                      <span className="font-mono">{f.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <section id="hub-knowledge" className="bg-white py-20 lg:py-24 border-b border-[#e5e5ea]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium text-[#0066cc] mb-2">
              {lang === 'es'
                ? '11. Organigrama Empresarial, Directorios y Conocimiento'
                : '11. Corporate Org Chart, Global Directory & Knowledge'}
            </p>
            <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
              {lang === 'es'
                ? 'Organigrama, directorios separados, protocolos y referencia Optic.'
                : 'Corporate structure, separated directories, SOPs and Optic dictionary.'}
            </h2>
          </div>

          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea] self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'directory' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#6e6e73]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {lang === 'es' ? 'Organigrama y Directorio' : 'Org Chart & Directory'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('procedures')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'procedures' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#6e6e73]'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              {lang === 'es' ? 'Protocolos y SOPs' : 'Operational SOPs'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('optic')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'optic' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#6e6e73]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {lang === 'es' ? 'Diccionario Optic' : 'Optic Dictionary'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('apps')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'apps' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#6e6e73]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Apps Script ({appsScripts.length})
            </button>
          </div>
        </div>

        {/* Directory & Org Chart Tab */}
        {activeTab === 'directory' && (
          <div className="mt-8 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea]">
                {filterButtons.map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setDirFilter(btn.id)}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap ${
                      dirFilter === btn.id
                        ? 'bg-white text-[#1d1d1f] shadow-xs'
                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#6e6e73] absolute left-3 top-1/2 -translate-y-1/2" />
                <label htmlFor="dir-search" className="sr-only">
                  {lang === 'es' ? 'Buscar contacto' : 'Search contact'}
                </label>
                <input
                  id="dir-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={lang === 'es' ? 'Filtrar directorio...' : 'Filter directory...'}
                  className="w-full pl-9 pr-3 py-2 text-[13px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>
            </div>

            {/* 1. Organigrama Empresarial */}
            {showOrgChart && (
              <div className="rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <GitFork className="w-5 h-5 text-[#0066cc]" />
                    <h3 className="font-display text-[18px] font-semibold text-[#1d1d1f]">
                      {lang === 'es'
                        ? 'Organigrama Empresarial · Estructura Operativa ISS México'
                        : 'Corporate Org Chart · ISS Mexico Operational Structure'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-[#6e6e73]">
                      {orgChart.length} {lang === 'es' ? 'nodos operativos' : 'organizational nodes'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenContentManager('directory')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      {lang === 'es' ? 'Editar organigrama' : 'Edit org chart'}
                    </button>
                  </div>
                </div>

                {/* Tier 1 */}
                {level1Nodes.length > 0 && (
                  <div className="flex flex-col items-center">
                    <div
                      className={
                        level1Nodes.length === 1
                          ? 'grid grid-cols-1 gap-4 w-full max-w-xl'
                          : 'grid grid-cols-1 md:grid-cols-2 gap-4 w-full'
                      }
                    >
                      {level1Nodes.map((node) => (
                        <div
                          key={node.id}
                          className="rounded-xl bg-[#060a13] text-white p-5 border border-[#1e293b] text-center shadow-xs"
                        >
                          <div className="text-[11px] font-mono uppercase tracking-wider text-[#93c5fd]">
                            {lang === 'es' ? node.department : node.departmentEn}
                          </div>
                          <div className="mt-1 font-display text-[17px] font-semibold">
                            {lang === 'es' ? node.title : node.titleEn}
                          </div>
                          <div className="mt-1 text-[13px] text-[#cbd5e1]">
                            {lang === 'es'
                              ? node.holderOrTeam
                              : node.holderOrTeamEn ?? node.holderOrTeam}
                          </div>
                          {node.email && (
                            <div className="mt-2 text-[12px] font-mono text-[#7dd3fc]">
                              {node.email}
                            </div>
                          )}
                          {renderNodeExtras(node, true)}
                        </div>
                      ))}
                    </div>
                    {level2Nodes.length > 0 && <div className="h-6 w-px bg-[#cbd5e1]" />}
                  </div>
                )}

                {/* Tier 2 */}
                {level2Nodes.length > 0 && (
                  <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {level2Nodes.map((node) => (
                        <div
                          key={node.id}
                          className="rounded-xl bg-white p-5 border border-[#d2d2d7] flex flex-col justify-between"
                        >
                          <div>
                            <div className="text-[11px] font-semibold text-[#0066cc] uppercase tracking-wider">
                              {lang === 'es' ? node.department : node.departmentEn}
                            </div>
                            <div className="mt-1 font-display text-[15px] font-semibold text-[#1d1d1f]">
                              {lang === 'es' ? node.title : node.titleEn}
                            </div>
                            <div className="mt-1 text-[13px] text-[#424245]">
                              {lang === 'es'
                                ? node.holderOrTeam
                                : node.holderOrTeamEn ?? node.holderOrTeam}
                            </div>
                            {renderNodeExtras(node, false)}
                          </div>
                          {node.email && (
                            <div className="mt-3 pt-2.5 border-t border-[#e5e5ea] text-[12px] font-mono text-[#1d1d1f] break-all">
                              {node.email}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {level3Nodes.length > 0 && (
                      <div className="mx-auto h-6 w-px bg-[#cbd5e1]" />
                    )}
                  </div>
                )}

                {/* Tier 3 */}
                {level3Nodes.length > 0 && (
                  <div
                    className={
                      level3Nodes.length === 1
                        ? 'max-w-2xl mx-auto'
                        : 'grid grid-cols-1 md:grid-cols-2 gap-4'
                    }
                  >
                    {level3Nodes.map((node) => (
                      <div
                        key={node.id}
                        className="rounded-xl bg-white p-5 border border-[#e5e5ea] flex flex-col justify-between gap-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-[11px] font-medium text-[#6e6e73] uppercase tracking-wider">
                              {lang === 'es' ? node.department : node.departmentEn}
                            </div>
                            <div className="mt-0.5 font-display text-[15px] font-semibold text-[#1d1d1f]">
                              {lang === 'es' ? node.title : node.titleEn}
                            </div>
                            <div className="text-[13px] text-[#424245]">
                              {lang === 'es'
                                ? node.holderOrTeam
                                : node.holderOrTeamEn ?? node.holderOrTeam}
                            </div>
                          </div>
                          {node.email && (
                            <div className="text-[12px] font-mono text-[#0066cc] shrink-0">
                              {node.email}
                            </div>
                          )}
                        </div>
                        {renderNodeExtras(node, false)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2–6. Separated Directory Cards */}
            {portDirectory.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {portDirectory.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="font-semibold text-[#0066cc]">
                          {DIR_CATEGORY_LABELS[entry.category]?.[lang] ?? entry.category}
                        </span>
                        <span className="text-[#6e6e73]">
                          {ACCESS_LEVEL_LABELS[entry.accessLevel]?.[lang] ?? entry.accessLevel}
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-[17px] font-semibold text-[#1d1d1f]">
                        {entry.organization}
                      </h3>
                      <p className="text-[13px] text-[#424245] mt-0.5">
                        {entry.contactName} ·{' '}
                        {lang === 'es' ? entry.role : entry.roleEn ?? entry.role}
                      </p>
                      <p className="mt-3 text-[13px] text-[#6e6e73] leading-relaxed">
                        {lang === 'es' ? entry.notes : entry.notesEn ?? entry.notes}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#d2d2d7]/70 text-[12px] font-mono text-[#1d1d1f] space-y-1">
                      <div className="break-all">{entry.email}</div>
                      <div className="text-[#424245]">{entry.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Operational Knowledge Tab */}
        {activeTab === 'procedures' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {procedures.map((proc) => {
              const steps =
                lang === 'es'
                  ? proc.steps
                  : proc.stepsEn && proc.stepsEn.length > 0
                  ? proc.stepsEn
                  : proc.steps;
              const docs =
                lang === 'es'
                  ? proc.requiredDocs
                  : proc.requiredDocsEn && proc.requiredDocsEn.length > 0
                  ? proc.requiredDocsEn
                  : proc.requiredDocs;

              return (
                <div
                  key={proc.id}
                  className="rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[12px] text-[#6e6e73]">
                      <span className="font-medium text-[#0066cc]">
                        {PHASE_LABELS[proc.phase]?.[lang] ?? proc.phase}
                      </span>
                      <span className="font-mono">{proc.updatedAt}</span>
                    </div>
                    <h3 className="mt-2 font-display text-[18px] font-semibold text-[#1d1d1f]">
                      {lang === 'es' ? proc.title : proc.titleEn}
                    </h3>
                    <p className="mt-2 text-[14px] text-[#424245] leading-relaxed">
                      {lang === 'es' ? proc.summary : proc.summaryEn ?? proc.summary}
                    </p>
                    <ol className="mt-4 space-y-2 text-[13px] text-[#1d1d1f] list-decimal pl-5">
                      {steps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#d2d2d7]/70 text-[12px] text-[#424245]">
                    <span className="font-semibold text-[#1d1d1f]">
                      {lang === 'es' ? 'Documentos clave: ' : 'Required documents: '}
                    </span>
                    {docs.join(' · ')}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Optic Knowledge Base Tab */}
        {activeTab === 'optic' && (
          <div className="mt-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea]">
              <p className="text-[13px] text-[#424245]">
                {lang === 'es'
                  ? 'Diccionario conceptual de Optic: consulta de códigos financieros y procedimientos internos sin conexión directa a registros contables vivos.'
                  : 'Optic conceptual dictionary: reference financial codes and billing workflows with no direct connection to live ledger records.'}
              </p>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'es' ? 'Buscar término Optic...' : 'Search Optic term...'}
                aria-label={lang === 'es' ? 'Buscar término Optic' : 'Search Optic term'}
                className="px-3 py-1.5 text-[13px] bg-white border border-[#d2d2d7] rounded-lg w-64"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredOptic.map((concept) => (
                <div
                  key={concept.id}
                  className="rounded-2xl bg-white border border-[#e5e5ea] p-6"
                >
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-mono font-medium text-[#0066cc]">{concept.code}</span>
                    <span className="text-[#6e6e73]">
                      {OPTIC_CATEGORY_LABELS[concept.category]?.[lang] ?? concept.category}
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-display text-[17px] font-semibold text-[#1d1d1f]">
                    {lang === 'es' ? concept.term : concept.termEn ?? concept.term}
                  </h3>
                  <p className="mt-2 text-[14px] text-[#424245] leading-relaxed">
                    {lang === 'es'
                      ? concept.definition
                      : concept.definitionEn ?? concept.definition}
                  </p>
                  <p className="mt-3 pt-3 border-t border-[#e5e5ea] text-[12px] text-[#6e6e73]">
                    {lang === 'es'
                      ? concept.usageNote
                      : concept.usageNoteEn ?? concept.usageNote}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3 Apps Script Existing Systems Tab */}
        {activeTab === 'apps' && (
          <div className="mt-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-[14px] text-[#424245] max-w-2xl">
                {lang === 'es'
                  ? 'Acceso centralizado a los tres sistemas existentes de Google Apps Script sin sustituir su código ni alterar sus hojas actuales.'
                  : 'Centralized gateway to your three existing Google Apps Script applications without replacing or altering their current code.'}
              </p>
              <button
                type="button"
                onClick={() => onOpenContentManager('apps')}
                className="px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#d2d2d7] rounded-lg transition-colors"
              >
                {lang === 'es' ? 'Configurar enlaces' : 'Configure URLs'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {appsScripts.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[12px] text-[#6e6e73]">
                      <span>
                        {lang === 'es'
                          ? app.integrationMode
                          : app.integrationMode === 'Acceso directo'
                          ? 'Direct Access'
                          : 'Progressive Sync'}
                      </span>
                      <span className="text-[#92400e]">
                        {lang === 'es'
                          ? app.status
                          : app.status === 'Enlace activo'
                          ? 'Active Link'
                          : 'Pending sheet mapping'}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-[17px] font-semibold text-[#1d1d1f]">
                      {lang === 'es' ? app.name : app.nameEn ?? app.name}
                    </h3>
                    <p className="mt-2 text-[13px] text-[#424245] leading-relaxed">
                      {lang === 'es' ? app.role : app.roleEn ?? app.role}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#d2d2d7]/70">
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0066cc] hover:underline"
                    >
                      {lang === 'es' ? 'Abrir aplicación' : 'Open application'}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
