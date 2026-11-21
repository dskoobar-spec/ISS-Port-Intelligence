import type {
  CargoGroup,
  DirectoryCategory,
  DirectoryEntry,
  Language,
  OfficialPortStatus,
  OperationalProcedure,
  OpticConcept,
  PortGeneralInfo,
  PortProfile,
  PortRegion,
  PortRestriction,
  PortServiceItem,
  PortStatusEvent,
  PhysicalRestrictionSpec,
} from '../types/port';

export const REGION_LABELS: Record<PortRegion, { es: string; en: string }> = {
  'GOLFO DE MÉXICO': { es: 'Golfo de México', en: 'Gulf of Mexico' },
  'MAR CARIBE': { es: 'Mar Caribe', en: 'Caribbean Sea' },
  'PACÍFICO NORTE': { es: 'Pacífico Norte', en: 'North Pacific' },
  'PACÍFICO CENTRO': { es: 'Pacífico Centro', en: 'Central Pacific' },
  'PACÍFICO SUR': { es: 'Pacífico Sur', en: 'South Pacific' },
};

export const PORT_STATUS_META: Record<
  OfficialPortStatus,
  {
    es: string;
    en: string;
    scopeEs: string;
    scopeEn: string;
    tone: 'open' | 'restricted' | 'closed';
  }
> = {
  'Abierto a toda navegación': {
    es: 'Abierto a toda navegación',
    en: 'Open to all navigation',
    scopeEs: 'Apertura total a navegación de altura y cabotaje',
    scopeEn: 'Full opening to ocean-going and coastal traffic',
    tone: 'open',
  },
  'Cerrado a embarcaciones menores': {
    es: 'Cerrado a embarcaciones menores',
    en: 'Closed to small craft (< 500 GT)',
    scopeEs: 'Cierre preventivo a embarcaciones menores a 500 TRB',
    scopeEn: 'Preventive closure for vessels under 500 GRT',
    tone: 'restricted',
  },
  'Cierre a embarcaciones mayores a 500 TRB': {
    es: 'Cierre a embarcaciones mayores a 500 TRB',
    en: 'Closed to vessels > 500 GRT',
    scopeEs: 'Cierre a embarcaciones mayores a 500 TRB / tráfico de altura',
    scopeEn: 'Closed to vessels over 500 GRT / ocean-going traffic',
    tone: 'closed',
  },
  'Restringido por Norte': {
    es: 'Restringido por Norte',
    en: 'Restricted due to Norte gale',
    scopeEs: 'Navegación restringida por vientos de Norte y oleaje en barra',
    scopeEn: 'Navigation restricted due to Norte winds & bar swell',
    tone: 'restricted',
  },
  'Cerrado a toda navegación': {
    es: 'Cerrado a toda navegación',
    en: 'Closed to all navigation',
    scopeEs: 'Cierre total del puerto a toda navegación de altura y menor',
    scopeEn: 'Total port closure to all ocean-going and coastal vessels',
    tone: 'closed',
  },
};

export const CARGO_GROUP_LABELS: Record<CargoGroup, { es: string; en: string }> = {
  'Petroquímica y Líquidos': { es: 'Petroquímica y Líquidos', en: 'Petrochemicals & Liquids' },
  'Hidrocarburos y Gas': { es: 'Hidrocarburos y Gas', en: 'Hydrocarbons & Gas' },
  'Granel Agrícola': { es: 'Granel Agrícola', en: 'Agricultural Bulk' },
  'Granel Mineral': { es: 'Granel Mineral', en: 'Mineral Bulk' },
  'Carga General y Contenedores': {
    es: 'Carga General y Contenedores',
    en: 'General Cargo & Containers',
  },
  'Carga Proyecto': { es: 'Carga Proyecto', en: 'Project & Heavy-Lift' },
};

export const RESTRICTION_CATEGORY_LABELS: Record<
  PortRestriction['category'],
  { es: string; en: string }
> = {
  Física: { es: 'Física', en: 'Physical' },
  Operativa: { es: 'Operativa', en: 'Operational' },
  'Practicaje y Remolque': { es: 'Practicaje y Remolque', en: 'Pilotage & Towage' },
  'Seguridad y Aduana': { es: 'Seguridad y Aduana', en: 'Security & Customs' },
};

