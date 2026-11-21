import { useState } from 'react';
import { PackageSearch, Search } from 'lucide-react';
import { CARGO_GROUP_LABELS, formatDraftMAndFt } from '../utils/i18n';
import { findBerthsByProduct } from '../utils/pdaEngine';
import type { CargoGroup, Language, PortArea, PortProfile, Terminal } from '../types/port';

interface CargoMatrixSectionProps {
  port: PortProfile;
  areas: PortArea[];
  terminals: Terminal[];
  lang: Language;
  onSelectTerminal: (terminal: Terminal) => void;
}

const CARGO_GROUPS: CargoGroup[] = [
  'Petroquímica y Líquidos',
  'Hidrocarburos y Gas',
  'Granel Agrícola',
  'Granel Mineral',
  'Carga General y Contenedores',
  'Carga Proyecto',
];

export function CargoMatrixSection({
  port,
  areas,
  terminals,
  lang,
  onSelectTerminal,
}: CargoMatrixSectionProps) {
  const [selectedGroup, setSelectedGroup] = useState<CargoGroup | 'ALL'>('ALL');
  const [query, setQuery] = useState('');

  const matches = findBerthsByProduct(terminals, areas, port.id, selectedGroup, query);
  const areaById = new Map(areas.map((a) => [a.id, a]));

  return (
    <section id="cargo" className="bg-white py-20 lg:py-24 border-b border-[#e5e5ea]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium text-[#0066cc] mb-2">
              {lang === 'es'
                ? '06B. Productos que se Manejan y Muelles Habilitados'
                : '06B. Handled Commodities & Qualified Berths'}
            </p>
            <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
              {lang === 'es'
                ? 'Localiza al instante dónde se maneja cada producto.'
                : 'Locate every berth qualified for your commodity.'}
            </h2>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-[#6e6e73] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <label htmlFor="cargo-search-input" className="sr-only">
              {lang === 'es' ? 'Buscar producto o equipo' : 'Search commodity or equipment'}
            </label>
            <input
              id="cargo-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === 'es'
                  ? 'Ej. Amoníaco, Maíz, Azufre, Acero...'
                  : 'e.g. Ammonia, Corn, Sulfur, Steel...'
              }
              className="w-full pl-10 pr-4 py-2.5 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg focus:outline-2 focus:outline-[#0066cc]"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-1.5 p-1 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea] w-fit max-w-full">
          <button
            type="button"
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedGroup === 'ALL'
                ? 'bg-white text-[#1d1d1f] shadow-xs'
                : 'text-[#6e6e73] hover:text-[#1d1d1f]'
            }`}
          >
            {lang === 'es' ? 'Todos los grupos' : 'All groups'}
          </button>
          {CARGO_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedGroup === group
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              {CARGO_GROUP_LABELS[group][lang]}
            </button>
          ))}
        </div>

        {matches.length > 0 ? (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-[#e5e5ea]">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#f5f5f7] border-b border-[#e5e5ea] text-[12px] text-[#6e6e73]">
                  <th className="py-3.5 px-5 font-medium">
                    {lang === 'es' ? 'Recinto / Terminal' : 'Area / Terminal'}
                  </th>
                  <th className="py-3.5 px-4 font-medium">
                    {lang === 'es' ? 'Muelle' : 'Berth'}
                  </th>
                  <th className="py-3.5 px-4 font-medium">
                    {lang === 'es' ? 'Productos manejados' : 'Handled commodities'}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-right">
                    {lang === 'es' ? 'Calado máx.' : 'Max draft'}
                  </th>
                  <th className="py-3.5 px-4 font-medium">
                    {lang === 'es' ? 'Rendimiento' : 'Rate'}
                  </th>
                  <th className="py-3.5 px-5 font-medium text-right">
                    {lang === 'es' ? 'Ficha' : 'Sheet'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5ea] bg-white">
                {matches.map(({ terminal, areaName, berth }) => {
                  const areaObj = areaById.get(terminal.areaId);
                  const displayArea = areaObj
                    ? lang === 'es'
                      ? areaObj.name
                      : areaObj.nameEn
                    : areaName;
                  const displayProducts =
                    lang === 'es'
                      ? berth.products
                      : berth.productsEn ?? berth.products;

                  return (
                    <tr key={`${terminal.id}-${berth.id}`} className="hover:bg-[#f5f5f7]/60">
                      <td className="py-4 px-5">
                        <div className="text-[12px] text-[#6e6e73]">{displayArea}</div>
                        <div className="font-medium text-[#1d1d1f]">
                          {lang === 'es'
                            ? terminal.name
                            : terminal.nameEn ?? terminal.name}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-[#1d1d1f]">
                        {lang === 'es' ? berth.name : berth.nameEn ?? berth.name}
                      </td>
                      <td className="py-4 px-4 text-[#424245]">
                        {displayProducts.join(', ')}
                      </td>
                      <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-[#0066cc] whitespace-nowrap">
                        {formatDraftMAndFt(berth.maxDraftM)}
                      </td>
                      <td className="py-4 px-4 font-mono text-[13px] text-[#424245]">
                        <div>
                          {lang === 'es'
                            ? berth.loadingRate
                            : berth.loadingRateEn ?? berth.loadingRate}
                        </div>
                        {(berth.muellajeTariff || berth.muellajeTariffEn) && (
                          <div className="mt-0.5 text-[11px] text-[#6e6e73]">
                            {lang === 'es'
                              ? berth.muellajeTariff
                              : berth.muellajeTariffEn ?? berth.muellajeTariff}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectTerminal(terminal)}
                          className="text-[13px] font-medium text-[#0066cc] hover:underline whitespace-nowrap"
                        >
                          {lang === 'es' ? 'Ver terminal' : 'View terminal'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#e5e5ea] bg-[#f5f5f7] p-10 text-center">
            <PackageSearch className="w-8 h-8 text-[#6e6e73] mx-auto mb-3" />
            <p className="text-[15px] font-medium text-[#1d1d1f]">
              {lang === 'es'
                ? 'Sin coincidencias para este filtro de carga.'
                : 'No berths match this commodity filter.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedGroup('ALL');
                setQuery('');
              }}
              className="mt-3 text-[13px] font-medium text-[#0066cc] hover:underline"
            >
              {lang === 'es' ? 'Restablecer búsqueda' : 'Reset search'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
