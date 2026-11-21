import { useMemo, useState } from 'react';
import { Calculator, SlidersHorizontal } from 'lucide-react';
import { calculatePda } from '../utils/pdaEngine';
import type { Language, PortArea, PortProfile, TariffItem } from '../types/port';

interface TariffsAndPdaSectionProps {
  port: PortProfile;
  areas: PortArea[];
  tariffs: TariffItem[];
  lang: Language;
  onOpenContentManager: () => void;
}

const UNIT_LABELS: Record<TariffItem['unit'], { es: string; en: string }> = {
  per_gt: { es: 'Por UAB/GT', en: 'Per GT' },
  per_loa_m: { es: 'Por metro LOA', en: 'Per m LOA' },
  per_day: { es: 'Por día', en: 'Per day' },
  per_ton: { es: 'Por tonelada', en: 'Per MT' },
  per_tug_hour: { es: 'Por hora-remolcador', en: 'Per tug-hour' },
  flat: { es: 'Cuota fija', en: 'Flat fee' },
};

export function TariffsAndPdaSection({
  port,
  areas,
  tariffs,
  lang,
  onOpenContentManager,
}: TariffsAndPdaSectionProps) {
  const portAreas = areas.filter((a) => a.portId === port.id);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    portAreas[0]?.id ?? 'area-asipona-coa'
  );
  const [vesselName, setVesselName] = useState('MT Veracruz Trader');
  const [gt, setGt] = useState(22500);
  const [loaM, setLoaM] = useState(182);
  const [daysAlongside, setDaysAlongside] = useState(3);
  const [cargoTons, setCargoTons] = useState(15000);
  const [tugHours, setTugHours] = useState(4);
  const [usdToMxn, setUsdToMxn] = useState(19.5);

  const effectiveAreaId = portAreas.some((a) => a.id === selectedAreaId)
    ? selectedAreaId
    : portAreas[0]?.id ?? '';

  const pda = useMemo(
    () =>
      calculatePda(
        {
          portId: port.id,
          areaId: effectiveAreaId,
          vesselName,
          gt,
          loaM,
          daysAlongside,
          cargoTons,
          tugHours,
          usdToMxn,
        },
        tariffs
      ),
    [port.id, effectiveAreaId, vesselName, gt, loaM, daysAlongside, cargoTons, tugHours, usdToMxn, tariffs]
  );

  const portTariffs = tariffs.filter((t) => t.portId === port.id);

  return (
    <section id="tariffs-pda" className="bg-[#f5f5f7] py-20 lg:py-24 border-b border-[#e5e5ea]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium text-[#0066cc] mb-2">
              {lang === 'es'
                ? '09. Catálogo Maestro de Tarifas y Calculador PDA'
                : '09. Unified Tariff Catalog & Live PDA Estimator'}
            </p>
            <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-semibold tracking-tight text-[#1d1d1f] [text-wrap:balance]">
              {lang === 'es'
                ? 'Un solo catálogo compartido entre Tarifarios y PDA.'
                : 'One single catalog shared by Tariffs and PDA calculations.'}
            </h2>
            <p className="mt-3 text-[16px] text-[#424245]">
              {lang === 'es'
                ? 'Cualquier ajuste en el Content Manager actualiza automáticamente el cálculo PDA sin duplicar hojas.'
                : 'Any rate adjustment in Content Manager instantly updates PDA outputs without duplicate spreadsheets.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenContentManager}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-white hover:bg-[#ebebef] border border-[#d2d2d7] rounded-lg transition-colors self-start lg:self-auto"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {lang === 'es' ? 'Editar tarifas en Content Manager' : 'Edit tariffs in Content Manager'}
          </button>
        </div>

        {/* Interactive PDA Calculator + Output */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Vessel Input Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e5e5ea] p-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#e5e5ea]">
              <Calculator className="w-5 h-5 text-[#0066cc]" />
              <h3 className="font-display text-[17px] font-semibold text-[#1d1d1f]">
                {lang === 'es' ? 'Parámetros de escala (PDA)' : 'Port Call Parameters (PDA)'}
              </h3>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="pda-vessel" className="block text-[12px] font-medium text-[#424245] mb-1">
                  {lang === 'es' ? 'Buque / Referencia' : 'Vessel / Reference'}
                </label>
                <input
                  id="pda-vessel"
                  type="text"
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="pda-area" className="block text-[12px] font-medium text-[#424245] mb-1">
                  {lang === 'es' ? 'Recinto de atraque' : 'Berthing Enclosure'}
                </label>
                <select
                  id="pda-area"
                  value={effectiveAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full px-3 py-2 text-[14px] bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                >
                  {portAreas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {lang === 'es' ? a.name : a.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pda-gt" className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'UAB / Arqueo Bruto (GT)' : 'GRT / Gross Tonnage'}
                  </label>
                  <input
                    id="pda-gt"
                    type="number"
                    min={500}
                    step={500}
                    value={gt}
                    onChange={(e) => setGt(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-[14px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="pda-loa" className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Eslora LOA (metros)' : 'LOA (meters)'}
                  </label>
                  <input
                    id="pda-loa"
                    type="number"
                    min={40}
                    step={1}
                    value={loaM}
                    onChange={(e) => setLoaM(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-[14px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pda-days" className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Días en muelle' : 'Days alongside'}
                  </label>
                  <input
                    id="pda-days"
                    type="number"
                    min={1}
                    step={0.5}
                    value={daysAlongside}
                    onChange={(e) => setDaysAlongside(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-[14px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="pda-tugs" className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Horas-remolcador' : 'Tug hours'}
                  </label>
                  <input
                    id="pda-tugs"
                    type="number"
                    min={0}
                    step={0.5}
                    value={tugHours}
                    onChange={(e) => setTugHours(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-[14px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pda-cargo" className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Tonelaje carga (MT)' : 'Cargo volume (MT)'}
                  </label>
                  <input
                    id="pda-cargo"
                    type="number"
                    min={0}
                    step={500}
                    value={cargoTons}
                    onChange={(e) => setCargoTons(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-[14px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="pda-fx" className="block text-[12px] font-medium text-[#424245] mb-1">
                    {lang === 'es' ? 'Tipo de Cambio USD / MXN' : 'FX Rate USD / MXN'}
                  </label>
                  <input
                    id="pda-fx"
                    type="number"
                    min={1}
                    step={0.1}
                    value={usdToMxn}
                    onChange={(e) => setUsdToMxn(Number(e.target.value) || 19.5)}
                    className="w-full px-3 py-2 text-[14px] font-mono bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live PDA Result Breakdown */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
            <div className="p-6 bg-[#1d1d1f] text-white flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[12px] text-[#a1a1a6]">
                  {lang === 'es' ? 'Estimado Proforma (PDA)' : 'Proforma Disbursement Estimate'} ·{' '}
                  {vesselName}
                </div>
                <div
                  data-testid="pda-total-usd"
                  className="mt-1 font-mono text-[28px] font-semibold tabular-nums"
                >
                  ${pda.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-[#a1a1a6]">
                  {lang === 'es' ? 'Equivalente MXN' : 'MXN Equivalent'}
                </div>
                <div className="font-mono text-[18px] font-medium text-[#93c5fd] tabular-nums">
                  ${pda.totalMxn.toLocaleString('en-US', { minimumFractionDigits: 2 })} MXN
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#f5f5f7] border-b border-[#e5e5ea] text-[12px] text-[#6e6e73]">
                    <th className="py-3 px-5 font-medium">
                      {lang === 'es' ? 'Concepto / Proveedor' : 'Item / Provider'}
                    </th>
                    <th className="py-3 px-3 font-medium text-right">
                      {lang === 'es' ? 'Base' : 'Basis'}
                    </th>
                    <th className="py-3 px-3 font-medium text-right">
                      {lang === 'es' ? 'Tarifa' : 'Rate'}
                    </th>
                    <th className="py-3 px-5 font-medium text-right">USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5ea]">
                  {pda.lineItems.map((line) => (
                    <tr key={line.tariffId}>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-[#1d1d1f]">
                          {lang === 'es' ? line.concept : line.conceptEn}
                        </div>
                        <div className="text-[12px] text-[#6e6e73]">
                          {line.code} · {line.provider}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-[#424245]">
                        {line.quantity.toLocaleString('en-US')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-[#424245]">
                        ${line.unitRate.toFixed(2)} {line.currency}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums font-semibold text-[#1d1d1f]">
                        ${line.amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-[#f5f5f7] border-t border-[#e5e5ea] text-[12px] text-[#6e6e73]">
              {lang === 'es'
                ? `Nota: ${pda.pendingItemsCount} conceptos muestran tarifas referenciales sujetas a confirmación oficial de proveedor y condiciones particulares.`
                : `Note: ${pda.pendingItemsCount} items show reference rates subject to official supplier confirmation and call terms.`}
            </div>
          </div>
        </div>

        {/* Shared Master Tariff Table */}
        <div className="mt-10 bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
            <h3 className="font-display text-[16px] font-semibold text-[#1d1d1f]">
              {lang === 'es'
                ? 'Catálogo maestro de servicios y vigencias'
                : 'Master Service & Tariff Catalog'}
            </h3>
            <span className="text-[12px] text-[#6e6e73]">
              {portTariffs.length} {lang === 'es' ? 'conceptos registrados' : 'registered items'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f5f5f7] border-b border-[#e5e5ea] text-[12px] text-[#6e6e73]">
                  <th className="py-3 px-5 font-medium">
                    {lang === 'es' ? 'Código' : 'Code'}
                  </th>
                  <th className="py-3 px-4 font-medium">
                    {lang === 'es' ? 'Concepto' : 'Concept'}
                  </th>
                  <th className="py-3 px-4 font-medium">
                    {lang === 'es' ? 'Proveedor' : 'Provider'}
                  </th>
                  <th className="py-3 px-4 font-medium">
                    {lang === 'es' ? 'Unidad de cobro' : 'Unit'}
                  </th>
                  <th className="py-3 px-4 font-medium text-right">
                    {lang === 'es' ? 'Tarifa' : 'Rate'}
                  </th>
                  <th className="py-3 px-5 font-medium">
                    {lang === 'es' ? 'Vigencia / Estatus' : 'Effective / Status'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5ea]">
                {portTariffs.map((t) => (
                  <tr key={t.id} className={!t.active ? 'opacity-50' : ''}>
                    <td className="py-3 px-5 font-mono text-[12px] text-[#424245]">{t.code}</td>
                    <td className="py-3 px-4 font-medium text-[#1d1d1f]">
                      {lang === 'es' ? t.concept : t.conceptEn}
                    </td>
                    <td className="py-3 px-4 text-[#424245]">{t.provider}</td>
                    <td className="py-3 px-4 text-[#424245]">
                      {lang === 'es' ? UNIT_LABELS[t.unit].es : UNIT_LABELS[t.unit].en}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                      {t.rate.toFixed(2)} {t.currency}
                    </td>
                    <td className="py-3 px-5 text-[12px] text-[#6e6e73]">
                      {t.effectiveFrom} ·{' '}
                      {t.verificationStatus === 'verified'
                        ? lang === 'es'
                          ? 'Verificado'
                          : 'Verified'
                        : lang === 'es'
                        ? 'Referencia por confirmar'
                        : 'Pending confirmation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