export const ACCESS_LEVEL_LABELS: Record<
  DirectoryEntry['accessLevel'],
  { es: string; en: string }
> = {
  'Público Operativo': { es: 'Público Operativo', en: 'Operational Public' },
  'Interno ISS': { es: 'Interno ISS', en: 'ISS Internal' },
  'Comercial Restringido': { es: 'Comercial Restringido', en: 'Commercial Restricted' },
};

export const PHASE_LABELS: Record<
  OperationalProcedure['phase'],
  { es: string; en: string }
> = {
  'Pre-Arribo': { es: 'Pre-Arribo', en: 'Pre-Arrival' },
  'Atraque y Maniobras': { es: 'Atraque y Maniobras', en: 'Berthing & Maneuvering' },
  'Operación de Carga': { es: 'Operación de Carga', en: 'Cargo Operations' },
  'Despacho y Zarpe': { es: 'Despacho y Zarpe', en: 'Clearance & Sailing' },
};

export const OPTIC_CATEGORY_LABELS: Record<
  OpticConcept['category'],
  { es: string; en: string }
> = {
  'Contabilidad Portuaria': { es: 'Contabilidad Portuaria', en: 'Port Accounting' },
  'Facturación PDA/FDA': { es: 'Facturación PDA/FDA', en: 'PDA/FDA Billing' },
  'Cuentas de Terceros': { es: 'Cuentas de Terceros', en: 'Third-Party Pass-Through' },
  Conciliación: { es: 'Conciliación', en: 'Reconciliation' },
};

export const DIR_CATEGORY_LABELS: Record<
  DirectoryCategory,
  { es: string; en: string }
> = {
  ISS: { es: 'Directorio ISS', en: 'ISS Directory' },
  Subagentes: { es: 'Subagentes', en: 'Sub-Agents' },
  Proveedores: { es: 'Proveedores', en: 'Suppliers' },
  CLS_HUB: { es: 'CLS / HUB', en: 'CLS / HUB' },
  Clientes: { es: 'Clientes', en: 'Clients' },
  Dow_Jones: { es: 'Dow Jones', en: 'Dow Jones' },
};

export function translatePortStatus(status: OfficialPortStatus, lang: Language): string {
  const entry = PORT_STATUS_META[status];
  if (!entry) return status;
  return lang === 'es' ? entry.es : entry.en;
}

export function formatPortStatusTimestamp(date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

export const MAX_STATUS_HISTORY_PER_PORT = 10;

/**
 * Appends a status-change event ONLY when `nextStatus !== previousStatus`.
 * Keeps the most recent 10 transitions for the given port.
 */
export function recordPortStatusTransition(
  history: PortStatusEvent[],
  portId: string,
  previousStatus: OfficialPortStatus | undefined,
  nextStatus: OfficialPortStatus,
  timestamp: string = formatPortStatusTimestamp(),
  customNotes?: { es?: string; en?: string }
): PortStatusEvent[] {
  const portHistory = history.filter((ev) => ev.portId === portId);
  const latestRecorded = portHistory[0]?.status ?? previousStatus;

  if (latestRecorded === nextStatus) {
    return history;
  }

  const meta = PORT_STATUS_META[nextStatus];
  const newEvent: PortStatusEvent = {
    id: `st-${portId}-${Date.now()}`,
    portId,
    status: nextStatus,
    navigationScope: meta.scopeEs,
    navigationScopeEn: meta.scopeEn,
    timestamp,
    notes:
      customNotes?.es ??
      (previousStatus
        ? `Cambio de estatus: ${previousStatus} → ${nextStatus}`
        : `Cambio a: ${nextStatus}`),
    notesEn:
      customNotes?.en ??
      (previousStatus
        ? `Status changed: ${PORT_STATUS_META[previousStatus]?.en ?? previousStatus} → ${meta.en}`
        : `Status changed to: ${meta.en}`),
  };

  const otherPorts = history.filter((ev) => ev.portId !== portId);
  const updatedPortHistory = [newEvent, ...portHistory].slice(0, MAX_STATUS_HISTORY_PER_PORT);
  return [...updatedPortHistory, ...otherPorts];
}

export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

export function formatDraftMAndFt(meters: number, mDecimals = 2): string {
  const ft = metersToFeet(meters);
  return `${meters.toFixed(mDecimals)} m / ${ft.toFixed(1)} ft`;
}

/**
 * Enhances free-form metric depth strings like "18.0 – 26.0 m" so they display both m and ft.
 */
export function formatDepthRangeMAndFt(raw?: string): string {
  if (!raw) return '—';
  if (raw.toLowerCase().includes('ft') || raw.toLowerCase().includes('pies')) {
    return raw;
  }
  const rangeMatch = raw.match(/(\d+(?:\.\d+)?)\s*[–\-a]\s*(\d+(?:\.\d+)?)\s*m/i);
  if (rangeMatch) {
    const minM = parseFloat(rangeMatch[1]);
    const maxM = parseFloat(rangeMatch[2]);
    return `${raw} (${Math.round(metersToFeet(minM))}–${Math.round(metersToFeet(maxM))} ft)`;
  }
  const singleMatch = raw.match(/(\d+(?:\.\d+)?)\s*m/i);
  if (singleMatch) {
    const valM = parseFloat(singleMatch[1]);
    return `${raw} (${metersToFeet(valM).toFixed(1)} ft)`;
  }
  return raw;
}

export function getDefaultGeneralInfo(port: PortProfile): PortGeneralInfo {
  if (port.generalInfo) return port.generalInfo;
  const cleanName = port.name.replace('Puerto de ', '');
  const maxDraft =
    port.channels.length > 0
      ? Math.max(...port.channels.map((c) => c.operationalDraftM))
      : 11.0;

  return {
    geographicalNote: `Lat / Long ${port.coordinates} · Acceso marítimo oficial ${cleanName}`,
    geographicalNoteEn: `Lat / Long ${port.coordinates} · Official maritime approach ${cleanName}`,
    ispsLevel: `${port.unLocode} | Nivel de Seguridad PBIP/ISPS 1`,
    utcOffset: port.timezone,
    workingHours:
      '24 Horas SHINC (Domingos y Días Festivos incluidos) · 3 Turnos: 1ro 08:00–16:00 hrs · 2do 16:00–24:00 hrs · 3ro 00:00–08:00 hrs',
    workingHoursEn:
      '24 Hours SHINC (Sundays & Holidays Included) · 3 Shifts: 1st 08:00–16:00 hrs · 2nd 16:00–24:00 hrs · 3rd 00:00–08:00 hrs',
    holidays:
      'Año Nuevo (1 Ene), Día de la Constitución (1er Lun Feb), Natalicio Benito Juárez (3er Lun Mar), Día del Trabajo (1 May), Independencia (16 Sep), Revolución Mexicana (3er Lun Nov), Transmisión Poder Ejecutivo (1 Oct cada 6 años), Navidad (25 Dic). Operación continua 365 días disponible.',
    holidaysEn:
      'New Year (Jan 1), Constitution Day (1st Mon Feb), Birth of Benito Juárez (3rd Mon Mar), Labor Day (May 1), Independence Day (Sep 16), Revolution Day (3rd Mon Nov), Change of Federal Power (Oct 1 every 6 yrs), Christmas (Dec 25). Continuous 365-day operation available.',
    approachNote: `Aproximación marítima desde boya de recalada hacia dársenas interiores de ${cleanName}; practicaje obligatorio en canal de acceso hasta ${formatDraftMAndFt(maxDraft)}.`,
    approachNoteEn: `Maritime approach from sea buoy into inner basins of ${cleanName}; compulsory pilotage along access channel up to ${formatDraftMAndFt(maxDraft)}.`,
  };
}

export function getDefaultPhysicalSpecs(port: PortProfile): PhysicalRestrictionSpec[] {
  if (port.physicalSpecs && port.physicalSpecs.length > 0) return port.physicalSpecs;
  const maxDraft =
    port.channels.length > 0
      ? Math.max(...port.channels.map((c) => c.operationalDraftM))
      : 11.0;

  return [
    {
      id: `phys-${port.id}-anch`,
      label: 'Zona de Fondeo',
      labelEn: 'Anchorage Area',
      value: 'Fuera de Escolleras / Boya de Recalada',
      valueEn: 'Outside Breakwaters / Sea Buoy',
      remarks: 'Fondo de arena y fango; buen tenedero sujeto a aviso meteorológico de Capitanía.',
      remarksEn: 'Sand and mud holding ground; monitor local Harbor Master weather advisories.',
      highlight: 'default',
    },
    {
      id: `phys-${port.id}-evac`,
      label: 'Restricción de Fondeo / Clima',
      labelEn: 'Anchorage / Weather Restriction',
      value:
        port.region === 'GOLFO DE MÉXICO' || port.region === 'MAR CARIBE'
          ? 'Evacuación Preventiva ("Nortes" / Ciclones)'
          : 'Alerta por Mar de Fondo / Oleaje',
      valueEn:
        port.region === 'GOLFO DE MÉXICO' || port.region === 'MAR CARIBE'
          ? 'Mandatory Evacuation ("Nortes" / Gales)'
          : 'Swell / Surge Precautionary Watch',
      remarks:
        'Durante frentes fríos intensos o huracanes (>30–35 kt), Capitanía ordena suspender maniobras o levar anclas hacia aguas abiertas.',
      remarksEn:
        'During severe gales or tropical systems (>30–35 kt), Harbor Master orders suspend maneuvering or weigh anchor to open sea.',
      highlight: 'danger',
    },
    {
      id: `phys-${port.id}-loa`,
      label: 'Eslora Máx. Permisible (LOA)',
      labelEn: 'Max Permissible LOA',
      value: maxDraft >= 14 ? '290.00 m – 366.00 m' : '185.00 m – 230.00 m',
      valueEn: maxDraft >= 14 ? '290.00 m – 366.00 m' : '185.00 m – 230.00 m',
      remarks: 'Buques que excedan eslora estándar requieren autorización especial de Capitanía y estudio de maniobra.',
      remarksEn: 'Vessels exceeding standard quay limits require special Harbor Master clearance.',
      highlight: 'default',
    },
    {
      id: `phys-${port.id}-beam`,
      label: 'Manga Máx. Permisible (Beam)',
      labelEn: 'Max Permissible Beam',
      value: maxDraft >= 14 ? '32.30 m – 48.00 m' : '28.00 m – 32.30 m',
      valueEn: maxDraft >= 14 ? '32.30 m – 48.00 m' : '28.00 m – 32.30 m',
      remarks: 'Acorde con ancho de canal y diámetro de dársena de ciaboga autorizado.',
      remarksEn: 'Aligned with authorized entrance channel width and turning basin diameter.',
      highlight: 'default',
    },
    {
      id: `phys-${port.id}-ukc`,
      label: 'Margen Bajo la Quilla (UKC)',
      labelEn: 'Under Keel Clearance (UKC)',
      value: '0.91 m (3.00 ft) o 10% del calado',
      valueEn: '0.91 m (3.00 ft) or 10% of draft',
      remarks: 'UKC mínimo obligatorio exigido en todo momento por la Autoridad Marítima.',
      remarksEn: 'Minimum UKC mandated at all times by Maritime Authority & Pilotage Rules.',
      highlight: 'default',
    },
    {
      id: `phys-${port.id}-dens`,
      label: 'Densidad del Agua',
      labelEn: 'Water Density',
      value: '1.020 – 1.025 g/cm³',
      valueEn: '1.020 – 1.025 g/cm³',
      remarks: 'Agua marina / salobre; verificar lectura por desembocadura o temporada de lluvias.',
      remarksEn: 'Salt / brackish water; confirm hydrometer reading prior to draft survey.',
      highlight: 'default',
    },
    {
      id: `phys-${port.id}-tide`,
      label: 'Rango de Marea',
      labelEn: 'Tidal Range',
      value:
        port.region === 'PACÍFICO NORTE'
          ? '1.10 – 2.10 m (3.6 – 6.9 ft)'
          : '0.45 – 0.90 m (1.5 – 3.0 ft)',
      valueEn:
        port.region === 'PACÍFICO NORTE'
          ? '1.10 – 2.10 m (3.6 – 6.9 ft)'
          : '0.45 – 0.90 m (1.5 – 3.0 ft)',
      remarks: 'Marea semidiurna / mixta; considerar ventana de pleamar en calados límite.',
      remarksEn: 'Mixed/semidiurnal tide; leverage high-water window for max draft sailings.',
      highlight: 'default',
    },
    {
      id: `phys-${port.id}-air`,
      label: 'Calado Aéreo (Air Draft)',
      labelEn: 'Air Draft',
      value: 'Sin restricciones de puente',
      valueEn: 'No Bridge Restrictions',
      remarks: 'Verificar altura libre de brazos cargadores o grúas pórtico en cada muelle.',
      remarksEn: 'Verify shiploader / crane boom air clearance individually per berth.',
      highlight: 'success',
    },
  ];
}

export function getDefaultMarineServices(port: PortProfile): PortServiceItem[] {
  if (port.marineServices && port.marineServices.length > 0) return port.marineServices;
  const isCruiseEco = port.id === 'mxczm' || port.id === 'mxcun' || port.id === 'mxpva';

  return [
    {
      id: `srv-${port.id}-pilot`,
      category: 'Maniobra Marítima',
      categoryEn: 'Marine Maneuvering',
      name: 'Practicaje / Piloting',
      nameEn: 'Pilotage / Piloting',
      detail: 'Disponible 24/7 sujeto a estatus de puerto y reglas de Capitanía.',
      detailEn: 'Available 24/7 subject to port open status and Harbor Master rules.',
      available: true,
    },
    {
      id: `srv-${port.id}-tow`,
      category: 'Maniobra Marítima',
      categoryEn: 'Marine Maneuvering',
      name: 'Remolque Portuario (Towage)',
      nameEn: 'Harbor Towage',
      detail: isCruiseEco
        ? 'Remolcadores de apoyo bajo requerimiento para esloras mayores.'
        : 'Flota local de remolcadores azimutales de 50 a 70 ton Bollard Pull.',
      detailEn: isCruiseEco
        ? 'Support tugs available on request for larger vessels.'
        : 'Local fleet of 50 to 70 T. Bollard Pull azimuth tugboats.',
      available: true,
    },
    {
      id: `srv-${port.id}-moor`,
      category: 'Maniobra Marítima',
      categoryEn: 'Marine Maneuvering',
      name: 'Amarre y Desamarre de Cabos',
      nameEn: 'Mooring Rope / Line Handling',
      detail: 'Servicio obligatorio de cuadrillas y lancha de cabos en atraque/desatraque.',
      detailEn: 'Mandatory line-handling crew and mooring boat service.',
      available: true,
    },
    {
      id: `srv-${port.id}-launch`,
      category: 'Maniobra Marítima',
      categoryEn: 'Marine Maneuvering',
      name: 'Servicio de Lancha (Launch Boat)',
      nameEn: 'Boat Services / Launch',
      detail: 'Traslado de autoridades, inspectores, tripulación y suministros al fondeo.',
      detailEn: 'Launch service for authorities, surveyors, crew and anchorage transfers.',
      available: true,
    },
    {
      id: `srv-${port.id}-chandling`,
      category: 'Avituallamiento y Suministros',
      categoryEn: 'Husbandry & Supplies',
      name: 'Avituallamiento Naval (Ship Chandling)',
      nameEn: 'Ship Chandling',
      detail: 'Víveres, pertrechos, refacciones técnicas y consumibles aduanados.',
      detailEn: 'Provisions, bonded stores, marine spares and deck/engine supplies.',
      available: true,
    },
    {
      id: `srv-${port.id}-water`,
      category: 'Avituallamiento y Suministros',
      categoryEn: 'Husbandry & Supplies',
      name: 'Suministro de Agua Potable',
      nameEn: 'Potable Water Supply',
      detail: 'Disponible por toma directa en muelle o mediante pipa certificada.',
      detailEn: 'Available via dock pipeline connection or certified tank truck.',
      available: true,
    },
    {
      id: `srv-${port.id}-bunker`,
      category: 'Combustible y Ambiental',
      categoryEn: 'Fuel & Environmental',
      name: 'Suministro de Combustible (Bunkering)',
      nameEn: 'Fuel Supply (Bunkering)',
      detail: isCruiseEco
        ? 'Restringido en áreas naturales protegidas; solo MGO vía pipa en zonas habilitadas.'
        : 'MGO / VLSFO / IFO vía pipa autorizada o barcaza con permiso ASIPONA y Capitanía.',
      detailEn: isCruiseEco
        ? 'Restricted in marine parks; limited MGO delivery by tank truck only with permit.'
        : 'Bunker / VLSFO / MGO available via licensed tank truck or barge with ASIPONA permit.',
      available: !isCruiseEco,
    },
    {
      id: `srv-${port.id}-marpol`,
      category: 'Combustible y Ambiental',
      categoryEn: 'Fuel & Environmental',
      name: 'Recolección de Basura MARPOL Anexo V',
      nameEn: 'Garbage & Waste Collection (MARPOL)',
      detail: 'Prestadores autorizados con manifiesto oficial y cumplimiento MARPOL.',
      detailEn: 'Licensed contractors with full MARPOL compliance certificates.',
      available: true,
    },
    {
      id: `srv-${port.id}-slops`,
      category: 'Combustible y Ambiental',
      categoryEn: 'Fuel & Environmental',
      name: 'Retiro de Slops, Sentinas y Materiales Peligrosos',
      nameEn: 'Wastewater, Slops & Hazardous Waste Disposal',
      detail: 'Recolección mediante unidades de vacío y manejo certificado de residuos peligrosos.',
      detailEn: 'Certified vacuum truck slops, bilge & hazardous waste collection with disposal manifest.',
      available: !isCruiseEco || port.id === 'mxpva',
    },
    {
      id: `srv-${port.id}-stevedoring`,
      category: 'Operación de Carga',
      categoryEn: 'Cargo & Technical Support',
      name: 'Estiba, Maniobras y Báscula Certificada',
      nameEn: 'Maneuvering, Stevedoring & Certified Weighbridge',
      detail: isCruiseEco
        ? 'Atención a equipaje, avituallamiento hotelero y carga ligera de transbordadores.'
        : 'Cuadrillas portuarias, maquinaria, trincado en muelle y servicio de báscula fiscal.',
      detailEn: isCruiseEco
        ? 'Luggage handling, cruise provisions and RoPax ferry terminal operations.'
        : 'Dockside stevedoring, lashing, heavy-lift support & certified fiscal weighbridge.',
      available: true,
    },
    {
      id: `srv-${port.id}-fumigation`,
      category: 'Operación de Carga',
      categoryEn: 'Cargo & Technical Support',
      name: 'Fumigación Certificada y Peritajes (Draft/Cleanliness)',
      nameEn: 'Fumigation & Independent Marine Surveys',
      detail: isCruiseEco
        ? 'Desinsectación sanitaria y certificados fitosanitarios bajo demanda.'
        : 'Fumigación certificada para granel agrícola, bodegas y Draft/Ullage Surveys.',
      detailEn: isCruiseEco
        ? 'Sanitary vector control & inspection certificates upon request.'
        : 'Certified fumigation for agricultural bulk holds plus Draft / Ullage Surveys.',
      available: true,
    },
    {
      id: `srv-${port.id}-medical`,
      category: 'Tripulación y Cumplimiento',
      categoryEn: 'Crew & Compliance',
      name: 'Cambio de Tripulación, Asistencia Médica y Buceo',
      nameEn: 'Crew Change, Medical Assistance & Diving',
      detail: 'Coordinación migratoria INM, ambulancia/hospital y buceo comercial autorizado.',
      detailEn: 'Immigration crew sign-on/off, medical evac & approved underwater inspection.',
      available: true,
    },
  ];
}

export function cleanPortShortName(name: string): string {
  return name.replace('Puerto de ', '');
}
