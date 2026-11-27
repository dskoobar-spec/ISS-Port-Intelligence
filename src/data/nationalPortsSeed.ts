import type {
  AnchorageZone,
  Berth,
  CargoGroup,
  DirectoryEntry,
  NavigationChannel,
  PortArea,
  PortProfile,
  PortRegion,
  PortRestriction,
  PortStatusEvent,
  StorageSummary,
  TariffItem,
  Terminal,
  TerminalCommercialProfile,
  VesselLineupEntry,
  WeatherStatus,
} from '../types/port';

export const GAS_LINEUP_APP_URL =
  'https://script.google.com/macros/s/AKfycbwnoC7XKGU7lXLpeylMB_iq3VY1RkCYMgCRkvreByCJxA7z2OIe8GYxUy8AgKKcgqVpAQ/exec';

interface AreaSpec {
  key: string;
  name: string;
  nameEn: string;
  summary: string;
  summaryEn: string;
  channelDepthM: number;
  operationalDraftM: number;
  turningBasinM: number;
  daylightOnly: boolean;
  tugRequirement: string;
  pilotRequirement: string;
}

interface BerthSpec {
  idSuffix: string;
  name: string;
  lengthM: number;
  maxLoaM: number;
  maxBeamM: number;
  berthDepthM: number;
  maxDraftM: number;
  airDraftM?: number;
  products: string[];
  cargoGroups: CargoGroup[];
  equipment: string[];
  connections: string[];
  loadingRate: string;
  notes: string;
}

interface TerminalSpec {
  idSuffix: string;
  areaKey: string;
  name: string;
  operator: string;
  shortDesc: string;
  shortDescEn: string;
  coordinates: string;
  mapX: number;
  mapY: number;
  imageType: 'hero' | 'pajaritos' | 'recintoSur' | 'channel';
  cargoGroups: CargoGroup[];
  storageSummary?: StorageSummary;
  commercialProfile?: TerminalCommercialProfile;
  procedures: string[];
  restrictionsSummary: string;
  berths: BerthSpec[];
}

interface RestrictionSpec {
  idSuffix: string;
  areaKey?: string;
  category: PortRestriction['category'];
  title: string;
  titleEn: string;
  detail: string;
  detailEn: string;
  limitValue: string;
  verificationStatus: 'verified' | 'pending_validation';
  source: string;
}

interface PortBlueprint {
  id: string;
  shortCode: string;
  name: string;
  unLocode: string;
  region: PortRegion;
  state: string;
  coordinates: string;
  vhfChannel: string;
  authority: string;
  lineupSourceUrl: string;
  lineupConnector: string;
  operatingRulesSummary: string;
  operatingRulesUrl: string;
  headlineEs: string;
  headlineEn: string;
  overviewEs: string;
  overviewEn: string;
  heroImageType: 'hero' | 'pajaritos' | 'recintoSur' | 'channel';
  channels: NavigationChannel[];
  anchorageZones: AnchorageZone[];
  areas: AreaSpec[];
  terminals: TerminalSpec[];
  restrictions: RestrictionSpec[];
  sampleVessel: string;
  sampleImo: string;
  sampleBerth: string;
  sampleCargo: string;
  sampleStatus: VesselLineupEntry['status'];
}

export function buildAdditionalPortsData(images: {
  heroCoa: string;
  pajaritos: string;
  recintoSur: string;
  channel: string;
}): {
  ports: PortProfile[];
  areas: PortArea[];
  terminals: Terminal[];
  restrictions: PortRestriction[];
  tariffs: TariffItem[];
  directory: DirectoryEntry[];
  weather: WeatherStatus[];
  statusHistory: PortStatusEvent[];
  lineup: VesselLineupEntry[];
} {
  const resolveImage = (t: 'hero' | 'pajaritos' | 'recintoSur' | 'channel') => {
    switch (t) {
      case 'hero':
        return images.heroCoa;
      case 'pajaritos':
        return images.pajaritos;
      case 'recintoSur':
        return images.recintoSur;
      case 'channel':
      default:
        return images.channel;
    }
  };

  const blueprints: PortBlueprint[] = [
    // 1. ALTAMIRA
    {
      id: 'mxalt',
      shortCode: 'ALT',
      name: 'Puerto de Altamira',
      unLocode: 'MXATM',
      region: 'GOLFO DE MÉXICO',
      state: 'Tamaulipas · Golfo de México',
      coordinates: "22°29'18\"N · 97°51'12\"W",
      vhfChannel: 'CH 16 / CH 12 (CCTM Altamira)',
      authority: 'ASIPONA Altamira · Capitanía de Puerto',
      lineupSourceUrl: 'https://puertoaltamira.com.mx/upl/sec/PROGRAMACION.pdf',
      lineupConnector: 'ALT_PROGRAM_PDF',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Altamira: Control de Tráfico Marítimo (CCTM) obligatorio 24/7 por VHF CH 12; canal de 3,732 m × 350 m; maniobras nocturnas habilitadas hasta eslora 294 m (GNL y buques >250 m sujetos a ventana diurna y 3 remolcadores azimutales); aviso PIS/VUMCE 48 h antes.',
      operatingRulesUrl: 'https://www.puertoaltamira.com.mx/reglas-de-operacion/',
      headlineEs: 'Altamira. Nodo petroquímico, GNL y contenedores del noreste.',
      headlineEn: 'Altamira. Northeastern petrochemical, LNG & container gateway.',
      overviewEs:
        'Puerto industrial y comercial en Tamaulipas con dársenas dedicadas para terminales petroquímicas (Vopak, TEPEAL, OTM/TMA), Terminal de GNL (TLA), contenedores y usos múltiples (ATP, IPM, CTS, Steelterminal) y astillero offshore (J. Ray McDermott).',
      overviewEn:
        'Industrial and commercial port in Tamaulipas operating dedicated basins for petrochemicals (Vopak, TEPEAL, OTM), LNG (TLA), containers and multipurpose terminals (ATP, IPM, CTS, Steelterminal) plus offshore fabrication.',
      heroImageType: 'pajaritos',
      channels: [
        {
          id: 'ch-alt-ext',
          name: 'Canal de Acceso y Escolleras Altamira',
          lengthNm: 2.01,
          widthM: 350,
          channelDepthM: 14.0,
          operationalDraftM: 12.19,
          squatAllowanceNote:
            'Canal de 3,732 m × 350 m; calado operativo de referencia 12.19 m (40 ft) en dársena principal y 12.8 m en zona GNL.',
          verificationStatus: 'verified',
        },
        {
          id: 'ch-alt-int',
          name: 'Dársenas de Ciaboga Norte, Sur y Petroquímica',
          lengthNm: 1.45,
          widthM: 480,
          channelDepthM: 13.5,
          operationalDraftM: 11.89,
          squatAllowanceNote:
            'Dársena de ciaboga principal de 480–600 m de diámetro para maniobras de Panamax, Aframax y buques metaneros.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-alt-1',
          name: 'Fondeadero Principal Altamira (Norte/NW Boya de Recalada)',
          purpose: 'Buques mercantes generales, graneleros y portacontenedores',
          coordinates: "22°26.7'N · 097°46.0'W (3.0 MN al NW de boya de recalada)",
          depthM: '20.0 – 24.0 m (arena y fango)',
          maxVesselOrNotes:
            'Fondo firme de arena; mantener radioescucha continua en VHF CH 16/12 con CCTM Altamira.',
          verificationStatus: 'verified',
        },
        {
          id: 'az-alt-2',
          name: 'Zona de Espera Buques Tanque / GNL y Carga Peligrosa',
          purpose: 'Buques tanque petroquímicos, gaseros y metaneros TLA',
          coordinates: "22°28.5'N · 097°44.0'W",
          depthM: '24.0 – 28.0 m',
          maxVesselOrNotes:
            'Resguardo mínimo de seguridad de 2.0 MN de plataformas y escolleras; máquinas en standby durante Nortes.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'comercial',
          name: 'Dársena Comercial y Usos Múltiples (ATP · IPM · CTS)',
          nameEn: 'Commercial & Multipurpose Basin',
          summary:
            'Frente norte y centro para contenedores, vehículos RoRo, acero en rollo, granel mineral y agrícola con espuela ferroviaria.',
          summaryEn:
            'North/central basin handling containers, RoRo vehicles, steel coils, mineral and agricultural bulk with rail spurs.',
          channelDepthM: 14.0,
          operationalDraftM: 12.19,
          turningBasinM: 480,
          daylightOnly: false,
          tugRequirement: '2 remolcadores (3 para esloras > 240 m o ráfagas > 20 kt)',
          pilotRequirement: 'Practicaje obligatorio 24/7 coordinado por CCTM Altamira',
        },
        {
          key: 'petro',
          name: 'Dársena Petroquímica, Hidrocarburos y GNL (Vopak · TEPEAL · TLA)',
          nameEn: 'Petrochemical, Liquids & LNG Basin',
          summary:
            'Terminales especializadas en químicos líquidos, paraxileno, estireno, gas licuado y Terminal de Regasificación de GNL.',
          summaryEn:
            'Specialized terminals for liquid chemicals, paraxylene, styrene, LPG and LNG regasification.',
          channelDepthM: 14.5,
          operationalDraftM: 12.5,
          turningBasinM: 600,
          daylightOnly: false,
          tugRequirement: '3 remolcadores azimutales de escolta en maniobras de GNL y buques tanque',
          pilotRequirement: 'Ventana diurna obligatoria para metaneros > 260 m',
        },
      ],
      terminals: [
        {
          idSuffix: 'atp',
          areaKey: 'comercial',
          name: 'Altamira Terminal Portuaria (ATP)',
          operator: 'ATP / Grupo Mexgal',
          shortDesc:
            'Terminal especializada en contenedores, carga proyecto, rollos de acero y carga general con grúas pórtico Post-Panamax.',
          shortDescEn:
            'Container, project cargo, steel coil and general cargo terminal equipped with Post-Panamax gantry cranes.',
          coordinates: "22°29'34\"N · 97°52'10\"W",
          mapX: 30,
          mapY: 36,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores', 'Carga Proyecto'],
          storageSummary: {
            coveredSqm: 14500,
            openYardSqm: 85000,
            containerYardSqm: 310000,
            warehousesBreakdown:
              'Patio de contenedores FCL/Reefer (310,000 m²), almacén fiscalizado cubierto (14,500 m²) y patios de acero laminado y carga proyecto (85,000 m²) con 4 vías ferroviarias internas.',
            warehousesBreakdownEn:
              '310,000 m² FCL/Reefer container yard, 14,500 m² bonded covered warehouse & 85,000 m² heavy steel/project cargo laydown with 4 internal rail spurs.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal Líder de Contenedores, Acero Laminado y Carga Proyecto del Golfo Norte',
            positioningHeadlineEn:
              'Northern Gulf’s Flagship Container, Steel Coil & Heavy Project Cargo Terminal',
            address: 'Puerto Industrial de Altamira, Blvd. de los Ríos Km 4.2, Altamira, Tamaulipas',
            customsRegime: 'Recinto Fiscalizado Autorizado · Aduana de Altamira (Despacho Electrónico VUCEM e Intermodal)',
            customsRegimeEn: 'Authorized Bonded Terminal · Altamira Customs (VUCEM Electronic & In-Bond Rail Clearance)',
            commercialServices: [
              'Estiba/desestiba de contenedores FCL/LCL, carga refrigerada (+700 tomas reefer) y mercancías peligrosas IMO',
              'Descarga y consolidación de bobinas de acero automotriz, placas y perfiles estructurales bajo almacén cubierto',
              'Izaje de piezas sobredimensionadas y maquinaria industrial para corredores Monterrey, Saltillo y Bajío',
              'Despacho ferroviario unitario KCSM/CPKC y Ferromex directo dentro de terminal',
            ],
            commercialServicesEn: [
              'Container stevedoring (FCL/LCL, 700+ reefer plugs, IMO dangerous cargo)',
              'Automotive steel coil, plate & structural steel handling with covered humidity-protected sheds',
              'Heavy-lift project cargo rigging bound for Monterrey, Saltillo & Bajío manufacturing corridors',
              'On-dock unit train loading via CPKC (KCSM) and Ferromex intermodal spurs',
            ],
            infrastructureHighlights: [
              '600 m de muelle lineal continuo a 12.19 m (40 ft) de calado operativo',
              '4 grúas pórtico Ship-to-Shore Post-Panamax + 2 grúas móviles MHC de alto tonelaje',
              'Patio intermodal de 4 espuelas ferroviarias y básculas certificadas de 100 ton',
            ],
            infrastructureHighlightsEn: [
              '600 m continuous quay rated at 12.19 m (40 ft) official draft',
              '4 Post-Panamax Ship-to-Shore gantries + 2 heavy-lift mobile harbor cranes (MHC)',
              '4-track on-dock intermodal railyard & certified 100 MT weighbridges',
            ],
            vesselTypesServed: [
              'Portacontenedores Panamax y Post-Panamax',
              'Buques Siderúrgicos / Carga General y Heavy-Lift Multipropósito',
            ],
            vesselTypesServedEn: [
              'Panamax & Post-Panamax Container Vessels',
              'Steel Breakbulk & Heavy-Lift Multipurpose Ships',
            ],
            connectivity:
              'Acceso ferroviario doble CPKC y Ferromex directo al hub industrial Monterrey–Saltillo–San Luis Potosí y corredor carretero Tampico–Mante / México 80.',
            connectivityEn:
              'Dual CPKC & Ferromex rail access directly to Monterrey–Saltillo–SLP manufacturing hubs plus Federal Hwy 80.',
            operationalAdvantages: [
              'Reserva territorial industrial de +9,500 ha adyacente al recinto para parques industriales y centros de distribución.',
              'Alta productividad STS (28–35 mov/h) sin congestión urbana en accesos carreteros.',
            ],
            operationalAdvantagesEn: [
              'Adjoins 9,500+ ha industrial park reserve with zero urban traffic bottlenecks.',
              'High 28–35 moves/hr STS crane productivity and seamless rail dispatch.',
            ],
            certifications: ['ISPS / PBIP', 'C-TPAT / OEA', 'ISO 9001 / 14001'],
          },
          procedures: ['Envío EDI BAPLIE 24 h previo; VUMCE 48 h pre-ETA.'],
          restrictionsSummary: 'Calado op. 12.19 m (40 ft); muelle lineal de 600 m.',
          berths: [
            {
              idSuffix: 'atp-1',
              name: 'Posiciones 1 y 2 ATP',
              lengthM: 600,
              maxLoaM: 294,
              maxBeamM: 32.3,
              berthDepthM: 13.5,
              maxDraftM: 12.19,
              products: ['Contenedores', 'Acero laminado', 'Carga proyecto', 'Maquinaria pesada'],
              cargoGroups: ['Carga General y Contenedores', 'Carga Proyecto'],
              equipment: ['4 Grúas Pórtico Ship-to-Shore', '2 Grúas Móviles MHC', 'Patio intermodal'],
              connections: ['Ferrocarril KCSM / Ferromex', 'Carretera Tampico–Mante'],
              loadingRate: '28 – 35 mov/hora por grúa',
              notes: 'Posiciones continuas con conexión directa a patio ferroviario.',
            },
          ],
        },
        {
          idSuffix: 'ipm',
          areaKey: 'comercial',
          name: 'Infraestructura Portuaria Mexicana (IPM) & CTS / Steelterminal',
          operator: 'IPM Altamira / Cooper T. Smith / Steelterminal',
          shortDesc:
            'Terminales de usos múltiples para contenedores, automóviles RoRo, minerales a granel, clinker, coque y acero.',
          shortDescEn:
            'Multipurpose terminals handling containers, RoRo vehicles, dry bulk minerals, clinker, petcoke and steel.',
          coordinates: "22°29'05\"N · 97°51'48\"W",
          mapX: 48,
          mapY: 45,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores', 'Granel Mineral', 'Granel Agrícola'],
          storageSummary: {
            coveredSqm: 24000,
            openYardSqm: 195000,
            containerYardSqm: 140000,
            warehousesBreakdown:
              'Patios automotrices RoRo, bodegas especializadas de rollos de acero (Steelterminal), silos/tolvas ecológicas CTS para coque y minerales, y patio de contenedores IPM.',
            warehousesBreakdownEn:
              'RoRo automotive compounds, Steelterminal covered steel-coil warehouses, CTS enclosed mineral/petcoke bulk hoppers & IPM container yard.',
          },
          commercialProfile: {
            positioningHeadline:
              'Complejo Multipropósito de Acero, RoRo Automotriz y Granel Mineral del Noreste',
            positioningHeadlineEn:
              'Northeastern Mexico’s Multipurpose Automotive RoRo, Steel & Mineral Bulk Complex',
            address: 'Dársena Sur, Puerto Industrial de Altamira, Tamaulipas',
            customsRegime: 'Recintos Fiscalizados Especializados (IPM · CTS · Steelterminal) · Aduana de Altamira',
            customsRegimeEn: 'Specialized Bonded Terminals (IPM · CTS · Steelterminal) · Altamira Customs',
            commercialServices: [
              'Operación RoRo automotriz de importación/exportación hacia plantas del Bajío y Noreste',
              'Descarga mecanizada con tolvas ecológicas de coque de petróleo, mineral de hierro, fluorita, clinker y grano',
              'Almacenaje climatizado y manejo magnético de bobinas de acero automotriz en Steelterminal',
              'Consolidación ferroviaria y despacho intermodal de contenedores en IPM',
            ],
            commercialServicesEn: [
              'RoRo automotive vehicle import/export supporting Bajío & Northern OEM assembly plants',
              'Enclosed ecological hopper stevedoring for petcoke, iron ore, fluorspar, clinker & grain',
              'Climate-controlled automotive steel coil storage & crane handling at Steelterminal',
              'Container & unit-train rail dispatch via IPM intermodal tracks',
            ],
            infrastructureHighlights: [
              '750 m continuos de atraque a 11.89–12.19 m de calado operativo',
              'Grúas móviles MHC de 100 ton, tolvas ecológicas antipolvo y doble espuela ferroviaria',
              'Básculas electrónicas de 100 ton y patios pavimentados para vehículos RoRo',
            ],
            infrastructureHighlightsEn: [
              '750 m continuous quay rated at 11.89–12.19 m operational draft',
              '100T MHC cranes, dust-controlled ecological bulk hoppers & dual rail spurs',
              '100T electronic weighbridges & dedicated paved automotive staging yards',
            ],
            vesselTypesServed: [
              'Buques Pure Car Carriers (PCTC / RoRo)',
              'Graneleros Handysize / Supramax y Buques Siderúrgicos / Contenedores',
            ],
            vesselTypesServedEn: [
              'Pure Car & Truck Carriers (PCTC / RoRo)',
              'Handysize / Supramax Bulk Carriers & Steel/Container Ships',
            ],
            connectivity:
              'Doble espuela ferroviaria conectada a CPKC/Ferromex hacia Monterrey, Saltillo y San Luis Potosí; enlace directo a Carretera Tampico–Mante.',
            connectivityEn:
              'Dual rail spur linking CPKC/Ferromex to Monterrey, Saltillo & SLP industrial corridors plus Federal Hwy 80.',
            operationalAdvantages: [
              'Integración en un mismo frente de carga seca, siderúrgica automotriz y exportación RoRo.',
              'Altos rendimientos en descarga de coque/mineral (5,000–8,000 MT/día) y 250 autos/hora.',
            ],
            operationalAdvantagesEn: [
              'Co-located automotive steel logistics, RoRo handling & high-rate dry bulk stevedoring.',
              'Up to 8,000 MT/day dry bulk throughput and 250 units/hr RoRo productivity.',
            ],
            certifications: ['ISPS / PBIP', 'ISO 9001 / 14001', 'Industria Limpia PROFEPA'],
          },
          procedures: ['Inspección previa de bodegas y plan de estiba 48 h antes.'],
          restrictionsSummary: 'Calado op. 11.89 – 12.19 m según posición asignada.',
          berths: [
            {
              idSuffix: 'ipm-1',
              name: 'Muelles IPM / CTS / Steelterminal',
              lengthM: 750,
              maxLoaM: 260,
              maxBeamM: 32.3,
              berthDepthM: 13.0,
              maxDraftM: 11.89,
              products: ['Automóviles RoRo', 'Coque de petróleo', 'Mineral de hierro', 'Grano', 'Acero'],
              cargoGroups: ['Carga General y Contenedores', 'Granel Mineral', 'Granel Agrícola'],
              equipment: ['Grúas MHC 100 ton', 'Tolvas ecológicas', 'Patios automotrices'],
              connections: ['Doble espuela ferroviaria', 'Básculas de 100 ton'],
              loadingRate: '5,000 – 8,000 MT/día granel · 250 u/h RoRo',
              notes: 'Incluye frente especializado de Steelterminal y Cooper T. Smith para graneles.',
            },
          ],
        },
        {
          idSuffix: 'vopak-tepeal',
          areaKey: 'petro',
          name: 'Terminales Petroquímicas (Vopak · TEPEAL · OTM / TMA)',
          operator: 'Vopak México / TEPEAL / OTM Mexplus',
          shortDesc:
            'Cluster de muelles de fluidos químicos y petroquímicos conectados por ducto al corredor industrial Altamira.',
          shortDescEn:
            'Chemical and petrochemical jetty cluster piped directly into the Altamira industrial corridor.',
          coordinates: "22°28'42\"N · 97°52'35\"W",
          mapX: 66,
          mapY: 38,
          imageType: 'pajaritos',
          cargoGroups: ['Petroquímica y Líquidos', 'Hidrocarburos y Gas'],
          storageSummary: {
            coveredSqm: 2500,
            openYardSqm: 15000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Parques de tanques químicos en acero inoxidable y carbón de Vopak, TEPEAL y OTM Mexplus con esferas presurizadas de VCM/butadieno y líneas calefaccionadas/nitrógeno.',
            warehousesBreakdownEn:
              'Vopak, TEPEAL & OTM stainless/carbon chemical tank farms plus pressurized VCM spheres and nitrogen-blanketed pipelines.',
          },
          commercialProfile: {
            positioningHeadline:
              'Cluster Petroquímico de Fluidos conectado por Ducto al Principal Corredor Químico del Noreste',
            positioningHeadlineEn:
              'Pipeline-Integrated Chemical & Clean Fuels Hub Serving the Altamira Petrochemical Corridor',
            address: 'Zona Petroquímica Norte, Puerto Industrial de Altamira, Tamaulipas',
            customsRegime: 'Terminales Marítimas Especializadas de Líquidos · Recinto Fiscalizado / IMMEX',
            customsRegimeEn: 'Specialized Bonded Liquid & Chemical Terminals · Altamira Customs / IMMEX',
            commercialServices: [
              'Almacenamiento y trasiego en tanques especializados de paraxileno, estireno, ácido acético, VCM, glicoles y sosa cáustica',
              'Importación de destilados limpios (gasolina, diésel UBA, turbosina) en OTM Mexplus',
              'Transferencia directa por ducto hacia complejos industriales Indorama, Alpek, Sabic, BASF y Mexichem/Orbia',
              'Servicios de calentamiento de producto, inertización con nitrógeno y despacho en autotanque y carrotanque',
            ],
            commercialServicesEn: [
              'Specialized chemical storage & ship-to-tank transfers for paraxylene, styrene, acetic acid, VCM, glycols & caustic soda',
              'Clean refined fuels import (gasoline, ULSD, jet A-1) via OTM Mexplus rail/truck racks',
              'Direct pipeline delivery into Indorama, Alpek, Sabic, BASF & Orbia industrial plants',
              'Product heating, nitrogen blanketing, vapor recovery & railcar/tank-truck loading racks',
            ],
            infrastructureHighlights: [
              '420 m de frente en muelles líquidos a 11.89 m de calado operativo',
              'Brazos articulados Chiksan en acero inoxidable, líneas dedicadas sin contaminación cruzada y sistemas ESD',
              'Almacenamiento presurizado y atmosférico conectado a poliductos industriales',
            ],
            infrastructureHighlightsEn: [
              '420 m liquid jetty spread rated at 11.89 m operational draft',
              'Stainless Chiksan marine arms, dedicated segregated lines & ESD trips',
              'Atmospheric & pressurized tank farms directly piped into chemical plants',
            ],
            vesselTypesServed: [
              'Buques Quimiqueros Parcel Tankers IMO I / II / III',
              'Buques Gaseros Petroquímicos (VCM / Butadieno) y Producto MR1/MR2',
            ],
            vesselTypesServedEn: [
              'IMO Type I / II / III Parcel Chemical Tankers',
              'Petrochemical Gas Carriers (VCM/Butadiene) & MR1/MR2 Product Tankers',
            ],
            connectivity:
              'Red de ductos de proceso hacia el Corredor Petroquímico Altamira–Tampico y espuelas para carrotanques químicos KCSM/Ferromex.',
            connectivityEn:
              'Dedicated chemical pipeline corridor into Altamira plants plus KCSM/Ferromex tank-car rail sidings.',
            operationalAdvantages: [
              'Cero fletes terrestres intermedios para materias primas petroquímicas gracias a ductos directos a planta.',
              'Altos estándares CDI / OCIMF SIRE e ISGOTT con líneas totalmente segregadas.',
            ],
            operationalAdvantagesEn: [
              'Direct pier-to-plant pipelines eliminate intermediate chemical trucking.',
              'Segregated stainless piping meeting strict CDI / OCIMF SIRE & ISGOTT standards.',
            ],
            certifications: ['CDI / SIRE', 'ISGOTT', 'ISPS / PBIP', 'ISO 14001 / 45001'],
          },
          procedures: ['ISGOTT Ship/Shore Checklist y vetting CDI/SIRE obligatorio.'],
          restrictionsSummary: 'Máquinas en standby 24/7; prohibido bunkering simultáneo.',
          berths: [
            {
              idSuffix: 'vpk-1',
              name: 'Muelles Vopak / TEPEAL / OTM (Posiciones Líquidas)',
              lengthM: 420,
              maxLoaM: 205,
              maxBeamM: 32.2,
              berthDepthM: 13.0,
              maxDraftM: 11.89,
              products: ['Paraxileno', 'Estireno', 'Ácido acético', 'Monómero de vinilo', 'Diésel / Refinados'],
              cargoGroups: ['Petroquímica y Líquidos', 'Hidrocarburos y Gas'],
              equipment: ['Brazos Chiksan acero inoxidable', 'Sistema ESD', 'Líneas de nitrógeno'],
              connections: ['Ductos a plantas Indorama, Sabic, Alpek y Basf'],
              loadingRate: '500 – 1,100 m³/h',
              notes: 'Incluye atención a terminales Negromex / Styrolution y OTM.',
            },
          ],
        },
        {
          idSuffix: 'tla-lng',
          areaKey: 'petro',
          name: 'Terminal de GNL Altamira (TLA) & J. Ray McDermott Offshore',
          operator: 'Terminal de LNG de Altamira / McDermott',
          shortDesc:
            'Muelle dedicado para buques metaneros (GNL) e instalaciones adyacentes de fabricación offshore.',
          shortDescEn:
            'Dedicated LNG carrier berth plus adjacent heavy offshore jacket fabrication quay.',
          coordinates: "22°28'18\"N · 97°50'42\"W",
          mapX: 70,
          mapY: 66,
          imageType: 'channel',
          cargoGroups: ['Hidrocarburos y Gas', 'Carga Proyecto'],
          storageSummary: {
            coveredSqm: 18000,
            openYardSqm: 260000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Tanques criogénicos TLA (300,000 m³ de GNL / regasificación 500–700 MMPCD) + patio de fabricación pesada J. Ray McDermott (26 ha con naves cubiertas y muelle heavy-lift).',
            warehousesBreakdownEn:
              'TLA cryogenic LNG tanks (300,000 m³) + 26 ha J. Ray McDermott heavy offshore jacket fabrication yard & load-out quay.',
          },
          commercialProfile: {
            positioningHeadline:
              'Hub Criogénico de GNL del Golfo de México y Patio de Fabricación Pesada Costa Afuera',
            positioningHeadlineEn:
              'Gulf of Mexico Cryogenic LNG Regasification Terminal & Heavy Offshore Structure Fabrication Yard',
            address: 'Zona Energética y Offshore, Puerto de Altamira, Tamaulipas',
            customsRegime: 'Recinto Portuario Energético / Régimen Especial GNL y Fabricación Offshore (IMMEX)',
            customsRegimeEn: 'Dedicated LNG Energy Precinct & Offshore Fabrication IMMEX Customs Facility',
            commercialServices: [
              'Recepción, almacenamiento criogénico (-162 °C) y regasificación de Gas Natural Licuado hasta 10,000 m³/h en TLA',
              'Inyección directa de gas natural a red troncal SISTRANGAS / CFE para generación eléctrica e industria del noreste',
              'Fabricación, ensamble y embarque (load-out) de jackets, cubiertas de plataformas y módulos offshore en patio McDermott',
            ],
            commercialServicesEn: [
              'Cryogenic LNG (-162 °C) carrier discharge up to 10,000 m³/hr, storage & pipeline send-out at TLA',
              'Direct natural gas supply into SISTRANGAS / CFE national trunk network',
              'Heavy offshore platform jacket, topside module fabrication & skid/barge load-out at McDermott yard',
            ],
            infrastructureHighlights: [
              'Muelle profundo a -14.5 m (12.50 m calado op.) apto para metaneros Q-Flex / convencionales hasta 295 m LOA',
              '4 brazos criogénicos de 16", 2 tanques de almacenamiento total 300,000 m³ y monitores de espuma/cortina de agua',
              'Muelle heavy-lift reforzado para barcazas lanzadoras (launch barges) de estructuras de gran tonelaje',
            ],
            infrastructureHighlightsEn: [
              '-14.5 m deep-water berth (12.50 m op. draft) accommodating LNG carriers up to 295 m LOA',
              '4 x 16" cryogenic arms, 300,000 m³ LNG tank farm & deluge fire protection',
              'Reinforced heavy-lift load-out quay for massive offshore launch barges',
            ],
            vesselTypesServed: [
              'Buques Metaneros Criogénicos (LNG Carriers hasta 155,000–215,000 m³)',
              'Barcazas Oceánicas Heavy-Lift, Launch Barges y Buques de Construcción Submarina',
            ],
            vesselTypesServedEn: [
              'Cryogenic LNG Carriers (155,000–215,000 m³)',
              'Heavy-Lift Launch Barges & Offshore Construction Vessels',
            ],
            connectivity:
              'Conexión directa al Sistema Nacional de Gasoductos (SISTRANGAS / CFE) y acceso marítimo inmediato al Golfo de México.',
            connectivityEn:
              'Direct interconnection to SISTRANGAS / CFE gas transmission grid and unrestricted Gulf of Mexico offshore access.',
            operationalAdvantages: [
              'Infraestructura criogénica SIGTTO con tasa de descarga hasta 10,000 m³/h y alta disponibilidad de gasoducto.',
              'Único patio en Golfo norte con capacidad de load-out para súper estructuras costa afuera.',
            ],
            operationalAdvantagesEn: [
              'SIGTTO-compliant 10,000 m³/hr LNG terminal with direct national grid tie-in.',
              'Major Northern Gulf fabrication yard built for mega offshore topside & jacket load-outs.',
            ],
            certifications: ['SIGTTO / IGC', 'ISPS / PBIP', 'ASME / AWS (Fabricación Offshore)'],
          },
          procedures: ['Escolta obligatoria de 3 remolcadores; zona de exclusión marítima de 500 m.'],
          restrictionsSummary: 'Atraque diurno exclusivo para buques GNL.',
          berths: [
            {
              idSuffix: 'tla-1',
              name: 'Muelle GNL TLA / Muelle Pesado McDermott',
              lengthM: 380,
              maxLoaM: 295,
              maxBeamM: 46.0,
              berthDepthM: 14.5,
              maxDraftM: 12.5,
              products: ['Gas Natural Licuado (GNL)', 'Módulos y estructuras offshore'],
              cargoGroups: ['Hidrocarburos y Gas', 'Carga Proyecto'],
              equipment: ['4 Brazos criogénicos 16"', 'Monitores de espuma y cortina de agua'],
              connections: ['Gasoducto SISTRANGAS / CFE', 'Patio heavy-lift offshore'],
              loadingRate: 'Hasta 10,000 m³/h (descarga GNL)',
              notes: 'Estándar SIGTTO completo.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'draft',
          areaKey: 'comercial',
          category: 'Física',
          title: 'Calado Oficial Dársena Comercial vs. Canal',
          titleEn: 'Commercial Basin Draft vs. Channel Depth',
          detail:
            'Canal de acceso 14.0 m de profundidad; calado operativo autorizado de 12.19 m (40 ft) en terminales comerciales y 12.50 m en dársena GNL.',
          detailEn:
            'Access channel 14.0 m depth; authorized operational draft 12.19 m (40 ft) at commercial berths and 12.50 m at LNG berth.',
          limitValue: '12.19 m (40 ft)',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Altamira',
        },
        {
          idSuffix: 'nortes',
          category: 'Operativa',
          title: 'Cierre Preventivo por Frentes Fríos ("Nortes")',
          titleEn: 'Cold Front ("Nortes") Preventive Closure',
          detail:
            'Vientos del N/NNW > 25–30 kt suspenden entrada/salida en canal de escolleras y maniobras de grúas pórtico.',
          detailEn:
            'N/NNW winds > 25–30 kt suspend breakwater transit and gantry crane operations.',
          limitValue: 'Cierre > 25 kt',
          verificationStatus: 'verified',
          source: 'Capitanía de Puerto Altamira',
        },
        {
          idSuffix: 'tugs',
          areaKey: 'petro',
          category: 'Practicaje y Remolque',
          title: 'Escolta de Remolcadores para Buques Tanque y GNL',
          titleEn: 'Tugboat Escort for Tankers & LNG Carriers',
          detail:
            'Buques metaneros y quimiqueros > 180 m requieren 2 a 3 remolcadores azimutales con control de escolta desde la boya de recalada.',
          detailEn:
            'LNG carriers and chemical tankers > 180 m require 2–3 azimuth escort tugs from sea buoy.',
          limitValue: '2 – 3 Remolcadores',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Altamira',
        },
      ],
      sampleVessel: 'MT Bow Pioneer',
      sampleImo: '9712456',
      sampleBerth: 'Muelles Vopak / TEPEAL',
      sampleCargo: 'Paraxileno · 14,000 MT',
      sampleStatus: 'BERTHED',
    },

    // 2. TAMPICO
    {
      id: 'mxtam',
      shortCode: 'TAM',
      name: 'Puerto de Tampico',
      unLocode: 'MXTAM',
      region: 'GOLFO DE MÉXICO',
      state: 'Tamaulipas · Río Pánuco',
      coordinates: "22°13'06\"N · 97°51'24\"W",
      vhfChannel: 'CH 16 / CH 14 (Capitanía Tampico)',
      authority: 'ASIPONA Tampico · Capitanía de Puerto',
      lineupSourceUrl: 'https://puertodetampico.com.mx/transparencia-proactiva-o-focalizada/',
      lineupConnector: 'DOCUMENT_LINK',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Tampico: Tránsito fluvial por el río Pánuco; restricción diurna de ciaboga para buques > 200 m LOA en Muelle Fiscal y Terminal Madero; velocidad máxima 6 nudos al pasar muelles atracados; monitoreo obligatorio de crecidas del río Pánuco.',
      operatingRulesUrl: 'https://puertodetampico.com.mx/reglas-de-operacion/',
      headlineEs: 'Tampico. 11 posiciones públicas y Terminal Marítima Madero.',
      headlineEn: 'Tampico. 11 public berths & Ciudad Madero hydrocarbon hub.',
      overviewEs:
        'Puerto fluvial sobre la margen del río Pánuco con 11 posiciones públicas en 2,149 m de frente de atraque (incluyendo CICE y Tampico Terminal Marítima T11) más la Terminal Marítima de PEMEX Ciudad Madero y terminales siderúrgicas privadas.',
      overviewEn:
        'River port on the Pánuco River with 11 public berths across 2,149 m of quay (including CICE and T11) plus PEMEX Ciudad Madero oil terminal and private steel docks.',
      heroImageType: 'recintoSur',
      channels: [
        {
          id: 'ch-tam-panuco',
          name: 'Canal de Navegación Escolleras – Muelle Fiscal (Río Pánuco)',
          lengthNm: 5.4,
          widthM: 100,
          channelDepthM: 10.8,
          operationalDraftM: 9.75,
          squatAllowanceNote:
            'Calado oficial entre 9.20 m y 9.75 m (30–32 ft) en agua dulce/salobre; verificar nivel del río Pánuco en temporada de lluvias.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-tam-1',
          name: 'Fondeadero Oficial Tampico (SE de Escolleras)',
          purpose: 'Espera de marea, práctico y buques de carga/petroleros',
          coordinates: "22°13.5'N · 097°43.5'W (~3.5 MN al SE de escolleras)",
          depthM: '18.0 – 22.0 m (arena y concha)',
          maxVesselOrNotes:
            'Fondo de arena y concha; fondeo prohibido en zona de tuberías submarinas al norte del eje de escolleras.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'fiscal',
          name: 'Recinto Fiscal ASIPONA (Posiciones 1 – 11 · 2,149 m)',
          nameEn: 'ASIPONA Fiscal Quays (Berths 1 – 11)',
          summary:
            '11 posiciones de atraque continuas con más de 60,000 m² de bodegas cubiertas, operadas por ASIPONA, CICE y T11.',
          summaryEn:
            '11 continuous berths with over 60,000 m² of covered sheds operated by ASIPONA, CICE and T11.',
          channelDepthM: 10.8,
          operationalDraftM: 9.45,
          turningBasinM: 310,
          daylightOnly: false,
          tugRequirement: '2 remolcadores obligatorios en ciaboga fluvial',
          pilotRequirement: 'Practicaje obligatorio desde boya de recalada hasta posición asignada',
        },
        {
          key: 'madero',
          name: 'Terminal Marítima PEMEX Ciudad Madero & Terminales Privadas',
          nameEn: 'PEMEX Madero Oil Terminal & Private Terminals',
          summary:
            'Muelles petroleros y petroquímicos de Refinería Madero en la desembocadura más muelles privados de acero y minerales.',
          summaryEn:
            'PEMEX Madero refinery oil jetties near river mouth plus private steel and mineral berths.',
          channelDepthM: 11.0,
          operationalDraftM: 9.75,
          turningBasinM: 330,
          daylightOnly: true,
          tugRequirement: '2 a 3 remolcadores de escolta para buques tanque',
          pilotRequirement: 'Ciaboga diurna obligatoria para esloras > 200 m en Madero',
        },
      ],
      terminals: [
        {
          idSuffix: 'fiscal-1-10',
          areaKey: 'fiscal',
          name: 'Muelles Públicos 1 – 10 & Terminal CICE Tampico',
          operator: 'ASIPONA Tampico / Grupo CICE',
          shortDesc:
            'Diez posiciones públicas de carga general, rollos de acero, tubería petrolera, minerales, madera y carga proyecto.',
          shortDescEn:
            'Ten public berths serving steel coils, oilfield pipe, dry bulk minerals, timber and project cargo.',
          coordinates: "22°12'54\"N · 97°51'30\"W",
          mapX: 35,
          mapY: 46,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores', 'Granel Mineral', 'Carga Proyecto'],
          storageSummary: {
            coveredSqm: 60000,
            openYardSqm: 125000,
            containerYardSqm: 38000,
            warehousesBreakdown:
              'Más de 60,000 m² de bodegas fiscales cubiertas a pie de muelle en las Posiciones 1–10 + 125,000 m² de patios pavimentados y espuela ferroviaria directa.',
            warehousesBreakdownEn:
              'Over 60,000 m² dockside bonded warehouses across Berths 1–10 + 125,000 m² paved laydown yards with direct on-dock rail.',
          },
          commercialProfile: {
            positioningHeadline:
              'Recinto Público Fluvial con 10 Posiciones y Red Global hacia Más de 100 Países',
            positioningHeadlineEn:
              '10-Berth Pánuco River Fiscal Hub Connecting 100+ Countries via Steel, Pipe & Project Logistics',
            address: 'Recinto Fiscal Portuario s/n, Zona Centro, Tampico, Tamaulipas',
            customsRegime: 'Recinto Fiscal Portuario ASIPONA / Cesionarios CICE · Aduana de Tampico',
            customsRegimeEn: 'ASIPONA / CICE Fiscal Port Enclosure · Tampico Customs',
            commercialServices: [
              'Carga y descarga de acero laminado, tubería petrolera OCTG, madera, concentrados minerales, coque, azúcar y fertilizantes',
              'Almacenaje bajo techo en +60,000 m² de bodegas fiscales a primera línea de muelle',
              'Manejo de piezas industriales sobredimensionadas y contenedores FCL con equipo de alto tonelaje',
              'Consolidación directa en vagón ferroviario sobre vía paralela a muelles 1–10',
            ],
            commercialServicesEn: [
              'Stevedoring of rolled steel, OCTG oilfield pipe, timber, mineral concentrates, petcoke, sugar & fertilizers',
              'First-line covered bonded warehousing across 60,000+ m² directly behind berths 1–10',
              'Heavy industrial project cargo lifts & container handling via high-capacity cranes/forklifts',
              'Direct ship-to-railcar loading along quay-side railway tracks',
            ],
            infrastructureHighlights: [
              '1,949 m continuos de muelle entre las Posiciones 1 y 10 (de 2,149 m totales con T11)',
              '60,000+ m² de almacenes cubiertos + patios pavimentados para tubería y acero',
              'Espuelas ferroviarias directas a muelle y enlaces a más de 100 países',
            ],
            infrastructureHighlightsEn: [
              '1,949 m of continuous quay across Berths 1–10 (2,149 m total including Berth 11)',
              '60,000+ m² covered transit sheds + heavy steel/pipe yards',
              'Direct dockside rail sidings & global breakbulk trade links to 100+ nations',
            ],
            vesselTypesServed: [
              'Buques de Carga General / Multipropósito / Heavy-Lift',
              'Graneleros Handysize y Handy-Max',
            ],
            vesselTypesServedEn: [
              'General Cargo / Breakbulk / Heavy-Lift Vessels',
              'Handysize & Handymax Dry Bulk Carriers',
            ],
            connectivity:
              'Vías ferroviarias on-dock conectadas a líneas nacionales hacia San Luis Potosí, Monterrey y Centro; acceso vial urbano controlado por Av. Hidalgo / Carretera 180.',
            connectivityEn:
              'On-dock rail network linking SLP, Monterrey & Central Mexico; highway dispatch via Fed. Hwy 180.',
            operationalAdvantages: [
              'Amplia capacidad de bodegas cubiertas inmediatas al muelle para carga sensible a humedad (acero, azúcar, papel).',
              'Flexibilidad de atraque en 10 posiciones continuas con baja estadía en fondeadero.',
            ],
            operationalAdvantagesEn: [
              'Massive dockside covered warehouse footprint protecting moisture-sensitive steel & bagged cargo.',
              '10 continuous public berths providing high berth availability for breakbulk tonnage.',
            ],
            certifications: ['ISPS / PBIP', 'ISO 9001'],
          },
          procedures: ['Validar peso por eje en muelle antes de maniobras heavy-lift.'],
          restrictionsSummary: 'Calado op. 9.14 – 9.45 m (30–31 ft) en agua dulce.',
          berths: [
            {
              idSuffix: 'tam-1-5',
              name: 'Posiciones 1 – 5 (Tramo Oeste / Bodegas Fiscales)',
              lengthM: 960,
              maxLoaM: 190,
              maxBeamM: 30.0,
              berthDepthM: 10.2,
              maxDraftM: 9.14,
              products: ['Acero estructural', 'Tubería OCTG', 'Carga general', 'Madera', 'Azúcar'],
              cargoGroups: ['Carga General y Contenedores', 'Carga Proyecto'],
              equipment: ['Grúas móviles sobre llantas', 'Montacargas 16–32 ton', '60,000 m² bodegas'],
              connections: ['Espuela ferroviaria directa a muelle', 'Carretera federal 180'],
              loadingRate: '2,500 – 4,000 MT/día',
              notes: 'Posiciones de alta rotación para industria siderúrgica y energética.',
            },
            {
              idSuffix: 'tam-6-10',
              name: 'Posiciones 6 – 10 (Tramo Este / Graneles y CICE)',
              lengthM: 989,
              maxLoaM: 195,
              maxBeamM: 32.2,
              berthDepthM: 10.5,
              maxDraftM: 9.45,
              products: ['Concentrado mineral', 'Coque', 'Cemento', 'Contenedores', 'Carga proyecto'],
              cargoGroups: ['Granel Mineral', 'Carga General y Contenedores'],
              equipment: ['Almejas hidráulicas', 'Grúas móviles portuarias', 'Patios pavimentados'],
              connections: ['Conexión ferroviaria y aduana interior'],
              loadingRate: '3,500 – 5,000 MT/día',
              notes: 'Tramo operado con cesionarios especializados en carga seca y contenedores.',
            },
          ],
        },
        {
          idSuffix: 't11',
          areaKey: 'fiscal',
          name: 'Tampico Terminal Marítima (Posición 11 · T11)',
          operator: 'Tampico Terminal Marítima (T11)',
          shortDesc:
            'Posición 11 dedicada a carga general, acero, contenedores y operaciones offshore en el extremo este del recinto.',
          shortDescEn:
            'Berth 11 dedicated to general cargo, steel, containers and offshore logistics.',
          coordinates: "22°13'08\"N · 97°50'42\"W",
          mapX: 54,
          mapY: 42,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores', 'Carga Proyecto'],
          storageSummary: {
            coveredSqm: 6500,
            openYardSqm: 42000,
            containerYardSqm: 15000,
            warehousesBreakdown:
              'Patio fiscal exclusivo T11 (42,000 m² pavimentados + 6,500 m² bodega techada) en el extremo este del Recinto Fiscal Tampico.',
            warehousesBreakdownEn:
              'Exclusive T11 bonded yard (42,000 m² paved + 6,500 m² covered warehouse) on the eastern flank of Tampico Fiscal Quay.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal Privada Cesionada en Posición 11 para Acero, Carga Proyecto y Logística Offshore',
            positioningHeadlineEn:
              'Dedicated Berth 11 Concessionaire Specializing in Steel, Project Cargo & Offshore Support',
            address: 'Tramo Este Recinto Fiscal, Posición 11, Tampico, Tamaulipas',
            customsRegime: 'Recinto Fiscalizado T11 · Aduana de Tampico',
            customsRegimeEn: 'Bonded Terminal Concession T11 · Tampico Customs',
            commercialServices: [
              'Operación privada exclusiva de placa/rollo de acero, perfiles metálicos, equipos petroleros y contenedores',
              'Almacenaje fiscalizado, trincado de carga proyecto y soporte logístico a embarcaciones offshore',
            ],
            commercialServicesEn: [
              'Dedicated stevedoring for steel plates/coils, structural beams, oilfield gear & containers',
              'Bonded storage, project lashing/securing & offshore supply vessel turnarounds',
            ],
            infrastructureHighlights: [
              '200 m de muelle dedicado a 9.45 m de calado operativo',
              'Grúas portuarias de alto tonelaje y patio fiscal pavimentado independiente',
            ],
            infrastructureHighlightsEn: [
              '200 m exclusive quay at 9.45 m operational draft',
              'Heavy-duty mobile craneage & gated private bonded laydown',
            ],
            vesselTypesServed: ['Buques Siderúrgicos / Carga General', 'OSV y Buques Heavy-Lift'],
            vesselTypesServedEn: ['Steel & Breakbulk Vessels', 'OSV & Project Cargo Ships'],
            connectivity: 'Acceso vial portuario exclusivo en zona este hacia corredor industrial Tampico–Altamira.',
            connectivityEn: 'Direct eastern port gate road access linking Tampico–Altamira industrial corridor.',
            operationalAdvantages: ['Operación integrada con patio fiscal propio libre de interferencia con muelles 1–10.'],
            operationalAdvantagesEn: ['Self-contained bonded yard operation independent of public Berths 1–10.'],
            certifications: ['ISPS / PBIP'],
          },
          procedures: ['Coordinar acceso terrestre y patio aduanal directamente con T11.'],
          restrictionsSummary: 'Longitud 200 m · Calado op. 9.45 m.',
          berths: [
            {
              idSuffix: 'tam-11',
              name: 'Posición 11 (T11)',
              lengthM: 200,
              maxLoaM: 185,
              maxBeamM: 30.0,
              berthDepthM: 10.4,
              maxDraftM: 9.45,
              products: ['Acero en placa/rollo', 'Equipos industriales', 'Contenedores'],
              cargoGroups: ['Carga General y Contenedores', 'Carga Proyecto'],
              equipment: ['Grúa portuaria de alto tonelaje', 'Patio fiscal dedicado'],
              connections: ['Acceso vial exclusivo a zona portuaria'],
              loadingRate: '3,000 – 4,500 MT/día',
              notes: 'Completa las 11 posiciones públicas del Recinto Tampico.',
            },
          ],
        },
        {
          idSuffix: 'pemex-madero',
          areaKey: 'madero',
          name: 'Terminal Marítima PEMEX Ciudad Madero',
          operator: 'PEMEX Logística · Refinería Francisco I. Madero',
          shortDesc:
            'Muelles petroleros cercanos a la boca del Pánuco para crudo, gasolinas, diésel, combustóleo y asfaltos.',
          shortDescEn:
            'Oil jetties near the Pánuco river mouth handling crude, gasoline, diesel, fuel oil and asphalt.',
          coordinates: "22°15'02\"N · 97°48'20\"W",
          mapX: 72,
          mapY: 56,
          imageType: 'pajaritos',
          cargoGroups: ['Hidrocarburos y Gas', 'Petroquímica y Líquidos'],
          storageSummary: {
            coveredSqm: 1800,
            openYardSqm: 40000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Tanques de almacenamiento en Refinería Francisco I. Madero y Terminal Marítima conectada por batería de poliductos y líneas térmicas de asfalto.',
            warehousesBreakdownEn:
              'Refinería Madero & Marine Terminal tank farms served by multi-product pipelines and heated asphalt transfer lines.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal Marítima Petrolera de Refinería Madero en la Desembocadura del Pánuco',
            positioningHeadlineEn:
              'PEMEX Refinería Madero Marine Hydrocarbon & Asphalt Distribution Terminal',
            address: 'Margen Izquierda Río Pánuco Km 1.5, Ciudad Madero, Tamaulipas',
            customsRegime: 'Terminal Estratégica PEMEX Logística · Aduana de Tampico',
            customsRegimeEn: 'PEMEX Logística Strategic Hydrocarbon Terminal · Tampico Customs',
            commercialServices: [
              'Carga y descarga de gasolinas, diésel UBA, combustóleo, crudo y asfaltos térmicos',
              'Abastecimiento de cabotaje en el Golfo de México e importación/exportación de refinados',
            ],
            commercialServicesEn: [
              'Pipeline marine loading/unloading of gasoline, ULSD, fuel oil, crude & heated liquid asphalt',
              'Gulf of Mexico coastal cabotage & refined products import/export',
            ],
            infrastructureHighlights: [
              '5 posiciones petroleras (480 m totales) a 9.75 m (32 ft) de calado operativo',
              'Brazos de carga de 8" y 12", red contraincendio dedicada y poliductos directos a refinería',
            ],
            infrastructureHighlightsEn: [
              '5 petroleum berths (480 m total) at 9.75 m (32 ft) maximum operational draft',
              '8" & 12" marine loading arms, dedicated fire-fighting loop & refinery pipelines',
            ],
            vesselTypesServed: ['Buques Tanque Producto MR1 / Panamax (hasta 215 m LOA)', 'Asfalteros térmicos'],
            vesselTypesServedEn: ['MR1 / Panamax Product Tankers (up to 215 m LOA)', 'Heated Bitumen Tankers'],
            connectivity: 'Poliductos directos con Refinería Francisco I. Madero y red de abastecimiento del Noreste.',
            connectivityEn: 'Direct refinery pipelines feeding PEMEX Madero and Northeastern Mexico fuel network.',
            operationalAdvantages: ['Ubicación inmediata a la boca del río Pánuco reduciendo tiempo de tránsito fluvial.'],
            operationalAdvantagesEn: ['Close proximity to Pánuco mouth minimizing upriver transit time.'],
            certifications: ['OCIMF / SIRE', 'ISGOTT', 'ISPS / PBIP'],
          },
          procedures: ['Vetting OCIMF/SIRE y guardia de remolcador contra incendio permanente.'],
          restrictionsSummary: 'Calado máx. 9.75 m (32 ft); restricción diurna > 200 m LOA.',
          berths: [
            {
              idSuffix: 'mad-1-5',
              name: 'Muelles Petroleros Madero 1 – 5',
              lengthM: 480,
              maxLoaM: 215,
              maxBeamM: 32.3,
              berthDepthM: 10.8,
              maxDraftM: 9.75,
              products: ['Gasolina', 'Diésel UBA', 'Combustóleo', 'Asfalto líquido', 'Crudo'],
              cargoGroups: ['Hidrocarburos y Gas'],
              equipment: ['Brazos marinos 8" y 12"', 'Red fija contra incendio y barreras'],
              connections: ['Poliductos directos a Refinería Madero'],
              loadingRate: '1,200 – 2,400 m³/h',
              notes: 'Atraque prioritario para flota petrolera nacional y cabotaje.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'turn-daylight',
          areaKey: 'madero',
          category: 'Operativa',
          title: 'Restricción Diurna de Ciaboga (LOA > 200 m)',
          titleEn: 'Daylight Turning Basin Restriction (LOA > 200 m)',
          detail:
            'Buques con eslora superior a 200–220 m solo efectúan ciaboga con luz natural debido al ancho efectivo del canal del río Pánuco.',
          detailEn:
            'Vessels > 200–220 m LOA perform turning maneuvers during daylight hours only due to river width.',
          limitValue: 'Diurno > 200 m',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Tampico',
        },
        {
          idSuffix: 'river-draft',
          areaKey: 'fiscal',
          category: 'Física',
          title: 'Calado Fluvial en Agua Dulce / Salobre',
          titleEn: 'Fresh/Brackish River Draft Allowance',
          detail:
            'Considerar densidad del río Pánuco (1.000–1.012 g/cm³) para cálculo de calado estático; máximo 9.45 m en Fiscal y 9.75 m en Madero.',
          detailEn:
            'Account for Pánuco river water density (1.000–1.012 g/cm³); max 9.45 m at Fiscal quays and 9.75 m at Madero.',
          limitValue: '9.45 – 9.75 m',
          verificationStatus: 'verified',
          source: 'Boletín Batimétrico ASIPONA Tampico',
        },
      ],
      sampleVessel: 'MV Panuco Steel',
      sampleImo: '9481203',
      sampleBerth: 'Posiciones 1 – 5 (Tramo Oeste)',
      sampleCargo: 'Acero en rollo · 16,500 MT',
      sampleStatus: 'EXPECTED',
    },

    // 3. TUXPAN
    {
      id: 'mxtux',
      shortCode: 'TUX',
      name: 'Puerto de Tuxpan',
      unLocode: 'MXTUX',
      region: 'GOLFO DE MÉXICO',
      state: 'Veracruz · Golfo de México',
      coordinates: "20°58'12\"N · 97°18'54\"W",
      vhfChannel: 'CH 16 / CH 12 (Control Tráfico Tuxpan)',
      authority: 'ASIPONA Tuxpan · Capitanía de Puerto',
      lineupSourceUrl: 'https://puertotuxpan.com.mx/programacion-de-buques/',
      lineupConnector: 'PDF_INDEX',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Tuxpan: 36 posiciones (3 públicas + 35 privadas/especializadas); velocidad máxima en río 6.0 nudos; escollera Norte 1,400 m y Sur 940 m; zona de maniobras total 9.91 km (146.59 ha); control estricto de 5 monoboyas offshore PEMEX/CFE.',
      operatingRulesUrl: 'https://www.puertotuxpan.com.mx/reglas-de-operacion/',
      headlineEs: 'Tuxpan. 36 posiciones de atraque, TPT y enlace al Valle de México.',
      headlineEn: 'Tuxpan. 36 berthing positions, TPT & gateway to Mexico City.',
      overviewEs:
        'Puerto fluvial y exterior en el norte de Veracruz protegido por escolleras de 1,400 m y 940 m. Opera Tuxpan Port Terminal (SSA México), Terminales Marítimas de Hidrocarburos (Invex/Valero/Monterrá/Olmeca), 5 monoboyas offshore y muelles públicos TUMP.',
      overviewEn:
        'Northern Veracruz river and outer port protected by 1,400 m and 940 m breakwaters. Houses Tuxpan Port Terminal (SSA Mexico), refined fuel import terminals, 5 offshore SPMs and public TUMP berths.',
      heroImageType: 'hero',
      channels: [
        {
          id: 'ch-tux-ext',
          name: 'Canal Exterior (4.0 km + 2.5 km barra)',
          lengthNm: 3.51,
          widthM: 180,
          channelDepthM: 15.0,
          operationalDraftM: 13.1,
          squatAllowanceNote:
            'Calado oficial 13.10 m hacia TPT y terminales exteriores; dársena de ciaboga exterior de 500 m de diámetro.',
          verificationStatus: 'verified',
        },
        {
          id: 'ch-tux-rio',
          name: 'Canal Interior Río Tuxpan (2.49 km)',
          lengthNm: 1.34,
          widthM: 130,
          channelDepthM: 11.2,
          operationalDraftM: 10.05,
          squatAllowanceNote:
            'Calado oficial 10.05 m hasta recinto fiscal y terminales río arriba; dársena interior 420 × 220 m; velocidad máx. 6 kt.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-tux-1',
          name: 'Fondeadero Isla de Lobos / Recalada Tuxpan',
          purpose: 'Espera de buques comerciales, graneleros y portacontenedores',
          coordinates: "20°58.8'N · 097°14.5'W (Abrigo Isla de Lobos / SE boya)",
          depthM: '18.0 – 26.0 m',
          maxVesselOrNotes:
            'Fondeo regulado para evitar zona de arrecifes y tuberías hacia monoboyas PEMEX/CFE.',
          verificationStatus: 'verified',
        },
        {
          id: 'az-tux-2',
          name: 'Polígono de Exclusión y Espera de 5 Monoboyas (PEMEX / CFE)',
          purpose: 'Buques tanque de crudo, combustóleo, diésel y gas LP',
          coordinates: "20°59.5'N · 097°15.2'W (polígono de 5 monoboyas)",
          depthM: '20.0 – 25.0 m',
          maxVesselOrNotes:
            'Prohibido fondear dentro del radio de 1.0 MN de las monoboyas e instalaciones de gas.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'exterior',
          name: 'Puerto Exterior / Canal Profundo (TPT & Hidrocarburos)',
          nameEn: 'Outer Deep-Water Port (TPT & Fuels)',
          summary:
            'Zona de mayor calado (13.10 m) cercana a escolleras para contenedores, automóviles y terminales modernas de refinados.',
          summaryEn:
            'Deep-draft outer zone (13.10 m) near breakwaters serving containers, RoRo and refined fuel import terminals.',
          channelDepthM: 15.0,
          operationalDraftM: 13.1,
          turningBasinM: 500,
          daylightOnly: false,
          tugRequirement: '2 a 3 remolcadores azimutales',
          pilotRequirement: 'Practicaje obligatorio 24/7 en barra y escolleras',
        },
        {
          key: 'rio',
          name: 'Río Tuxpan (3 Posiciones Públicas + Terminales Privadas)',
          nameEn: 'Tuxpan River Basin (Public & Private Berths)',
          summary:
            'Incluye los 3 muelles públicos ASIPONA, terminal de usos múltiples, graneles agrícolas, azufre y terminales de fluidos río arriba.',
          summaryEn:
            'Includes 3 public ASIPONA berths, multipurpose terminal, grain, sulfur and upriver liquid terminals.',
          channelDepthM: 11.2,
          operationalDraftM: 10.05,
          turningBasinM: 420,
          daylightOnly: false,
          tugRequirement: '2 remolcadores; velocidad máx. en río 6.0 nudos',
          pilotRequirement: 'Practicaje obligatorio en todo tránsito fluvial',
        },
      ],
      terminals: [
        {
          idSuffix: 'tpt',
          areaKey: 'exterior',
          name: 'Tuxpan Port Terminal (TPT · SSA México)',
          operator: 'SSA México / Carrix',
          shortDesc:
            'Terminal automatizada de contenedores y automóviles con acceso directo a la autopista México–Tuxpan.',
          shortDescEn:
            'Automated container and RoRo vehicle terminal directly linked to the Mexico City–Tuxpan highway.',
          coordinates: "20°58'06\"N · 97°18'22\"W",
          mapX: 34,
          mapY: 38,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores', 'Carga Proyecto'],
          storageSummary: {
            coveredSqm: 10000,
            openYardSqm: 65000,
            containerYardSqm: 280000,
            warehousesBreakdown:
              'Patio automatizado de contenedores (280,000 m²), almacén fiscalizado TPT, patios automotrices RoRo y acceso directo de 6 carriles hacia Autopista México–Tuxpan (~281 km a CDMX).',
            warehousesBreakdownEn:
              'Automated container yard (280,000 m²), bonded CFS warehouse, RoRo vehicle yard & direct 6-lane connector to Mexico–Tuxpan highway (~281 km to Mexico City).',
          },
          commercialProfile: {
            positioningHeadline:
              'Puerto Más Cercano al Valle de México (~281 km vía Arco Norte / México–Tuxpan) con Terminal Automatizada SSA Marine',
            positioningHeadlineEn:
              'Closest Deep-Water Port to Mexico City (~281 km) Operated by SSA Marine (TPT)',
            address: 'Carr. a Barra Norte Km 5, Tuxpan de Rodríguez Cano, Veracruz',
            customsRegime: 'Recinto Fiscalizado Especializado TPT · Aduana de Tuxpan (Carril Rápido al Altiplano)',
            customsRegimeEn: 'Specialized Bonded Container/RoRo Terminal TPT · Tuxpan Customs',
            commercialServices: [
              'Operación automatizada de contenedores FCL/LCL, reefer y rutas Short Sea Shipping con Golfo EE.UU.',
              'Manejo de automóviles RoRo, carga proyecto y carga suelta para Hidalgo, Puebla, EdoMéx y CDMX',
              'Inspección aduanal ágil con rayos X y despacho carretero inmediato sin congestión ferroviaria',
            ],
            commercialServicesEn: [
              'Automated FCL/LCL & reefer container stevedoring plus US Gulf Short Sea Shipping services',
              'Automotive RoRo, heavy breakbulk & project cargo serving Hidalgo, Puebla & Mexico City',
              'High-speed X-ray customs screening & direct expressway dispatch',
            ],
            infrastructureHighlights: [
              '556 m de muelle en Posiciones 1–2 a 13.10 m de calado operativo',
              '4 grúas pórtico Súper Post-Panamax y 8 grúas RTG eléctricas de patio',
              'Enlace carretero directo a 281 km de la Ciudad de México vía Autopista México–Tuxpan y Arco Norte',
            ],
            infrastructureHighlightsEn: [
              '556 m quay across Berths 1–2 rated at 13.10 m operational draft',
              '4 Super Post-Panamax STS gantries + 8 electric RTGs',
              'Direct highway link just ~281 km from Mexico City via Mexico–Tuxpan & Arco Norte expressways',
            ],
            vesselTypesServed: [
              'Portacontenedores Post-Panamax (hasta 310 m LOA)',
              'Buques Short-Sea Shipping, PCTC RoRo y Carga Proyecto',
            ],
            vesselTypesServedEn: [
              'Post-Panamax Container Vessels (up to 310 m LOA)',
              'Short Sea Shipping, PCTC RoRo & Heavy Project Vessels',
            ],
            connectivity:
              'Autopista México–Tuxpan (~281 km / 3.5–4 h al Valle de México, Pachuca y Arco Norte), evitando cruces serranos.',
            connectivityEn:
              'Direct Mexico–Tuxpan toll highway (~281 km / 3.5–4 h to Mexico City & Arco Norte ring road).',
            operationalAdvantages: [
              'Menor distancia terrestre de cualquier puerto mexicano hacia el mercado consumidor del Valle de México.',
              'Terminal de nueva generación operada por SSA Marine con baja congestión portuaria.',
            ],
            operationalAdvantagesEn: [
              'Shortest trucking distance from any ocean port to Mexico City metropolitan consumer market.',
              'Modern SSA Marine automated operations with minimal gate turnaround times.',
            ],
            certifications: ['ISPS / PBIP', 'C-TPAT / OEA', 'ISO 9001'],
          },
          procedures: ['EDI BAPLIE 24 h previo; VUMCE 48 h pre-ETA.'],
          restrictionsSummary: 'Calado op. 13.10 m; grúas Súper Post-Panamax.',
          berths: [
            {
              idSuffix: 'tpt-1-2',
              name: 'Posiciones TPT 1 y 2',
              lengthM: 556,
              maxLoaM: 310,
              maxBeamM: 43.0,
              berthDepthM: 14.5,
              maxDraftM: 13.1,
              products: ['Contenedores FCL/LCL', 'Automóviles RoRo', 'Carga refrigerada'],
              cargoGroups: ['Carga General y Contenedores'],
              equipment: ['4 Grúas Pórtico Súper Post-Panamax', '8 Grúas RTG eléctricas'],
              connections: ['Autopista México–Tuxpan (260 km a CDMX)', 'Tomas reefer'],
              loadingRate: '32 – 38 mov/hora por grúa',
              notes: 'Posición más cercana por carretera al Valle de México.',
            },
          ],
        },
        {
          idSuffix: 'fluidos',
          areaKey: 'exterior',
          name: 'Terminales Marítimas de Hidrocarburos & 5 Monoboyas (Tuxpan)',
          operator: 'Servitux / Monterrá / Invex / PEMEX / CFE',
          shortDesc:
            'Complejo de terminales privadas de importación de refinados en margen sur más 5 monoboyas offshore para PEMEX y CFE.',
          shortDescEn:
            'Private refined fuel import terminals on south bank plus 5 offshore SPM buoys serving PEMEX & CFE.',
          coordinates: "20°57'38\"N · 97°18'44\"W",
          mapX: 66,
          mapY: 42,
          imageType: 'pajaritos',
          cargoGroups: ['Hidrocarburos y Gas', 'Petroquímica y Líquidos'],
          storageSummary: {
            coveredSqm: 2000,
            openYardSqm: 35000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Más de 2.2 millones de barriles de almacenamiento en terminales privadas Servitux, Monterrá, Invex y Olmeca + 5 monoboyas offshore PEMEX/CFE conectadas a poliductos Tuxpan–Tula–Azcapotzalco.',
            warehousesBreakdownEn:
              '2.2M+ bbl refined fuel storage across Servitux, Monterrá, Invex & Olmeca terminals plus 5 offshore PEMEX/CFE SPM buoys linked to Tuxpan–Tula pipelines.',
          },
          commercialProfile: {
            positioningHeadline:
              'Principal Puerta Privada y Estatal de Importación de Combustibles hacia el Valle de México',
            positioningHeadlineEn:
              'Central Mexico’s Premier Refined Fuel Import Hub via South-Bank Terminals & 5 Offshore SPMs',
            address: 'Margen Sur Río Tuxpan / Polígono Offshore Monoboyas, Tuxpan, Veracruz',
            customsRegime: 'Recintos Fiscalizados de Hidrocarburos (CRE / ASEA) · Aduana de Tuxpan',
            customsRegimeEn: 'CRE/ASEA Regulated Bonded Hydrocarbon Terminals · Tuxpan Customs',
            commercialServices: [
              'Importación de gasolinas, diésel UBA, turbosina, asfalto y combustóleo hacia el Altiplano',
              'Almacenaje privado en tanques (>2.2 M bbl) con islas de carga para autotanques y despacho por poliducto',
              'Operación offshore de 5 monoboyas PEMEX/CFE para alije de buques tanque hasta 13.10 m calado',
            ],
            commercialServicesEn: [
              'Marine import of gasoline, ULSD, jet A-1, asphalt & fuel oil supplying Central Mexico',
              'Private bonded tank farms (>2.2M bbl) with high-speed tanker-truck racks & pipeline injection',
              '5 offshore PEMEX/CFE Single Point Mooring (SPM) operations up to 13.10 m draft',
            ],
            infrastructureHighlights: [
              '600 m de muelles privados margen sur + 5 monoboyas offshore dedicadas',
              'Brazos marinos de 12" y 16" y tasas de descarga de 1,800 a 3,500 m³/h',
            ],
            infrastructureHighlightsEn: [
              '600 m south-bank fluid jetties + 5 dedicated offshore SPM buoys',
              '12" & 16" marine loading arms rated at 1,800–3,500 m³/hr',
            ],
            vesselTypesServed: ['Buques Tanque Producto MR1 / MR2 / LR1 (hasta 250 m LOA)', 'Asfalteros y GLP'],
            vesselTypesServedEn: ['MR1 / MR2 / LR1 Product Tankers (up to 250 m LOA)', 'Asphalt & LPG Carriers'],
            connectivity: 'Poliductos Tuxpan–Tula y Tuxpan–Azcapotzalco hacia el Valle de México y carretera directa.',
            connectivityEn: 'Tuxpan–Tula & Tuxpan–Azcapotzalco pipelines to Mexico City plus direct highway dispatch.',
            operationalAdvantages: ['Reducción drástica de flete terrestre de combustibles al abastecer directamente al Centro del país.'],
            operationalAdvantagesEn: ['Closest marine fuel entry point to Mexico City & central plateau demand centers.'],
            certifications: ['OCIMF / SIRE', 'ISGOTT', 'ASEA / CRE', 'ISPS / PBIP'],
          },
          procedures: ['Inspección OCIMF / SIRE y protocolo de amarre en monoboya (SPM).'],
          restrictionsSummary: 'Calado 13.1 m en exterior; restricción de marejada en monoboyas > 1.8 m.',
          berths: [
            {
              idSuffix: 'tux-oil',
              name: 'Muelles de Fluidos Margen Sur & Monoboyas PEMEX/CFE',
              lengthM: 600,
              maxLoaM: 250,
              maxBeamM: 40.0,
              berthDepthM: 14.0,
              maxDraftM: 13.1,
              products: ['Gasolina', 'Diésel UBA', 'Turbosina', 'Combustóleo', 'Gas LP'],
              cargoGroups: ['Hidrocarburos y Gas'],
              equipment: ['Brazos de carga 12" y 16"', 'Mangueras flotantes SPM', 'Contención de derrames'],
              connections: ['Poliductos Tuxpan–Tula / Azcapotzalco', 'Almacenamiento > 2.2 M bbl'],
              loadingRate: '1,800 – 3,500 m³/h',
              notes: 'Incluye infraestructura pública/privada que suma 36 posiciones totales en puerto.',
            },
          ],
        },
        {
          idSuffix: 'tump-rio',
          areaKey: 'rio',
          name: 'Muelles Públicos ASIPONA (3 Posiciones) & Terminales Fluviales',
          operator: 'ASIPONA Tuxpan / Operadores Graneleros',
          shortDesc:
            'Tres muelles públicos en margen izquierda del río Tuxpan y terminales privadas de graneles agrícolas, minerales y carga general.',
          shortDescEn:
            'Three public berths on left bank plus private river terminals for grain, minerals and general cargo.',
          coordinates: "20°57'55\"N · 97°20'15\"W",
          mapX: 46,
          mapY: 68,
          imageType: 'channel',
          cargoGroups: ['Granel Agrícola', 'Granel Mineral', 'Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 22000,
            openYardSqm: 90000,
            containerYardSqm: 20000,
            warehousesBreakdown:
              'Bodegas fiscales de recinto interior (22,000 m²), silos/bodegas graneleras privadas río arriba y patios de fabricación de estructuras petroleras offshore.',
            warehousesBreakdownEn:
              '22,000 m² fiscal warehouses along public berths, upriver private grain/mineral silos & offshore structure fabrication yards.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminales Fluviales Públicas y Privadas de Graneles, Acero y Estructuras Offshore',
            positioningHeadlineEn:
              'Upriver Public & Private Bulk Grain, Mineral, Breakbulk & Offshore Fabrication Quays',
            address: 'Carretera a la Barra / Margen Izquierda Río Tuxpan, Tuxpan, Veracruz',
            customsRegime: 'Recinto Fiscal Portuario ASIPONA y Terminales Privadas Fluviales · Aduana de Tuxpan',
            customsRegimeEn: 'ASIPONA Public Fiscal Berths & Private River Terminals · Tuxpan Customs',
            commercialServices: [
              'Importación de maíz, trigo, fertilizantes y clinker con tolvas ecológicas hacia silos fluviales',
              'Manejo de acero, cemento y fabricación/embarque de plataformas y estructuras offshore río arriba',
            ],
            commercialServicesEn: [
              'Bulk corn, wheat, fertilizer & clinker discharge via dust-controlled hoppers into river silos',
              'Steel breakbulk handling & upriver offshore platform fabrication/load-outs',
            ],
            infrastructureHighlights: [
              '540 m en 3 posiciones públicas + más de 30 instalaciones fluviales especializadas (10.05 m calado)',
              'Dársena de ciaboga interior 420 × 220 m y grúas móviles con tolvas ecológicas',
            ],
            infrastructureHighlightsEn: [
              '540 m across 3 public berths + 30+ private upriver installations (10.05 m official draft)',
              '420 × 220 m interior turning basin, mobile cranes & enclosed hoppers',
            ],
            vesselTypesServed: ['Graneleros Handysize', 'Buques Carga General y Barcazas Offshore'],
            vesselTypesServedEn: ['Handysize Bulkers', 'General Cargo & Offshore Barges'],
            connectivity: 'Conexión carretera Tuxpan–Tampico y autopista México–Tuxpan.',
            connectivityEn: 'Direct link to Tuxpan–Tampico corridor and Mexico–Tuxpan toll road.',
            operationalAdvantages: ['Acceso directo a 35 terminales privadas fluviales especializadas por producto.'],
            operationalAdvantagesEn: ['Consolidates 35 product-dedicated upriver industrial facilities.'],
            certifications: ['ISPS / PBIP', 'SENASICA'],
          },
          procedures: ['Control de velocidad máx. 6 kt al cruzar por zona de muelles fluviales.'],
          restrictionsSummary: 'Calado oficial interior 10.05 m (33 ft).',
          berths: [
            {
              idSuffix: 'tux-pub',
              name: 'Posiciones Públicas 1 – 3 & Terminales Río Arriba',
              lengthM: 540,
              maxLoaM: 195,
              maxBeamM: 32.2,
              berthDepthM: 11.0,
              maxDraftM: 10.05,
              products: ['Maíz', 'Trigo', 'Clinker', 'Fertilizantes', 'Acero', 'Carga general'],
              cargoGroups: ['Granel Agrícola', 'Granel Mineral', 'Carga General y Contenedores'],
              equipment: ['Grúas móviles', 'Tolvas ecológicas', 'Bodegas cubiertas'],
              connections: ['Carretera Tuxpan–Tampico y autopista CDMX'],
              loadingRate: '4,000 – 6,500 MT/día',
              notes: 'Dársena de ciaboga interior 420 × 220 m.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'speed-6kt',
          areaKey: 'rio',
          category: 'Operativa',
          title: 'Velocidad Máxima en Canal Fluvial (6.0 Nudos)',
          titleEn: 'Maximum River Speed (6.0 Knots)',
          detail:
            'Velocidad máxima permitida de 6.0 nudos en el canal interior del río Tuxpan para evitar oleaje sobre las 35 instalaciones fluviales.',
          detailEn:
            'Maximum 6.0 knots speed limit in the interior Tuxpan river channel to protect 35 riverbank berths.',
          limitValue: '6.0 nudos',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Tuxpan',
        },
        {
          idSuffix: 'draft-split',
          category: 'Física',
          title: 'Diferenciación Calado Exterior (13.10 m) vs. Río (10.05 m)',
          titleEn: 'Outer Port Draft (13.10 m) vs. Inner River (10.05 m)',
          detail:
            'Canal exterior habilitado a 13.10 m para TPT/terminales de entrada; canal interior limitado a 10.05 m oficiales.',
          detailEn:
            'Outer channel rated at 13.10 m for TPT/outer terminals; inner river channel capped at 10.05 m official draft.',
          limitValue: '13.10 m / 10.05 m',
          verificationStatus: 'verified',
          source: 'ASIPONA Tuxpan · Características Técnicas',
        },
      ],
      sampleVessel: 'MT Tuxpan Spirit',
      sampleImo: '9623411',
      sampleBerth: 'Muelles Fluidos Margen Sur',
      sampleCargo: 'Diésel UBA · 32,000 MT',
      sampleStatus: 'ANCHORED',
    },

    // 4. VERACRUZ
    {
      id: 'mxver',
      shortCode: 'VER',
      name: 'Puerto de Veracruz',
      unLocode: 'MXVER',
      region: 'GOLFO DE MÉXICO',
      state: 'Veracruz · Golfo de México',
      coordinates: "19°12'30\"N · 96°07'48\"W",
      vhfChannel: 'CH 16 / CH 12 (CCTM Veracruz)',
      authority: 'ASIPONA Veracruz · Capitanía de Puerto',
      lineupSourceUrl: 'https://www.puertodeveracruz.com.mx/tramites-y-servicios/programacion-de-buques/',
      lineupConnector: 'EMBEDDED_VIEWER',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Veracruz: Reporte obligatorio al CCTM al cruzar línea de control 19°15.10\'N 096°11.00\'W; gestión en plataformas MediPort y PIS 48 h previas; separación estricta entre Bahía Sur (Recinto Tradicional: Muelles 1–8, TUM, Cementos, T) y Bahía Norte (ICAVE TEC -15.5 m, CICE, Logra, Gramosa, IEnova).',
      operatingRulesUrl: 'https://www.puertodeveracruz.com.mx/reglas-de-operacion/',
      headlineEs: 'Veracruz. Bahía Norte (-15.5 m) y Recinto Tradicional Bahía Sur.',
      headlineEn: 'Veracruz. Bahía Norte (-15.5 m) & Historic Bahía Sur quays.',
      overviewEs:
        'Principal puerto comercial del Golfo de México estructurado en dos grandes zonas: Bahía Sur (Muelles 1, 2, 4N/4S, 5, 6, 7, 8, TUM, Cementos y Muelle de la T) y Bahía Norte (Expansión de aguas profundas con Hutchison ICAVE TEC, Grupo CICE, Grupo Logra, Gramosa e IEnova).',
      overviewEn:
        'Premier commercial port of the Gulf organized into Bahía Sur (Berths 1–8, TUM, Cement, T-pier) and Bahía Norte deep-water expansion (ICAVE TEC, CICE, Logra, Gramosa, IEnova).',
      heroImageType: 'recintoSur',
      channels: [
        {
          id: 'ch-ver-norte',
          name: 'Canal de Acceso y Dársena Bahía Norte (Expansión)',
          lengthNm: 2.3,
          widthM: 220,
          channelDepthM: 16.5,
          operationalDraftM: 14.5,
          squatAllowanceNote:
            'Canal de acceso principal hacia TEC ICAVE (-15.5 m) y terminales de Bahía Norte; rompeolas poniente de 4.2 km.',
          verificationStatus: 'verified',
        },
        {
          id: 'ch-ver-sur',
          name: 'Canal y Dársena Bahía Sur (Recinto Tradicional)',
          lengthNm: 1.5,
          widthM: 180,
          channelDepthM: 13.5,
          operationalDraftM: 12.2,
          squatAllowanceNote:
            'Acceso entre escolleras tradicionales a Muelles 1–8, TUM, Cementos y Muelle de Contenedores Sur (42 ft en muelle contenedores, 27–38 ft en muelles 1–8).',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-ver-1',
          name: 'Área de Fondeo Veracruz Exterior (Norte de Arrecife Gallega)',
          purpose: 'Buques mercantes generales, portacontenedores y graneleros en espera',
          coordinates: "19°15.10'N · 096°11.00'W (Línea de reporte CCTM Veracruz)",
          depthM: '22.0 – 34.0 m',
          maxVesselOrNotes:
            'Fondear estrictamente fuera de parques arrecifales (Sistema Arrecifal Veracruzano); reporte VHF CH 12 al cruzar línea de control.',
          verificationStatus: 'verified',
        },
        {
          id: 'az-ver-2',
          name: 'Zona de Espera de Buques Tanque / Hidrocarburos (IEnova · Muelle 8)',
          purpose: 'Buques tanque con productos inflamables o químicos',
          coordinates: "19°16.40'N · 096°09.20'W",
          depthM: '26.0 – 35.0 m',
          maxVesselOrNotes:
            'Mantener separación reglamentaria y máquina lista ante avisos de Frente Frío ("Norte").',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'bahia-norte',
          name: 'Bahía Norte (Expansión: ICAVE · CICE · Logra · Gramosa · IEnova)',
          nameEn: 'Bahía Norte Expansion Zone',
          summary:
            'Nuevo recinto de aguas profundas (-15.5 m en TEC) protegido por el rompeolas poniente, dedicado a contenedores, semiespecializada, granel mineral/agrícola e hidrocarburos.',
          summaryEn:
            'Deep-water expansion zone (-15.5 m at TEC) protected by the western breakwater for containers, semi-specialized cargo, bulk and fuels.',
          channelDepthM: 16.5,
          operationalDraftM: 14.5,
          turningBasinM: 600,
          daylightOnly: false,
          tugRequirement: '2 a 3 remolcadores azimutales de alto bollard pull',
          pilotRequirement: 'Practicaje obligatorio 24/7; coordinación MediPort / PIS',
        },
        {
          key: 'bahia-sur',
          name: 'Bahía Sur (Recinto Tradicional: Muelles 1–8 · TUM · Cementos · T)',
          nameEn: 'Bahía Sur Traditional Quays',
          summary:
            'Muelles históricos multipropósito, exportación automotriz RoRo, granel agrícola, cementos, contenedores sur y líquidos (Muelle 8).',
          summaryEn:
            'Historic multipurpose quays for RoRo automotive export, agri bulk, cement, southern containers and liquids (Berth 8).',
          channelDepthM: 13.5,
          operationalDraftM: 11.58,
          turningBasinM: 480,
          daylightOnly: false,
          tugRequirement: '2 remolcadores estándar (3 para buques > 220 m en dársena sur)',
          pilotRequirement: 'Practicaje obligatorio 24/7 sujeto a cierre de puerto por Norte',
        },
      ],
      terminals: [
        {
          idSuffix: 'icave-bn',
          areaKey: 'bahia-norte',
          name: 'TEC Bahía Norte · Hutchison Ports ICAVE',
          operator: 'Hutchison Ports ICAVE',
          shortDesc:
            'Terminal especializada de contenedores de nueva generación en Bahía Norte con profundidad de -15.5 m y grúas Súper Post-Panamax.',
          shortDescEn:
            'Next-generation container terminal at Bahía Norte with -15.5 m depth and Super Post-Panamax gantry cranes.',
          coordinates: "19°13'45\"N · 96°09'12\"W",
          mapX: 34,
          mapY: 28,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 16000,
            openYardSqm: 85000,
            containerYardSqm: 720000,
            warehousesBreakdown:
              'Terminal de 72 hectáreas totales en Fase II (Bahía Norte) con 1,050 m de frente de muelle planificado, patio de contenedores de alta densidad, +1,000 tomas reefer, espuela intermodal dual Ferrosur/KCSM y capacidad superior a 2.4 millones de TEUs/año al término del plan maestro.',
            warehousesBreakdownEn:
              '72-hectare Bahía Norte Phase II facility with 1,050 m planned quay, high-density container stacks, 1,000+ reefer plugs, dual Ferrosur/KCSM rail yard and 2.4M TEUs/year master-plan capacity.',
          },
          commercialProfile: {
            positioningHeadline:
              'Hutchison Ports ICAVE Fase II (Bahía Norte) — 72 ha, -15.5 m Calado y Hub Intermodal al Altiplano',
            positioningHeadlineEn:
              'Hutchison Ports ICAVE Phase II (Bahía Norte) — 72 ha Deep-Water Flagship & Dual-Rail Mexico City Gateway',
            address: 'Av. Nuevo Veracruz Portuario Km 13.5, Ampliación Bahía Norte, Veracruz, Veracruz',
            customsRegime: 'Recinto Fiscalizado Privado (Hutchison Ports ICAVE) · Aduana de Veracruz',
            customsRegimeEn: 'Bonded Private Container Concession (Hutchison Ports ICAVE) · Veracruz Customs',
            commercialServices: [
              'Estiba/desestiba de portacontenedores Post-Panamax y New-Panamax hasta 366 m LOA (34–40 mov/h por grúa)',
              'Gestión integral de carga refrigerada reefer e inspecciones OISA / SENASICA / COFEPRIS in-situ',
              'Despacho directo en doble espuela ferroviaria intermodal (CPKC / KCSM + Ferrosur) hacia Puebla, Bajío y Valle de México',
              'Manejo de carga sobredimensionada OOG, desconsolidación CFS y trazabilidad digital MediPort / PIS',
            ],
            commercialServicesEn: [
              'Post-Panamax & New-Panamax container handling up to 366 m LOA at 34–40 moves/hr per crane',
              'Cold-chain reefer monitoring and dockside OISA / SENASICA / COFEPRIS phytosanitary inspections',
              'Direct dual-rail intermodal dispatch (CPKC + Ferrosur) to Puebla, Bajío and Greater Mexico City',
              'Out-of-Gauge (OOG) project lifts, CFS warehousing and paperless MediPort / PIS gate release',
            ],
            infrastructureHighlights: [
              '72 hectáreas de desarrollo portuario en Bahía Norte con 700–1,050 m de muelle (-15.5 m / 14.5 m op.)',
              '7+ grúas Pórtico Súper Post-Panamax, grúas RTG electrificadas y patio ferroviario propio',
              'Conexión directa al Libramiento Portuario Km 13.5 evitando el tráfico urbano de Veracruz',
            ],
            infrastructureHighlightsEn: [
              '72 ha greenfield expansion in Bahía Norte with 700–1,050 m deep-water berth (-15.5 m / 14.5 m op.)',
              '7+ Super Post-Panamax STS cranes, electrified RTG fleet and dedicated on-dock rail yard',
              'Direct Km 13.5 Port Bypass access avoiding downtown Veracruz urban congestion',
            ],
            vesselTypesServed: [
              'Portacontenedores Post-Panamax y New-Panamax Atlántico/Golfo (hasta 366 m LOA)',
              'Buques Feeders Regionales del Golfo y Caribe',
            ],
            vesselTypesServedEn: [
              'Atlantic / Gulf Post-Panamax & New-Panamax Container Liners (up to 366 m LOA)',
              'Regional Gulf & Caribbean Feeder Vessels',
            ],
            connectivity:
              'Única terminal del Golfo con doble acceso ferroviario simultáneo (Ferrosur / Grupo México y CPKC) + Libramiento Portuario Km 13.5 hacia Autopista 150D Veracruz–Puebla–CDMX.',
            connectivityEn:
              'Dual Class-I on-dock rail (Ferrosur & CPKC) + Km 13.5 Port Bypass directly onto Hwy 150D to Puebla & Mexico City.',
            customsProcess: [
              'Transmisión VUCEM, archivo EDI BAPLIE 24 h previas y registro obligatorio en MediPort / PIS.',
              'Reconocimiento automatizado PITA en garita norte de alta capacidad y zona única de inspección.',
              'Salida directa en tren doble estiba hacia Pantaco / Puerta México (CDMX) o convoy carretero por Km 13.5.',
            ],
            customsProcessEn: [
              'VUCEM filing, EDI BAPLIE 24 h pre-arrival and MediPort / PIS gate appointment booking.',
              'PITA automated customs clearance at Bahía Norte multi-lane gate complex.',
              'Direct double-stack block train release to Mexico City or highway dispatch via Km 13.5 Bypass.',
            ],
            operationalAdvantages: [
              'Principal puerta contenerizada de México en el Golfo hacia Europa, Costa Este de EE.UU. y Sudamérica.',
              'Mayor profundidad de agua en el Golfo de México (-15.5 m) con salida ferroviaria dual competitiva.',
            ],
            operationalAdvantagesEn: [
              'Mexico’s #1 Gulf Coast container gateway linking Europe, US East Coast and East Coast South America.',
              'Deepest Gulf container berth (-15.5 m) paired with dual-carrier rail competition.',
            ],
            keyClientsOrTrades: ['Hutchison Ports ICAVE', 'MSC / Maersk / CMA CGM / Hapag-Lloyd', 'Ferrosur & CPKC'],
            certifications: ['PBIP / ISPS', 'OEA', 'C-TPAT', 'ISO 9001 / 14001 / 45001', 'ECOPORTS'],
          },
          procedures: ['EDI BAPLIE 24 h previo; registro obligatorio en MediPort y PIS.'],
          restrictionsSummary: 'Profundidad -15.5 m; calado op. hasta 14.5 m; muelle 700+ m.',
          berths: [
            {
              idSuffix: 'icave-1',
              name: 'Muelle TEC Bahía Norte (Posiciones 1 y 2)',
              lengthM: 700,
              maxLoaM: 366,
              maxBeamM: 49.0,
              berthDepthM: 15.5,
              maxDraftM: 14.5,
              products: ['Contenedores FCL/LCL', 'Reefer', 'Carga sobredimensionada'],
              cargoGroups: ['Carga General y Contenedores'],
              equipment: ['7 Grúas Pórtico Súper Post-Panamax', 'Patio intermodal ferroviario'],
              connections: ['Doble espuela Ferrosur / KCSM', 'Libramiento portuario KM 13.5'],
              loadingRate: '34 – 40 mov/hora por grúa',
              notes: 'Terminal insignia de la ampliación Bahía Norte.',
            },
          ],
        },
        {
          idSuffix: 'bn-bulk-oil',
          areaKey: 'bahia-norte',
          name: 'Bahía Norte · Grupo CICE · Logra · Gramosa · IEnova Hidrocarburos',
          operator: 'Grupo CICE / Grupo Logra / Gramosa / IEnova',
          shortDesc:
            'Complejo de 4 terminales especializadas en Bahía Norte: carga semiespecializada (CICE), granel mineral (Logra), granel agrícola (Gramosa) e hidrocarburos (IEnova).',
          shortDescEn:
            'Four specialized Bahía Norte terminals: semi-specialized (CICE), mineral bulk (Logra), agri-bulk (Gramosa) and refined fuels (IEnova).',
          coordinates: "19°13'22\"N · 96°08'35\"W",
          mapX: 60,
          mapY: 32,
          imageType: 'pajaritos',
          cargoGroups: ['Granel Mineral', 'Granel Agrícola', 'Hidrocarburos y Gas', 'Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 68000,
            openYardSqm: 220000,
            containerYardSqm: 95000,
            warehousesBreakdown:
              'Terminal Semiespecializada Grupo CICE (22 ha, 550 m muelle, 13,800 TEUs estática y ~2,000 m de vías) + domos minerales Grupo Logra + silos graneleros mecanizados Gramosa + parque de tanques IEnova Bahía Norte (>2.1M bbl combustibles).',
            warehousesBreakdownEn:
              'Grupo CICE Semi-Specialized Terminal (22 ha, 550 m quay, 13,800 TEU static & ~2,000 m rail) + Logra mineral domes + Gramosa automated grain silos + IEnova hydrocarbon tank farm (2.1M+ bbl).',
          },
          commercialProfile: {
            positioningHeadline:
              'Cluster Especializado Bahía Norte (CICE · Logra · Gramosa · IEnova) — Acero, Granos y Combustibles',
            positioningHeadlineEn:
              'Bahía Norte Specialized Cluster (CICE · Logra · Gramosa · IEnova) — Steel, Grain, Minerals & Fuels',
            address: 'Polígono Industrial Bahía Norte Km 13.5, Puerto de Veracruz, Veracruz',
            customsRegime: 'Cuatro Cesionarios Fiscalizados Especializados (CICE · Logra · Gramosa · IEnova) · Aduana de Veracruz',
            customsRegimeEn: 'Four Specialized Bonded Concessions (CICE · Logra · Gramosa · IEnova) · Veracruz Customs',
            commercialServices: [
              'Carga semiespecializada, rollos de acero, contenedores, proyectos pesados y 13,800 TEUs de patio en Grupo CICE (22 ha / 550 m muelle)',
              'Manejo hermético de concentrados minerales, coque, fertilizantes y ferroaleaciones con bandas antipolvo (Grupo Logra)',
              'Descarga mecanizada de maíz, trigo, soya y oleaginosas con torres succionadoras y silos de alta capacidad (Gramosa)',
              'Recepción, almacenamiento y trasvase de gasolinas, diésel y turbosina por brazos marinos 12"/16" (IEnova Bahía Norte)',
            ],
            commercialServicesEn: [
              'Semi-specialized breakbulk, steel coils, heavy project lifts, containers and 13,800-TEU yard at Grupo CICE (22 ha)',
              'Dust-free enclosed handling of mineral concentrates, petcoke, fertilizers & ferroalloys (Grupo Logra)',
              'High-speed pneumatic/mechanical grain discharge & silo storage for corn, wheat and soy (Gramosa)',
              'Refined fuel & Jet A-1 marine terminal reception, tank storage and rail/truck loading (IEnova)',
            ],
            infrastructureHighlights: [
              '1,220 m de frentes de atraque combinados en Bahía Norte con calados operativos de 13.5 a 14.0 m',
              '~2,000 m de espuelas ferroviarias internas dentro de CICE conectadas al Libramiento Ferroviario doble',
              'Bandas cerradas antipolvo, grúas MHC de 125 ton, torres graneleras e infraestructura energética ISGOTT',
            ],
            infrastructureHighlightsEn: [
              '1,220 m combined Bahía Norte quays rated to 13.5–14.0 m operational draft',
              '~2,000 m internal rail tracks inside CICE linking both Ferrosur and CPKC mainlines',
              'Sealed dust-control conveyors, 125t MHC cranes, grain unloaders and ISGOTT-compliant fuel arms',
            ],
            vesselTypesServed: [
              'Buques de Carga General / Steel Coils / Heavy-Lift / Feeders (CICE)',
              'Graneleros Panamax / Supramax Minerales y Agrícolas (Logra / Gramosa)',
              'Buques Tanque MR / LR1 de Productos Refinados (IEnova)',
            ],
            vesselTypesServedEn: [
              'General Cargo / Steel / Heavy-Lift / Container Feeders (CICE)',
              'Panamax / Supramax Mineral & Grain Bulkers (Logra / Gramosa)',
              'MR / LR1 Clean Product Tankers (IEnova)',
            ],
            connectivity:
              'Libramiento Ferroviario Ferroportuario Veracruz (enlace directo Ferrosur y CPKC) y Autopista Km 13.5 hacia Valle de México, Puebla y Bajío.',
            connectivityEn:
              'Veracruz Port Rail Bypass (direct Ferrosur & CPKC) + Km 13.5 Freight Expressway toward Puebla, CDMX & Bajío.',
            customsProcess: [
              'Registro previo VUCEM, inspección fitosanitaria SENASICA/OISA (Gramosa) y control SIRE/CRE (IEnova).',
              'Despacho aduanal PITA en garita Bahía Norte o liberación directa en espuela ferroviaria unitaria.',
            ],
            customsProcessEn: [
              'Pre-arrival VUCEM clearance, SENASICA/OISA grain examination (Gramosa) and SIRE/CRE compliance (IEnova).',
              'Automated PITA truck gate clearance or direct unit-train customs release.',
            ],
            operationalAdvantages: [
              'Alta especialización por tipo de carga eliminando contaminación cruzada entre acero, minerales, alimentos y combustibles.',
              'Capacidad de trenes unitarios de grano, acero y carrotanques energéticos desde muelle.',
            ],
            operationalAdvantagesEn: [
              'Dedicated single-commodity terminals eliminating cross-contamination across steel, grains, bulk and fuels.',
              'Unit-train dispatch capability directly from quay-side yards and fuel racks.',
            ],
            keyClientsOrTrades: ['Grupo CICE', 'Grupo Logra', 'Gramosa Agroalimentos', 'IEnova / Sempra / Valero'],
            certifications: ['PBIP / ISPS', 'ISGOTT / OCIMF SIRE', 'SENASICA / OISA', 'ISO 9001 / 14001 / 45001'],
          },
          procedures: ['Vetting SIRE en IEnova; inspección fitosanitaria SENASICA en Gramosa.'],
          restrictionsSummary: 'Calados op. entre 13.0 m y 14.0 m según terminal de Bahía Norte.',
          berths: [
            {
              idSuffix: 'bn-cice',
              name: 'CICE Semiespecializada / Logra Mineral / Gramosa Agrícola',
              lengthM: 900,
              maxLoaM: 250,
              maxBeamM: 36.0,
              berthDepthM: 14.5,
              maxDraftM: 13.5,
              products: ['Acero y proyectos (CICE)', 'Concentrado/Coque (Logra)', 'Maíz/Trigo/Soya (Gramosa)'],
              cargoGroups: ['Carga General y Contenedores', 'Granel Mineral', 'Granel Agrícola'],
              equipment: ['Torres descargadoras mecanizadas', 'Grúas MHC 125 ton', 'Silos de alta capacidad'],
              connections: ['Libramiento ferroviario directo', 'Bandas cerradas antipolvo'],
              loadingRate: '8,000 – 12,000 MT/día',
              notes: 'Terminales de alta eficiencia en dársena norte.',
            },
            {
              idSuffix: 'bn-ienova',
              name: 'Terminal de Hidrocarburos IEnova Bahía Norte',
              lengthM: 320,
              maxLoaM: 245,
              maxBeamM: 36.0,
              berthDepthM: 14.5,
              maxDraftM: 13.5,
              products: ['Gasolina regular/premium', 'Diésel UBA', 'Turbosina'],
              cargoGroups: ['Hidrocarburos y Gas'],
              equipment: ['Brazos marinos 12" y 16"', 'Sistema ESD y monitoreo atmosférico'],
              connections: ['Espuela ferroviaria y poliducto hacia altiplano'],
              loadingRate: '2,200 – 3,500 m³/h',
              notes: 'Cumplimiento estricto ISGOTT / OCIMF.',
            },
          ],
        },
        {
          idSuffix: 'sur-muelles',
          areaKey: 'bahia-sur',
          name: 'Bahía Sur · Muelles 1–8, TUM, Cementos, Contenedores Sur y Muelle T',
          operator: 'ASIPONA Veracruz / Operadores Cesionarios (SSA · CICE · Vopak)',
          shortDesc:
            'Recinto tradicional con detalle completo de calados ASIPONAVER: Muelles 1 (220 m/31\'), 2 (200 m/35\'), 4N/4S (315–381 m/32–34\'), 5–8 (202–260 m/33–38\'), TUM (250 m/36\'), Cementos (277 m/36\'), Contenedores (507 m/42\') y Muelle T (200 m/27\').',
          shortDescEn:
            'Historic quays with official ASIPONAVER drafts: Berths 1–8 (27–38 ft), TUM (36 ft), Cement (36 ft), South Container Quay (42 ft) and T-pier (27 ft).',
          coordinates: "19°12'18\"N · 96°07'40\"W",
          mapX: 46,
          mapY: 66,
          imageType: 'channel',
          cargoGroups: ['Carga General y Contenedores', 'Granel Agrícola', 'Petroquímica y Líquidos', 'Carga Proyecto'],
          storageSummary: {
            coveredSqm: 78000,
            openYardSqm: 260000,
            containerYardSqm: 120000,
            warehousesBreakdown:
              'Amplio ecosistema de bodegas fiscales cubiertas en Muelles 1–7, silos graneleros de Bahía Sur, patios automotrices RoRo de exportación/importación (SSA / CICE en M4N/4S y M5), terminales de tanques químicos Vopak en Muelle 8 y silos de cemento en Muelle Cementos.',
            warehousesBreakdownEn:
              'Extensive covered fiscal warehouses at Berths 1–7, South Bay grain silos, automotive RoRo export/import compounds (SSA / CICE at M4N/4S & M5), Vopak chemical tank farm at Berth 8 and cement silos.',
          },
          commercialProfile: {
            positioningHeadline:
              'Recinto Tradicional Bahía Sur — Hub Automotriz RoRo (Muelles 4N/4S y 5), Químicos Vopak (M8), Cemento y Carga General',
            positioningHeadlineEn:
              'Veracruz Bahía Sur Historic Enclosure — Premier Automotive RoRo Hub, Vopak Chemicals (Berth 8), Grain & Breakbulk',
            address: 'Recinto Portuario Tradicional Bahía Sur s/n, Col. Centro, Veracruz, Veracruz',
            customsRegime: 'Recinto Fiscal ASIPONA Veracruz & Cesionarios (SSA · CICE · Vopak · Apasco/Cemex) · Aduana de Veracruz',
            customsRegimeEn: 'ASIPONA Veracruz Fiscal Quays & Bonded Concessions (SSA · CICE · Vopak) · Veracruz Customs',
            commercialServices: [
              'Embarque y desembarque automotriz Ro-Ro de alta productividad (280–350 vehículos/h) para armadoras de Puebla, Bajío y Centro (Muelles 4N, 4S y 5)',
              'Recepción y almacenamiento químico/petroquímico y aceites líquidos en tanques dedicados Vopak (Muelle 8 hasta 38 ft / 11.58 m)',
              'Maniobras de carga general, acero, carga proyecto, grano agrícola y cemento/clinker en Muelles 1–7, TUM y Cementos (31–36 ft)',
              'Almacenaje fiscalizado en +78,000 m² de bodegas techadas, consolidación multimodal y despacho ferroviario directo desde muelle',
            ],
            commercialServicesEn: [
              'High-speed automotive RoRo stevedoring (280–350 units/hr) serving OEM assembly plants across Puebla & Bajío (Berths 4N/4S & 5)',
              'Bulk liquid chemical, petrochemical and base-oil terminal operations at Vopak Berth 8 (up to 38 ft / 11.58 m draft)',
              'Breakbulk, steel, project cargo, agricultural bulk and cement/clinker across Berths 1–7, TUM & Cement Pier (31–36 ft)',
              '78,000+ m² covered bonded sheds, VPC staging and direct on-dock rail dispatch',
            ],
            infrastructureHighlights: [
              'Más de 10 posiciones históricas especializadas (1, 2, 4N, 4S, 5–8, TUM 250 m, Cementos 277 m, Contenedores Sur 507 m / 42 ft y Muelle T)',
              'Líder del Golfo de México en exportación e importación automotriz RoRo con patios y rampas dedicadas',
              'Granjas de tanques químicos Vopak y terminales graneleras/cementeras conectadas por tubería y banda a pie de muelle',
            ],
            infrastructureHighlightsEn: [
              'Over 10 specialized berths (1, 2, 4N, 4S, 5–8, TUM 250 m, Cement 277 m, South Container 507 m / 42 ft & T-pier)',
              'Gulf Coast leader in finished vehicle RoRo export & import logistics with dedicated staging lots',
              'Shore-to-berth Vopak chemical pipelines, cement pneumatic lines and grain conveyor towers',
            ],
            vesselTypesServed: [
              'Buques Car Carriers / RoRo Automotrices (PCTC hasta 225 m LOA)',
              'Buques Quimiqueros Parcel Tankers (Vopak Muelle 8)',
              'Buques de Carga General, Cementeros y Graneleros Handymax / Panamax',
            ],
            vesselTypesServedEn: [
              'Pure Car & Truck Carriers (PCTC / RoRo up to 225 m LOA)',
              'Chemical Parcel Tankers (Vopak Berth 8)',
              'General Cargo, Cement Carriers & Handymax / Panamax Bulkers',
            ],
            connectivity:
              'Espuelas ferroviarias directas de Ferrosur y CPKC dentro del Recinto Fiscal + accesos hacia Libramiento Portuario y Autopista 150D (Puebla/VW/Audi–CDMX).',
            connectivityEn:
              'Direct Ferrosur & CPKC rail sidings inside the Fiscal Enclosure + Port Bypass onto Hwy 150D to Puebla/OEM plants & Mexico City.',
            customsProcess: [
              'Control de tránsito RoRo por VIN/código de barras, VUCEM y reconocimiento aduanal PITA en módulos dedicados.',
              'Protocolo ISGOTT/IBC y muestreo químico en Muelle 8; inspección fitosanitaria OISA en graneles agrícolas.',
            ],
            customsProcessEn: [
              'VIN-tracked RoRo customs gate control, VUCEM filing and automated PITA clearance.',
              'ISGOTT/IBC chemical transfer protocol at Berth 8 and OISA phytosanitary inspection for grain.',
            ],
            operationalAdvantages: [
              'Infraestructura automotriz más consolidada del Golfo de México con enlace directo a plantas de Puebla y Bajío.',
              'Disponibilidad simultánea de múltiples posiciones públicas y privadas por calado y especialidad.',
            ],
            operationalAdvantagesEn: [
              'Gulf Coast’s premier automotive RoRo export hub serving central Mexican OEM assembly corridors.',
              'Broad multi-berth flexibility spanning liquids, cement, grain, RoRo and breakbulk.',
            ],
            keyClientsOrTrades: ['Volkswagen / Audi / GM / Nissan / Stellantis', 'Vopak México', 'SSA México', 'Grupo CICE / Holcim'],
            certifications: ['PBIP / ISPS', 'ISGOTT / CDI-T (Vopak)', 'ISO 9001 / 14001 / 45001'],
          },
          procedures: ['Control automotriz RoRo en Muelles 4N/4S y 5; protocolo químico en Muelle 8 (38 ft).'],
          restrictionsSummary: 'Calados diferenciados de 27 ft (8.23 m Muelle T) hasta 42 ft (12.80 m Contenedores).',
          berths: [
            {
              idSuffix: 'ver-m1-4',
              name: 'Muelles 1 (220m/31\'), 2 (200m/35\'), 4 Norte (315.15m/32\') y 4 Sur (381.30m/34\')',
              lengthM: 1116,
              maxLoaM: 225,
              maxBeamM: 32.3,
              berthDepthM: 11.2,
              maxDraftM: 10.36,
              products: ['Automóviles RoRo', 'Carga general', 'Granel agrícola', 'Acero'],
              cargoGroups: ['Carga General y Contenedores', 'Granel Agrícola'],
              equipment: ['Rampas RoRo dedicadas', 'Grúas móviles', 'Patios automotrices'],
              connections: ['Ferrosur y KCSM en recinto fiscal'],
              loadingRate: '280 – 350 vehículos/h · 3,500 MT/día',
              notes: 'Muelle 4 Sur (381.30 m / 34 ft) y 4 Norte (315.15 m / 32 ft) son eje RoRo y multipropósito.',
            },
            {
              idSuffix: 'ver-m5-8',
              name: 'Muelles 5 (260m/33\'), 6 (260m/35\'), 7 (243m/37\') y 8 Líquidos (202.2m/38\')',
              lengthM: 965,
              maxLoaM: 210,
              maxBeamM: 32.2,
              berthDepthM: 12.2,
              maxDraftM: 11.58,
              products: ['Granos / Fertilizantes', 'Químicos y aceites vegetales (Muelle 8)', 'Carga general'],
              cargoGroups: ['Granel Agrícola', 'Petroquímica y Líquidos', 'Carga General y Contenedores'],
              equipment: ['Brazos químicos Muelle 8', 'Succionadoras de grano Muelle 6/7'],
              connections: ['Almacenamiento de fluidos Vopak/Asturiana y silos'],
              loadingRate: '500 – 900 m³/h (M8) · 5,500 MT/día',
              notes: 'Muelle 8 ofrece 38 ft (11.58 m) para quimiqueros y aceites.',
            },
            {
              idSuffix: 'ver-tum-cem-t',
              name: 'Muelle TUM (250m/36\'), Cementos (277.44m/36\'), Contenedores (507.42m/42\') y Muelle T (200m/27\')',
              lengthM: 1235,
              maxLoaM: 295,
              maxBeamM: 40.0,
              berthDepthM: 13.4,
              maxDraftM: 12.8,
              products: ['Contenedores', 'Cemento a granel', 'Granel mineral', 'Embarcaciones menores / RoRo'],
              cargoGroups: ['Carga General y Contenedores', 'Granel Mineral', 'Carga Proyecto'],
              equipment: ['Grúas pórtico Contenedores Sur', 'Silos de cemento', 'Grúas MHC'],
              connections: ['Red ferroviaria intermodal'],
              loadingRate: '30 mov/h · 6,000 MT/día cemento',
              notes: 'Muelle de Contenedores Sur 507.42 m / 42 ft (12.80 m); Muelle de la T 200 m / 27 ft (8.23 m).',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'nortes',
          category: 'Operativa',
          title: 'Protocolo de Cierre de Puerto por "Nortes" (> 25–30 kt)',
          titleEn: 'Cold Front ("Nortes") Port Closure (> 25–30 kt)',
          detail:
            'Durante temporada octubre–abril, frentes fríos intensos superan 35–50 kt cerrando bocana de Bahía Sur y Bahía Norte; reforzar amarras y suspender grúas.',
          detailEn:
            'Oct–Apr cold fronts exceeding 35–50 kt close both Bahía Sur and Bahía Norte entrances; double mooring lines required.',
          limitValue: 'Cierre > 25–30 kt',
          verificationStatus: 'verified',
          source: 'Capitanía de Puerto Veracruz',
        },
        {
          idSuffix: 'mediport',
          category: 'Seguridad y Aduana',
          title: 'Plataformas MediPort, PIS y Línea de Control CCTM',
          titleEn: 'MediPort, PIS & CCTM Control Line Reporting',
          detail:
            'Alta previa obligatoria en MediPort/PIS (48 h pre-ETA) y reporte VHF CH 12 al cruzar 19°15.10\'N 096°11.00\'W.',
          detailEn:
            'Mandatory MediPort/PIS filing (48h pre-ETA) and VHF CH 12 report upon crossing 19°15.10\'N 096°11.00\'W.',
          limitValue: '48 h · VHF CH 12',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Veracruz',
        },
      ],
      sampleVessel: 'MV Veracruz Express',
      sampleImo: '9804512',
      sampleBerth: 'Muelle TEC Bahía Norte (ICAVE)',
      sampleCargo: 'Contenedores FCL · 3,100 TEU',
      sampleStatus: 'BERTHED',
    },

    // 5. DOS BOCAS
    {
      id: 'mxdob',
      shortCode: 'DOB',
      name: 'Puerto de Dos Bocas',
      unLocode: 'MXDBT',
      region: 'GOLFO DE MÉXICO',
      state: 'Tabasco · Golfo de México',
      coordinates: "18°26'08\"N · 93°11'42\"W",
      vhfChannel: 'CH 16 / CH 12 / CH 13 (CCTM Dos Bocas)',
      authority: 'ASIPONA Dos Bocas · Capitanía de Puerto',
      lineupSourceUrl: 'https://www.puertodosbocas.com.mx/tramites-programacion-de-buques',
      lineupConnector: 'RESTRICTED_PORTAL',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Dos Bocas: CCTM activo en VHF CH 12/13/16; Terminal Comercial/TUM de 300 m (6 módulos de 50 m) con -10.0 m y calado oficial 9.75 m (32 ft); eslora máx. 190 m carga / 300 m cruceros; obligatorio 3 remolcadores para buques 185–200 m LOA; prioridad logística a flota PEMEX Exploración y Producción.',
      operatingRulesUrl: 'https://www.puertodosbocas.com.mx/reglas-de-operacion',
      headlineEs: 'Dos Bocas. Hub offshore PEMEX y Terminal Comercial (32 ft).',
      headlineEn: 'Dos Bocas. Offshore oilfield hub & Commercial TUM (32 ft).',
      overviewEs:
        'Puerto petrolero e industrial en Paraíso, Tabasco, dividido en dos zonas operativas: Zona Comercial / Terminal de Usos Múltiples (300 m en 6 módulos a -10.0 m) y Terminal de Abastecimiento Offshore PEMEX (Muelle Norte, Oriente I y Pilotos) más Terminal Marítima Dos Bocas (exportación de crudo por monoboyas).',
      overviewEn:
        'Petroleum and offshore logistics port in Tabasco organized into Commercial/TUM Zone (300 m quay in 6 modules at -10.0 m) and PEMEX Offshore Supply Terminal (North, East I & Pilots piers) plus crude export SPM buoys.',
      heroImageType: 'pajaritos',
      channels: [
        {
          id: 'ch-dob-main',
          name: 'Canal de Acceso Principal Dos Bocas (2,200 m)',
          lengthNm: 1.19,
          widthM: 325,
          channelDepthM: 10.0,
          operationalDraftM: 9.75,
          squatAllowanceNote:
            'Canal de 2,200 m con transición de ancho 325 m -> 125 m -> 100 m; profundidad oficial -10.0 m NBM y dársena de ciaboga de 300 m (-9.5 m).',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-dob-1',
          name: 'Área de Fondeo Exterior Dos Bocas (Comercial y OSV)',
          purpose: 'Buques mercantes, carga proyecto y embarcaciones offshore en espera',
          coordinates: "18°29.5'N · 093°13.0'W (~3.2 MN al norte de escolleras)",
          depthM: '16.0 – 22.0 m',
          maxVesselOrNotes:
            'Resguardo estricto respecto a corredores de ductos submarinos de PEMEX Terminal Marítima.',
          verificationStatus: 'verified',
        },
        {
          id: 'az-dob-2',
          name: 'Zona de Exclusión Monoboyas de Crudo (TMDB PEMEX)',
          purpose: 'Buques tanque petroleros para carga de crudo Maya/Olmeca',
          coordinates: "18°36.0'N · 093°10.5'W (zona offshore 12 MN norte)",
          depthM: '24.0 – 28.0 m',
          maxVesselOrNotes:
            'Acceso exclusivamente con piloto de amarre PEMEX y embarcaciones de apoyo autorizadas.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'comercial',
          name: 'Zona Comercial / Terminal de Usos Múltiples (TUM)',
          nameEn: 'Commercial & Multipurpose Terminal (TUM)',
          summary:
            'Frente continuo de 300 m (6 módulos de 50 m) a -10.0 m NBM para carga general, carga proyecto, equipos de refinería, tubería y cruceros.',
          summaryEn:
            'Continuous 300 m quay (6 × 50 m modules) at -10.0 m NBM serving general cargo, refinery project modules, pipe and cruise ships.',
          channelDepthM: 10.0,
          operationalDraftM: 9.75,
          turningBasinM: 300,
          daylightOnly: false,
          tugRequirement: '2 remolcadores estándar; 3 remolcadores obligatorios para LOA 185 – 200 m',
          pilotRequirement: 'Practicaje obligatorio > 500 UAB en VHF CH 12/13',
        },
        {
          key: 'offshore',
          name: 'Terminal de Abastecimiento Offshore PEMEX (Muelle Norte · Oriente I · Pilotos)',
          nameEn: 'PEMEX Offshore Supply Terminal',
          summary:
            'Dársena dedicada 24/7 al reabastecimiento de plataformas marinas en la Sonda de Campeche con fluidos de perforación, agua, diésel y refacciones.',
          summaryEn:
            '24/7 offshore supply basin serving Campeche Sound rigs with drilling muds, water, diesel and equipment.',
          channelDepthM: 8.5,
          operationalDraftM: 7.5,
          turningBasinM: 280,
          daylightOnly: false,
          tugRequirement: 'Asistencia de remolque según eslora y maniobra en dársena interior',
          pilotRequirement: 'Control de tráfico CCTM obligatorio en todo movimiento de entrada/salida',
        },
      ],
      terminals: [
        {
          idSuffix: 'tum',
          areaKey: 'comercial',
          name: 'Terminal de Usos Múltiples (TUM) Dos Bocas · Zona Comercial',
          operator: 'ASIPONA Dos Bocas / Operadores Autorizados',
          shortDesc:
            'Muelle comercial de 300 m (6 módulos de 50 m) habilitado a 9.75 m (32 ft) para carga proyecto, tubería, acero, graneles y cruceros.',
          shortDescEn:
            '300 m commercial quay (6 × 50 m modules) rated at 9.75 m (32 ft) draft for project cargo, pipe, steel, bulk and cruise calls.',
          coordinates: "18°26'14\"N · 93°11'34\"W",
          mapX: 38,
          mapY: 44,
          imageType: 'recintoSur',
          cargoGroups: ['Carga Proyecto', 'Carga General y Contenedores', 'Granel Mineral'],
          storageSummary: {
            coveredSqm: 4500,
            openYardSqm: 110000,
            containerYardSqm: 25000,
            warehousesBreakdown:
              'Patios reforzados heavy-lift y almacenaje aduanal de carga proyecto energética (110,000 m²) tras los 6 módulos comerciales TUM (300 m) adyacentes a Refinería Olmeca.',
            warehousesBreakdownEn:
              'Heavy-lift reinforced laydown & customs project yards (110,000 m²) backing the 6 TUM modules (300 m) adjacent to Olmeca Refinery.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal Comercial Multipropósito de Proyectos Energéticos y Corredor Refinería Olmeca (32 ft)',
            positioningHeadlineEn:
              'Commercial Heavy-Lift Project & Olmeca Refinery Gateway Terminal (300 m / 32 ft)',
            address: 'Carretera Federal Barra de Dos Bocas s/n, Paraíso, Tabasco',
            customsRegime: 'Recinto Fiscal Portuario ASIPONA Dos Bocas · Aduana de Dos Bocas',
            customsRegimeEn: 'ASIPONA Dos Bocas Fiscal Enclosure · Dos Bocas Customs',
            commercialServices: [
              'Recepción de módulos sobredimensionados, equipos de refinería, tubería revestida y grúas heavy-lift',
              'Descarga de barita, bentonita, cemento petrolero, acero y contenedores offshore en 6 módulos continuos',
              'Atención a cruceros turísticos hasta 300 m LOA con coordinación portuaria y aduanal integral',
            ],
            commercialServicesEn: [
              'Heavy-lift discharge of oversized refinery modules, coated pipe & industrial machinery',
              'Oilfield bulk stevedoring (barite, bentonite, cement), steel & containers across 6 quay modules',
              'Cruise ship berth accommodation up to 300 m LOA with full port clearance',
            ],
            infrastructureHighlights: [
              '300 m continuos (6 módulos de 50 m) a 9.75 m (32 ft) de calado oficial',
              'Patios reforzados heavy-lift, básculas camioneras y dársena de ciaboga de 300 m',
            ],
            infrastructureHighlightsEn: [
              '300 m quay (6 x 50 m modules) rated to 9.75 m (32 ft) official draft',
              'Reinforced heavy-lift yards, truck scales & 300 m turning basin',
            ],
            vesselTypesServed: [
              'Buques Heavy-Lift / Carga Proyecto',
              'Graneleros Costeros, Carga General y Cruceros (hasta 300 m)',
            ],
            vesselTypesServedEn: [
              'Heavy-Lift & Project Cargo Ships',
              'Coastal Bulkers, General Cargo & Cruise Ships (up to 300 m)',
            ],
            connectivity:
              'Conexión inmediata con Refinería Olmeca, corredor industrial Paraíso–Villahermosa y nuevo enlace ferroviario Estación Roberto Ayala–Dos Bocas.',
            connectivityEn:
              'Direct gate access to Olmeca Refinery, Paraíso–Villahermosa highway & new Dos Bocas rail link.',
            operationalAdvantages: [
              'Cercanía inmediata a la Refinería Olmeca y corredor industrial costero de Tabasco.',
              'Operación continua 24/7 para maniobras críticas de proyecto energético.',
            ],
            operationalAdvantagesEn: [
              'Immediate proximity to Olmeca Refinery minimizing oversized heavy-haul distances.',
              '24/7 port window for critical energy-sector turnarounds.',
            ],
            certifications: ['ISPS / PBIP', 'ISO 9001'],
          },
          procedures: ['Confirmar 3 remolcadores si LOA está entre 185 y 200 m; VUMCE 48 h previas.'],
          restrictionsSummary: 'Calado oficial 9.75 m (32 ft); LOA máx. 190 m carga / 300 m cruceros.',
          berths: [
            {
              idSuffix: 'dob-tum-1',
              name: 'Módulos 1 – 6 TUM (300 m lineales)',
              lengthM: 300,
              maxLoaM: 190,
              maxBeamM: 32.2,
              berthDepthM: 10.0,
              maxDraftM: 9.75,
              products: ['Carga proyecto energética', 'Tubería revestida', 'Barita / Bentonita', 'Contenedores', 'Cruceros (hasta 300 m)'],
              cargoGroups: ['Carga Proyecto', 'Carga General y Contenedores', 'Granel Mineral'],
              equipment: ['Grúas móviles de alto tonelaje', 'Patios reforzados heavy-lift', 'Básculas camioneras'],
              connections: ['Conexión directa a Refinería Olmeca y carretera Paraíso–Villahermosa'],
              loadingRate: 'Turnaround 24/7 según plan de izaje',
              notes: 'Dársena de ciaboga de 300 m a -9.5 m NBM.',
            },
          ],
        },
        {
          idSuffix: 'pemex-offshore',
          areaKey: 'offshore',
          name: 'Terminal de Abastecimiento Offshore PEMEX (Muelle Norte, Oriente I y Pilotos)',
          operator: 'PEMEX Exploración y Producción / Contratistas Offshore',
          shortDesc:
            'Muelles de alta rotación para flota OSV, PSV, lanchas de pasaje y buques de apoyo a plataformas.',
          shortDescEn:
            'High-turnaround berths for OSV, PSV, crew boats and offshore platform support vessels.',
          coordinates: "18°25'52\"N · 93°11'50\"W",
          mapX: 66,
          mapY: 54,
          imageType: 'pajaritos',
          cargoGroups: ['Hidrocarburos y Gas', 'Carga Proyecto'],
          storageSummary: {
            coveredSqm: 12000,
            openYardSqm: 185000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Bases integradas de abastecimiento PEMEX PEP y contratistas con plantas de lodos de perforación, silos neumáticos de barita/cemento, tanques de diésel marino y patios de tubería offshore.',
            warehousesBreakdownEn:
              'Integrated PEMEX PEP & service company shorebases featuring mud plants, bulk barite/cement silos, MGO tanks & pipe laydown yards.',
          },
          commercialProfile: {
            positioningHeadline:
              'Hub 24/7 de Abastecimiento Offshore Sonda de Campeche y Terminal de Exportación TMDB',
            positioningHeadlineEn:
              '24/7 Bay of Campeche Offshore Supply Hub & Crude Export Terminal (TMDB)',
            address: 'Dársena Offshore PEMEX, Puerto de Dos Bocas, Paraíso, Tabasco',
            customsRegime: 'Recinto Portuario Offshore PEMEX · Aduana de Dos Bocas',
            customsRegimeEn: 'PEMEX Offshore Supply Precinct · Dos Bocas Customs',
            commercialServices: [
              'Suministro simultáneo bajo muelle de diésel marino, agua industrial, lodos base agua/aceite y barita/cemento a granel',
              'Movilización de tripulaciones offshore (crew change), contenedores CCU, tubería de perforación y herramienta petrolera',
              'Exportación de crudo Maya y Olmeca mediante monoboyas costa afuera de la Terminal Marítima Dos Bocas (TMDB)',
            ],
            commercialServicesEn: [
              'Simultaneous quayside loading of MGO, drill water, OBM/WBM muds & pneumatic bulk barite/cement',
              'Offshore crew-boat mobilization, DNV CCU baskets, drill pipe & wellhead equipment staging',
              'Crude oil export via offshore Single Point Mooring (SPM) buoys at TMDB',
            ],
            infrastructureHighlights: [
              '950 m en Muelle Norte, Oriente I y Pilotos + monoboyas TMDB a 12 MN costa afuera',
              'Plantas de lodos, silos neumáticos, bombas de alta capacidad en muelle y bases logísticas integradas',
            ],
            infrastructureHighlightsEn: [
              '950 m quay across North, East I & Pilots piers + TMDB offshore SPM buoys',
              'On-site liquid mud plants, bulk silos, dockside pumping stations & contractor yards',
            ],
            vesselTypesServed: ['Buques OSV / PSV / AHTSV / Crew Boats', 'Buques Tanque Crudo Aframax / VLCC (TMDB)'],
            vesselTypesServedEn: ['OSV / PSV / AHTSV / Fast Crew Boats', 'Aframax / VLCC Crude Tankers (TMDB)'],
            connectivity: 'Ductos petroleros desde campos marinos y terrestres de Tabasco/Campeche y red logística Paraíso.',
            connectivityEn: 'Direct offshore/onshore crude pipeline gathering grid and Tabasco oilfield corridor.',
            operationalAdvantages: [
              'Base logística con menor tiempo de navegación hacia los principales complejos productores de la Sonda de Campeche.',
              'Operación continua 24/7 con prioridad para soporte a plataformas marinas.',
            ],
            operationalAdvantagesEn: [
              'Shortest steaming time to major producing fields in the Bay of Campeche.',
              'Dedicated 24/7 turnaround capability supporting offshore drilling & production.',
            ],
            certifications: ['ISPS / PBIP', 'SASISOPA / ASEA', 'OCIMF / SIRE (TMDB)'],
          },
          procedures: ['Permiso interno PEMEX / CCTM Dos Bocas en VHF CH 13.'],
          restrictionsSummary: 'Ventana continua 24/7; prioridad para emergencias de plataformas.',
          berths: [
            {
              idSuffix: 'dob-osv',
              name: 'Muelle Norte, Oriente I y Muelle de Pilotos',
              lengthM: 950,
              maxLoaM: 120,
              maxBeamM: 22.0,
              berthDepthM: 8.5,
              maxDraftM: 7.5,
              products: ['Diésel marino', 'Agua industrial', 'Lodos de perforación', 'Cemento a granel', 'Equipo petrolero'],
              cargoGroups: ['Hidrocarburos y Gas', 'Carga Proyecto'],
              equipment: ['Plantas de lodos', 'Silos de barita/cemento', 'Sistemas de bombeo en muelle'],
              connections: ['Patios logísticos PEMEX y bases de servicios petroleros'],
              loadingRate: 'Turnaround OSV 4 – 10 horas',
              notes: 'Opera paralelamente con monoboyas offshore de la Terminal Marítima Dos Bocas.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'tugs-185',
          areaKey: 'comercial',
          category: 'Practicaje y Remolque',
          title: 'Uso Obligatorio de 3 Remolcadores (LOA 185 – 200 m)',
          titleEn: 'Mandatory 3 Tugs for LOA 185 – 200 m',
          detail:
            'Las Reglas de Operación exigen 3 remolcadores para maniobras de entrada, ciaboga (300 m) y atraque de buques con eslora entre 185 y 200 m.',
          detailEn:
            'Operating Rules mandate 3 tugs for arrival, turning (300 m basin) and berthing of vessels between 185 and 200 m LOA.',
          limitValue: '3 Remolcadores',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Dos Bocas',
        },
        {
          idSuffix: 'draft-32',
          areaKey: 'comercial',
          category: 'Física',
          title: 'Calado Oficial 9.75 m (32 ft) y Dársena -9.5 m',
          titleEn: 'Official Draft 9.75 m (32 ft) & -9.5 m Turning Basin',
          detail:
            'Canal dragado a -10.0 m NBM (ancho de 325 m -> 125 m -> 100 m) con calado oficial de 9.75 m en módulos TUM.',
          detailEn:
            'Channel dredged to -10.0 m NBM (325 -> 125 -> 100 m width) with 9.75 m official draft at TUM modules.',
          limitValue: '9.75 m (32 ft)',
          verificationStatus: 'verified',
          source: 'ASIPONA Dos Bocas · Infraestructura',
        },
      ],
      sampleVessel: 'OSV Tabasco Supply',
      sampleImo: '9541109',
      sampleBerth: 'Módulos 1 – 6 TUM (300 m)',
      sampleCargo: 'Tubería offshore · 4,200 MT',
      sampleStatus: 'BERTHED',
    },

    // 6. CIUDAD DEL CARMEN
    {
      id: 'mxcar',
      shortCode: 'CAR',
      name: 'Puerto de Ciudad del Carmen',
      unLocode: 'MXCME',
      region: 'GOLFO DE MÉXICO',
      state: 'Campeche · Laguna de Términos',
      coordinates: "18°38'24\"N · 91°50'30\"W",
      vhfChannel: 'CH 16 / CH 14 (Capitanía Carmen)',
      authority: 'APICAM Isla del Carmen · Capitanía de Puerto',
      lineupSourceUrl: 'https://apicampeche.com.mx/isla-del-carmen/',
      lineupConnector: 'PORTAL_LINK',
      operatingRulesSummary:
        'Reglas de Operación APICAM Isla del Carmen: Cuatro dársenas pesqueras e industriales (Dársenas 1, 2, 3 y 4 · Laguna Azul) dando soporte a más de 100 compañías petroleras de la Sonda de Campeche; zona de fondeo oficial delimitada en polígono 18°44\'N–18°46\'N / 091°50\'W–091°54\'W; restricción estricta de calado de barra en Boca del Carmen (~5.4 m).',
      operatingRulesUrl: 'https://apicampeche.com.mx/isla-del-carmen/',
      headlineEs: 'Ciudad del Carmen. 4 Dársenas Offshore de la Sonda de Campeche.',
      headlineEn: 'Ciudad del Carmen. 4 Offshore Supply Basins for Campeche Sound.',
      overviewEs:
        'Puerto estratégico operado por APICAM en Isla del Carmen, Campeche. Sus 4 dársenas (Laguna Azul) albergan bases logísticas de más de 100 empresas offshore (Cotemar, Halliburton, Naviera Integral, PEMEX) para embarcaciones OSV, PSV, lodos, cemento y carga petrolera.',
      overviewEn:
        'Strategic offshore logistics port managed by APICAM in Isla del Carmen. Its 4 basins (Laguna Azul) host over 100 oilfield service companies serving Campeche Sound OSV/PSV fleets.',
      heroImageType: 'channel',
      channels: [
        {
          id: 'ch-car-barra',
          name: 'Canal de Acceso Barra Laguna Azul / Isla del Carmen',
          lengthNm: 2.8,
          widthM: 80,
          channelDepthM: 6.5,
          operationalDraftM: 5.4,
          squatAllowanceNote:
            'Canal limitado por barra de arena natural; requiere verificación frecuente de calado (5.2 – 5.5 m) y marea antes de maniobrar buques OSV cargados.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-car-1',
          name: 'Polígono Oficial de Fondeo Ciudad del Carmen',
          purpose: 'Embarcaciones de suministro offshore (OSV), barcazas y cabotaje',
          coordinates: "18°44'N – 18°46'N · 091°50'W – 091°54'W",
          depthM: '7.5 – 12.0 m',
          maxVesselOrNotes:
            'Zona oficial de fondeo fuera de la línea de tráfico hacia plataformas; reportar fondeo a Capitanía de Puerto Carmen VHF CH 14.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'darsenas-1-2',
          name: 'Dársenas 1 y 2 · Muelles Públicos APICAM y Pesca Industrial',
          nameEn: 'Basins 1 & 2 · APICAM Public & Service Quays',
          summary:
            'Muelles multipropósito de APICAM para carga general petrolera, reparación menor a flote y avituallamiento de embarcaciones.',
          summaryEn:
            'APICAM multipurpose quays supporting offshore general cargo, afloat repairs and vessel provisioning.',
          channelDepthM: 6.5,
          operationalDraftM: 5.4,
          turningBasinM: 210,
          daylightOnly: false,
          tugRequirement: '1 a 2 remolcadores para barcazas sin propulsión y esloras > 85 m',
          pilotRequirement: 'Practicaje obligatorio para buques > 500 UAB al cruzar barra',
        },
        {
          key: 'darsenas-3-4',
          name: 'Dársenas 3 y 4 · Laguna Azul (Hub Petrolero Offshore)',
          nameEn: 'Basins 3 & 4 · Laguna Azul Offshore Hub',
          summary:
            'Concentra muelles concesionados a operadores petroleros (Cotemar, Halliburton, Naviera Integral, Schlumberger, PEMEX) con plantas de lodos y combustible marino.',
          summaryEn:
            'Concessioned oilfield bases (Cotemar, Halliburton, Naviera Integral, PEMEX) with drilling mud plants and marine bunkering.',
          channelDepthM: 6.5,
          operationalDraftM: 5.2,
          turningBasinM: 220,
          daylightOnly: false,
          tugRequirement: 'Remolque obligatorio para chalanes y plataformas autoelevables menores',
          pilotRequirement: 'Coordinación con Capitanía Carmen y control de dársena APICAM',
        },
      ],
      terminals: [
        {
          idSuffix: 'apicam-1-2',
          areaKey: 'darsenas-1-2',
          name: 'Dársenas 1 y 2 · Recinto Fiscal APICAM Isla del Carmen',
          operator: 'APICAM / Cesionarios Portuarios',
          shortDesc:
            'Frente público multipropósito para suministro a plataformas, tubería, contenedores offshore y carga de proyectos.',
          shortDescEn:
            'Public multipurpose berths for offshore rig supply, tubulars, offshore baskets and project cargo.',
          coordinates: "18°38'35\"N · 91°50'25\"W",
          mapX: 38,
          mapY: 46,
          imageType: 'channel',
          cargoGroups: ['Carga Proyecto', 'Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 4200,
            openYardSqm: 38000,
            containerYardSqm: 14000,
            warehousesBreakdown:
              'Bodega fiscal aduanal en Dársena 1 + 38,000 m² de patios pavimentados para tubería OCTG, contenedores offshore (CCUs) y carga de proyectos petroleros.',
            warehousesBreakdownEn:
              'Bonded customs shed at Dock 1 + 38,000 m² paved laydown yards for OCTG pipe, offshore Cargo Carrying Units (CCUs) and energy project cargo.',
          },
          commercialProfile: {
            positioningHeadline:
              'Frente Público Offshore y Recinto Fiscalizado para Logística de la Sonda de Campeche',
            positioningHeadlineEn:
              'Public Offshore Supply Quays & Bonded Enclosure Serving Bay of Campeche Rigs',
            address: 'Av. 4 Oriente s/n, Zona Industrial y Portuaria Laguna Azul, Cd. del Carmen, Campeche',
            customsRegime: 'Recinto Fiscal Portuario APICAM · Aduana de Ciudad del Carmen',
            customsRegimeEn: 'APICAM Bonded Port Enclosure · Ciudad del Carmen Customs',
            commercialServices: [
              'Carga y descarga rápida de contenedores offshore (CCUs), canastillas y equipos de perforación',
              'Manejo de tubería petrolera OCTG, casing, válvulas submarinas y refacciones críticas',
              'Suministro de agua industrial, víveres avituallados y diésel marino a flota OSV / PSV',
              'Resguardo aduanal y maniobras de importación temporal de equipo petrolero en régimen offshore',
            ],
            commercialServicesEn: [
              'Rapid OSV/PSV loadout of certified offshore Cargo Carrying Units (CCUs), baskets and drilling tools',
              'Handling of OCTG casing, subsea trees, valves and critical rig spare parts',
              'Potable/industrial water, ship chandling provisions and marine gasoil bunkering alongside',
              'Bonded customs staging and temporary import clearance for offshore oilfield equipment',
            ],
            infrastructureHighlights: [
              '780 m lineales de atraque multipropósito entre Dársenas 1 y 2',
              'Calado operativo de 5.4 m (17.7 ft) en canal de barra protegido',
              'Proximidad inmediata al Helipuerto de Ciudad del Carmen y zona aduanal',
            ],
            infrastructureHighlightsEn: [
              '780 m total multipurpose quay wall across Basins 1 & 2',
              '5.4 m (17.7 ft) operational draft inside protected bar channel',
              'Immediate proximity to Ciudad del Carmen Heliport & Customs compound',
            ],
            vesselTypesServed: [
              'Buques de Suministro Costa Afuera (PSV / OSV / FSV)',
              'Remolcadores Manejadores de Anclas (AHTS) y Barcazas de Proyecto',
            ],
            vesselTypesServedEn: [
              'Platform Supply Vessels (PSV / OSV / Fast Supply Vessels)',
              'Anchor Handling Tugs (AHTS) & Offshore Project Barges',
            ],
            connectivity:
              'Enlace inmediato con Parque Industrial Laguna Azul, Carretera Costera 180 y Helipuerto PEMEX / taxis aéreos hacia plataformas.',
            connectivityEn:
              'Direct link to Laguna Azul Industrial Park, Fed. Hwy 180 and Ciudad del Carmen Offshore Heliport.',
            customsProcess: [
              'Transmisión VUMCE de manifiesto de carga y lista de tripulantes/pasajeros costa afuera.',
              'Pedimento de importación temporal o aviso de traslado offshore ante Aduana de Cd. del Carmen.',
              'Validación de certificados de izaje (LOLER / DNV 2.7-1) para canastillas y contenedores offshore.',
              'Control de acceso PBIP APICAM y liberación en ventana de 6–12 h para turnaround de OSV.',
            ],
            customsProcessEn: [
              'VUMCE electronic cargo manifest and offshore crew/passenger roster submission.',
              'Temporary import pedimento or offshore transit notice cleared with Cd. del Carmen Customs.',
              'Lifting gear & DNV 2.7-1 certification verification for offshore CCUs/baskets.',
              'APICAM ISPS gate clearance enabling 6–12 h rapid OSV turnaround.',
            ],
            operationalAdvantages: [
              'Turnarounds express (6–12 horas) para abastecimiento continuo de campos Cantarell y Ku-Maloob-Zaap.',
              'Integración directa mar-aire mediante cercanía al helipuerto petrolero.',
            ],
            operationalAdvantagesEn: [
              'Express 6–12 hour vessel turnarounds sustaining Cantarell & Ku-Maloob-Zaap offshore blocks.',
              'Seamless sea-air crew & urgent spare transfer next to Cd. del Carmen Heliport.',
            ],
            certifications: ['PBIP / ISPS', 'DNV 2.7-1 Rigging Compliance', 'APICAM Calidad'],
          },
          procedures: ['Aviso de arribo VUMCE y lista de tripulantes/pasajeros costa afuera.'],
          restrictionsSummary: 'Calado operativo máximo 5.4 m (17.7 ft) en canal de barra.',
          berths: [
            {
              idSuffix: 'car-d1-2',
              name: 'Muelles Dársena 1 y Dársena 2',
              lengthM: 780,
              maxLoaM: 105,
              maxBeamM: 20.0,
              berthDepthM: 6.2,
              maxDraftM: 5.4,
              products: ['Contenedores offshore', 'Tubería de perforación', 'Víveres y agua industrial'],
              cargoGroups: ['Carga Proyecto', 'Carga General y Contenedores'],
              equipment: ['Grúas móviles sobre camión', 'Montacargas de patio', 'Tomas de agua/diésel'],
              connections: ['Patios aduanales Laguna Azul', 'Helipuerto Ciudad del Carmen cercano'],
              loadingRate: 'Turnaround OSV 6 – 12 h',
              notes: 'Acceso continuo sujeto a apertura de barra.',
            },
          ],
        },
        {
          idSuffix: 'laguna-azul-3-4',
          areaKey: 'darsenas-3-4',
          name: 'Dársenas 3 y 4 · Complejo Offshore Laguna Azul (Cotemar · Halliburton · PEMEX)',
          operator: 'Cotemar / Halliburton / Naviera Integral / PEMEX',
          shortDesc:
            'Cluster especializado con plantas de cemento petrolero, lodos base aceite, diésel marino y mantenimiento naval.',
          shortDescEn:
            'Specialized oilfield cluster with bulk cement, oil-based muds, marine gasoil and vessel maintenance yards.',
          coordinates: "18°38'12\"N · 91°49'18\"W",
          mapX: 66,
          mapY: 52,
          imageType: 'pajaritos',
          cargoGroups: ['Hidrocarburos y Gas', 'Carga Proyecto'],
          storageSummary: {
            coveredSqm: 18500,
            openYardSqm: 110000,
            containerYardSqm: 12000,
            warehousesBreakdown:
              'Silos neumáticos de barita, bentonita y cemento petrolero, granjas de tanques para lodos base aceite/salmueras, naves de mantenimiento naval y +110,000 m² de patios petroleros privados.',
            warehousesBreakdownEn:
              'Pneumatic silos for barite, bentonite & oilwell cement, liquid mud/brine tank farms, marine repair hangars and 110,000+ m² private oilfield yards.',
          },
          commercialProfile: {
            positioningHeadline:
              'Hub Petrolero Privado de Mayor Concentración Offshore en la Sonda de Campeche',
            positioningHeadlineEn:
              'Mexico’s Densest Private Offshore Oilfield Services Hub (Cotemar · Halliburton · PEMEX)',
            address: 'Parque Industrial y Portuario Laguna Azul, Dársenas 3 y 4, Cd. del Carmen, Campeche',
            customsRegime: 'Cesionarios Portuarios APICAM y Bases Privadas Fiscalizadas',
            customsRegimeEn: 'APICAM Port Concessionaires & Bonded Oilfield Logistics Bases',
            commercialServices: [
              'Bombeo simultáneo de lodos de perforación base aceite/agua, salmueras de terminación, diésel marino y agua potable',
              'Suministro neumático de cemento petrolero, barita y bentonita a granel hacia barcos estimuladores y PSV',
              'Mantenimiento naval, soldadura certificada, overhaul de motores marinos y rehabilitación de equipos offshore (Cotemar)',
              'Gestión integral MARPOL (residuos aceitosos, recortes de perforación y aguas residuales)',
            ],
            commercialServicesEn: [
              'Simultaneous bulk pumping of oil/water-based drilling muds, completion brines, marine gasoil and drill water',
              'Pneumatic bulk transfer of oilwell cement, barite and bentonite to stimulation vessels & PSVs',
              'Marine hull/machinery maintenance, certified welding and offshore rig refurbishment support (Cotemar)',
              'Certified MARPOL waste reception (slops, drilling cuttings & bilge/grey water)',
            ],
            infrastructureHighlights: [
              '1,450 m de frentes de atraque especializados distribuidos en Dársenas 3 y 4',
              'Plantas de lodos y silos neumáticos conectados directamente por tubería a cada posición',
              'Ecosistema concentrado de +100 contratistas internacionales de perforación y producción',
            ],
            infrastructureHighlightsEn: [
              '1,450 m specialized oilfield quay across Basins 3 & 4',
              'Shore-to-berth manifold pipelines for muds, brines, dry bulk cement/barite and MGO',
              'Co-located ecosystem of 100+ upstream drilling, completion and marine contractors',
            ],
            vesselTypesServed: [
              'Buques Estimuladores de Pozos y Cementadores',
              'PSV / OSV Especializados en Granel Líquido y Neumático',
              'Floteles y Barcazas de Mantenimiento Costa Afuera',
            ],
            vesselTypesServedEn: [
              'Well Stimulation & Acidizing Vessels',
              'Liquid Mud & Dry Bulk Offshore Supply Vessels (PSV/OSV)',
              'Offshore Accommodation Barges & Workboats',
            ],
            connectivity:
              'Acceso interior al Parque Industrial Laguna Azul con logística integrada hacia terminales aéreas y Dos Bocas.',
            connectivityEn:
              'Internal road access inside Laguna Azul Oilfield Park linking heliports and Dos Bocas corridor.',
            operationalAdvantages: [
              'Abastecimiento simultáneo multi-línea (lodos + barita + diésel + agua) que reduce estadía en muelle.',
              'Capacidades técnicas de reparación naval y prefabricación de spools en el mismo complejo.',
            ],
            operationalAdvantagesEn: [
              'Simultaneous multi-hose transfer (muds + barite + MGO + water) cutting berth occupancy.',
              'On-site marine engineering, spool fabrication and emergency vessel repair.',
            ],
            keyClientsOrTrades: ['PEMEX Exploración y Producción', 'Cotemar', 'Halliburton', 'SLB / Naviera Integral'],
            certifications: ['PBIP / ISPS', 'ISO 9001 / ISO 14001 / ISO 45001', 'MARPOL Anexos I–V'],
          },
          procedures: ['Certificado de limpieza y compatibilidad para lodos base aceite y barita.'],
          restrictionsSummary: 'Calado máx. 5.2 m; estricto control MARPOL en Laguna Azul.',
          berths: [
            {
              idSuffix: 'car-d3-4',
              name: 'Muelles Especializados Dársenas 3 y 4 (Laguna Azul)',
              lengthM: 1450,
              maxLoaM: 100,
              maxBeamM: 20.0,
              berthDepthM: 6.0,
              maxDraftM: 5.2,
              products: ['Lodos de perforación', 'Barita y cemento a granel', 'Diésel marino', 'Químicos de estimulación'],
              cargoGroups: ['Hidrocarburos y Gas', 'Carga Proyecto'],
              equipment: ['Silos neumáticos', 'Bombas de transferencia de lodos', 'Grúas de patio'],
              connections: ['Bases industriales de +100 compañías petroleras'],
              loadingRate: 'Bombeo simultáneo lodos/diésel/agua',
              notes: 'Centro neurálgico del servicio costa afuera en Campeche.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'barra-draft',
          category: 'Física',
          title: 'Limitación de Calado en Canal de Barra (5.40 m)',
          titleEn: 'Bar Channel Draft Restriction (5.40 m)',
          detail:
            'La barra de acceso restringe el calado máximo operativo a ~5.40 m (17.7 ft); buques con mayor calado deben operar desde Dos Bocas o Coatzacoalcos.',
          detailEn:
            'Natural entrance bar restricts max operational draft to ~5.40 m (17.7 ft); deeper vessels route via Dos Bocas or Coatzacoalcos.',
          limitValue: '5.40 m máx.',
          verificationStatus: 'verified',
          source: 'Capitanía de Puerto Ciudad del Carmen / APICAM',
        },
        {
          idSuffix: 'anchorage-poly',
          category: 'Operativa',
          title: 'Fondeo Estricto Dentro del Polígono Oficial',
          titleEn: 'Mandatory Official Anchorage Polygon',
          detail:
            'Toda embarcación en espera debe fondear dentro del polígono 18°44\'N–18°46\'N · 091°50\'W–091°54\'W evitando rutas de plataformas.',
          detailEn:
            'Waiting vessels must anchor strictly inside 18°44\'N–18°46\'N · 091°50\'W–091°54\'W clear of platform lanes.',
          limitValue: 'Polígono oficial',
          verificationStatus: 'verified',
          source: 'APICAM / Capitanía Isla del Carmen',
        },
      ],
      sampleVessel: 'OSV Campeche Bay',
      sampleImo: '9419820',
      sampleBerth: 'Muelles Dársenas 3 y 4 (Laguna Azul)',
      sampleCargo: 'Lodos y equipo petrolero · 1,850 MT',
      sampleStatus: 'EXPECTED',
    },

    // 7. PROGRESO
    {
      id: 'mxpro',
      shortCode: 'PRO',
      name: 'Puerto de Progreso',
      unLocode: 'MXPGO',
      region: 'GOLFO DE MÉXICO',
      state: 'Yucatán · Península de Yucatán',
      coordinates: "21°18'24\"N · 89°40'18\"W",
      vhfChannel: 'CH 16 / CH 12 (CCTM Progreso)',
      authority: 'ASIPONA Progreso · Capitanía de Puerto',
      lineupSourceUrl: 'https://www.lineaships.com/es/itinerarios/',
      lineupConnector: 'PRO_OPERATOR_HTML',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Progreso: Terminal Remota conectada por viaducto de 6.5 km con 10–11 posiciones en 2,400 m de muelle; canal dragado a 42 ft con calado oficial operativo de 32 ft (9.75 m) y ciaboga de 450 m; fondeadero general limitado a 23 ft (7.0 m) al N/NW.',
      operatingRulesUrl: 'https://www.puertoprogreso.com.mx/reglas-de-operacion',
      headlineEs: 'Progreso. Terminal Remota (2,400 m) y Viaducto de Yucatán.',
      headlineEn: 'Progreso. 2,400 m Offshore Terminal & Yucatán Viaduct.',
      overviewEs:
        'Plataforma portuaria mar adentro unida a tierra mediante el viaducto más largo de México. Opera 10–11 posiciones de atraque en 2,400 m de longitud: TEC Contenedores (APM Terminals), TUM 1–3, Granel Agrícola (Multisur), Muelle 9 Hidrocarburos (9.75 m / 32 ft) y Terminal de Cruceros y Transbordadores.',
      overviewEn:
        'Offshore port platform connected by a 6.5 km viaduct. Operates 10–11 berths over 2,400 m of quay: APM Terminals TEC, TUM 1–3, Multisur Grain, Berth 9 Hydrocarbons (9.75 m / 32 ft) and Cruise & Ferry terminal.',
      heroImageType: 'recintoSur',
      channels: [
        {
          id: 'ch-pro-main',
          name: 'Canal de Acceso Terminal Remota Progreso',
          lengthNm: 3.4,
          widthM: 150,
          channelDepthM: 12.8,
          operationalDraftM: 9.75,
          squatAllowanceNote:
            'Canal dragado a 42 ft (12.8 m) y dársena de ciaboga de 450 m; calado oficial operativo máximo 32 ft (9.75 m) sobre losa caliza.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-pro-1',
          name: 'Fondeadero General Progreso (Oeste/Norte Terminal Remota)',
          purpose: 'Buques mercantes de calado reducido y espera de práctico',
          coordinates: "21°23'00\"N · 089°42'30\"W",
          depthM: '8.5 – 10.5 m (calado máx. recomendado 23 ft / 7.0 m)',
          maxVesselOrNotes:
            'Por escasa pendiente de la plataforma de Yucatán, buques > 23 ft de calado deben fondear más al norte (~6–8 MN) bajo instrucción de Capitanía.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'remota-carga',
          name: 'Terminal Remota · Carga, Contenedores, Graneles e Hidrocarburos (Muelles 1–9)',
          nameEn: 'Offshore Terminal · Cargo, Grain & Berth 9 Fuels',
          summary:
            'Concentra APM Terminals Yucatán (TEC), TUM 1, 2 y 3, terminal granelera agrícola (silos) y Muelle 9 de Hidrocarburos PEMEX (32 ft).',
          summaryEn:
            'Houses APM Terminals Yucatán (TEC), TUM 1–3, agricultural grain silos and Berth 9 PEMEX fuels (32 ft).',
          channelDepthM: 12.8,
          operationalDraftM: 9.75,
          turningBasinM: 450,
          daylightOnly: false,
          tugRequirement: '2 remolcadores obligatorios para todo buque > 120 m',
          pilotRequirement: 'Practicaje obligatorio desde boya de recalada',
        },
        {
          key: 'cruceros',
          name: 'Terminal de Cruceros SSA & Transbordadores',
          nameEn: 'Cruise & Ferry Terminal',
          summary:
            'Espigón turístico y de cruceros internacionales capaz de atender simultáneamente buques de pasaje de gran eslora.',
          summaryEn:
            'Dedicated cruise and ferry pier accommodating large international cruise vessels.',
          channelDepthM: 12.8,
          operationalDraftM: 9.75,
          turningBasinM: 450,
          daylightOnly: false,
          tugRequirement: 'Remolcadores en standby según condiciones de viento NE/Norte',
          pilotRequirement: 'Practicaje prioritario para ventanas de cruceros',
        },
      ],
      terminals: [
        {
          idSuffix: 'tec-tum',
          areaKey: 'remota-carga',
          name: 'TEC Contenedores (APM) & Terminales de Usos Múltiples (TUM 1, 2 y 3)',
          operator: 'APM Terminals Yucatán / Grupo Logra / Multisur',
          shortDesc:
            'Posiciones multipropósito y de contenedores en Terminal Remota con conectividad directa por el viaducto hacia Mérida.',
          shortDescEn:
            'Container and multipurpose berths at Terminal Remota with direct viaduct access to Mérida.',
          coordinates: "21°19'48\"N · 89°40'32\"W",
          mapX: 38,
          mapY: 38,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores', 'Granel Agrícola', 'Carga Proyecto'],
          storageSummary: {
            coveredSqm: 18500,
            openYardSqm: 62000,
            containerYardSqm: 115000,
            warehousesBreakdown:
              'Patio de 11.5 hectáreas en Terminal de Contenedores APM Terminals Yucatán (TEC) con tomas reefer, + silos de Granel Agrícola (Grupo Logra / Multisur) de 60,000+ MT y bodegas cubiertas para carga general y proyecto en TUM 1–3.',
            warehousesBreakdownEn:
              '11.5-hectare APM Terminals Yucatán Container Terminal (TEC) yard with reefer stacks + 60,000+ MT agricultural grain silos (Logra/Multisur) and covered sheds at TUM 1–3.',
          },
          commercialProfile: {
            positioningHeadline:
              'Plataforma Logística Offshore de Yucatán (Viaducto 6.5 km) — Contenedores APM, Granos y Proyectos',
            positioningHeadlineEn:
              'Yucatán Offshore Port Gateway (6.5 km Viaduct) — APM Containers, Grain Silos & Project Cargo',
            address: 'Terminal Remota s/n, Viaducto del Muelle Fiscal Km 6.5, Progreso, Yucatán',
            customsRegime: 'Recinto Fiscalizado Portuario (APM Terminals / Multisur / Logra) · Aduana de Progreso',
            customsRegimeEn: 'Bonded Port Concessions (APM Terminals / Multisur / Logra) · Progreso Customs',
            commercialServices: [
              'Carga/descarga de contenedores FCL, LCL, reefers refrigerados y consolidación en Terminal de Contenedores (APM Terminals Yucatán)',
              'Descarga mecanizada con almejas/succionadoras y ensilado de maíz amarillo, trigo y pasta de soya (Multisur / Logra)',
              'Maniobras de carga proyecto (turbinas eólicas, generadores, acero estructural) y vehículos Ro-Ro hacia Yucatán y Tren Maya',
              'Servicios de inspección fitosanitaria OISA/SENASICA y despacho aduanal integrado sobre plataforma offshore',
            ],
            commercialServicesEn: [
              'FCL, LCL & reefer container stevedoring, CFS consolidation and depot services at APM Terminals Yucatán',
              'Mechanized grain unloader/hopper discharge & silo storage for yellow corn, wheat and soymeal (Multisur/Logra)',
              'Heavy project cargo (wind turbines, power modules, steel) and Ro-Ro handling serving Yucatán & Maya corridor',
              'On-platform OISA/SENASICA phytosanitary inspection and integrated Progreso customs clearance',
            ],
            infrastructureHighlights: [
              '1,200+ m de muelles comerciales especializados (TEC + TUM 1, 2 y 3) dentro de 2,400 m de frente en Terminal Remota',
              'Grúas móviles portuarias de alta capacidad, reach-stackers electrificados en TEC y silos graneleros mecanizados',
              'Conectividad directa mar-tierra mediante el viaducto marítimo de 6.5 km (el más largo del continente)',
            ],
            infrastructureHighlightsEn: [
              '1,200+ m specialized commercial berths (TEC + TUM 1–3) inside Progreso’s 2,400 m Offshore Platform',
              'Mobile harbor cranes, electrified reach-stackers at APM TEC and mechanized grain silos',
              'Uncongested 6.5 km deep-water viaduct connecting offshore berths to Mérida industrial corridor',
            ],
            vesselTypesServed: [
              'Portacontenedores Regionales y Feeders (hasta 240 m LOA)',
              'Graneleros Panamax / Supramax / Handymax Agrícolas',
              'Buques de Carga Proyecto / Heavy-Lift y Ro-Ro',
            ],
            vesselTypesServedEn: [
              'Regional & Feeder Container Vessels (up to 240 m LOA)',
              'Agricultural Panamax / Supramax / Handymax Bulkers',
              'Heavy-Lift Project Cargo & Ro-Ro Carriers',
            ],
            connectivity:
              'Enlace carretero de 4 carriles vía Viaducto de 6.5 km hacia Autopista Mérida–Progreso (25 min a parques industriales y enlace de carga Tren Maya).',
            connectivityEn:
              '4-lane 6.5 km maritime viaduct directly onto Mérida–Progreso Expressway (25 min to Mérida parks & rail hub).',
            customsProcess: [
              'Transmisión VUMCE y manifiesto EDI BAPLIE / lista de granos 48 h antes del arribo.',
              'Inspección OISA / SENASICA en muelle para granos agrícolas y carga refrigerada perecedera.',
              'Despacho automatizado PITA en garita aduanal al pie del viaducto marítimo.',
              'Autorización previa de ASIPONA para convoyes sobredimensionados en cruce del viaducto.',
            ],
            customsProcessEn: [
              'VUMCE filing and EDI BAPLIE / bulk grain manifest 48 h prior to arrival.',
              'Dockside OISA/SENASICA phytosanitary inspection for agricultural grains and reefer perishables.',
              'Automated PITA customs gate release at viaduct shore abutment.',
              'ASIPONA heavy-haul escort permit for oversized project units crossing the 6.5 km viaduct.',
            ],
            operationalAdvantages: [
              'Principal puerta de exportación/importación contenerizada y agroindustrial de toda la Península de Yucatán.',
              'Aislamiento seguro de la mancha urbana gracias a la plataforma offshore en aguas abiertas.',
            ],
            operationalAdvantagesEn: [
              'Primary container & agro-bulk supply gateway for Yucatán, Campeche and Quintana Roo.',
              'Zero urban traffic bottleneck thanks to offshore island terminal layout.',
            ],
            keyClientsOrTrades: ['APM Terminals Yucatán', 'Grupo Logra / Multisur', 'Maersk / MSC / Hapag', 'Agroindustrias de Yucatán'],
            certifications: ['PBIP / ISPS', 'ISO 9001 / 14001', 'SENASICA Punto de Inspección Autorizado'],
          },
          procedures: ['Coordinar cruce de carga pesada por el viaducto de 6.5 km con ASIPONA.'],
          restrictionsSummary: 'Calado operativo 9.75 m (32 ft); 2,400 m lineales totales en recinto.',
          berths: [
            {
              idSuffix: 'pro-tec',
              name: 'TEC Contenedores & TUM 1, 2 y 3 (Granel Agrícola)',
              lengthM: 1200,
              maxLoaM: 240,
              maxBeamM: 32.3,
              berthDepthM: 11.0,
              maxDraftM: 9.75,
              products: ['Contenedores FCL/Reefer', 'Maíz amarillo', 'Pasta de soya', 'Trigo', 'Carga general'],
              cargoGroups: ['Carga General y Contenedores', 'Granel Agrícola'],
              equipment: ['Grúas móviles portuarias', 'Succionadoras de grano y silos', 'Patio reefer'],
              connections: ['Viaducto Marítimo 6.5 km hacia Mérida / Tren Maya carga'],
              loadingRate: '25 mov/h · 6,000 MT/día granel',
              notes: 'Incluye zonas de Granel Agrícola (silos) y carga proyecto.',
            },
          ],
        },
        {
          idSuffix: 'muelle-9-hidro',
          areaKey: 'remota-carga',
          name: 'Muelle 9 · Terminal de Hidrocarburos Progreso',
          operator: 'PEMEX Logística / Importadores Autorizados',
          shortDesc:
            'Muelle especializado en el extremo de la Terminal Remota para abastecimiento de combustibles de la Península de Yucatán.',
          shortDescEn:
            'Dedicated hydrocarbon berth supplying refined fuels to the Yucatán Peninsula.',
          coordinates: "21°20'05\"N · 89°40'18\"W",
          mapX: 66,
          mapY: 34,
          imageType: 'pajaritos',
          cargoGroups: ['Hidrocarburos y Gas'],
          storageSummary: {
            coveredSqm: 800,
            openYardSqm: 6500,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Cabezal de brazos marinos y sistema contraincendio en extremo norte de Terminal Remota enlazado por poliducto submarino/viaducto hacia Terminal de Almacenamiento Mérida.',
            warehousesBreakdownEn:
              'Marine loading arm manifold & fire-fighting platform at north tip of Terminal Remota linked via pipeline along viaduct to Mérida Tank Farm.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal Energética Estratégica de Combustibles para la Península de Yucatán (32 ft)',
            positioningHeadlineEn:
              'Strategic Hydrocarbon Jetty Supplying Refined Fuels Across the Yucatán Peninsula (32 ft)',
            address: 'Muelle 9, Extremo Terminal Remota, Puerto de Progreso, Yucatán',
            customsRegime: 'Terminal Especializada de Hidrocarburos · Aduana de Progreso',
            customsRegimeEn: 'Dedicated Hydrocarbon Berth · Progreso Customs',
            commercialServices: [
              'Descarga por brazos marinos de Gasolina Magna/Premium, Diésel UBA, Turbosina (Jet A-1) y Combustóleo',
              'Bombeo directo por poliducto hacia tanques de almacenamiento en tierra y distribución peninsular',
              'Protocolos de seguridad ISGOTT, inspección SIRE y contención contraincendio dedicada',
            ],
            commercialServicesEn: [
              'Marine loading-arm discharge of Motor Gasoline, ULSD Diesel, Jet A-1 and Fuel Oil',
              'Direct pipeline transfer to onshore storage terminals serving Yucatán & Quintana Roo',
              'Full ISGOTT terminal safety compliance, SIRE vetting and dedicated firefighting coverage',
            ],
            infrastructureHighlights: [
              '280 m de longitud con calado máximo oficial de 9.75 m (32 ft)',
              'Brazos marinos de carga/descarga 10" y 12" con paro de emergencia ESD y barreras flotantes',
            ],
            infrastructureHighlightsEn: [
              '280 m dedicated dolphin jetty rated to 9.75 m (32 ft) official draft',
              '10" & 12" marine loading arms equipped with ESD interlocks and containment booms',
            ],
            vesselTypesServed: ['Buques Tanque MR / Handysize de Productos Limpios y Negros (hasta 205 m LOA)'],
            vesselTypesServedEn: ['MR / Handysize Clean & Dirty Product Tankers (up to 205 m LOA)'],
            connectivity:
              'Poliducto dedicado a lo largo del viaducto hacia TAD PEMEX Progreso / Mérida y red energética de CFE.',
            connectivityEn:
              'Dedicated multi-product pipeline along viaduct to Progreso/Mérida tank farms and CFE power plants.',
            operationalAdvantages: [
              'Única posición especializada para importación de petrolíferos y turbosina de la Península de Yucatán.',
              'Aislamiento perimetral extremo respecto a áreas comerciales y turísticas del puerto.',
            ],
            operationalAdvantagesEn: [
              'Sole deep-water refined fuel and Jet A-1 import berth serving the Yucatán Peninsula.',
              'Maximum safety standoff at outer tip of the offshore platform.',
            ],
            certifications: ['PBIP / ISPS', 'ISGOTT / OCIMF SIRE', 'ASEA'],
          },
          procedures: ['Vetting SIRE, checklist ISGOTT y vigilancia contraincendio continua.'],
          restrictionsSummary: 'Calado oficial máximo 9.75 m (32 ft).',
          berths: [
            {
              idSuffix: 'pro-m9',
              name: 'Muelle 9 Hidrocarburos',
              lengthM: 280,
              maxLoaM: 205,
              maxBeamM: 32.2,
              berthDepthM: 11.0,
              maxDraftM: 9.75,
              products: ['Gasolina', 'Diésel UBA', 'Turbosina', 'Combustóleo'],
              cargoGroups: ['Hidrocarburos y Gas'],
              equipment: ['Brazos marinos 10" y 12"', 'Sistema ESD y barreras marinas'],
              connections: ['Poliducto submarino/viaducto hacia Terminal Mérida'],
              loadingRate: '1,400 – 2,200 m³/h',
              notes: 'Infraestructura estratégica energética de Yucatán.',
            },
          ],
        },
        {
          idSuffix: 'cruceros-ferry',
          areaKey: 'cruceros',
          name: 'Terminal de Cruceros y Transbordadores (SSA México)',
          operator: 'SSA México / ASIPONA Progreso',
          shortDesc:
            'Muelles turísticos y de transbordadores con edificio terminal de pasajeros y tiendas libres de impuestos.',
          shortDescEn:
            'Cruise and ferry berths equipped with passenger terminal and duty-free infrastructure.',
          coordinates: "21°19'30\"N · 89°40'12\"W",
          mapX: 54,
          mapY: 64,
          imageType: 'hero',
          cargoGroups: ['Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 9200,
            openYardSqm: 22000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Edificio terminal internacional de pasajeros con módulos de Migración (INM) y Aduana, áreas duty-free, bahías de autobuses turísticos y zona logística de avituallamiento de cruceros.',
            warehousesBreakdownEn:
              'International passenger terminal building housing INM Immigration & Customs halls, duty-free retail, tour-coach staging and cruise provisioning bays.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal de Cruceros y Transbordadores (SSA México) — Puerta Turística al Mundo Maya',
            positioningHeadlineEn:
              'International Cruise & Ro-Pax Terminal (SSA México) — Gateway to Mérida & Mayan Sites',
            address: 'Terminal de Cruceros, Terminal Remota Km 6.5, Progreso, Yucatán',
            customsRegime: 'Recinto Portuario Turístico PBIP · INM / Aduana de Progreso',
            customsRegimeEn: 'ISPS International Passenger Port · INM / Progreso Customs',
            commercialServices: [
              'Atraque simultáneo de megacruceros hasta 330 m LOA y transbordadores Ro-Pax del Golfo/Caribe',
              'Gestión integral de flujo de pasajeros (hasta 4,500 pax/escala), despacho INM y aduana turística',
              'Avituallamiento hotelero, suministro de agua potable y recepción certificada de residuos MARPOL',
            ],
            commercialServicesEn: [
              'Simultaneous berthing for mega cruise vessels up to 330 m LOA and Gulf/Caribbean Ro-Pax ferries',
              'End-to-end passenger embarkation/transit (up to 4,500 pax/call), INM immigration and customs screening',
              'Hotel stores provisioning, potable water bunkering and certified MARPOL waste reception',
            ],
            infrastructureHighlights: [
              '640 m de frente en Muelles Este/Oeste + rampa especializada Ro-Pax',
              'Terminal de pasajeros climatizada, tienda libre de impuestos y parque de excursiones',
            ],
            infrastructureHighlightsEn: [
              '640 m East/West cruise quay walls + dedicated Ro-Pax stern ramp',
              'Air-conditioned passenger concourse, duty-free plaza and excursion coach terminal',
            ],
            vesselTypesServed: ['Megacruceros Internacionales (hasta 330 m LOA)', 'Transbordadores Ro-Pax / Fast Ferries'],
            vesselTypesServedEn: ['Mega Cruise Ships (up to 330 m LOA)', 'Ro-Pax & Fast Ferries'],
            connectivity:
              'Acceso directo por viaducto hacia Mérida, Chichén Itzá, Uxmal y red hotelera de Yucatán.',
            connectivityEn:
              'Direct viaduct dispatch toward Mérida, Chichén Itzá, Uxmal and Yucatán resorts.',
            operationalAdvantages: [
              'Atención prioritaria garantizada conforme al calendario anual de líneas navieras de crucero.',
              'Operación dual cruceros + carga Ro-Pax de abastecimiento peninsular.',
            ],
            operationalAdvantagesEn: [
              'Guaranteed berth windows aligned with annual international cruise line schedules.',
              'Dual cruise tourism and Gulf Ro-Pax supply connectivity.',
            ],
            keyClientsOrTrades: ['Carnival Cruise Line', 'Royal Caribbean', 'Disney Cruise Line', 'Operadores Ro-Pax'],
            certifications: ['PBIP / ISPS Nivel 1/2', 'Sanidad Internacional / Libre Plática'],
          },
          procedures: ['Protocolo PBIP/ISPS Nivel 1/2 y despacho migratorio INM en terminal.'],
          restrictionsSummary: 'Eslora máx. cruceros hasta 330 m; calado 9.75 m.',
          berths: [
            {
              idSuffix: 'pro-cr',
              name: 'Muelles de Cruceros Este/Oeste y Rampa Transbordadores',
              lengthM: 640,
              maxLoaM: 330,
              maxBeamM: 40.0,
              berthDepthM: 11.0,
              maxDraftM: 9.75,
              products: ['Cruceros internacionales', 'Transbordadores Ro-Pax', 'Provisiones'],
              cargoGroups: ['Carga General y Contenedores'],
              equipment: ['Pasarelas de pasajeros', 'Terminal migratoria y aduanal'],
              connections: ['Transporte turístico directo por viaducto'],
              loadingRate: 'Embarque/desembarque hasta 4,500 pasajeros',
              notes: 'Operación prioritaria según calendario anual de cruceros.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'draft-32-limestone',
          areaKey: 'remota-carga',
          category: 'Física',
          title: 'Calado Oficial 9.75 m (32 ft) sobre Losa Caliza',
          titleEn: 'Official 9.75 m (32 ft) Draft over Limestone Shelf',
          detail:
            'Aunque el canal está dragado a 42 ft, el calado oficial operativo está limitado a 32 ft (9.75 m) por naturaleza rocosa del fondo.',
          detailEn:
            'While channel is dredged to 42 ft, official operational draft is capped at 32 ft (9.75 m) due to rocky seabed.',
          limitValue: '9.75 m (32 ft)',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Progreso',
        },
        {
          idSuffix: 'anchorage-23ft',
          category: 'Operativa',
          title: 'Restricción de Calado en Fondeadero General (23 ft)',
          titleEn: 'General Anchorage Draft Cap (23 ft)',
          detail:
            'El fondeadero en 21°23\'00"N 089°42\'30"W solo admite hasta 23 ft (7.0 m); buques mayores deben fondear más alejados mar adentro.',
          detailEn:
            'Main anchorage at 21°23\'00"N 089°42\'30"W supports up to 23 ft (7.0 m); deeper vessels anchor farther offshore.',
          limitValue: '23 ft (7.0 m)',
          verificationStatus: 'verified',
          source: 'Capitanía de Puerto Progreso',
        },
      ],
      sampleVessel: 'MV Yucatan Carrier',
      sampleImo: '9663014',
      sampleBerth: 'TEC Contenedores & TUM 1–3',
      sampleCargo: 'Maíz amarillo · 24,000 MT',
      sampleStatus: 'EXPECTED',
    },

    // 8. MANZANILLO
    {
      id: 'mxman',
      shortCode: 'MAN',
      name: 'Puerto de Manzanillo',
      unLocode: 'MXZLO',
      region: 'PACÍFICO CENTRO',
      state: 'Colima · Pacífico Mexicano',
      coordinates: "19°03'36\"N · 104°18'12\"W",
      vhfChannel: 'CH 16 / CH 12 (CCTM Manzanillo)',
      authority: 'ASIPONA Manzanillo · Capitanía de Puerto',
      lineupSourceUrl: 'https://www.puertomanzanillo.com.mx/esps/0000208/programacion-de-buques.html',
      lineupConnector: 'HISTORICAL_INDEX',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Manzanillo: Puerto interior de San Pedrito (19+ posiciones comerciales, dársenas norte y sur de 600 m a -17.0/-18.5 m, canal -18.0 m, calado máximo autorizado 15.5 m) + Terminal de GNL en Laguna de Cuyutlán; zonas de fondeo Alfa, Bravo y Charly (Charly exclusiva para mercancía peligrosa/buques tanque).',
      operatingRulesUrl: 'https://www.puertomanzanillo.com.mx/esps/0000197/reglas-de-operacion.html',
      headlineEs: 'Manzanillo. Líder nacional en contenedores y San Pedrito / Cuyutlán.',
      headlineEn: 'Manzanillo. Mexico’s #1 Pacific container port & Cuyutlán LNG.',
      overviewEs:
        'Principal puerta comercial del Pacífico mexicano en carga contenerizada. Comprende el Puerto Interior de San Pedrito (SSA México TEC I, Contecon Manzanillo TEC II, Hutchison TIMSA, Hazesa, Ocupa, Cruceros y PEMEX) y la zona energética de Laguna de Cuyutlán (Terminal GNL KMS).',
      overviewEn:
        'Mexico’s leading Pacific container gateway encompassing San Pedrito Inner Port (SSA TEC I, Contecon TEC II, TIMSA, Hazesa, Ocupa, Cruise & PEMEX) and Laguna de Cuyutlán (LNG terminal).',
      heroImageType: 'recintoSur',
      channels: [
        {
          id: 'ch-man-sanpedrito',
          name: 'Canal de Acceso San Pedrito y Dársenas Norte / Sur',
          lengthNm: 2.1,
          widthM: 220,
          channelDepthM: 18.0,
          operationalDraftM: 15.5,
          squatAllowanceNote:
            'Canal principal dragado a -18.0 m; dársenas de ciaboga Norte y Sur de 600 m (-17.0 a -18.5 m); calado op. 13.0–15.5 m según posición TEC.',
          verificationStatus: 'verified',
        },
        {
          id: 'ch-man-cuyutlan',
          name: 'Canal de Acceso Laguna de Cuyutlán (Zona GNL)',
          lengthNm: 1.6,
          widthM: 240,
          channelDepthM: 16.5,
          operationalDraftM: 14.0,
          squatAllowanceNote:
            'Dársena exclusiva para buques metaneros GNL y futura expansión portuaria Cuyutlán.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-man-alfa',
          name: 'Zona de Fondeo "Alfa" (Bahía de Manzanillo)',
          purpose: 'Buques portacontenedores y carga general en espera de ventana',
          coordinates: "19°04.2'N · 104°20.5'W (Bahía interior norte)",
          depthM: '18.0 – 32.0 m',
          maxVesselOrNotes:
            'Asignada por CCTM Manzanillo según orden de arribo y ventana de terminal.',
          verificationStatus: 'verified',
        },
        {
          id: 'az-man-bravo',
          name: 'Zona de Fondeo "Bravo" (Bahía de Santiago)',
          purpose: 'Graneleros minerales, agrícolas y buques de mayor porte',
          coordinates: "19°05.8'N · 104°22.0'W",
          depthM: '25.0 – 40.0 m',
          maxVesselOrNotes:
            'Mantener radioescucha continua VHF CH 12/16; evitar deriva hacia zona turística de playa.',
          verificationStatus: 'verified',
        },
        {
          id: 'az-man-charly',
          name: 'Zona de Fondeo "Charly" (Mercancías Peligrosas y Tanques)',
          purpose: 'Buques tanque hidrocarburos, químicos y carga IMDG Clase 1/2/3',
          coordinates: "19°03.0'N · 104°22.8'W (Exterior Bahía)",
          depthM: '30.0 – 48.0 m',
          maxVesselOrNotes:
            'Uso obligatorio para buques con mercancías peligrosas, inflamables o en espera de Terminal PEMEX / GNL.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'san-pedrito',
          name: 'Puerto Interior San Pedrito (TEC I · TEC II · TIMSA · Hazesa · PEMEX)',
          nameEn: 'San Pedrito Inner Port',
          summary:
            'Concentra más de 19 posiciones de altura entre terminales especializadas de contenedores, minerales, granos, vehículos, cruceros y combustibles.',
          summaryEn:
            'Over 19 deep-water berths spanning container terminals, dry bulk, RoRo, cruise and PEMEX fuels.',
          channelDepthM: 18.0,
          operationalDraftM: 15.5,
          turningBasinM: 600,
          daylightOnly: false,
          tugRequirement: '2 a 4 remolcadores azimutales según eslora (hasta 366 m LOA)',
          pilotRequirement: 'Practicaje obligatorio 24/7; coordinación CCTM Manzanillo',
        },
        {
          key: 'cuyutlan',
          name: 'Laguna de Cuyutlán (Terminal GNL & Expansión)',
          nameEn: 'Laguna de Cuyutlán LNG & Expansion',
          summary:
            'Zona energética dedicada al recibo y regasificación de Gas Natural Licuado (Terminal KMS) y proyectos de expansión portuaria.',
          summaryEn:
            'Dedicated energy port zone for LNG regasification (KMS Terminal) and deep-water expansion.',
          channelDepthM: 16.5,
          operationalDraftM: 14.0,
          turningBasinM: 550,
          daylightOnly: true,
          tugRequirement: '3 a 4 remolcadores de escolta obligatoria para metaneros',
          pilotRequirement: 'Maniobra diurna exclusiva con escolta de seguridad marítima',
        },
      ],
      terminals: [
        {
          idSuffix: 'tec1-ssa',
          areaKey: 'san-pedrito',
          name: 'TEC I (SSA México) & Hutchison Ports TIMSA',
          operator: 'SSA México / Hutchison Ports TIMSA',
          shortDesc:
            'Principales terminales de contenedores y usos múltiples en San Pedrito con grúas Súper Post-Panamax y conexión ferroviaria directa.',
          shortDescEn:
            'Primary container and multipurpose terminals at San Pedrito featuring Super Post-Panamax cranes and on-dock rail.',
          coordinates: "19°03'52\"N · 104°17'44\"W",
          mapX: 32,
          mapY: 36,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 28000,
            openYardSqm: 140000,
            containerYardSqm: 480000,
            warehousesBreakdown:
              'Más de 48 ha de patios contenerizados en TEC I (SSA México) + Hutchison TIMSA con capacidad estática superior a 33,000 TEUs, >1,000 tomas reefer, Recinto Fiscalizado Estratégico (RFE) y bodegas CFS.',
            warehousesBreakdownEn:
              '48+ ha of container yards across TEC I (SSA México) & Hutchison TIMSA offering >33,000 TEU static capacity, 1,000+ reefer plugs, Strategic Bonded Zone (RFE) and CFS sheds.',
          },
          commercialProfile: {
            positioningHeadline:
              'Complejo Líder del Pacífico (TEC I SSA México & Hutchison TIMSA) — +1.5M TEUs/Año y Ferrocarril On-Dock',
            positioningHeadlineEn:
              'Flagship Manzanillo Container Hub (SSA TEC I & TIMSA) — 1.5M+ TEUs/Yr & On-Dock Double-Stack Rail',
            address: 'Av. Teniente Azueta s/n, Col. Burócrata, Puerto Interior San Pedrito, Manzanillo, Colima',
            customsRegime: 'Recinto Fiscalizado y Recinto Fiscalizado Estratégico (RFE) · Aduana de Manzanillo',
            customsRegimeEn: 'Bonded Port Concessions & Strategic Fiscal Zone (RFE) · Manzanillo Customs',
            commercialServices: [
              'Estiba/desestiba de contenedores FCL/LCL de gran volumen con >16 grúas Súper Post-Panamax (35–42 mov/h)',
              'Cadena de frío de alta densidad con >1,000 tomas reefer e inspecciones OISA / SENASICA / COFEPRIS in-situ',
              'Despacho multimodal en espuelas ferroviarias on-dock Ferromex hacia Guadalajara, Bajío y Valle de México',
              'Servicios de desconsolidación CFS, manejo de mercancía sobredimensionada OOG, acero y carga general (TIMSA)',
            ],
            commercialServicesEn: [
              'High-velocity FCL/LCL container operations with 16+ Super Post-Panamax STS cranes (35–42 mph)',
              'High-density cold chain with 1,000+ reefer plugs and dockside OISA/SENASICA/COFEPRIS inspection halls',
              'On-dock Ferromex double-stack intermodal rail dispatch to Guadalajara, Bajío & Mexico City',
              'CFS deconsolidation, Out-of-Gauge (OOG) project lifts, steel coils and multipurpose cargo at TIMSA',
            ],
            infrastructureHighlights: [
              '1,450+ m de frente de atraque conjunto con esloras hasta 366 m LOA y 13.5 m de calado operativo',
              'Ecosistema integrado por 16+ grúas STS, flota RTG electrificada y espuelas ferroviarias dentro del recinto',
              'Respaldo del Recinto Fiscalizado Estratégico (RFE) para almacenamiento diferido de impuestos y valor agregado',
            ],
            infrastructureHighlightsEn: [
              '1,450+ m combined quay accommodating 366 m LOA vessels at 13.5 m operational draft',
              '16+ Super Post-Panamax STS cranes, RTG blocks and multi-track on-dock rail sidings',
              'Strategic Bonded Zone (RFE) enabling tax-deferred warehousing and distribution',
            ],
            vesselTypesServed: [
              'Portacontenedores Post-Panamax y New-Panamax (hasta 14,000 TEUs / 366 m LOA)',
              'Buques Multipropósito / Carga General / Heavy-Lift (TIMSA)',
            ],
            vesselTypesServedEn: [
              'Post-Panamax & New-Panamax Container Ships (up to 14,000 TEU / 366 m LOA)',
              'Multipurpose Breakbulk & Heavy-Lift Carriers (TIMSA)',
            ],
            connectivity:
              'Conexión ferroviaria on-dock directa de Ferromex (Manzanillo–Guadalajara–Irapuato–CDMX–El Paso) + Autopista de cuota 54D Manzanillo–Guadalajara.',
            connectivityEn:
              'Direct Ferromex on-dock rail corridor (Manzanillo–Guadalajara–Bajío–CDMX) + 4-lane Toll Hwy 54D.',
            customsProcess: [
              'Transmisión electrónica VUCEM, manifiesto EDI BAPLIE y programación de citas digitales de transporte 24 h antes.',
              'Reconocimiento aduanero automatizado PITA y plataforma única de inspección agrícola/sanitaria en terminal.',
              'Programación de salida en tren intermodal directo o despacho carretero con lector RFID/OCR en garita.',
            ],
            customsProcessEn: [
              'VUCEM electronic manifest, EDI BAPLIE and digital truck appointment booking 24 h pre-arrival.',
              'PITA automated customs inspection and unified OISA/COFEPRIS examination bays.',
              'Intermodal rail release or OCR/RFID-automated road gate exit.',
            ],
            operationalAdvantages: [
              'Mayor ecosistema logístico, aduanal y de transporte contenerizado del país (Manzanillo ~4M TEUs totales).',
              'Alta frecuencia de recaladas semanales directas Transpacífico desde Asia y Costa Oeste.',
            ],
            operationalAdvantagesEn: [
              'Anchored within Mexico’s largest container hub (~4M TEUs portwide) with unmatched logistics density.',
              'Highest weekly frequency of direct Transpacific Asia–Mexico liner loops.',
            ],
            keyClientsOrTrades: ['SSA México', 'Hutchison Ports TIMSA', 'MSC / Maersk / CMA CGM / COSCO', 'Ferromex'],
            certifications: ['PBIP / ISPS', 'OEA (Operador Económico Autorizado)', 'C-TPAT', 'ISO 9001 / 14001 / 28000'],
          },
          procedures: ['Ventana fija semanal y transmisión EDI BAPLIE 24 h previas.'],
          restrictionsSummary: 'Calado diseño -14.5 m; calado op. 13.0 – 13.5 m (Súper Post-Panamax).',
          berths: [
            {
              idSuffix: 'man-ssa',
              name: 'Posiciones TEC I (SSA) & Muelles TIMSA',
              lengthM: 1450,
              maxLoaM: 366,
              maxBeamM: 49.0,
              berthDepthM: 14.5,
              maxDraftM: 13.5,
              products: ['Contenedores FCL/LCL', 'Reefer', 'Carga general', 'Acero'],
              cargoGroups: ['Carga General y Contenedores'],
              equipment: ['16+ Grúas Pórtico Ship-to-Shore', 'Grúas RTG y espuelas ferroviarias'],
              connections: ['Ferromex corredor Guadalajara–Bajío–CDMX'],
              loadingRate: '35 – 42 mov/hora por grúa',
              notes: 'Alta densidad operativa en San Pedrito.',
            },
          ],
        },
        {
          idSuffix: 'tec2-contecon',
          areaKey: 'san-pedrito',
          name: 'TEC II · Contecon Manzanillo (ICTSI)',
          operator: 'Contecon Manzanillo S.A. de C.V.',
          shortDesc:
            'Terminal especializada de contenedores en Zona Norte de San Pedrito preparada para buques de mayor calado del Pacífico.',
          shortDescEn:
            'Deep-water container terminal in Northern San Pedrito serving ultra-large Pacific vessels.',
          coordinates: "19°04'38\"N · 104°17'10\"W",
          mapX: 56,
          mapY: 30,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 14000,
            openYardSqm: 45000,
            containerYardSqm: 720000,
            warehousesBreakdown:
              'Más de 72 hectáreas desarrolladas en Zona Norte de San Pedrito (ICTSI Contecon Manzanillo) con bloques automatizados de contenedores, zona reefer ampliada (+1,000 tomas), almacén de inspección aduanal y patio ferroviario intermodal.',
            warehousesBreakdownEn:
              '72+ hectares in Northern San Pedrito (ICTSI Contecon Manzanillo) featuring semi-automated RTG container blocks, 1,000+ reefer plugs, customs exam warehouse and on-dock rail yard.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal de Aguas Profundas TEC II (Contecon ICTSI) — Calado hasta 15.5 m para Megabuques ULCS',
            positioningHeadlineEn:
              'Deep-Water TEC II Container Terminal (Contecon ICTSI) — 15.5 m Draft for Megamax / ULCS Pacific Calls',
            address: 'Zona Norte Puerto Interior San Pedrito s/n, Manzanillo, Colima',
            customsRegime: 'Recinto Fiscalizado Privado (Contecon Manzanillo / ICTSI) · Aduana de Manzanillo',
            customsRegimeEn: 'Bonded Private Concession (Contecon Manzanillo / ICTSI) · Manzanillo Customs',
            commercialServices: [
              'Atención a buques portacontenedores de última generación (ULCS / Megamax hasta 366+ m y 15.5 m calado)',
              'Productividad de 36–44 mov/hora por grúa con 10+ grúas STS de alcance hasta 24 filas de contenedores',
              'Almacenaje y monitoreo inteligente de carga refrigerada reefer e inspecciones aduanales/fitosanitarias in-situ',
              'Integración ferroviaria directa y portal digital autónomo de citas, pagos y liberación aduanal',
            ],
            commercialServicesEn: [
              'Ultra-Large Container Ship (ULCS/Megamax) berthing up to 366+ m LOA and 15.5 m authorized draft',
              'High-speed 36–44 mph crane productivity with 10+ 24-row Super Post-Panamax STS cranes',
              'Smart reefer monitoring, dangerous goods (IMDG) segregation and dockside customs/OISA exam facility',
              'Direct on-dock rail blocks and 100% digital gate/appointment/billing portal',
            ],
            infrastructureHighlights: [
              '1,080 m de muelle en aguas profundas (-16.5 m pie de muelle / Dársena Norte -17.0 m)',
              'Capacidad anual superior a 1.5 – 1.7 millones de TEUs dentro de la expansión Zona Norte',
              '10 grúas Pórtico Súper Post-Panamax y bloques RTG de alta densidad con vía férrea intermodal',
            ],
            infrastructureHighlightsEn: [
              '1,080 m deep-water berth wall (-16.5 m alongside / North Turning Basin -17.0 m)',
              'Over 1.5–1.7M TEUs annual throughput capacity in Manzanillo North Zone',
              '10 Super Post-Panamax STS cranes + high-density RTG stacks and on-dock rail tracks',
            ],
            vesselTypesServed: [
              'Megabuques Portacontenedores ULCS / New-Panamax (hasta 15,000+ TEUs)',
              'Buques con Carga Proyecto Sobredimensionada (OOG) bajo grúa pórtico',
            ],
            vesselTypesServedEn: [
              'Ultra-Large / New-Panamax Container Vessels (15,000+ TEUs)',
              'Oversized Out-of-Gauge (OOG) Project Cargo under STS cranes',
            ],
            connectivity:
              'Vías férreas Ferromex dentro de Zona Norte + libramiento carretero norte de Manzanillo sin cruce por centro urbano.',
            connectivityEn:
              'On-dock Ferromex intermodal sidings + northern Manzanillo freight bypass avoiding downtown traffic.',
            customsProcess: [
              'Registro electrónico en plataforma Contecon Digital + VUCEM y BAPLIE 48 h previas al arribo.',
              'Despacho sin papeles en garita automática OCR/RFID y módulo único de reconocimiento aduanero.',
              'Traslado ferroviario en bloque hacia terminales interiores de Guadalajara, Silao y Pantaco CDMX.',
            ],
            customsProcessEn: [
              'Electronic pre-registration on Contecon portal + VUCEM & BAPLIE 48 h pre-ETA.',
              'Paperless OCR/RFID automated truck gate and integrated customs/OISA inspection bay.',
              'Scheduled block-train dispatch to Guadalajara, Bajío and Mexico City inland ramps.',
            ],
            operationalAdvantages: [
              'Mayor calado autorizado para portacontenedores en San Pedrito (hasta 15.5 m) evitando alijos en Asia.',
              'Ruta logística norte con tiempos ágiles de ingreso y salida de autotransporte pesado.',
            ],
            operationalAdvantagesEn: [
              'Deepest container berth draft in San Pedrito (15.5 m) maximizing Pacific vessel load factors.',
              'North bypass highway access cutting truck turnaround times.',
            ],
            keyClientsOrTrades: ['ICTSI Contecon', 'CMA CGM / COSCO / ONE / Hapag-Lloyd / Evergreen', 'Ferromex'],
            certifications: ['PBIP / ISPS', 'OEA', 'ISO 9001 / 14001 / 45001', 'Clean Port'],
          },
          procedures: ['Registro en plataforma digital Contecon + VUMCE 48 h previas.'],
          restrictionsSummary: 'Dársena Norte -17.0 m; calado autorizado hasta 15.2 – 15.5 m.',
          berths: [
            {
              idSuffix: 'man-tec2',
              name: 'Posiciones TEC II Zona Norte',
              lengthM: 1080,
              maxLoaM: 366,
              maxBeamM: 51.0,
              berthDepthM: 16.5,
              maxDraftM: 15.5,
              products: ['Contenedores FCL/LCL', 'Carga refrigerada', 'Carga proyecto sobredimensionada'],
              cargoGroups: ['Carga General y Contenedores', 'Carga Proyecto'],
              equipment: ['10 Grúas Pórtico Súper Post-Panamax', 'Bloques intermodales automatizados'],
              connections: ['Vía férrea directa y autopista Colima–Guadalajara'],
              loadingRate: '36 – 44 mov/hora por grúa',
              notes: 'Mayor capacidad de calado para contenedores en San Pedrito.',
            },
          ],
        },
        {
          idSuffix: 'hazesa-pemex',
          areaKey: 'san-pedrito',
          name: 'Hazesa (Minerales y Graneles) · Ocupa · Cruceros & Terminal PEMEX',
          operator: 'Hazesa / Ocupa / PEMEX Logística / ASIPONA',
          shortDesc:
            'Terminales de minerales a granel (concentrados de hierro/cobre), granel agrícola, terminal de cruceros y muelles de hidrocarburos PEMEX.',
          shortDescEn:
            'Mineral bulk (iron/copper concentrates), agricultural bulk, cruise berth and PEMEX refined fuel jetties.',
          coordinates: "19°03'18\"N · 104°18'30\"W",
          mapX: 44,
          mapY: 62,
          imageType: 'pajaritos',
          cargoGroups: ['Granel Mineral', 'Granel Agrícola', 'Hidrocarburos y Gas'],
          storageSummary: {
            coveredSqm: 54000,
            openYardSqm: 135000,
            containerYardSqm: 30000,
            warehousesBreakdown:
              'Domos y bodegas herméticas de mineral (Hazesa) para concentrados de hierro/cobre/zinc, silos mecanizados para granel agrícola (Grupo Ocupa / Comercializadora La Junta), patios de carga general y granjas de tanques PEMEX.',
            warehousesBreakdownEn:
              'Enclosed mineral storage domes (Hazesa) for iron/copper/zinc concentrates, mechanized agricultural grain silos (Ocupa), general cargo yards and PEMEX refined fuel tank farms.',
          },
          commercialProfile: {
            positioningHeadline:
              'Ecosistema de Graneles Minerales (Hazesa), Agrícolas (Ocupa), Cruceros y Combustibles PEMEX',
            positioningHeadlineEn:
              'Dry Mineral Bulk (Hazesa), Grain (Ocupa), Cruise & PEMEX Energy Terminals in San Pedrito',
            address: 'Recinto Portuario San Pedrito Sur / Banda B, Manzanillo, Colima',
            customsRegime: 'Cesionarios Fiscalizados Especializados (Hazesa · Ocupa · PEMEX) · Aduana de Manzanillo',
            customsRegimeEn: 'Specialized Bonded Terminal Concessions (Hazesa · Ocupa · PEMEX) · Manzanillo Customs',
            commercialServices: [
              'Carga de exportación de mineral de hierro, concentrados de cobre/zinc y descarga de coque/fertilizantes (Hazesa)',
              'Descarga mecanizada de maíz, trigo, soya, canola y manejo de acero, automóviles y contenedores (Ocupa)',
              'Recepción de gasolinas, diésel y combustóleo por brazos marinos en muelles petroleros PEMEX Logística',
              'Atención turística ocasional en posición de cruceros del recinto centro de Manzanillo',
            ],
            commercialServicesEn: [
              'Bulk export ship-loading of iron ore, copper/zinc concentrates and petcoke/fertilizer import (Hazesa)',
              'Mechanized agri-bulk discharge (corn, wheat, soy) plus steel, breakbulk and container support (Ocupa)',
              'Pipeline reception of gasoline, diesel and fuel oil via marine loading arms at PEMEX jetties',
              'Cruise ship berthing support at Manzanillo downtown cruise quay',
            ],
            infrastructureHighlights: [
              '920 m lineales combinados con bandas cargadoras telescópicas de mineral de 10,000–15,000 MT/día',
              'Almacenaje hermético anti-emisión de polvos (domos minerales) + silos agrícolas y básculas certificadas',
              'Espuelas ferroviarias y poliducto PEMEX Manzanillo–Guadalajara directamente enlazados',
            ],
            infrastructureHighlightsEn: [
              '920 m combined quay equipped with telescopic shiploaders rated 10,000–15,000 MT/day',
              'Environmentally sealed mineral domes + grain silos and certified rail/truck weighbridges',
              'Direct rail sidings and PEMEX Manzanillo–Guadalajara multi-product pipeline tie-in',
            ],
            vesselTypesServed: [
              'Graneleros Supramax / Panamax / Handymax Minerales y Agrícolas',
              'Buques Tanque MR / Handysize de Combustibles PEMEX',
            ],
            vesselTypesServedEn: [
              'Supramax / Panamax / Handymax Mineral & Grain Bulkers',
              'MR / Handysize Refined Hydrocarbon Tankers',
            ],
            connectivity:
              'Enlace ferroviario Ferromex hacia distritos mineros de Michoacán/Colima/Jalisco y corredor industrial del Bajío; poliducto hacia Guadalajara.',
            connectivityEn:
              'Ferromex rail links to Colima/Michoacán/Jalisco mining belts & Bajío; PEMEX pipeline to Guadalajara.',
            operationalAdvantages: [
              'Principal nodo exportador de mineral de hierro y concentrados metálicos del Pacífico Central mexicano.',
              'Operación simultánea de minerales, granos y energéticos dentro de dársena protegida.',
            ],
            operationalAdvantagesEn: [
              'Primary Central Pacific export gateway for Mexican iron ore and metallic concentrates.',
              'Protected inner-basin operations covering bulk minerals, grains and refined fuels.',
            ],
            keyClientsOrTrades: ['Terminal Hazesa', 'Grupo Ocupa', 'PEMEX Logística', 'Ternium / ArcelorMittal / Mineras'],
            certifications: ['PBIP / ISPS', 'ISO 9001 / 14001', 'IMSBC Code / TML Compliance'],
          },
          procedures: ['Certificado TML (Transportable Moisture Limit) para concentrados minerales; SIRE en PEMEX.'],
          restrictionsSummary: 'Calados entre 11.5 m y 14.0 m según posición.',
          berths: [
            {
              idSuffix: 'man-haz',
              name: 'Muelles Hazesa Mineral / Ocupa / Terminal PEMEX',
              lengthM: 920,
              maxLoaM: 230,
              maxBeamM: 32.3,
              berthDepthM: 14.5,
              maxDraftM: 13.5,
              products: ['Concentrado de hierro/zinc', 'Maíz / Trigo', 'Gasolina y Diésel', 'Cruceros'],
              cargoGroups: ['Granel Mineral', 'Granel Agrícola', 'Hidrocarburos y Gas'],
              equipment: ['Cargadores mecanizados de mineral', 'Silos agrícolas', 'Brazos de carga PEMEX'],
              connections: ['Patios ferroviarios y poliducto PEMEX'],
              loadingRate: '10,000 – 15,000 MT/día mineral',
              notes: 'Completa el ecosistema multipropósito del recinto San Pedrito.',
            },
          ],
        },
        {
          idSuffix: 'cuyutlan-lng',
          areaKey: 'cuyutlan',
          name: 'Terminal de GNL Manzanillo (Laguna de Cuyutlán)',
          operator: 'Terminal KMS de GNL (KOGAS / Mitsui / Samsung)',
          shortDesc:
            'Terminal dedicada de regasificación de Gas Natural Licuado en Laguna de Cuyutlán al sur de la ciudad.',
          shortDescEn:
            'Dedicated LNG regasification terminal in Laguna de Cuyutlán south of Manzanillo.',
          coordinates: "19°01'05\"N · 104°17'45\"W",
          mapX: 74,
          mapY: 66,
          imageType: 'channel',
          cargoGroups: ['Hidrocarburos y Gas'],
          storageSummary: {
            coveredSqm: 2400,
            openYardSqm: 85000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Dos tanques criogénicos de contención total de 150,000 m³ c/u (300,000 m³ totales) a -162 °C, tren de vaporización de 500 MMpcd y subestación de control en Laguna de Cuyutlán.',
            warehousesBreakdownEn:
              'Two 150,000 m³ full-containment cryogenic LNG tanks (300,000 m³ total) at -162 °C, 500 MMscfd regasification train and control station in Laguna de Cuyutlán.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal Criogénica de Regasificación GNL Manzanillo (KMS: KOGAS · Mitsui · Samsung) — 500 MMpcd',
            positioningHeadlineEn:
              'Manzanillo LNG Cryogenic Regasification Terminal (KMS: KOGAS · Mitsui · Samsung) — 500 MMscfd',
            address: 'Laguna de Cuyutlán, Polígono Energético Sur, Manzanillo, Colima',
            customsRegime: 'Terminal Marítima Energética Especializada (CRE / ASEA) · Aduana de Manzanillo',
            customsRegimeEn: 'Dedicated Cryogenic LNG Import Terminal (CRE / ASEA) · Manzanillo Customs',
            commercialServices: [
              'Descarga criogénica de Gas Natural Licuado (GNL) a -162 °C mediante 4 brazos marinos articulados (10,000–12,000 m³/h)',
              'Almacenamiento criogénico de 300,000 m³ y regasificación continua de hasta 500 MMpcd para generación eléctrica de CFE',
              'Inyección directa al Gasoducto Manzanillo–Guadalajara y nodo occidental del SISTRANGAS',
            ],
            commercialServicesEn: [
              'Cryogenic LNG unloading at -162 °C via 4 marine loading arms at 10,000–12,000 m³/h',
              '300,000 m³ cryogenic storage and up to 500 MMscfd sendout supplying CFE power generation',
              'Direct injection into Manzanillo–Guadalajara Gas Pipeline and western SISTRANGAS grid',
            ],
            infrastructureHighlights: [
              'Muelle criogénico dedicado de 360 m para metaneros Q-Flex / Moss / Membrane hasta 295 m LOA y 14.0 m calado',
              'Canal de acceso independiente (-16.5 m) y dársena exclusiva separada del tráfico comercial de San Pedrito',
              'Rompeolas de protección y zona de seguridad marítima vigilada con 3–4 remolcadores de escolta',
            ],
            infrastructureHighlightsEn: [
              '360 m dedicated LNG jetty handling carriers up to 295 m LOA / 14.0 m operational draft',
              'Independent -16.5 m approach channel isolated from San Pedrito container traffic',
              'Breakwater protection and strict exclusion zone enforced with 3–4 escort tugs',
            ],
            vesselTypesServed: ['Buques Metaneros Criogénicos GNL (138,000 – 217,000 m³)'],
            vesselTypesServedEn: ['Cryogenic LNG Carriers (138,000 – 217,000 m³)'],
            connectivity:
              'Gasoducto de alta presión Manzanillo–Colima–Guadalajara abasteciendo centrales termoeléctricas de CFE e industria de Occidente.',
            connectivityEn:
              'High-pressure Manzanillo–Colima–Guadalajara pipeline feeding CFE power plants and Western Mexico industry.',
            operationalAdvantages: [
              'Elimina interferencia con maniobras contenerizadas de San Pedrito al contar con acceso propio en Cuyutlán.',
              'Operación bajo los más altos estándares internacionales SIGTTO / OCIMF.',
            ],
            operationalAdvantagesEn: [
              'Zero berth congestion from container terminals thanks to dedicated Cuyutlán channel.',
              'Operated strictly under international SIGTTO / OCIMF LNG safety standards.',
            ],
            keyClientsOrTrades: ['Terminal KMS de GNL', 'CFEnergía / CFE', 'KOGAS / Mitsui / Samsung'],
            certifications: ['SIGTTO Compliance', 'PBIP / ISPS', 'CRE / ASEA', 'ISO 9001 / 14001 / 45001'],
          },
          procedures: ['Protocolo SIGTTO, escolta de 3–4 remolcadores y zona de exclusión marítima.'],
          restrictionsSummary: 'Atraque y desatraque diurno exclusivo.',
          berths: [
            {
              idSuffix: 'man-lng',
              name: 'Muelle Criogénico GNL Cuyutlán',
              lengthM: 360,
              maxLoaM: 295,
              maxBeamM: 46.0,
              berthDepthM: 15.5,
              maxDraftM: 14.0,
              products: ['Gas Natural Licuado (GNL)'],
              cargoGroups: ['Hidrocarburos y Gas'],
              equipment: ['4 Brazos de descarga criogénicos', 'Tanques de almacenamiento 300,000 m³'],
              connections: ['Gasoducto Manzanillo–Guadalajara'],
              loadingRate: '10,000 – 12,000 m³/h',
              notes: 'Dársena independiente del tráfico comercial de San Pedrito.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'anchorage-charly',
          category: 'Seguridad y Aduana',
          title: 'Fondeo Obligatorio en Zona "Charly" para Mercancía Peligrosa',
          titleEn: 'Mandatory Zone "Charly" Anchorage for Dangerous Cargo',
          detail:
            'Buques tanque y portacontenedores con carga peligrosa de alto riesgo deben permanecer en Zona de Fondeo Charly hasta confirmación de ventana.',
          detailEn:
            'Tankers and vessels with high-risk dangerous goods must anchor in Zone Charly until berth confirmation.',
          limitValue: 'Zona Charly',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Manzanillo',
        },
        {
          idSuffix: 'channel-draft',
          areaKey: 'san-pedrito',
          category: 'Física',
          title: 'Canal -18.0 m vs. Calado Máx. Autorizado 15.5 m (TEC)',
          titleEn: 'Channel -18.0 m vs. Max Authorized Draft 15.5 m',
          detail:
            'Dársenas de 600 m en San Pedrito permiten maniobrar buques hasta 366 m LOA con calado de 13.5 m en TEC I y hasta 15.5 m en TEC II.',
          detailEn:
            '600 m turning basins handle up to 366 m LOA vessels at 13.5 m (TEC I) and up to 15.5 m (TEC II).',
          limitValue: '13.5 – 15.5 m',
          verificationStatus: 'verified',
          source: 'ASIPONA Manzanillo · Características Náuticas',
        },
      ],
      sampleVessel: 'MV Pacific Horizon',
      sampleImo: '9834120',
      sampleBerth: 'Posiciones TEC II Zona Norte',
      sampleCargo: 'Contenedores FCL · 4,800 TEU',
      sampleStatus: 'BERTHED',
    },

    // 9. PUERTO VALLARTA
    {
      id: 'mxpva',
      shortCode: 'PVA',
      name: 'Puerto Vallarta',
      unLocode: 'MXPVR',
      region: 'PACÍFICO CENTRO',
      state: 'Jalisco · Bahía de Banderas',
      coordinates: "20°39'18\"N · 105°14'36\"W",
      vhfChannel: 'CH 16 / CH 12 (Control Tráfico Vallarta)',
      authority: 'ASIPONA Puerto Vallarta · Capitanía de Puerto',
      lineupSourceUrl: 'https://www.puertodevallarta.com.mx/calendario-de-arribos',
      lineupConnector: 'IMAGE_LINK',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Puerto Vallarta: Terminal Marítima de Cruceros con 3 posiciones simultáneas habilitadas para cruceros internacionales > 300 m LOA + muelles turísticos locales y cabotaje; estricta separación de tráfico turístico y embarcaciones recreativas en Bahía de Banderas; cumplimiento PBIP/ISPS y sanidad internacional.',
      operatingRulesUrl: 'https://www.puertodevallarta.com.mx/reglas-de-operacion',
      headlineEs: 'Puerto Vallarta. 3 posiciones simultáneas para cruceros > 300 m.',
      headlineEn: 'Puerto Vallarta. 3 simultaneous berths for cruise ships > 300 m.',
      overviewEs:
        'Principal destino de cruceros del Pacífico Central mexicano en Bahía de Banderas. Cuenta con tres muelles internacionales de atraque simultáneo para cruceros de gran porte (> 300 m LOA) y dársena interior para embarcaciones turísticas locales.',
      overviewEn:
        'Premier Central Pacific cruise port in Bahía de Banderas operating three simultaneous international cruise berths (> 300 m LOA) plus local marine excursion piers.',
      heroImageType: 'hero',
      channels: [
        {
          id: 'ch-pva-main',
          name: 'Canal de Acceso y Dársena de Ciaboga Puerto Vallarta',
          lengthNm: 0.9,
          widthM: 180,
          channelDepthM: 12.0,
          operationalDraftM: 10.2,
          squatAllowanceNote:
            'Canal corto protegido hacia dársena interior con radio de giro de 420 m; sin restricciones significativas de barra.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-pva-1',
          name: 'Fondeadero Bahía de Banderas (Cruceros / Tender Operations)',
          purpose: 'Cruceros internacionales en fondeo (cuando los 3 muelles están ocupados) y cabotaje',
          coordinates: "20°38.6'N · 105°15.8'W (1.2 MN al W del acceso)",
          depthM: '22.0 – 35.0 m',
          maxVesselOrNotes:
            'Operación de lanchas tender coordinada con Capitanía de Puerto; mantener área libre de tráfico menor y deportes acuáticos.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'cruceros',
          name: 'Terminal Marítima Internacional de Cruceros (Muelles 1, 2 y 3)',
          nameEn: 'International Cruise Terminal (Berths 1, 2 & 3)',
          summary:
            'Tres posiciones habilitadas simultáneamente para cruceros internacionales superiores a 300 m de eslora con control PBIP/ISPS completo.',
          summaryEn:
            'Three simultaneous berths rated for international cruise ships > 300 m LOA under full ISPS control.',
          channelDepthM: 12.0,
          operationalDraftM: 10.2,
          turningBasinM: 420,
          daylightOnly: false,
          tugRequirement: '1 a 2 remolcadores según equipamiento de thrusters y viento local',
          pilotRequirement: 'Practicaje obligatorio desde 1.5 MN al oeste de la bocana',
        },
      ],
      terminals: [
        {
          idSuffix: 'cruceros-1-3',
          areaKey: 'cruceros',
          name: 'Terminal Marítima de Cruceros Puerto Vallarta (Muelles 1, 2 y 3)',
          operator: 'ASIPONA Puerto Vallarta / Terminal de Pasajeros',
          shortDesc:
            'Tres muelles de atraque simultáneo para megacruceros más muelle de embarcaciones locales y cabotaje turístico.',
          shortDescEn:
            'Three simultaneous berths for mega cruise liners plus local excursion and coastal cabotage docks.',
          coordinates: "20°39'16\"N · 105°14'28\"W",
          mapX: 46,
          mapY: 46,
          imageType: 'hero',
          cargoGroups: ['Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 7800,
            openYardSqm: 26000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Edificio terminal internacional de pasajeros con salas de migración INM, aduana turística, comercios libres de impuestos, muelle de taxis acuáticos/tours y parque de transporte terrestre.',
            warehousesBreakdownEn:
              'International cruise passenger concourse housing INM immigration, customs screening, duty-free retail, local excursion marina dock and coach staging plaza.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal Marítima de Cruceros Puerto Vallarta — 3 Posiciones Simultáneas (>300 m LOA) y Escala Riviera Mexicana',
            positioningHeadlineEn:
              'Puerto Vallarta International Cruise Terminal — 3 Simultaneous Mega-Berths (>300 m LOA)',
            address: 'Blvd. Francisco Medina Ascencio Km 4.5, Zona Hotelera Norte, Puerto Vallarta, Jalisco',
            customsRegime: 'Recinto Portuario Internacional de Pasaje PBIP · Aduana de Puerto Vallarta / INM',
            customsRegimeEn: 'ISPS International Cruise Port · Puerto Vallarta Customs & INM Immigration',
            commercialServices: [
              'Atraque simultáneo hasta para 3 megacruceros internacionales (>300 m LOA) en Muelles 1, 2 y 3 (+ capacidad hasta ~1.7M pax/año)',
              'Operación Home Port / Embarque y desembarque parcial de pasajeros en conectividad aérea PVR',
              'Avituallamiento fresco/seco hotelero, suministro de agua potable, cambio de tripulación y recepción MARPOL',
              'Logística de excursiones certificadas, seguridad PBIP y coordinación de tender operations en fondeo cuando aplica',
            ],
            commercialServicesEn: [
              'Simultaneous berthing for up to 3 mega cruise ships (>300 m LOA) across Berths 1–3 (annual capacity ~1.7M pax)',
              'Home Port turnarounds & partial embarkation leveraging Puerto Vallarta International Airport (3 km)',
              'Hotel food & beverage provisioning, potable water supply, crew changes and certified MARPOL waste reception',
              'Certified shore excursion coach dispatch, ISPS security and Bay of Banderas tender coordination',
            ],
            infrastructureHighlights: [
              '940 m totales en 3 posiciones internacionales (hasta 335 m LOA / 10.2 m calado) + dársena turística local',
              'Conectividad aeroportuaria de 5 minutos (Aeropuerto Internacional PVR a 3 km)',
              'Separación reglamentaria total entre canal de aproximación de cruceros y embarcaciones menores',
            ],
            infrastructureHighlightsEn: [
              '940 m quay across 3 international berths (up to 335 m LOA / 10.2 m draft) + local excursion piers',
              '5-minute transfer to PVR International Airport (3 km)',
              'Strict traffic separation between mega-cruise channel and recreational craft',
            ],
            vesselTypesServed: [
              'Megacruceros Internacionales (Royal Caribbean, Carnival, Princess, Norwegian, Holland America)',
              'Embarcaciones Turísticas Locales y Cabotaje de Pasaje',
            ],
            vesselTypesServedEn: [
              'International Mega Cruise Liners (Royal Caribbean, Carnival, Princess, NCL, HAL)',
              'Local Bay Excursion & Coastal Passenger Vessels',
            ],
            connectivity:
              'Sobre Blvd. Francisco Medina Ascencio (Zona Hotelera Norte), a 3 km del Aeropuerto Internacional PVR y 10 min del Centro Histórico.',
            connectivityEn:
              'Directly on Blvd. Medina Ascencio (North Hotel Zone), 3 km from PVR International Airport.',
            customsProcess: [
              'Envío vía VUMCE de Declaración Marítima de Sanidad y manifiestos de pasaje/tripulación 48 h previas.',
              'Otorgamiento de Libre Plática y despacho migratorio INM a bordo o en salas de terminal.',
              'Control aduanal de provisiones de barco (avituallamiento) y equipaje de Home Port.',
            ],
            customsProcessEn: [
              'VUMCE filing of Maritime Health Declaration and crew/passenger manifests 48 h prior to arrival.',
              'International Health Free Pratique and INM immigration clearance.',
              'Customs supervision of ship hotel stores and Home Port passenger baggage.',
            ],
            operationalAdvantages: [
              'Puerto emblemático de la ruta "Mexican Riviera" con 3 muelles simultáneos protegidos.',
              'Cercanía récord entre muelle, zona hotelera y aeropuerto internacional para Home Porting y crew changes.',
            ],
            operationalAdvantagesEn: [
              'Anchor marquee stop of the Mexican Riviera itinerary with 3 simultaneous sheltered berths.',
              'Unmatched 3 km port-to-airport proximity ideal for Home Port operations and crew changes.',
            ],
            keyClientsOrTrades: ['Royal Caribbean', 'Carnival Cruise Line', 'Princess Cruises', 'Norwegian Cruise Line'],
            certifications: ['PBIP / ISPS Nivel 1', 'Sanidad Internacional / Libre Plática', 'Puerto Verde'],
          },
          procedures: ['Despacho migratorio INM, Sanidad Internacional y lista de tripulantes/pasajeros 48 h previas.'],
          restrictionsSummary: '3 posiciones simultáneas para buques > 300 m LOA; calado máx. 10.2 m.',
          berths: [
            {
              idSuffix: 'pva-m1-3',
              name: 'Muelles Internacionales 1, 2 y 3 + Muelles Locales',
              lengthM: 940,
              maxLoaM: 335,
              maxBeamM: 42.0,
              berthDepthM: 11.5,
              maxDraftM: 10.2,
              products: ['Cruceros internacionales', 'Provisiones hoteleras', 'Agua potable y residuos MARPOL'],
              cargoGroups: ['Carga General y Contenedores'],
              equipment: ['Terminal de pasajeros certificada PBIP', 'Tomas de agua potable y recepción MARPOL'],
              connections: ['Av. Francisco Medina Ascencio · Aeropuerto PVR a 3 km'],
              loadingRate: 'Atención simultánea a +9,000 pasajeros',
              notes: 'Incluye regulación separada para embarcaciones turísticas locales en dársena interior.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'traffic-sep',
          areaKey: 'cruceros',
          category: 'Operativa',
          title: 'Separación de Tráfico Turístico en Bahía de Banderas',
          titleEn: 'Touristic & Recreational Traffic Separation',
          detail:
            'Embarcaciones menores turísticas y taxis acuáticos tienen prohibido interferir en el canal de aproximación de cruceros durante maniobras de práctico.',
          detailEn:
            'Local tour boats must keep completely clear of the cruise approach channel during pilotage maneuvers.',
          limitValue: 'Canal exclusivo',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Puerto Vallarta',
        },
        {
          idSuffix: 'isps-sanidad',
          category: 'Seguridad y Aduana',
          title: 'Protocolo PBIP/ISPS y Sanidad Internacional de Pasaje',
          titleEn: 'ISPS Security & International Health Clearance',
          detail:
            'Declaración Marítima de Sanidad y listas de pasaje/tripulación vía VUMCE 48 h antes del arribo para otorgar libre plática inmediata.',
          detailEn:
            'Maritime Health Declaration and passenger/crew manifests due 48 h prior to arrival via VUMCE.',
          limitValue: '48 h pre-ETA',
          verificationStatus: 'verified',
          source: 'Sanidad Internacional / Capitanía Puerto Vallarta',
        },
      ],
      sampleVessel: 'MS Riviera Princess',
      sampleImo: '9614118',
      sampleBerth: 'Muelle Internacional 1',
      sampleCargo: 'Crucero Internacional · 3,200 PAX',
      sampleStatus: 'EXPECTED',
    },

    // 10. ENSENADA
    {
      id: 'mxens',
      shortCode: 'ENS',
      name: 'Puerto de Ensenada',
      unLocode: 'MXESE',
      region: 'PACÍFICO NORTE',
      state: 'Baja California · Pacífico Norte',
      coordinates: "31°51'18\"N · 116°37'48\"W",
      vhfChannel: 'CH 16 / CH 12 (CCTM Ensenada)',
      authority: 'ASIPONA Ensenada · Capitanía de Puerto',
      lineupSourceUrl: 'https://www.puertoensenada.com.mx/programacion-de-buques',
      lineupConnector: 'DOCUMENT_LINK',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Ensenada: Canal de acceso 16.06 m (calado op. 14.50 m); Ciaboga 15.70 m (op. 14.50 m); Canal interior 13.80 m (op. 13.00 m); 6 posiciones comerciales/cruceros (TUM 1 11.70 m/180 m, TUM 2 EIT 14.50 m/350 m, ASIPONA 1 13.00 m, ASIPONA 2 7.50 m, Cruceros ECV1/ECV2 9.50–10.00 m estribor al muelle >300 m) + Energía Costa Azul GNL.',
      operatingRulesUrl: 'https://www.puertoensenada.com.mx/reglas-de-operacion-autorizadas-y-vigentes',
      headlineEs: 'Ensenada. TUM 2 EIT (14.50 m), Cruceros ECV1/ECV2 y Costa Azul GNL.',
      headlineEn: 'Ensenada. EIT (14.50 m), ECV Cruise Terminal & Costa Azul LNG.',
      overviewEs:
        'Puerto de aguas profundas en Baja California con canal principal a 16.06 m (calado op. 14.50 m). Opera Hutchison Ports EIT (TUM 2 hasta 350 m LOA), TUM 1, Posiciones ASIPONA 1 y 2, Terminal de Cruceros (ECV1 y ECV2) y la terminal energética Energía Costa Azul (Sempra GNL).',
      overviewEn:
        'Deep-water Baja California port featuring a 16.06 m channel (14.50 m op. draft). Houses Hutchison Ports EIT (TUM 2 up to 350 m LOA), TUM 1, ASIPONA 1 & 2, Cruise Terminal (ECV1/ECV2) and Energía Costa Azul LNG.',
      heroImageType: 'recintoSur',
      channels: [
        {
          id: 'ch-ens-ext',
          name: 'Canal de Acceso y Dársena de Ciaboga Ensenada',
          lengthNm: 1.6,
          widthM: 180,
          channelDepthM: 16.06,
          operationalDraftM: 14.5,
          squatAllowanceNote:
            'Canal a 16.06 m y dársena de ciaboga a 15.70 m; calado operativo autorizado de 14.50 m hacia TUM 2 (EIT).',
          verificationStatus: 'verified',
        },
        {
          id: 'ch-ens-int',
          name: 'Canal Interior Puerto de Ensenada',
          lengthNm: 0.9,
          widthM: 140,
          channelDepthM: 13.8,
          operationalDraftM: 13.0,
          squatAllowanceNote:
            'Da acceso a ASIPONA 1 (13.00 m), TUM 1 (11.70 m) y ASIPONA 2 (7.50 m).',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-ens-1',
          name: 'Fondeadero Bahía de Todos Santos (Ensenada)',
          purpose: 'Buques portacontenedores, graneleros y cruceros en espera',
          coordinates: "31°50.0'N · 116°39.2'W (al W/SW del rompeolas)",
          depthM: '18.0 – 28.0 m',
          maxVesselOrNotes:
            'Abrigo parcial tras Punta Morro; mantener guardia VHF CH 12/16 con CCTM Ensenada.',
          verificationStatus: 'verified',
        },
        {
          id: 'az-ens-2',
          name: 'Zona de Espera Costa Azul (Buques Metaneros GNL)',
          purpose: 'Buques metaneros para Terminal Energía Costa Azul (Sempra)',
          coordinates: "31°57.5'N · 116°51.0'W",
          depthM: '30.0 – 45.0 m',
          maxVesselOrNotes:
            'Zona de exclusión marítima de Sempra LNG 14 millas al norte de Ensenada.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'comercial',
          name: 'Recinto Comercial y Cruceros (TUM 1 · TUM 2 EIT · ASIPONA 1/2 · ECV1/2)',
          nameEn: 'Commercial & Cruise Enclosure',
          summary:
            'Incluye EIT (TUM 2, 14.50 m / máx. 350 m LOA), TUM 1 (11.70 m / 180 m), muelles públicos ASIPONA 1 y 2 y muelles de cruceros ECV1/ECV2.',
          summaryEn:
            'Includes EIT (TUM 2, 14.50 m / 350 m LOA), TUM 1 (11.70 m), ASIPONA 1 & 2 and cruise piers ECV1/ECV2.',
          channelDepthM: 16.06,
          operationalDraftM: 14.5,
          turningBasinM: 500,
          daylightOnly: false,
          tugRequirement: '2 remolcadores azimutales estándar (3 para portacontenedores > 300 m)',
          pilotRequirement: 'Practicaje obligatorio 24/7; cruceros ECV atraque estribor al muelle',
        },
        {
          key: 'costa-azul',
          name: 'Energía Costa Azul GNL (Sempra Infrastructure)',
          nameEn: 'Energía Costa Azul LNG Terminal',
          summary:
            'Terminal marítima costa afuera al norte de Ensenada para descarga y licuefacción/exportación de GNL.',
          summaryEn:
            'Dedicated offshore LNG import & liquefaction terminal north of Ensenada.',
          channelDepthM: 16.0,
          operationalDraftM: 13.8,
          turningBasinM: 550,
          daylightOnly: true,
          tugRequirement: '3 remolcadores de escolta obligatorios durante toda la estadía',
          pilotRequirement: 'Prácticos especializados GNL bajo normas SIGTTO',
        },
      ],
      terminals: [
        {
          idSuffix: 'eit-tum2',
          areaKey: 'comercial',
          name: 'Ensenada International Terminal (TUM 2 · Hutchison Ports EIT)',
          operator: 'Hutchison Ports EIT',
          shortDesc:
            'Terminal de contenedores y usos múltiples de aguas profundas (14.50 m) habilitada para buques hasta 350 m LOA.',
          shortDescEn:
            'Deep-water container and multipurpose terminal (14.50 m) serving vessels up to 350 m LOA.',
          coordinates: "31°51'12\"N · 116°37'54\"W",
          mapX: 38,
          mapY: 40,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores', 'Carga Proyecto'],
          storageSummary: {
            coveredSqm: 12500,
            openYardSqm: 48000,
            containerYardSqm: 145000,
            warehousesBreakdown:
              'Patio contenerizado de 14.5 ha en Hutchison Ports EIT (TUM 2) con capacidad superior a 400,000 TEUs/año, tomas reefer refrigeradas, almacén fiscalizado para desconsolidación CFS e inspecciones OISA / Aduana.',
            warehousesBreakdownEn:
              '14.5 ha Hutchison Ports EIT container yard (TUM 2) with 400,000+ TEU/year capacity, reefer stacks, CFS customs exam shed and OISA inspection bays.',
          },
          commercialProfile: {
            positioningHeadline:
              'Ensenada International Terminal (Hutchison EIT · TUM 2) — Puerta Contenerizada de Baja California',
            positioningHeadlineEn:
              'Ensenada International Terminal (Hutchison EIT · TUM 2) — Baja California Deep-Water Gateway',
            address: 'Blvd. Teniente Azueta 224, Recinto Portuario, Ensenada, Baja California',
            customsRegime: 'Recinto Fiscalizado Privado (Hutchison Ports EIT) · Aduana de Ensenada',
            customsRegimeEn: 'Bonded Private Container Concession (Hutchison Ports EIT) · Ensenada Customs',
            commercialServices: [
              'Estiba de contenedores FCL/LCL y carga refrigerada reefer de exportación agroindustrial de Baja California (berries, hortalizas, vino, atún)',
              'Atención a portacontenedores hasta 350 m LOA y 14.50 m de calado en TUM 2 (+ TUM 1 multipropósito)',
              'Maniobras de carga proyecto, acero, maquinaria para industria maquiladora de Tijuana / Mexicali y carga general',
              'Servicios CFS de consolidación/desconsolidación e inspección fitosanitaria OISA / SENASICA en terminal',
            ],
            commercialServicesEn: [
              'FCL/LCL & reefer container handling serving Baja California agro-exports (berries, produce, seafood, wine)',
              'Container ship berthing up to 350 m LOA and 14.50 m draft at TUM 2 (+ TUM 1 multipurpose quay)',
              'Project cargo, steel and industrial equipment handling for Tijuana / Mexicali maquiladora plants',
              'CFS warehousing, devanning and dockside OISA / SENASICA cold-chain inspection',
            ],
            infrastructureHighlights: [
              '600 m de muelle en aguas profundas (-15.7 m pie de muelle; calado operativo 14.50 m en TUM 2)',
              'Grúas Pórtico Súper Post-Panamax, grúas RTG y plataforma digital E-Port de Hutchison',
              'Capacidad portuaria superior a 430,000 TEUs integrando corredor marítimo alternativo al sur de California',
            ],
            infrastructureHighlightsEn: [
              '600 m deep-water quay (-15.7 m alongside; 14.50 m authorized draft at TUM 2)',
              'Super Post-Panamax STS cranes, RTG blocks and Hutchison digital E-Port portal',
              'Portwide capacity >430,000 TEUs offering a direct transpacific alternative south of LA/Long Beach',
            ],
            vesselTypesServed: [
              'Portacontenedores Post-Panamax y Feeders Transpacífico (hasta 350 m LOA)',
              'Buques Multipropósito / Carga General / Heavy-Lift (TUM 1 y TUM 2)',
            ],
            vesselTypesServedEn: [
              'Post-Panamax & Transpacific Feeder Container Ships (up to 350 m LOA)',
              'Multipurpose General Cargo & Heavy-Lift Ships (TUM 1 & TUM 2)',
            ],
            connectivity:
              'Autopista Escénica Tijuana–Ensenada (Fed. 1D) conectando en 90 min con parques maquiladores de Tijuana, Tecate, Mexicali y cruces fronterizos hacia California.',
            connectivityEn:
              'Fed. 1D Scenic Highway linking in 90 min to Tijuana, Tecate, Mexicali maquiladora corridors and US-California border ports.',
            customsProcess: [
              'Transmisión VUMCE y archivo EDI BAPLIE 24–48 h previas al atraque.',
              'Despacho automatizado PITA en Aduana de Ensenada + inspección OISA para productos perecederos.',
              'Tránsito carretero seguro hacia recintos industriales IMMEX en Tijuana y Mexicali.',
            ],
            customsProcessEn: [
              'VUMCE filing and EDI BAPLIE 24–48 h prior to berth.',
              'Automated PITA customs release at Ensenada Customs + OISA cold-chain inspection.',
              'Bonded IMMEX truck corridor dispatch to Tijuana and Mexicali manufacturing clusters.',
            ],
            operationalAdvantages: [
              'Alternativa estratégica libre de congestión portuaria del sur de California para la manufactura de Baja California.',
              'Calado profundo de 14.50 m que permite recaladas directas Asia–Ensenada.',
            ],
            operationalAdvantagesEn: [
              'Congestion-free alternative to Southern California gateways for Baja California manufacturing.',
              '14.50 m deep-water capability enabling direct Asia–Ensenada mainline calls.',
            ],
            keyClientsOrTrades: ['Hutchison Ports EIT', 'Maersk / CMA CGM / MSC / Hapag', 'Industria IMMEX Baja California'],
            certifications: ['PBIP / ISPS', 'OEA', 'C-TPAT', 'ISO 9001 / 14001 / 45001'],
          },
          procedures: ['EDI BAPLIE 24 h previas; cumplimiento VUMCE 48 h.'],
          restrictionsSummary: 'Calado máx. 14.50 m · Eslora máx. 350 m LOA.',
          berths: [
            {
              idSuffix: 'ens-tum2',
              name: 'TUM 2 (Hutchison EIT) & TUM 1',
              lengthM: 600,
              maxLoaM: 350,
              maxBeamM: 46.0,
              berthDepthM: 15.7,
              maxDraftM: 14.5,
              products: ['Contenedores FCL/Reefer', 'Carga general', 'Carga proyecto'],
              cargoGroups: ['Carga General y Contenedores', 'Carga Proyecto'],
              equipment: ['Grúas Pórtico Súper Post-Panamax', 'Grúas RTG y patio reefer'],
              connections: ['Corredor carretero Tijuana–Mexicali–California'],
              loadingRate: '30 – 36 mov/hora por grúa',
              notes: 'TUM 1 limitado a 11.70 m de calado y 180 m LOA.',
            },
          ],
        },
        {
          idSuffix: 'asipona-cruceros',
          areaKey: 'comercial',
          name: 'Muelles ASIPONA 1 y 2 (Minerales) & Cruceros ECV1 / ECV2',
          operator: 'ASIPONA Ensenada / Ensenada Cruiseport Village',
          shortDesc:
            'Posiciones para mineral de hierro/cemento (ASIPONA 1: 13.00 m; ASIPONA 2: 7.50 m) y muelles de cruceros ECV1/ECV2 (9.50–10.00 m).',
          shortDescEn:
            'Mineral/cement berths (ASIPONA 1: 13.00 m; ASIPONA 2: 7.50 m) and cruise berths ECV1/ECV2 (9.50–10.00 m).',
          coordinates: "31°51'34\"N · 116°37'28\"W",
          mapX: 62,
          mapY: 50,
          imageType: 'hero',
          cargoGroups: ['Granel Mineral', 'Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 11000,
            openYardSqm: 95000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Patios minerales de gran volumen para mineral de hierro y cemento/clinker en Posiciones ASIPONA 1 y 2 + complejo turístico internacional Ensenada Cruiseport Village (ECV1 y ECV2) con edificio de pasajeros y explanada de excursiones.',
            warehousesBreakdownEn:
              'High-volume iron ore & cement bulk yards serving ASIPONA Berths 1 & 2 + Ensenada Cruiseport Village (ECV1 & ECV2) international passenger terminal and excursion plaza.',
          },
          commercialProfile: {
            positioningHeadline:
              'Muelles Públicos ASIPONA 1 y 2 (Granel Mineral / Cemento) & Cruceros ECV1 / ECV2 (2° Puerto del País)',
            positioningHeadlineEn:
              'ASIPONA Mineral Berths 1 & 2 (Iron Ore / Cement) & ECV1/ECV2 Cruise Terminal (#2 Cruise Port in Mexico)',
            address: 'Blvd. Costero Lázaro Cárdenas s/n, Zona Centro, Ensenada, Baja California',
            customsRegime: 'Recinto Fiscal ASIPONA Ensenada y Terminal Turística ECV (Hutchison) · Aduana de Ensenada',
            customsRegimeEn: 'ASIPONA Ensenada Fiscal Quay & ECV Cruise Terminal · Ensenada Customs',
            commercialServices: [
              'Embarque mecanizado de mineral de hierro, cobre, cemento y clinker en ASIPONA 1 (13.00 m) y ASIPONA 2 (7.50 m)',
              'Atención anual líder de cruceros internacionales de California en ECV1 y ECV2 (2° puerto receptor de México)',
              'Servicios de suministro de agua potable, avituallamiento, manejo de equipaje, migración INM y recepción MARPOL',
            ],
            commercialServicesEn: [
              'Mechanized ship-loading of iron ore, copper, cement and clinker at ASIPONA 1 (13.00 m) & ASIPONA 2 (7.50 m)',
              'Year-round California–Baja cruise turnaround & transit calls at ECV1/ECV2 (Mexico’s #2 cruise port)',
              'Potable water bunkering, hotel provisioning, baggage handling, INM clearance and MARPOL reception',
            ],
            infrastructureHighlights: [
              '860 m de frente combinado: ASIPONA 1 (13.00 m), ASIPONA 2 (7.50 m) y ECV1/ECV2 (9.50–10.00 m)',
              'Bandas cargadoras de mineral a 8,000–12,000 MT/día en ASIPONA 1',
              'Terminal de cruceros Ensenada Cruiseport Village con capacidad para megacruceros >300 m LOA',
            ],
            infrastructureHighlightsEn: [
              '860 m combined quay: ASIPONA 1 (13.00 m), ASIPONA 2 (7.50 m) & ECV1/ECV2 (9.50–10.00 m)',
              'Conveyor shiploaders operating at 8,000–12,000 MT/day at ASIPONA 1',
              'Ensenada Cruiseport Village accommodating mega-liners >300 m LOA starboard-alongside',
            ],
            vesselTypesServed: [
              'Graneleros Supramax / Handymax Minerales',
              'Megacruceros Internacionales (Carnival, Royal Caribbean, Princess, Disney)',
            ],
            vesselTypesServedEn: [
              'Supramax / Handymax Mineral Bulkers',
              'International Mega Cruise Ships (Carnival, Royal Caribbean, Princess, Disney)',
            ],
            connectivity:
              'Acceso directo al corredor mineral del Pacífico Norte y vialidad turística hacia Ruta del Vino (Valle de Guadalupe).',
            connectivityEn:
              'Direct bulk haul access and tourist corridor to Valle de Guadalupe wine country & Tijuana.',
            operationalAdvantages: [
              'Segundo puerto de cruceros más visitado de México gracias a itinerarios semanales desde Los Ángeles / San Diego.',
              'Calado de 13.00 m en ASIPONA 1 para exportación competitiva de mineral hacia Asia.',
            ],
            operationalAdvantagesEn: [
              'Mexico’s second-busiest cruise port anchored by year-round Los Angeles/San Diego loops.',
              '13.00 m bulk berth depth supporting competitive Pacific iron-ore exports to Asia.',
            ],
            keyClientsOrTrades: ['Ensenada Cruiseport Village', 'Carnival / Royal Caribbean / Princess', 'CEMEX / Mineras del Norte'],
            certifications: ['PBIP / ISPS', 'Sanidad Internacional', 'ISO 9001 / 14001'],
          },
          procedures: ['Cruceros > 300 m atracan estribor al muelle (starboard alongside) en ECV1/ECV2.'],
          restrictionsSummary: 'ASIPONA 1: 13.00 m; ASIPONA 2: 7.50 m; ECV1/ECV2: 9.50–10.00 m.',
          berths: [
            {
              idSuffix: 'ens-bulk-ecv',
              name: 'ASIPONA 1 (13.00m) · ASIPONA 2 (7.50m) · Cruceros ECV1/ECV2 (9.50–10.00m)',
              lengthM: 860,
              maxLoaM: 320,
              maxBeamM: 40.0,
              berthDepthM: 13.8,
              maxDraftM: 13.0,
              products: ['Mineral de hierro', 'Cemento / Clinker', 'Cruceros internacionales'],
              cargoGroups: ['Granel Mineral', 'Carga General y Contenedores'],
              equipment: ['Bandas cargadoras de mineral', 'Terminal internacional de cruceros'],
              connections: ['Patios minerales y vialidad costera Ensenada'],
              loadingRate: '8,000 – 12,000 MT/día mineral',
              notes: 'Segundo puerto de cruceros con mayor recepción de México.',
            },
          ],
        },
        {
          idSuffix: 'costa-azul-gnl',
          areaKey: 'costa-azul',
          name: 'Terminal Marítima Energía Costa Azul (GNL)',
          operator: 'Sempra Infrastructure',
          shortDesc:
            'Espigón marítimo protegido para buques metaneros al norte de Ensenada.',
          shortDescEn:
            'Protected marine jetty for LNG carriers north of Ensenada.',
          coordinates: "31°58'48\"N · 116°49'12\"W",
          mapX: 30,
          mapY: 70,
          imageType: 'pajaritos',
          cargoGroups: ['Hidrocarburos y Gas'],
          storageSummary: {
            coveredSqm: 3500,
            openYardSqm: 120000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Dos tanques criogénicos de GNL de 160,000 m³ c/u (320,000 m³ totales) a -162 °C, tren de regasificación de 1,300 MMpcd y planta de licuefacción ECA LNG Fase 1 de 3.25 Mtpa en Costa Azul.',
            warehousesBreakdownEn:
              'Two 160,000 m³ cryogenic LNG tanks (320,000 m³ total) at -162 °C, 1,300 MMscfd regasification train and 3.25 Mtpa ECA LNG Phase 1 liquefaction export facility.',
          },
          commercialProfile: {
            positioningHeadline:
              'Energía Costa Azul GNL (Sempra Infrastructure) — Regasificación 1,300 MMpcd y Licuefacción Exportadora 3.25 Mtpa',
            positioningHeadlineEn:
              'Energía Costa Azul LNG (Sempra Infrastructure) — 1,300 MMscfd Regas & 3.25 Mtpa Export Liquefaction Hub',
            address: 'Km 14 Carretera Escénica Tijuana–Ensenada, Costa Azul, Ensenada, Baja California',
            customsRegime: 'Terminal Marítima Energética Estratégica (Sempra / ECA LNG) · Aduana de Ensenada',
            customsRegimeEn: 'Strategic Bi-Directional LNG Maritime Terminal (Sempra) · Ensenada Customs',
            commercialServices: [
              'Carga de exportación e importación criogénica de Gas Natural Licuado (GNL) vía brazos marinos de 16" (10,000–12,000 m³/h)',
              'Capacidad dual de regasificación hacia Baja California (1,300 MMpcd) y licuefacción exportadora Fase 1 (3.25 Mtpa)',
              'Escolta obligatoria de 3 remolcadores azimutales, monitoreo meteorológico de oleaje (<2.0 m) y protocolo SIGTTO',
            ],
            commercialServicesEn: [
              'Bi-directional cryogenic LNG loading & unloading via 16" marine arms at 10,000–12,000 m³/h',
              'Dual 1,300 MMscfd regasification sendout plus 3.25 Mtpa ECA LNG Phase 1 export liquefaction train',
              'Mandatory 3-tug escort, real-time swell monitoring (<2.0 m) and full SIGTTO safety protocols',
            ],
            infrastructureHighlights: [
              '360 m de espigón protegido por rompeolas propio para metaneros hasta 315 m LOA y 13.8 m calado',
              '320,000 m³ de almacenamiento criogénico total + planta de licuefacción ECA LNG con acceso directo al Pacífico',
              'Interconexión directa con Gasoducto Rosarito y red norteamericana evitando el Canal de Panamá hacia Asia',
            ],
            infrastructureHighlightsEn: [
              '360 m breakwater-protected jetty handling LNG carriers up to 315 m LOA / 13.8 m draft',
              '320,000 m³ cryogenic tank farm + Pacific-facing ECA LNG liquefaction train',
              'Direct tie-in to Rosarito Pipeline & US gas grid bypassing Panama Canal for Asia exports',
            ],
            vesselTypesServed: ['Buques Metaneros Criogénicos GNL (hasta 315 m LOA / 217,000 m³)'],
            vesselTypesServedEn: ['Cryogenic LNG Carriers (up to 315 m LOA / 217,000 m³)'],
            connectivity:
              'Gasoducto Rosarito–Tijuana–Baja Norte con interconexión bidireccional a Estados Unidos (El Paso / North Baja).',
            connectivityEn:
              'Rosarito–Tijuana pipeline system with bi-directional US cross-border interconnect.',
            operationalAdvantages: [
              'Única terminal de exportación GNL en el Pacífico norteamericano con tránsito directo sin pasar por el Canal de Panamá hacia Asia.',
              'Operación aislada 14 millas al norte del puerto comercial con dársena y rompeolas propios.',
            ],
            operationalAdvantagesEn: [
              'Direct Pacific Coast LNG export outlet to Asia eliminating Panama Canal transit delays.',
              'Dedicated breakwater-protected marine basin 14 miles north of commercial port traffic.',
            ],
            keyClientsOrTrades: ['Sempra Infrastructure', 'TotalEnergies', 'Mitsui', 'CFE / Baja California Gas'],
            certifications: ['SIGTTO / OCIMF', 'PBIP / ISPS', 'CRE / ASEA', 'ISO 9001 / 14001 / 45001'],
          },
          procedures: ['Cumplimiento estricto SIGTTO y 3 remolcadores de escolta.'],
          restrictionsSummary: 'Maniobras diurnas y ventana de oleaje < 2.0 m.',
          berths: [
            {
              idSuffix: 'ens-lng',
              name: 'Muelle GNL Energía Costa Azul',
              lengthM: 360,
              maxLoaM: 315,
              maxBeamM: 50.0,
              berthDepthM: 15.0,
              maxDraftM: 13.8,
              products: ['Gas Natural Licuado (GNL)'],
              cargoGroups: ['Hidrocarburos y Gas'],
              equipment: ['Brazos criogénicos 16"', 'Rompeolas de protección dedicado'],
              connections: ['Gasoducto Rosarito / interconexión EE.UU.'],
              loadingRate: '10,000 – 12,000 m³/h',
              notes: 'Proyecto dual de regasificación y licuefacción.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'ecv-starboard',
          areaKey: 'comercial',
          category: 'Operativa',
          title: 'Atraque Estribor al Muelle para Cruceros > 300 m (ECV1/ECV2)',
          titleEn: 'Starboard Alongside Requirement for Cruise Ships > 300 m',
          detail:
            'Las Reglas de Operación especifican atraque estribor al muelle en posiciones ECV1 y ECV2 (9.50–10.00 m) para cruceros mayores de 300 m.',
          detailEn:
            'Operating Rules mandate starboard-side alongside berthing at ECV1/ECV2 (9.50–10.00 m) for cruise ships > 300 m LOA.',
          limitValue: 'Estribor · 10.0 m',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Ensenada',
        },
        {
          idSuffix: 'berth-drafts',
          areaKey: 'comercial',
          category: 'Física',
          title: 'Calados Oficiales Diferenciados por Posición',
          titleEn: 'Position-Specific Authorized Drafts',
          detail:
            'TUM 2 (EIT): 14.50 m (máx. 350 m LOA); ASIPONA 1: 13.00 m; TUM 1: 11.70 m (máx. 180 m); ASIPONA 2: 7.50 m.',
          detailEn:
            'TUM 2 (EIT): 14.50 m (350 m LOA); ASIPONA 1: 13.00 m; TUM 1: 11.70 m (180 m LOA); ASIPONA 2: 7.50 m.',
          limitValue: '7.50 – 14.50 m',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Ensenada',
        },
      ],
      sampleVessel: 'MV Baja California',
      sampleImo: '9745201',
      sampleBerth: 'TUM 2 (Hutchison EIT)',
      sampleCargo: 'Contenedores FCL · 2,900 TEU',
      sampleStatus: 'ANCHORED',
    },

    // 11. LA PAZ / PICHILINGUE
    {
      id: 'mxlap',
      shortCode: 'LAP',
      name: 'Puerto de La Paz / Pichilingue',
      unLocode: 'MXLAP',
      region: 'PACÍFICO NORTE',
      state: 'Baja California Sur · Mar de Cortés',
      coordinates: "24°15'42\"N · 110°19'30\"W",
      vhfChannel: 'CH 16 / CH 14 (Capitanía La Paz)',
      authority: 'API Baja California Sur · Capitanía La Paz',
      lineupSourceUrl: 'https://apibcs.com.mx/',
      lineupConnector: 'PORTAL_LINK',
      operatingRulesSummary:
        'Reglas de Operación APIBCS Pichilingue: Canal de acceso y dársenas entre -7.0 y -7.5 m NBMI; muelles diferenciados (Transbordador 1/1 Bis -6.50 m, Transbordador 2/3 -5.50 m, Usos Múltiples 1 -6.00 m, Usos Múltiples 2 y Cruceros -9.15 m, Muelle CEMEX -7.00 m); fondeadero oficial de Caligas (-7.0 m / calado op. -6.00 m NBMI).',
      operatingRulesUrl: 'https://apibcs.com.mx/reglamento-y-manuales/',
      headlineEs: 'La Paz / Pichilingue. Cruceros (-9.15 m), Ro-Pax, CEMEX y Caligas.',
      headlineEn: 'La Paz / Pichilingue. Cruise (-9.15 m), Ro-Pax, CEMEX & Caligas.',
      overviewEs:
        'Enlace marítimo vital de Baja California Sur administrado por APIBCS en la Bahía de Pichilingue. Opera terminales de transbordadores Ro-Pax (Baja Ferries / TMC), Usos Múltiples 1 y 2 (-9.15 m cruceros), Muelle CEMEX (-7.00 m), Terminal PEMEX Punta Prieta y el Fondeadero de Caligas.',
      overviewEn:
        'Maritime lifeline for Baja California Sur managed by APIBCS at Pichilingue. Features Ro-Pax ferry berths, Multipurpose 1 & 2 (-9.15 m cruise berth), CEMEX (-7.00 m), PEMEX Punta Prieta and Caligas anchorage.',
      heroImageType: 'pajaritos',
      channels: [
        {
          id: 'ch-lap-pich',
          name: 'Canal de Acceso y Dársenas de Ciaboga Pichilingue',
          lengthNm: 1.4,
          widthM: 120,
          channelDepthM: 10.5,
          operationalDraftM: 9.15,
          squatAllowanceNote:
            'Dársena exterior -9.15 m para Usos Múltiples 2 / Cruceros; dársena interior y canales de transbordadores entre -7.0 y -7.5 m NBMI.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-lap-caligas',
          name: 'Fondeadero Oficial de Caligas (Bahía de La Paz)',
          purpose: 'Buques gaseros, cabotaje y descarga mediante línea o barcaza',
          coordinates: "24°14.8'N · 110°20.4'W (Bahía de La Paz / Caligas)",
          depthM: 'Profundidad -7.0 m · Calado op. -6.00 m NBMI',
          maxVesselOrNotes:
            'Regulado por APIBCS (/fondeo-bahia-la-paz/); prohibido fondear en zonas arrecifales o canales de ferry.',
          verificationStatus: 'verified',
        },
        {
          id: 'az-lap-ext',
          name: 'Fondeadero Exterior Cruceros / Punta Prieta',
          purpose: 'Cruceros turísticos de gran porte y buques tanque PEMEX',
          coordinates: "24°15.9'N · 110°21.0'W",
          depthM: '15.0 – 25.0 m',
          maxVesselOrNotes:
            'Resguardo del canal de aproximación al muelle Usos Múltiples 2 y Punta Prieta.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'pichilingue',
          name: 'Puerto de Pichilingue (Ro-Pax · Usos Múltiples · Cruceros · CEMEX)',
          nameEn: 'Pichilingue Port Complex',
          summary:
            'Concentra Transbordadores 1/1 Bis (-6.50 m) y 2/3 (-5.50 m), Usos Múltiples 1 (-6.00 m), Usos Múltiples 2 / Cruceros (-9.15 m) y Muelle CEMEX (-7.00 m).',
          summaryEn:
            'Houses Ferry berths 1/1 Bis (-6.50 m) and 2/3 (-5.50 m), Multipurpose 1 (-6.00 m), Multipurpose 2/Cruise (-9.15 m) and CEMEX (-7.00 m).',
          channelDepthM: 10.5,
          operationalDraftM: 9.15,
          turningBasinM: 350,
          daylightOnly: false,
          tugRequirement: '1 a 2 remolcadores para cruceros y buques sin propulsores transversales',
          pilotRequirement: 'Practicaje obligatorio > 500 UAB al ingresar a Pichilingue',
        },
      ],
      terminals: [
        {
          idSuffix: 'um-cruceros',
          areaKey: 'pichilingue',
          name: 'Muelles Usos Múltiples 1 & 2 (Cruceros) y CEMEX Pichilingue',
          operator: 'APIBCS / CEMEX',
          shortDesc:
            'Muelle Usos Múltiples 2 (-9.15 m) habilitado para cruceros y carga general de altura, Usos Múltiples 1 (-6.00 m) y Muelle CEMEX (-7.00 m).',
          shortDescEn:
            'Multipurpose 2 (-9.15 m) serving cruise ships and deep-sea cargo, Multipurpose 1 (-6.00 m) and CEMEX (-7.00 m).',
          coordinates: "24°15'46\"N · 110°19'26\"W",
          mapX: 38,
          mapY: 42,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores', 'Granel Mineral'],
          storageSummary: {
            coveredSqm: 4200,
            openYardSqm: 38000,
            containerYardSqm: 15000,
            warehousesBreakdown:
              'Silos cementeros CEMEX (-7.00 m), patios de carga general y recinto aduanal APIBCS Pichilingue junto a terminal internacional de cruceros (-9.15 m).',
            warehousesBreakdownEn:
              'CEMEX bulk cement silos (-7.00 m), APIBCS bonded general cargo yards & Pichilingue international cruise hall (-9.15 m).',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal Comercial, Cementera CEMEX y Cruceros Internacionales de Bahía de Pichilingue (-9.15 m)',
            positioningHeadlineEn:
              'Pichilingue Bay Commercial Cargo, CEMEX Cement & International Cruise Terminal (-9.15 m)',
            address: 'Carretera Escénica a Pichilingue Km 17, La Paz, Baja California Sur',
            customsRegime: 'Recinto Fiscal Portuario APIBCS Pichilingue · Aduana de La Paz',
            customsRegimeEn: 'APIBCS Bonded Port Precinct · La Paz Customs',
            commercialServices: [
              'Recepción de cruceros internacionales y buques de altura en Usos Múltiples 2 (-9.15 m NBMI)',
              'Descarga neumática de cemento a granel hacia silos CEMEX (-7.00 m) y materiales de construcción para Los Cabos/La Paz',
              'Manejo de carga general paletizada, contenedores y abastecimiento comercial peninsular (~80% del suministro de BCS)',
            ],
            commercialServicesEn: [
              'International cruise calls & deep-sea breakbulk at Multipurpose Berth 2 (-9.15 m NBMI)',
              'Pneumatic bulk cement unloading into CEMEX silos (-7.00 m) serving La Paz & Los Cabos construction',
              'General cargo & container stevedoring powering ~80% of Baja California Sur commercial supply',
            ],
            infrastructureHighlights: [
              '480 m en Usos Múltiples 1 (-6.0 m), Usos Múltiples 2 / Cruceros (-9.15 m) y CEMEX (-7.0 m)',
              'Puerto total de +1,400 m de muelle y >4.5M MT/año de capacidad instalada en Pichilingue',
            ],
            infrastructureHighlightsEn: [
              '480 m across Multipurpose 1 (-6.0 m), Multipurpose 2/Cruise (-9.15 m) & CEMEX (-7.0 m)',
              'Part of Pichilingue’s 1,400+ m quay system (>4.5M MT/yr capacity)',
            ],
            vesselTypesServed: ['Cruceros Internacionales (hasta 250 m LOA)', 'Cementeros y Carga General Costera'],
            vesselTypesServedEn: ['International Cruise Ships (up to 250 m LOA)', 'Cement Carriers & Coastal Breakbulk'],
            connectivity: 'Carretera Escénica Pichilingue hacia La Paz y corredor turístico Los Cabos (Transpeninsular Sur).',
            connectivityEn: 'Scenic Hwy to La Paz & Transpeninsular corridor linking Los Cabos.',
            operationalAdvantages: ['Único recinto comercial de altura del sur peninsular concentrando >80% del abasto estatal.'],
            operationalAdvantagesEn: ['Primary maritime supply gateway handling ~80% of Baja California Sur freight.'],
            certifications: ['ISPS / PBIP', 'APIBCS'],
          },
          procedures: ['Confirmar marea NBMI antes de operar en Usos Múltiples 1 (-6.00 m) o CEMEX (-7.00 m).'],
          restrictionsSummary: 'UM2 Cruceros: -9.15 m; CEMEX: -7.00 m; UM1: -6.00 m NBMI.',
          berths: [
            {
              idSuffix: 'lap-um2',
              name: 'Usos Múltiples 2 (-9.15m) · Usos Múltiples 1 (-6.00m) · CEMEX (-7.00m)',
              lengthM: 480,
              maxLoaM: 250,
              maxBeamM: 32.3,
              berthDepthM: 9.5,
              maxDraftM: 9.15,
              products: ['Cruceros internacionales', 'Cemento a granel (CEMEX)', 'Carga general', 'Contenedores'],
              cargoGroups: ['Carga General y Contenedores', 'Granel Mineral'],
              equipment: ['Sistema de descarga de cemento CEMEX', 'Terminal de cruceros'],
              connections: ['Carretera Escénica La Paz – Pichilingue'],
              loadingRate: '3,500 MT/día cemento · atención a cruceros',
              notes: 'Profundidades oficiales referenciadas al NBMI.',
            },
          ],
        },
        {
          idSuffix: 'ferry-pemex',
          areaKey: 'pichilingue',
          name: 'Terminales de Transbordadores (1, 1 Bis, 2 y 3) & PEMEX Punta Prieta',
          operator: 'Baja Ferries / TMC / PEMEX Logística',
          shortDesc:
            'Rampas Ro-Pax para enlace diario con Mazatlán y Topolobampo (profundidades -5.50 m a -6.50 m) más terminal de combustibles Punta Prieta.',
          shortDescEn:
            'Ro-Pax ferry ramps linking La Paz with Mazatlán and Topolobampo (-5.50 to -6.50 m) plus Punta Prieta fuel jetty.',
          coordinates: "24°15'18\"N · 110°19'38\"W",
          mapX: 64,
          mapY: 58,
          imageType: 'pajaritos',
          cargoGroups: ['Carga General y Contenedores', 'Hidrocarburos y Gas'],
          storageSummary: {
            coveredSqm: 3000,
            openYardSqm: 62000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Patios de tráileres y pasaje Baja Ferries / TMC (Transbordadores 1, 1 Bis, 2 y 3) + planta de almacenamiento de combustibles PEMEX Punta Prieta y NFE GNL/energía.',
            warehousesBreakdownEn:
              'Baja Ferries / TMC Ro-Pax trailer & passenger staging yards + PEMEX Punta Prieta fuel tank farm & NFE LNG/power infrastructure.',
          },
          commercialProfile: {
            positioningHeadline:
              'Autopista Marítima Ro-Pax Mar de Cortés (Mazatlán/Topolobampo) y Hub Energético Punta Prieta',
            positioningHeadlineEn:
              'Sea of Cortez Ro-Pax Ferry Corridor (Mazatlán/Topolobampo) & Punta Prieta Fuel/LNG Hub',
            address: 'Bahía de Pichilingue / Punta Prieta, La Paz, Baja California Sur',
            customsRegime: 'Recinto Cabotaje APIBCS y Terminal Estratégica PEMEX Punta Prieta',
            customsRegimeEn: 'APIBCS Cabotage Ro-Pax Enclosure & PEMEX Punta Prieta Fuel Terminal',
            commercialServices: [
              'Operación diaria Ro-Pax Baja Ferries y TMC (transbordadores hasta 300 m / rampas 1–3) conectando Sinaloa con BCS',
              'Descarga de gasolinas, diésel UBA y turbosina en Terminal PEMEX Punta Prieta + infraestructura GNL/eléctrica NFE',
            ],
            commercialServicesEn: [
              'Daily scheduled Baja Ferries & TMC Ro-Pax cargo/passenger crossings to Mazatlán & Topolobampo',
              'Refined fuels discharge at PEMEX Punta Prieta jetty plus NFE LNG power supply operations',
            ],
            infrastructureHighlights: [
              '620 m en Transbordadores 1/1 Bis (-6.50 m), 2/3 (-5.50 m) y Muelle PEMEX (-9.0 m)',
              'Rampas hidráulicas RoRo y brazos marinos de combustible a 900 m³/h',
            ],
            infrastructureHighlightsEn: [
              '620 m quay spanning Ferry 1/1 Bis (-6.50 m), Ferry 2/3 (-5.50 m) & PEMEX Punta Prieta (-9.0 m)',
              'Hydraulic RoPax ramps & 900 m³/hr refined product marine arms',
            ],
            vesselTypesServed: ['Buques Transbordadores Ro-Pax / RoRo', 'Buques Tanque Costeros PEMEX MR1'],
            vesselTypesServedEn: ['Ro-Pax / RoRo Cargo Ferries', 'Coastal Product Tankers MR1'],
            connectivity: 'Carretera Transpeninsular Sur y puente marítimo directo a Sinaloa.',
            connectivityEn: 'Transpeninsular South Highway & daily ferry link across Sea of Cortez.',
            operationalAdvantages: ['Prioridad de tránsito en canal para mantener itinerarios diarios de abasto hacia BCS.'],
            operationalAdvantagesEn: ['Channel transit priority safeguarding daily Baja California Sur freight schedules.'],
            certifications: ['ISPS / PBIP', 'OCIMF / SIRE (PEMEX)'],
          },
          procedures: ['Ventanas fijas diarias de salida/llegada para buques Ro-Pax.'],
          restrictionsSummary: 'Transbordador 1/1 Bis: -6.50 m; Transbordador 2/3: -5.50 m NBMI.',
          berths: [
            {
              idSuffix: 'lap-ropax',
              name: 'Transbordador 1/1 Bis (-6.50m) · 2/3 (-5.50m) & Terminal PEMEX',
              lengthM: 620,
              maxLoaM: 185,
              maxBeamM: 28.0,
              berthDepthM: 9.8,
              maxDraftM: 9.0,
              products: ['Carga rodada Ro-Pax', 'Autotransporte de carga', 'Gasolina / Diésel / Turbosina'],
              cargoGroups: ['Carga General y Contenedores', 'Hidrocarburos y Gas'],
              equipment: ['Rampas hidráulicas RoRo', 'Brazos marinos de combustibles Punta Prieta'],
              connections: ['Carretera Transpeninsular Sur'],
              loadingRate: 'Turnaround Ro-Pax 4 h · bombeo 900 m³/h',
              notes: 'Soporte logístico crítico de abasto para todo Baja California Sur.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'nbmi-berths',
          areaKey: 'pichilingue',
          category: 'Física',
          title: 'Profundidades Oficiales NBMI por Muelle en Pichilingue',
          titleEn: 'Official NBMI Depths per Berth at Pichilingue',
          detail:
            'UM2/Cruceros -9.15 m, CEMEX -7.00 m, Transbordador 1/1 Bis -6.50 m, UM1 -6.00 m, Transbordador 2/3 -5.50 m y Fondeadero Caligas -6.00 m op.',
          detailEn:
            'UM2/Cruise -9.15 m, CEMEX -7.00 m, Ferry 1/1 Bis -6.50 m, UM1 -6.00 m, Ferry 2/3 -5.50 m, Caligas anchorage -6.00 m op.',
          limitValue: '-5.50 a -9.15 m',
          verificationStatus: 'verified',
          source: 'APIBCS · Reglamento y Manuales Pichilingue',
        },
        {
          idSuffix: 'ferry-priority',
          category: 'Operativa',
          title: 'Prioridad de Paso a Transbordadores en Canal Interior',
          titleEn: 'Ro-Pax Ferry Channel Priority',
          detail:
            'Los transbordadores con itinerario publicado hacia Topolobampo/Mazatlán tienen prioridad de tránsito en el canal interior de Pichilingue.',
          detailEn:
            'Scheduled Ro-Pax ferries bound for Topolobampo/Mazatlán hold channel transit priority.',
          limitValue: 'Prioridad Ro-Pax',
          verificationStatus: 'verified',
          source: 'Reglas de Operación APIBCS',
        },
      ],
      sampleVessel: 'MT Cortes Tanker',
      sampleImo: '9387741',
      sampleBerth: 'Terminal PEMEX Punta Prieta / Fondeo Caligas',
      sampleCargo: 'Gasolina y Diésel · 15,000 MT',
      sampleStatus: 'BERTHED',
    },

    // 12. MAZATLÁN
    {
      id: 'mxmaz',
      shortCode: 'MAZ',
      name: 'Puerto de Mazatlán',
      unLocode: 'MXMZT',
      region: 'PACÍFICO NORTE',
      state: 'Sinaloa · Pacífico Norte',
      coordinates: "23°11'12\"N · 106°25'18\"W",
      vhfChannel: 'CH 16 / CH 12 (CCTM Mazatlán)',
      authority: 'ASIPONA Mazatlán · Capitanía de Puerto',
      lineupSourceUrl: 'https://mediport.puertomazatlan.com.mx/TramitesElectronicos/ConsultaBuques.aspx',
      lineupConnector: 'MZT_HTML',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Mazatlán: Terminal Marítima Mazatlán (TUM de 1,300 m, 5 bodegas de 3,000 m² y almacén con grúa de 5,200 m²); Terminal de Fluidos PEMEX (115 m, calado 10.67 m / 35 ft, 200,000 bbl); Terminal de Transbordadores (200 m + 2 rampas RoRo + 4 duques de alba, 9.15 m / 30 ft); Terminal Atunera PINSA y Cruceros.',
      operatingRulesUrl: 'https://www.puertomazatlan.com.mx/reglas-de-operacion',
      headlineEs: 'Mazatlán. TUM 1,300 m, Fluidos PEMEX (35 ft), Ro-Pax y PINSA.',
      headlineEn: 'Mazatlán. 1,300 m TUM, PEMEX Fuels (35 ft), Ro-Pax & PINSA.',
      overviewEs:
        'Puerto multipropósito en Sinaloa compuesto por la Terminal Marítima Mazatlán (TUM de 1,300 m de muelle con 5 bodegas de 3,000 m² y almacén granelero/grúa de 5,200 m²), Terminal de Fluidos PEMEX (10.67 m / 35 ft), Terminal de Transbordadores Baja Ferries/TMC (200 m + 2 rampas RoRo), Terminal Atunera PINSA y Cruceros.',
      overviewEn:
        'Multipurpose Sinaloa port featuring a 1,300 m TUM quay (5 × 3,000 m² sheds + 5,200 m² crane warehouse), PEMEX Fuels Terminal (10.67 m / 35 ft), Ro-Pax Ferry Terminal (200 m + 2 RoRo ramps + 4 dolphins, 9.15 m / 30 ft), PINSA Tuna and Cruise berths.',
      heroImageType: 'recintoSur',
      channels: [
        {
          id: 'ch-maz-main',
          name: 'Canal de Acceso Isla del Crestón – Dársena Fiscal Mazatlán',
          lengthNm: 1.5,
          widthM: 150,
          channelDepthM: 12.5,
          operationalDraftM: 10.67,
          squatAllowanceNote:
            'Calado operativo máximo 10.67 m (35 ft) hasta Muelle de Fluidos PEMEX y posiciones principales TUM; dársena de ciaboga de 380 m.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-maz-1',
          name: 'Fondeadero Exterior Mazatlán (Oeste/Sur de Isla del Crestón)',
          purpose: 'Buques mercantes, petroleros, portavehículos y cruceros en espera',
          coordinates: "23°10.4'N · 106°26.8'W (~1.5 MN al SW de Isla del Crestón)",
          depthM: '16.0 – 26.0 m',
          maxVesselOrNotes:
            'Zona expuesta a marejada de fondo del SW en verano; mantener máquina disponible y VHF CH 12/16.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'tum-comercial',
          name: 'Terminal Marítima Mazatlán (TUM 1,300 m) & PINSA / Cruceros',
          nameEn: 'Mazatlán Maritime Terminal (1,300 m) & PINSA / Cruise',
          summary:
            'Frente continuo de 1,300 m para contenedores, automóviles RoRo, acero, carga general y pesca atunera PINSA, con 5 bodegas de 3,000 m² y almacén de 5,200 m².',
          summaryEn:
            '1,300 m continuous quay for containers, RoRo vehicles, steel, general cargo and PINSA tuna fleet with 20,200 m² of covered storage.',
          channelDepthM: 12.0,
          operationalDraftM: 10.36,
          turningBasinM: 380,
          daylightOnly: false,
          tugRequirement: '2 remolcadores obligatorios para esloras > 140 m',
          pilotRequirement: 'Practicaje obligatorio desde Isla del Crestón',
        },
        {
          key: 'pemex-ferry',
          name: 'Terminal de Fluidos PEMEX (35 ft) & Transbordadores (30 ft)',
          nameEn: 'PEMEX Fluids (35 ft) & Ferry Terminal (30 ft)',
          summary:
            'Muelle PEMEX de 115 m (200,000 bbl, 35 ft) y Terminal de Transbordadores de 200 m con 2 rampas RoRo y 4 duques de alba (30 ft).',
          summaryEn:
            'PEMEX 115 m berth (200,000 bbl, 35 ft) and 200 m Ferry Terminal with 2 RoRo ramps & 4 dolphins (30 ft).',
          channelDepthM: 12.5,
          operationalDraftM: 10.67,
          turningBasinM: 380,
          daylightOnly: false,
          tugRequirement: '2 remolcadores para buques tanque PEMEX',
          pilotRequirement: 'Practicaje obligatorio; prioridad de ventana para ferry a La Paz',
        },
      ],
      terminals: [
        {
          idSuffix: 'tum',
          areaKey: 'tum-comercial',
          name: 'Terminal Marítima Mazatlán (TUM · 1,300 m) & Terminal Atunera PINSA',
          operator: 'TMAZ / ASIPONA Mazatlán / PINSA',
          shortDesc:
            '1,300 m de muelle con 5 bodegas (3,000 m² c/u), almacén de 5,200 m² con grúa puente, área automotriz RoRo, contenedores, cruceros y flota atunera PINSA.',
          shortDescEn:
            '1,300 m quay with 5 × 3,000 m² sheds, 5,200 m² crane warehouse, RoRo automotive, containers, cruise and PINSA tuna berth.',
          coordinates: "23°11'18\"N · 106°25'12\"W",
          mapX: 38,
          mapY: 42,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores', 'Granel Agrícola', 'Carga Proyecto'],
          storageSummary: {
            coveredSqm: 20200,
            openYardSqm: 115000,
            containerYardSqm: 45000,
            warehousesBreakdown:
              'TUM de 1,300 m (6 posiciones) respaldada por 5 bodegas fiscales de 3,000 m² c/u + almacén de 5,200 m² con grúa puente, patios automotrices RoRo y frigoríficos atuneros PINSA.',
            warehousesBreakdownEn:
              '1,300 m TUM (6 berths) backed by 5 x 3,000 m² sheds + 5,200 m² crane-equipped warehouse, automotive RoRo lots & PINSA tuna cold storage.',
          },
          commercialProfile: {
            positioningHeadline:
              'TUM de 1,300 m (6 Posiciones), Hub Automotriz/Contenedores, Flota Atunera PINSA y Cruceros Riviera Mexicana',
            positioningHeadlineEn:
              '1,300 m Multipurpose Quay (6 Berths), Automotive RoRo, PINSA Tuna Capital & Cruise Port',
            address: 'Interior Recinto Fiscal s/n, Col. Playa Sur, Mazatlán, Sinaloa',
            customsRegime: 'Recinto Fiscal Portuario ASIPONA / TMAZ · Aduana de Mazatlán (VUCEM / MediPort)',
            customsRegimeEn: 'ASIPONA / TMAZ Bonded Port Precinct · Mazatlán Customs (VUCEM / MediPort)',
            commercialServices: [
              'Importación/exportación de automóviles RoRo (PCTC) con patios pavimentados conectados a supercarretera Mazatlán–Durango',
              'Manejo de contenedores FCL/reefer, acero estructural, madera y carga proyecto en 6 posiciones continuas (1,300 m)',
              'Operación pesquera/frigorífica líder de México (PINSA atún congelado) y atención a cruceros turísticos Riviera Mexicana',
            ],
            commercialServicesEn: [
              'PCTC RoRo vehicle logistics linked to Durango–Monterrey–Bajío corridor via Mazatlán–Durango superhighway',
              'FCL/reefer containers, steel breakbulk & project cargo across 1,300 m continuous quay (6 berths)',
              'Mexico’s largest industrial tuna fleet discharge (PINSA cold chain) & Mexican Riviera cruise ship berthage',
            ],
            infrastructureHighlights: [
              '1,300 m lineales en 6 posiciones TUM a 10.36 m (34 ft) de calado operativo',
              '5 bodegas cubiertas de 3,000 m² + almacén de 5,200 m² con grúa puente + grúas móviles portuarias',
            ],
            infrastructureHighlightsEn: [
              '1,300 m continuous quay across 6 TUM berths at 10.36 m (34 ft) operational draft',
              '20,200 m² total covered storage (5 sheds + crane warehouse) & heavy mobile craneage',
            ],
            vesselTypesServed: ['Buques PCTC / RoRo Automotrices', 'Cruceros Riviera Mexicana, Contenedores y Atuneros PINSA'],
            vesselTypesServedEn: ['PCTC / RoRo Auto Carriers', 'Mexican Riviera Cruise Liners, Boxships & Tuna Vessels'],
            connectivity: 'Supercarretera Mazatlán–Durango hacia Torreón, Saltillo y Monterrey + Ferromex.',
            connectivityEn: 'Mazatlán–Durango toll expressway to Torreón, Saltillo & Monterrey + Ferromex rail.',
            operationalAdvantages: ['Salida estratégica del corredor económico del Norte de México hacia el Pacífico.'],
            operationalAdvantagesEn: ['Primary Pacific ocean exit for the Durango–Torreón–Monterrey economic corridor.'],
            certifications: ['ISPS / PBIP', 'ISO 9001', 'SENASICA'],
          },
          procedures: ['Programación electrónica vía MediPort Mazatlán; inspección aduanal 48 h previas.'],
          restrictionsSummary: 'Calado op. 10.36 m (34 ft) en posiciones TUM principales.',
          berths: [
            {
              idSuffix: 'maz-tum',
              name: 'Muelles Fiscales 1 – 6 (1,300 m TUM) & Muelle PINSA / Cruceros',
              lengthM: 1300,
              maxLoaM: 295,
              maxBeamM: 36.0,
              berthDepthM: 11.5,
              maxDraftM: 10.36,
              products: ['Automóviles RoRo', 'Contenedores', 'Atún congelado PINSA', 'Acero', 'Cruceros'],
              cargoGroups: ['Carga General y Contenedores', 'Granel Agrícola', 'Carga Proyecto'],
              equipment: ['Grúas móviles portuarias', 'Almacén 5,200 m² con grúa', '5 Bodegas de 3,000 m²'],
              connections: ['Corredor carretero Mazatlán–Durango (Supercarretera)'],
              loadingRate: '3,000 – 4,800 MT/día · 250 autos/h',
              notes: 'Hub atunero y de exportación automotriz del Pacífico Norte.',
            },
          ],
        },
        {
          idSuffix: 'pemex-ferry',
          areaKey: 'pemex-ferry',
          name: 'Terminal de Fluidos PEMEX & Terminal de Transbordadores (Baja Ferries / TMC)',
          operator: 'PEMEX Logística / Baja Ferries / TMC',
          shortDesc:
            'Muelle PEMEX de 115 m con capacidad de 200,000 bbl y 10.67 m (35 ft) de calado, junto a Terminal de Transbordadores de 200 m + 2 rampas RoRo + 4 duques de alba a 9.15 m (30 ft).',
          shortDescEn:
            '115 m PEMEX jetty (200,000 bbl, 35 ft draft) and 200 m Ferry Terminal with 2 RoRo ramps and 4 dolphins (30 ft draft).',
          coordinates: "23°10'52\"N · 106°25'04\"W",
          mapX: 66,
          mapY: 56,
          imageType: 'pajaritos',
          cargoGroups: ['Hidrocarburos y Gas', 'Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 2500,
            openYardSqm: 55000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Terminal de Almacenamiento PEMEX (200,000 bbl en tanque) + patios Ro-Pax de Baja Ferries y TMC con 2 rampas RoRo y 4 duques de alba.',
            warehousesBreakdownEn:
              'PEMEX 200,000 bbl fuel terminal tank farm + Baja Ferries / TMC Ro-Pax marshaling yards with 2 RoRo ramps & 4 dolphins.',
          },
          commercialProfile: {
            positioningHeadline:
              'Enlace Ro-Pax Baja Ferries / TMC hacia La Paz y Terminal Petrolera PEMEX (35 ft)',
            positioningHeadlineEn:
              'Baja Ferries / TMC Ro-Pax Sea Bridge to La Paz & PEMEX Fuel Import Berth (35 ft)',
            address: 'Dársena Sur / Zona de Transbordadores, Mazatlán, Sinaloa',
            customsRegime: 'Terminal PEMEX Logística y Terminal Cabotaje Ro-Pax · Aduana Mazatlán',
            customsRegimeEn: 'PEMEX Fuel Terminal & Cabotage Ro-Pax Ferry Facility · Mazatlán Customs',
            commercialServices: [
              'Operación diaria Ro-Pax Baja Ferries y TMC de tractocamiones, mercancías y pasajeros hacia La Paz (BCS)',
              'Descarga de diésel marino, gasolinas y combustóleo en Muelle PEMEX (115 m / 200,000 bbl)',
            ],
            commercialServicesEn: [
              'Daily scheduled Baja Ferries & TMC Ro-Pax cargo/passenger crossings to La Paz, BCS',
              'Fuel unloading (ULSD, gasoline & fuel oil) feeding PEMEX 200,000 bbl coastal depot',
            ],
            infrastructureHighlights: [
              'Muelle PEMEX 115 m (10.67 m / 35 ft) + Terminal Transbordadores 200 m con 2 rampas RoRo y 4 duques (9.15 m / 30 ft)',
              'Capacidad de almacenamiento de 200,000 bbl en TAD PEMEX y patios de pre-embarque vehicular Ro-Pax',
            ],
            infrastructureHighlightsEn: [
              '115 m PEMEX jetty (35 ft draft) + 200 m Ferry Quay with 2 RoRo ramps & 4 dolphins (30 ft draft)',
              '200,000 bbl PEMEX onshore storage farm plus dedicated Ro-Pax commercial vehicle staging lots',
            ],
            vesselTypesServed: ['Buques Transbordadores Ro-Pax', 'Buques Tanque Producto MR1'],
            vesselTypesServedEn: ['Ro-Pax Ferries', 'MR1 Product Tankers'],
            connectivity: 'Autopista Mazatlán–Culiacán y Supercarretera Mazatlán–Durango.',
            connectivityEn: 'Mazatlán–Culiacán & Mazatlán–Durango expressway links.',
            operationalAdvantages: ['Principal nodo continental sur del puente marítimo Sinaloa–Baja California Sur.'],
            operationalAdvantagesEn: ['Southern mainland anchor for Baja California Sur ferry logistics.'],
            certifications: ['ISPS / PBIP', 'OCIMF / SIRE (PEMEX)'],
          },
          procedures: ['Vetting SIRE en PEMEX; coordinación de rampas RoRo en Terminal de Transbordadores.'],
          restrictionsSummary: 'PEMEX: 10.67 m (35 ft); Transbordadores: 9.15 m (30 ft).',
          berths: [
            {
              idSuffix: 'maz-pemex-ferry',
              name: 'Muelle PEMEX (115m / 35 ft) & Transbordadores (200m + 4 Duques / 30 ft)',
              lengthM: 315,
              maxLoaM: 215,
              maxBeamM: 32.2,
              berthDepthM: 11.8,
              maxDraftM: 10.67,
              products: ['Diésel marino', 'Gasolinas', 'Combustóleo', 'Carga rodada Ro-Pax a La Paz'],
              cargoGroups: ['Hidrocarburos y Gas', 'Carga General y Contenedores'],
              equipment: ['Brazos de carga PEMEX', '2 Rampas RoRo y 4 duques de alba'],
              connections: ['Terminal de Almacenamiento PEMEX (200,000 bbl)', 'Autopista Mazatlán–Culiacán'],
              loadingRate: '1,200 – 2,000 m³/h PEMEX',
              notes: 'Enlace diario de carga rodada hacia Baja California Sur.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'pemex-ferry-draft',
          areaKey: 'pemex-ferry',
          category: 'Física',
          title: 'Calado Oficial PEMEX (10.67 m / 35 ft) vs. Transbordadores (9.15 m / 30 ft)',
          titleEn: 'Official PEMEX Draft (35 ft) vs. Ferry Terminal (30 ft)',
          detail:
            'Muelle PEMEX admite hasta 10.67 m (35 ft) de calado; Terminal de Transbordadores opera a 9.15 m (30 ft).',
          detailEn:
            'PEMEX berth allows up to 10.67 m (35 ft) draft; Ferry Terminal operates at 9.15 m (30 ft).',
          limitValue: '10.67 m / 9.15 m',
          verificationStatus: 'verified',
          source: 'ASIPONA Mazatlán · Fichas Técnicas',
        },
        {
          idSuffix: 'creston-swell',
          category: 'Operativa',
          title: 'Marejada del SW en Bocana de Isla del Crestón',
          titleEn: 'SW Swell Conditions off Crestón Entrance',
          detail:
            'Tormentas tropicales de verano (junio–octubre) generan marejada larga del SW frente al Crestón; vigilar margen UKC al cruzar bocana.',
          detailEn:
            'Summer tropical systems (Jun–Oct) produce long SW swell at Crestón entrance; monitor UKC closely.',
          limitValue: 'UKC estricto',
          verificationStatus: 'verified',
          source: 'Capitanía de Puerto Mazatlán',
        },
      ],
      sampleVessel: 'MV Sinaloa Star',
      sampleImo: '9570112',
      sampleBerth: 'Muelles Fiscales 1 – 6 (1,300 m TUM)',
      sampleCargo: 'Automóviles RoRo · 1,450 unidades',
      sampleStatus: 'EXPECTED',
    },

    // 13. TOPOLOBAMPO
    {
      id: 'mxtop',
      shortCode: 'TOP',
      name: 'Puerto de Topolobampo',
      unLocode: 'MXTPB',
      region: 'PACÍFICO NORTE',
      state: 'Sinaloa · Golfo de California',
      coordinates: "25°35'30\"N · 109°03'24\"W",
      vhfChannel: 'CH 16 / CH 14 (Capitanía Topolobampo)',
      authority: 'ASIPONA Topolobampo · Capitanía de Puerto',
      lineupSourceUrl: 'https://puertotopolobampo.com.mx/archivos/programacion.php',
      lineupConnector: 'TOPO_HTML',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Topolobampo: Canal de acceso de 22.22 km × 150 m con calado oficial de 13.40 m; 11 posiciones de atraque totales (PEMEX 2 × 156 m a 11.26–12.15 m; Terminal Transoceánica / TUM 135 m a 10.80 m / 35.4 ft; Transbordadores RoRo 170 m a 6.60 m / 21.6 ft; CEMEX 60 m + duques a 5.00 m / 16.5 ft; IEnova Almacenaje ~11.10 m).',
      operatingRulesUrl: 'https://www.puertotopolobampo.com.mx/reglas-de-operacion',
      headlineEs: 'Topolobampo. Canal de 22.22 km (13.40 m) y 11 posiciones.',
      headlineEn: 'Topolobampo. 22.22 km channel (13.40 m) & 11 berthing positions.',
      overviewEs:
        'Puerto agrícola, químico y de combustibles líder del noroeste. Su canal de 22.22 km × 150 m (13.40 m oficial) da acceso a 11 posiciones entre PEMEX (11.26–12.15 m), Terminal Transoceánica/TUM (10.80 m), IEnova Almacenaje (11.10 m), Transbordadores RoRo (6.60 m) y CEMEX (5.00 m).',
      overviewEn:
        'Northwestern agricultural, chemical and fuel port accessed via a 22.22 km × 150 m channel (13.40 m official). Operates 11 berths including PEMEX (11.26–12.15 m), Transoceánica/TUM (10.80 m), IEnova (11.10 m), Ferries (6.60 m) and CEMEX (5.00 m).',
      heroImageType: 'pajaritos',
      channels: [
        {
          id: 'ch-top-barra',
          name: 'Canal de Acceso Barra – Topolobampo (22.22 km × 150 m)',
          lengthNm: 12.0,
          widthM: 150,
          channelDepthM: 14.5,
          operationalDraftM: 13.4,
          squatAllowanceNote:
            'Travesía de 22.22 km (12.0 NM) desde boya de recalada por bahía de Ohuira/Topolobampo; calado oficial de canal 13.40 m.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-top-1',
          name: 'Fondeadero Exterior Barra de Topolobampo',
          purpose: 'Espera de marea y práctico para buques graneleros y petroleros',
          coordinates: "25°31.5'N · 109°11.2'W (al exterior de boya de recalada)",
          depthM: '15.0 – 22.0 m',
          maxVesselOrNotes:
            'Abordaje de práctico al exterior de la barra; tránsito de 12 NM hasta muelles requiere ~1.5 h.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'comercial-bulk',
          name: 'Zona Comercial y Granelera (Transoceánica TUM · RoRo · CEMEX)',
          nameEn: 'Commercial & Bulk Zone (TUM · Ferries · CEMEX)',
          summary:
            'Terminal Transoceánica/TUM para maíz blanco y fertilizantes (10.80 m), Terminal de Transbordadores a La Paz (6.60 m) y Muelle CEMEX (5.00 m).',
          summaryEn:
            'Transoceánica/TUM for white corn and fertilizers (10.80 m), La Paz Ferries (6.60 m) and CEMEX berth (5.00 m).',
          channelDepthM: 13.4,
          operationalDraftM: 10.8,
          turningBasinM: 400,
          daylightOnly: false,
          tugRequirement: '2 remolcadores en canal interior y ciaboga de graneleros',
          pilotRequirement: 'Practicaje obligatorio desde boya exterior (12 NM de canal)',
        },
        {
          key: 'energetica',
          name: 'Zona Energética y Química (PEMEX · IEnova · Amoníaco)',
          nameEn: 'Energy & Chemical Zone (PEMEX · IEnova · Ammonia)',
          summary:
            'Dos posiciones PEMEX de 156 m (11.26–12.15 m), Terminal de Almacenaje IEnova (~11.10 m) y muelle petroquímico/amoníaco.',
          summaryEn:
            'Two 156 m PEMEX berths (11.26–12.15 m), IEnova fuel terminal (~11.10 m) and ammonia/petrochemical berth.',
          channelDepthM: 14.0,
          operationalDraftM: 12.15,
          turningBasinM: 420,
          daylightOnly: true,
          tugRequirement: '2 a 3 remolcadores de escolta para buques tanque e hidrocarburos',
          pilotRequirement: 'Ventana diurna preferente en cruce de barra para tanques cargados',
        },
      ],
      terminals: [
        {
          idSuffix: 'transoceanica',
          areaKey: 'comercial-bulk',
          name: 'Terminal Transoceánica / TUM · Transbordadores & CEMEX (11 Posiciones)',
          operator: 'ASIPONA Topolobampo / Transoceánica / Baja Ferries / CEMEX',
          shortDesc:
            'Muelle Transoceánica/TUM de 135 m (10.80 m / 35.4 ft) para maíz blanco y urea; Transbordadores RoRo 170 m (6.60 m / 21.6 ft); CEMEX 60 m + duques (5.00 m / 16.5 ft).',
          shortDescEn:
            '135 m Transoceánica/TUM berth (10.80 m / 35.4 ft) for white corn and urea; 170 m Ferries (6.60 m); 60 m CEMEX + dolphins (5.00 m).',
          coordinates: "25°35'38\"N · 109°03'18\"W",
          mapX: 38,
          mapY: 44,
          imageType: 'recintoSur',
          cargoGroups: ['Granel Agrícola', 'Carga General y Contenedores', 'Granel Mineral'],
          storageSummary: {
            coveredSqm: 28000,
            openYardSqm: 92000,
            containerYardSqm: 15000,
            warehousesBreakdown:
              'Silos de alta capacidad para maíz blanco de Sinaloa en Terminal Transoceánica/TUM, bodegas de fertilizantes/urea, silos CEMEX y patio de transbordadores Baja Ferries.',
            warehousesBreakdownEn:
              'High-capacity Sinaloa white corn export silos at Transoceánica/TUM, dry fertilizer sheds, CEMEX cement silos & Baja Ferries Ro-Pax yard.',
          },
          commercialProfile: {
            positioningHeadline:
              'Principal Puerto Exportador de Maíz Blanco de Sinaloa, Fertilizantes y Enlace Ro-Pax a La Paz',
            positioningHeadlineEn:
              'Sinaloa’s Premier White Corn Export Silos, Bulk Fertilizer & La Paz Ro-Pax Ferry Gateway',
            address: 'Recinto Portuario Topolobampo, Ahome (Los Mochis), Sinaloa',
            customsRegime: 'Recinto Fiscal Portuario ASIPONA · Aduana de Mazatlán/Topolobampo (SENASICA)',
            customsRegimeEn: 'ASIPONA Bonded Enclosure · Topolobampo Customs & SENASICA Phytosanitary Clearance',
            commercialServices: [
              'Embarque mecanizado de maíz blanco y trigo cristalino en Terminal Transoceánica / TUM (7,000–9,500 MT/día)',
              'Importación de urea, DAP y fertilizantes sólidos/minerales hacia el Valle del Fuerte',
              'Cruce diario de transbordadores Ro-Pax Baja Ferries hacia La Paz/Pichilingue y descarga CEMEX',
            ],
            commercialServicesEn: [
              'Mechanized export loading of Sinaloa white corn & wheat at Transoceánica/TUM (7,000–9,500 MT/day)',
              'Bulk urea, DAP & mineral import stevedoring feeding Northern Sinaloa agriculture',
              'Daily Baja Ferries Ro-Pax crossing to La Paz plus CEMEX bulk cement discharge',
            ],
            infrastructureHighlights: [
              'Canal de acceso de 22.22 km × 150 m (13.40 m oficial) con 11 posiciones portuarias totales',
              'TUM Transoceánica (10.80 m / 35.4 ft), Transbordadores RoRo (6.60 m) y CEMEX (5.00 m)',
            ],
            infrastructureHighlightsEn: [
              '22.22 km × 150 m approach channel (13.40 m official depth) serving 11 total port positions',
              'Transoceánica TUM (10.80 m / 35.4 ft), RoRo Ferries (6.60 m) & CEMEX berth (5.00 m)',
            ],
            vesselTypesServed: ['Graneleros Handysize / Supramax (grano y fertilizantes)', 'Transbordadores Ro-Pax y Cementeros'],
            vesselTypesServedEn: ['Handysize / Supramax Grain & Fertilizer Bulkers', 'Ro-Pax Ferries & Cement Ships'],
            connectivity: 'Ferrocarril Chihuahua–Pacífico (Chepe / Ferromex) y Carretera Los Mochis–Topolobampo (Fed. 15).',
            connectivityEn: 'Ferromex Chihuahua–Pacific railway & Los Mochis–Topolobampo Federal Hwy 15.',
            operationalAdvantages: ['Ubicación en pleno corazón agrícola del norte de Sinaloa reduciendo fletes de grano.'],
            operationalAdvantagesEn: ['Direct dockside silos at the center of Mexico’s highest-yield white corn belt.'],
            certifications: ['ISPS / PBIP', 'SENASICA'],
          },
          procedures: ['Inspección fitosanitaria SENASICA y control estricto de humedad en exportación de maíz.'],
          restrictionsSummary: 'TUM: 10.80 m (35.4 ft); RoRo: 6.60 m (21.6 ft); CEMEX: 5.00 m (16.5 ft).',
          berths: [
            {
              idSuffix: 'top-tum',
              name: 'Terminal Transoceánica TUM (10.80m) · RoRo (6.60m) · CEMEX (5.00m)',
              lengthM: 365,
              maxLoaM: 215,
              maxBeamM: 32.2,
              berthDepthM: 11.5,
              maxDraftM: 10.8,
              products: ['Maíz blanco de exportación', 'Urea / DAP', 'Carga Ro-Pax', 'Cemento a granel'],
              cargoGroups: ['Granel Agrícola', 'Carga General y Contenedores', 'Granel Mineral'],
              equipment: ['Banda cargadora de grano', 'Silos de almacenamiento', 'Rampas RoRo y duques de alba'],
              connections: ['Ferrocarril Chepe / Ferromex (Chihuahua–Pacífico)', 'Carretera Los Mochis'],
              loadingRate: '7,000 – 9,500 MT/día grano',
              notes: 'Principal nodo exportador de maíz blanco de Sinaloa.',
            },
          ],
        },
        {
          idSuffix: 'pemex-ienova',
          areaKey: 'energetica',
          name: 'Terminal PEMEX (2 × 156 m) & Terminal IEnova Almacenaje',
          operator: 'PEMEX Logística / IEnova Topolobampo',
          shortDesc:
            'Dos posiciones PEMEX de 156 m habilitadas entre 11.26 m y 12.15 m de calado, más muelle de combustibles IEnova (~11.10 m).',
          shortDescEn:
            'Two 156 m PEMEX jetties rated at 11.26–12.15 m draft plus IEnova refined products berth (~11.10 m).',
          coordinates: "25°35'08\"N · 109°03'46\"W",
          mapX: 66,
          mapY: 54,
          imageType: 'pajaritos',
          cargoGroups: ['Hidrocarburos y Gas', 'Petroquímica y Líquidos'],
          storageSummary: {
            coveredSqm: 1500,
            openYardSqm: 45000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Terminales de almacenamiento de refinados PEMEX Logística e IEnova Topolobampo + tanques de amoníaco anhidro agrícola en zona industrial.',
            warehousesBreakdownEn:
              'PEMEX Logística & IEnova refined hydrocarbon tank farms plus agricultural anhydrous ammonia storage in Topolobampo industrial park.',
          },
          commercialProfile: {
            positioningHeadline:
              'Hub Energético y Químico del Noroeste: PEMEX (12.15 m), IEnova Combustibles y Amoníaco Anhidro',
            positioningHeadlineEn:
              'NW Mexico Fuel & Chemical Hub: PEMEX (12.15 m), IEnova Fuels & Anhydrous Ammonia',
            address: 'Zona Industrial Portuaria Topolobampo, Ahome, Sinaloa',
            customsRegime: 'Terminales Especializadas PEMEX e IEnova (CRE / ASEA) · Aduana Topolobampo',
            customsRegimeEn: 'CRE/ASEA Regulated Fuel & Ammonia Terminals · Topolobampo Customs',
            commercialServices: [
              'Importación y cabotaje de gasolinas, diésel UBA y combustóleo en muelles PEMEX 1–2 e IEnova',
              'Importación de amoníaco anhidro fertilizante para distritos de riego del norte de Sinaloa y Sonora',
            ],
            commercialServicesEn: [
              'Marine discharge of gasoline, ULSD & fuel oil via twin PEMEX jetties & IEnova terminal',
              'Anhydrous ammonia gas carrier unloading supporting Sinaloa agricultural irrigation districts',
            ],
            infrastructureHighlights: [
              '460 m combinados entre 2 muelles PEMEX (11.26–12.15 m) y muelle IEnova (~11.10 m)',
              'Brazos marinos 10"–12", sistema ESD y red contraincendio dedicada',
            ],
            infrastructureHighlightsEn: [
              '460 m berth length across twin PEMEX jetties (11.26–12.15 m) & IEnova berth (11.10 m)',
              '10"–12" marine loading arms, ESD trips & dedicated firewater protection',
            ],
            vesselTypesServed: ['Buques Tanque Producto MR1 / MR2', 'Gaseros de Amoníaco Anhidro'],
            vesselTypesServedEn: ['MR1 / MR2 Product Tankers', 'Anhydrous Ammonia Gas Carriers'],
            connectivity: 'Zona industrial Los Mochis–Topolobampo y ferrocarril/carretera federal 15.',
            connectivityEn: 'Topolobampo–Los Mochis industrial corridor, Ferromex rail & Fed. Hwy 15.',
            operationalAdvantages: ['Calados profundos de hasta 12.15 m para tanqueros cargados en el Golfo de California.'],
            operationalAdvantagesEn: ['Deep 12.15 m hydrocarbon draft maximizing Sea of Cortez tanker parcels.'],
            certifications: ['OCIMF / SIRE', 'ISGOTT', 'SIGTTO (Amoníaco)'],
          },
          procedures: ['Vetting SIRE obligatorio y protocolo ISGOTT Ship/Shore Checklist.'],
          restrictionsSummary: 'PEMEX: 11.26 – 12.15 m; IEnova: ~11.10 m.',
          berths: [
            {
              idSuffix: 'top-oil',
              name: 'Muelles PEMEX 1 y 2 (11.26–12.15 m) & Muelle IEnova (11.10 m)',
              lengthM: 460,
              maxLoaM: 215,
              maxBeamM: 32.3,
              berthDepthM: 13.0,
              maxDraftM: 12.15,
              products: ['Gasolina', 'Diésel UBA', 'Combustóleo', 'Amoníaco anhidro'],
              cargoGroups: ['Hidrocarburos y Gas', 'Petroquímica y Líquidos'],
              equipment: ['Brazos marinos 10" y 12"', 'ESD y red contraincendio'],
              connections: ['Tanques PEMEX e IEnova en zona industrial Topolobampo'],
              loadingRate: '1,400 – 2,400 m³/h',
              notes: 'Incluye atención energética al norte de Sinaloa y corredor Los Mochis.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'channel-22km',
          category: 'Operativa',
          title: 'Tránsito de Canal Largo (22.22 km / 12.0 NM) y Marea de Barra',
          titleEn: 'Long Bar Channel Transit (22.22 km / 12.0 NM)',
          detail:
            'Canal de 22.22 km × 150 m exige programar embarque de práctico al menos 2 h antes de ventana de atraque considerando corrientes de marea en la barra.',
          detailEn:
            '22.22 km × 150 m channel requires boarding pilot 2 hours prior to berthing window accounting for bar tidal currents.',
          limitValue: '22.22 km · 13.40 m',
          verificationStatus: 'verified',
          source: 'ASIPONA Topolobampo · Reglas de Operación',
        },
        {
          idSuffix: 'draft-per-berth',
          category: 'Física',
          title: 'Calados Oficiales Específicos por Terminal',
          titleEn: 'Terminal-Specific Authorized Drafts',
          detail:
            'Canal 13.40 m; PEMEX 11.26–12.15 m; IEnova 11.10 m; Transoceánica TUM 10.80 m (35.4 ft); RoRo 6.60 m (21.6 ft); CEMEX 5.00 m (16.5 ft).',
          detailEn:
            'Channel 13.40 m; PEMEX 11.26–12.15 m; IEnova 11.10 m; TUM 10.80 m; RoRo 6.60 m; CEMEX 5.00 m.',
          limitValue: '5.00 – 12.15 m',
          verificationStatus: 'verified',
          source: 'ASIPONA Topolobampo · Especificaciones de Muelles',
        },
      ],
      sampleVessel: 'MV Mayo Grain',
      sampleImo: '9601245',
      sampleBerth: 'Terminal Transoceánica (TUM)',
      sampleCargo: 'Maíz blanco · 30,000 MT',
      sampleStatus: 'EXPECTED',
    },

    // 14. GUAYMAS
    {
      id: 'mxgua',
      shortCode: 'GUA',
      name: 'Puerto de Guaymas',
      unLocode: 'MXGYM',
      region: 'PACÍFICO NORTE',
      state: 'Sonora · Mar de Cortés',
      coordinates: "27°55'18\"N · 110°53'42\"W",
      vhfChannel: 'CH 16 / CH 12 (CCTM Guaymas)',
      authority: 'ASIPONA Guaymas · Capitanía de Puerto',
      lineupSourceUrl: 'https://www.puertodeguaymas.com.mx/descargas/arribos.pdf',
      lineupConnector: 'GUA_ACTAS_PDF',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Guaymas: Puerto naturalmente abrigado por Isla Pájaros y Punta Baja (sin escolleras, 67 ha tierra + 77 ha agua); canal de 4.6 km × 150 m a 16.00 m; ciaboga de 600 m (16.00 m); 6 posiciones en 2 bandas (Banda Este Muelles 2, 3 y 4: 577 m, 16.00 m NBMI; Banda Sur Muelles 5 y 6: 359 m, 15.00 m NBMI) + Muelle de Cruceros (11.00 m) y PEMEX.',
      operatingRulesUrl: 'https://www.puertodeguaymas.com.mx/reglas-de-operacion',
      headlineEs: 'Guaymas. Abrigo natural (-16.00 m NBMI) y 6 posiciones en 2 bandas.',
      headlineEn: 'Guaymas. Naturally sheltered (-16.00 m NBMI) & 6 positions across 2 quays.',
      overviewEs:
        'Puerto naturalmente abrigado por Isla Pájaros y Punta Baja sin necesidad de rompeolas (67 ha terrestres y 77 ha de agua). Cuenta con canal y ciaboga de 600 m a 16.00 m y 6 posiciones comerciales en 2 bandas: Banda Este (Muelles 2, 3 y 4: 577 m a 16.00 m NBMI) y Banda Sur (Muelles 5 y 6: 359 m a 15.00 m NBMI), más Cruceros (11.00 m) y PEMEX.',
      overviewEn:
        'Naturally sheltered Sonora port behind Isla Pájaros and Punta Baja without breakwaters (67 ha land + 77 ha water). Features 16.00 m channel & 600 m turning basin serving 6 berths across Banda Este (577 m, 16.00 m NBMI) and Banda Sur (359 m, 15.00 m NBMI), plus Cruise (11.00 m) and PEMEX.',
      heroImageType: 'pajaritos',
      channels: [
        {
          id: 'ch-gua-main',
          name: 'Canal de Acceso Natural Guaymas (4.6 km × 150 m) & Ciaboga 600 m',
          lengthNm: 2.48,
          widthM: 150,
          channelDepthM: 16.0,
          operationalDraftM: 14.8,
          squatAllowanceNote:
            'Abrigo natural entre Isla Pájaros y Punta Baja; profundidad oficial 16.00 m NBMI en canal y dársena de ciaboga de 600 m.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-gua-1',
          name: 'Fondeadero Bahía de Guaymas (Exterior Isla Pájaros)',
          purpose: 'Graneleros minerales, tanques de ácido sulfúrico y buques graneleros',
          coordinates: "27°52.2'N · 110°52.0'W (al SE de Isla Pájaros)",
          depthM: '18.0 – 26.0 m',
          maxVesselOrNotes:
            'Buena tenedora de fango y arena; mantener libre el eje del canal de 4.6 km.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'bandas',
          name: 'Recinto Fiscal · Banda Este (16.0 m) & Banda Sur (15.0 m)',
          nameEn: 'Fiscal Quays · East Side (16.0 m) & South Side (15.0 m)',
          summary:
            '6 posiciones en 2 bandas para concentrado de cobre, barita, ácido sulfúrico, trigo de exportación y carga general, más Muelle de Cruceros (11.00 m).',
          summaryEn:
            '6 berths across 2 quays for copper concentrate, barite, sulfuric acid, export wheat and general cargo, plus Cruise berth (11.00 m).',
          channelDepthM: 16.0,
          operationalDraftM: 14.8,
          turningBasinM: 600,
          daylightOnly: false,
          tugRequirement: '2 remolcadores obligatorios para graneleros y quimiqueros > 160 m',
          pilotRequirement: 'Practicaje obligatorio desde entrada sur de Isla Pájaros',
        },
        {
          key: 'pemex',
          name: 'Terminal Marítima PEMEX & Operaciones Especializadas',
          nameEn: 'PEMEX Guaymas & Specialized Terminals',
          summary:
            'Muelles de combustibles refinados para abastecimiento de Sonora y terminal minera/química especializada.',
          summaryEn:
            'Refined fuel jetties supplying Sonora alongside specialized mineral/acid handling.',
          channelDepthM: 13.5,
          operationalDraftM: 11.8,
          turningBasinM: 450,
          daylightOnly: false,
          tugRequirement: '2 remolcadores de escolta para buques tanque',
          pilotRequirement: 'Practicaje obligatorio y control CCTM VHF CH 12',
        },
      ],
      terminals: [
        {
          idSuffix: 'banda-este',
          areaKey: 'bandas',
          name: 'Banda Este (Muelles 2, 3 y 4 · 577 m · 16.00 m NBMI)',
          operator: 'ASIPONA Guaymas / Grupo México / Operadores Agrícolas',
          shortDesc:
            'Frente profundo de 577 m a 16.00 m NBMI especializado en concentrado de cobre, ácido sulfúrico, trigo cristalino y minerales.',
          shortDescEn:
            '577 m deep-water quay (16.00 m NBMI) handling copper concentrate, sulfuric acid, durum wheat and dry bulk.',
          coordinates: "27°55'22\"N · 110°53'32\"W",
          mapX: 38,
          mapY: 36,
          imageType: 'recintoSur',
          cargoGroups: ['Granel Mineral', 'Petroquímica y Líquidos', 'Granel Agrícola'],
          storageSummary: {
            coveredSqm: 12000,
            openYardSqm: 146000,
            containerYardSqm: 0,
            warehousesBreakdown:
              '~146,000 m² de patios minerales + 12,000 m² de almacenes cubiertos, tanques y domos de fertilizantes Cortez Transfert y parque de ácido sulfúrico minero.',
            warehousesBreakdownEn:
              '~146,000 m² mineral yards + 12,000 m² covered warehouses, Cortez Transfert fertilizer domes/tanks & mining sulfuric acid tank farm.',
          },
          commercialProfile: {
            positioningHeadline:
              'Banda Este (-16.00 m NBMI): Exportación Minera de Sonora (Cobre/Ácido Sulfúrico) y Trigo del Yaqui',
            positioningHeadlineEn:
              'Banda Este Deep-Water Hub (-16.00 m NBMI): Sonora Copper Concentrate, Acid & Yaqui Wheat',
            address: 'Recinto Fiscal Portuario Banda Este, Guaymas, Sonora',
            customsRegime: 'Recinto Fiscal ASIPONA y Terminales Mineras/Agrícolas · Aduana de Guaymas',
            customsRegimeEn: 'ASIPONA Bonded Quays & Mineral/Grain Terminals · Guaymas Customs',
            commercialServices: [
              'Embarque mecanizado antipolvo de concentrado de cobre, barita, yeso y trigo cristalino del Valle del Yaqui',
              'Almacenamiento y embarque/descarga de ácido sulfúrico minero y fertilizantes en domos/tanques Cortez Transfert',
              'Capacidad global portuaria superior a 7.6 millones MT/año con acceso ferroviario directo Ferromex',
            ],
            commercialServicesEn: [
              'Enclosed mechanized loading of copper concentrate, barite, gypsum & Yaqui Valley durum wheat',
              'Mining-grade sulfuric acid & liquid/dry fertilizer logistics via Cortez Transfert domes/tanks',
              'Port-wide capacity >7.6M MT/year backed by on-dock Ferromex rail sidings',
            ],
            infrastructureHighlights: [
              '577 m continuos en Muelles 2, 3 y 4 a 16.00 m NBMI (14.80 m calado op.)',
              'Abrigo natural entre Isla Pájaros y Punta Baja sin requerir escolleras exteriores',
              'Espuelas ferroviarias Ferromex conectadas al corredor minero Sonora–Chihuahua–Arizona',
            ],
            infrastructureHighlightsEn: [
              '577 m quay across Berths 2, 3 & 4 at 16.00 m NBMI (14.80 m operational draft)',
              'Natural deep-water shelter behind Isla Pájaros & Punta Baja without breakwaters',
              'On-dock Ferromex rail linked to Sonora–Chihuahua–Arizona mining corridor',
            ],
            vesselTypesServed: ['Graneleros Supramax / Panamax (concentrados y grano)', 'Quimiqueros de Ácido Sulfúrico'],
            vesselTypesServedEn: ['Supramax / Panamax Dry Bulk Carriers', 'Dedicated Sulfuric Acid Tankers'],
            connectivity: 'Ferrocarril Ferromex y Carretera Federal 15 hacia Hermosillo, Nogales y Chihuahua.',
            connectivityEn: 'Ferromex rail & Federal Hwy 15 linking Hermosillo, Chihuahua & Arizona border.',
            operationalAdvantages: ['Profundidad de 16 m con abrigo natural que minimiza retrasos climáticos en el Mar de Cortés.'],
            operationalAdvantagesEn: ['Natural 16 m deep-water shelter ensuring ultra-high weather uptime in Sonora.'],
            certifications: ['ISPS / PBIP', 'ISGOTT / COF', 'SENASICA', 'PROFEPA'],
          },
          procedures: ['Control ambiental antipolvo en embarque de concentrado de cobre; checklist ISGOTT en ácido sulfúrico.'],
          restrictionsSummary: '577 m totales · Profundidad 16.00 m NBMI.',
          berths: [
            {
              idSuffix: 'gua-este',
              name: 'Muelles 2, 3 y 4 (Banda Este · 577 m)',
              lengthM: 577,
              maxLoaM: 250,
              maxBeamM: 36.0,
              berthDepthM: 16.0,
              maxDraftM: 14.8,
              products: ['Concentrado de cobre', 'Ácido sulfúrico', 'Trigo cristalino', 'Yeso mineral', 'Barita'],
              cargoGroups: ['Granel Mineral', 'Petroquímica y Líquidos', 'Granel Agrícola'],
              equipment: ['Cargadores mecanizados de mineral y grano', 'Brazos de carga de ácido sulfúrico'],
              connections: ['Espuela ferroviaria Ferromex (corredor Sonora–Nogales)'],
              loadingRate: '8,000 – 12,000 MT/día',
              notes: 'Mayor calado disponible del puerto de Guaymas.',
            },
          ],
        },
        {
          idSuffix: 'banda-sur',
          areaKey: 'bandas',
          name: 'Banda Sur (Muelles 5 y 6 · 359 m · 15.00 m NBMI) & Cruceros (11.00 m)',
          operator: 'ASIPONA Guaymas / Operadores Multipropósito',
          shortDesc:
            '359 m de muelle en Banda Sur a 15.00 m NBMI para carga general, graneles y contenedores, más Muelle de Cruceros (11.00 m) y PEMEX.',
          shortDescEn:
            '359 m Banda Sur quay (15.00 m NBMI) for general cargo, bulk and containers plus Cruise (11.00 m) and PEMEX.',
          coordinates: "27°55'08\"N · 110°53'46\"W",
          mapX: 62,
          mapY: 56,
          imageType: 'pajaritos',
          cargoGroups: ['Carga General y Contenedores', 'Granel Mineral', 'Hidrocarburos y Gas'],
          storageSummary: {
            coveredSqm: 6500,
            openYardSqm: 85000,
            containerYardSqm: 32000,
            warehousesBreakdown:
              'Patio multipropósito y modernización de grúas STS SSA Marine en Banda Sur (-15.0 m NBMI), terminal de cruceros (-11.0 m) y almacenamiento de combustibles PEMEX Sonora.',
            warehousesBreakdownEn:
              'Multipurpose/container yard undergoing SSA Marine STS crane upgrade on Banda Sur (-15.0 m NBMI), Cruise terminal (-11.0 m) & PEMEX Sonora fuel depot.',
          },
          commercialProfile: {
            positioningHeadline:
              'Banda Sur (-15.00 m NBMI · Modernización Contenedores SSA), Cruceros y Combustibles PEMEX',
            positioningHeadlineEn:
              'Banda Sur (-15.00 m NBMI · SSA Container Upgrade), Cruise Pier & PEMEX Fuel Depot',
            address: 'Banda Sur Recinto Portuario, Guaymas, Sonora',
            customsRegime: 'Recinto Fiscal Portuario ASIPONA y PEMEX Guaymas · Aduana de Guaymas',
            customsRegimeEn: 'ASIPONA Fiscal Enclosure & PEMEX Marine Terminal · Guaymas Customs',
            commercialServices: [
              'Operación multipropósito de contenedores (modernización STS SSA Marine), carga general, barita y coque en Muelles 5–6',
              'Atención a cruceros turísticos del Mar de Cortés (11.00 m) y descarga de refinados PEMEX para Sonora',
            ],
            commercialServicesEn: [
              'Container (with SSA Marine STS crane modernization), breakbulk, barite & petcoke stevedoring at Berths 5–6',
              'Sea of Cortez cruise calls (11.00 m) & PEMEX regional fuel imports serving Sonora',
            ],
            infrastructureHighlights: [
              '640 m totales combinando Banda Sur (359 m a 15.00 m NBMI), Cruceros (11.00 m) y PEMEX',
              'Enlace intermodal proyectado al corredor logístico Chihuahua–Sonora–Arizona',
            ],
            infrastructureHighlightsEn: [
              '640 m across Banda Sur (359 m at 15.00 m NBMI), Cruise (11.00 m) & PEMEX jetties',
              'Intermodal link serving the Chihuahua–Sonora–Arizona logistics corridor',
            ],
            vesselTypesServed: ['Portacontenedores y Multipropósito', 'Graneleros, Cruceros y Buques Tanque PEMEX'],
            vesselTypesServedEn: ['Container & Multipurpose Ships', 'Bulkers, Cruise Liners & PEMEX Tankers'],
            connectivity: 'Carretera Federal 15 (Guaymas–Hermosillo–Nogales) y red ferroviaria Ferromex.',
            connectivityEn: 'Federal Hwy 15 (Guaymas–Hermosillo–Nogales) and Ferromex rail.',
            operationalAdvantages: ['Posiciona a Guaymas como puerta alternativa del noroeste hacia Asia y el mercado de Arizona.'],
            operationalAdvantagesEn: ['Positions Sonora as an alternative Pacific gateway for Chihuahua & Arizona trade.'],
            certifications: ['ISPS / PBIP', 'OCIMF / SIRE (PEMEX)'],
          },
          procedures: ['VUMCE 48 h previas; SIRE vigente en maniobras PEMEX.'],
          restrictionsSummary: 'Banda Sur 15.00 m NBMI; Muelle Cruceros 11.00 m.',
          berths: [
            {
              idSuffix: 'gua-sur',
              name: 'Muelles 5 y 6 (Banda Sur · 359 m) + Cruceros (11.00m) + PEMEX',
              lengthM: 640,
              maxLoaM: 240,
              maxBeamM: 32.3,
              berthDepthM: 15.0,
              maxDraftM: 13.8,
              products: ['Contenedores', 'Carga general', 'Barita / Coque', 'Combustibles PEMEX', 'Cruceros'],
              cargoGroups: ['Carga General y Contenedores', 'Granel Mineral', 'Hidrocarburos y Gas'],
              equipment: ['Grúas móviles portuarias', 'Patio fiscal multipropósito', 'Terminal de cruceros'],
              connections: ['Carretera Federal 15 y red ferroviaria Ferromex'],
              loadingRate: '5,000 – 7,500 MT/día',
              notes: 'Completa las 6 posiciones comerciales en 2 bandas.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'natural-shelter',
          category: 'Física',
          title: 'Abrigo Natural sin Escolleras y Profundidades 15–16 m NBMI',
          titleEn: 'Natural Shelter & 15–16 m NBMI Berth Depths',
          detail:
            'Protegido naturalmente por Isla Pájaros y Punta Baja; Banda Este 16.00 m NBMI, Banda Sur 15.00 m NBMI y Cruceros 11.00 m.',
          detailEn:
            'Naturally sheltered by Isla Pájaros & Punta Baja; Banda Este 16.00 m NBMI, Banda Sur 15.00 m NBMI, Cruise 11.00 m.',
          limitValue: '15.0 – 16.0 m',
          verificationStatus: 'verified',
          source: 'ASIPONA Guaymas · Infraestructura Portuaria',
        },
        {
          idSuffix: 'acid-protocol',
          areaKey: 'bandas',
          category: 'Seguridad y Aduana',
          title: 'Protocolo Especializado para Ácido Sulfúrico y Concentrados',
          titleEn: 'Sulfuric Acid & Mineral Concentrate Safety Protocol',
          detail:
            'Buques de ácido sulfúrico y concentrados minerales requieren certificado de aptitud química/TML y monitoreo ambiental en muelle.',
          detailEn:
            'Sulfuric acid tankers and concentrate carriers require Fitness/TML certificates and continuous berth environmental monitoring.',
          limitValue: 'COF / TML / ISGOTT',
          verificationStatus: 'verified',
          source: 'Reglas de Operación ASIPONA Guaymas',
        },
      ],
      sampleVessel: 'MT Sonora Acid',
      sampleImo: '9698821',
      sampleBerth: 'Muelles 2, 3 y 4 (Banda Este)',
      sampleCargo: 'Ácido sulfúrico · 18,500 MT',
      sampleStatus: 'BERTHED',
    },

    // 15. SALINA CRUZ
    {
      id: 'mxscz',
      shortCode: 'SCZ',
      name: 'Puerto de Salina Cruz',
      unLocode: 'MXSCX',
      region: 'PACÍFICO SUR',
      state: 'Oaxaca · Istmo de Tehuantepec',
      coordinates: "16°09'42\"N · 95°11'54\"W",
      vhfChannel: 'CH 16 / CH 12 (CCTM Salina Cruz)',
      authority: 'ASIPONA Salina Cruz · Capitanía de Puerto',
      lineupSourceUrl: 'https://puertosalinacruz.com.mx/wp/programacion-de-buques-diciembre-2025/',
      lineupConnector: 'IMAGE_LINK',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Salina Cruz: Canal de acceso 14.00 m (calado op. 12.00 m); Antepuerto y Ciaboga 10.00–12.00 m; Terminal Contenedores (275 m, -11.00 m / 10.00 m op.); Muelle Fiscal I y II / TUM (450 m, -10.00 a -10.75 m / 8.75–10.00 m op.); Puerto Interior PEMEX (5.65–9.70 m); Monoboyas Offshore PEMEX (hasta 24.00 m, Monoboya 3 de 14.00–22.00 m); estricta precaución por vientos "Tehuanos" (> 35–55 kt).',
      operatingRulesUrl: 'https://www.puertosalinacruz.com.mx/reglas-de-operacion/',
      headlineEs: 'Salina Cruz. Extremo Pacífico CIIT, TUM y Monoboyas (-24.0 m).',
      headlineEn: 'Salina Cruz. Pacific CIIT terminus, TUM & Offshore SPMs (-24.0 m).',
      overviewEs:
        'Cabecera del Pacífico del Corredor Interoceánico del Istmo de Tehuantepec (enlazado por ferrocarril con Coatzacoalcos). Opera Terminal de Contenedores (275 m, 10.00 m op.), Muelle Fiscal I y II / TUM (450 m, 8.75–10.00 m op.), Puerto Interior PEMEX (5.65–9.70 m), 3 Monoboyas Offshore PEMEX (hasta 24.00 m) y nuevo Rompeolas Oeste.',
      overviewEn:
        'Pacific terminus of the Interoceanic Corridor (rail-linked to Coatzacoalcos). Features Container Terminal (275 m, 10.00 m op.), Fiscal Piers I & II / TUM (450 m, 8.75–10.00 m op.), PEMEX Inner Port (5.65–9.70 m), 3 Offshore SPMs (up to 24.00 m) and West Breakwater deep-water expansion.',
      heroImageType: 'hero',
      channels: [
        {
          id: 'ch-scz-access',
          name: 'Canal de Acceso Principal, Antepuerto y Ciaboga Salina Cruz',
          lengthNm: 1.8,
          widthM: 160,
          channelDepthM: 14.0,
          operationalDraftM: 12.0,
          squatAllowanceNote:
            'Canal a 14.00 m (calado op. 12.00 m); Antepuerto y dársena de ciaboga entre 10.00 y 12.00 m; nueva dársena del Rompeolas Oeste en desarrollo a -24.0 m.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-scz-1',
          name: 'Fondeadero Antepuerto y Bahía La Ventosa (Salina Cruz)',
          purpose: 'Buques comerciales, portacontenedores y carga proyecto CIIT',
          coordinates: "16°08.5'N · 095°10.2'W (Bahía La Ventosa al E de escolleras)",
          depthM: '14.0 – 22.0 m',
          maxVesselOrNotes:
            'Fondeadero bajo estricto control durante vientos "Tehuanos" del N/NNE (> 35–55 kt); mantener 2 anclas o máquina lista para zarpar a resguardo.',
          verificationStatus: 'verified',
        },
        {
          id: 'az-scz-2',
          name: 'Área de Exclusión Monoboyas Offshore PEMEX (1, 2 y 3)',
          purpose: 'Buques tanque de gran porte para crudo y refinados',
          coordinates: "16°06.8'N · 095°12.5'W (3.0 MN al sur de punta)",
          depthM: '14.0 – 24.0 m (Monoboya 3 hasta 22.0 m calado)',
          maxVesselOrNotes:
            'Prohibido fondear dentro del radio de seguridad de las 3 monoboyas PEMEX y oleoductos submarinos.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'comercial',
          name: 'Recinto Fiscal Comercial (Contenedores · Muelle Fiscal I y II / TUM)',
          nameEn: 'Commercial Fiscal Enclosure (Containers · Fiscal I & II / TUM)',
          summary:
            'Incluye Terminal de Contenedores (275 m, -11.00 m / 10.00 m op.) y Muelles Fiscales I y II / TUM (450 m, -10.00 a -10.75 m / 8.75–10.00 m op.) enlazados al Ferrocarril del Istmo (CIIT).',
          summaryEn:
            'Includes Container Terminal (275 m, -11.00 m / 10.00 m op.) and Fiscal Piers I & II / TUM (450 m, 8.75–10.00 m op.) linked to the CIIT Interoceanic Railway.',
          channelDepthM: 14.0,
          operationalDraftM: 10.0,
          turningBasinM: 420,
          daylightOnly: false,
          tugRequirement: '2 a 3 remolcadores obligatorios (refuerzo obligatorio durante vientos Tehuanos)',
          pilotRequirement: 'Practicaje obligatorio desde boya de recalada',
        },
        {
          key: 'pemex',
          name: 'Puerto Interior PEMEX & Monoboyas Offshore (1, 2 y 3 · -24.0 m)',
          nameEn: 'PEMEX Inner Port & Offshore SPM Buoys (-24.0 m)',
          summary:
            'Muelles interiores de Refinería Antonio Dovalí Jaime (5.65–9.70 m) más 3 Monoboyas Offshore de aguas profundas (Monoboya 3 habilitada hasta 14.00–22.00 m en fondo de -24.00 m).',
          summaryEn:
            'Refinery inner berths (5.65–9.70 m) plus 3 deep-water Offshore SPMs (SPM 3 rated 14.00–22.00 m draft in -24.00 m water).',
          channelDepthM: 24.0,
          operationalDraftM: 22.0,
          turningBasinM: 550,
          daylightOnly: false,
          tugRequirement: 'Lanchas de amarre y remolcadores de escolta PEMEX',
          pilotRequirement: 'Piloto de amarre PEMEX / práctico de puerto obligatorio',
        },
      ],
      terminals: [
        {
          idSuffix: 'cont-fiscal',
          areaKey: 'comercial',
          name: 'Terminal de Contenedores (275 m) & Muelle Fiscal I y II / TUM (450 m)',
          operator: 'ASIPONA Salina Cruz / Operadores CIIT',
          shortDesc:
            'Terminal de Contenedores (275 m, -11.00 m / 10.00 m op.) y Muelles Fiscales I y II / TUM (450 m, -10.00 a -10.75 m / 8.75–10.00 m op.) con conexión ferroviaria directa al Istmo.',
          shortDescEn:
            'Container Terminal (275 m, 10.00 m op.) and Fiscal Piers I & II / TUM (450 m, 8.75–10.00 m op.) with direct CIIT rail connection.',
          coordinates: "16°09'54\"N · 95°11'46\"W",
          mapX: 38,
          mapY: 42,
          imageType: 'recintoSur',
          cargoGroups: ['Carga General y Contenedores', 'Carga Proyecto', 'Granel Mineral'],
          storageSummary: {
            coveredSqm: 15000,
            openYardSqm: 95000,
            containerYardSqm: 62000,
            warehousesBreakdown:
              'Terminal de Contenedores (275 m / -11 m), Muelles Fiscales I y II (450 m / -10 m) con bodegas fiscales, patios ferroviarios on-dock CIIT y zona de carga proyecto eólica.',
            warehousesBreakdownEn:
              'Container Terminal (275 m / -11 m), Fiscal Piers I & II (450 m / -10 m) with bonded sheds, on-dock CIIT railyard & wind-energy heavy laydown.',
          },
          commercialProfile: {
            positioningHeadline:
              'Cabecera Pacífico del Corredor Interoceánico CIIT (Enlace Ferroviario Directo a Coatzacoalcos)',
            positioningHeadlineEn:
              'Pacific Terminus of Mexico’s Interoceanic Corridor (On-Dock CIIT Rail Link to Coatzacoalcos)',
            address: 'Av. Calzada Teniente José Azueta s/n, Col. Cantarranas, Salina Cruz, Oaxaca',
            customsRegime: 'Recinto Fiscal Portuario ASIPONA y Polo de Desarrollo CIIT · Aduana de Salina Cruz',
            customsRegimeEn: 'ASIPONA Bonded Precinct & CIIT Interoceanic Corridor Regime · Salina Cruz Customs',
            commercialServices: [
              'Operación intermodal de contenedores en puente terrestre Pacífico–Golfo (Salina Cruz ↔ Coatzacoalcos por Línea Z CIIT)',
              'Manejo de carga proyecto energética/eólica del Istmo de Tehuantepec, acero, automóviles y graneles en Fiscal I y II',
              'Consolidación directa en tren unitario desde patios ferroviarios dentro del recinto fiscal',
            ],
            commercialServicesEn: [
              'Trans-Isthmus container intermodal bridge linking Pacific calls to Coatzacoalcos via CIIT Line Z rail',
              'Heavy wind-turbine & energy project cargo, steel & breakbulk stevedoring across Fiscal I & II',
              'On-dock unit-train transloading directly inside the customs precinct',
            ],
            infrastructureHighlights: [
              '725 m continuos entre Contenedores (275 m, -11.0 m) y Fiscal I/II (450 m, -10.0 a -10.75 m) con espuela férrea on-dock',
              'Proyecto estratégico de nuevo Rompeolas Oeste y ampliación de aguas profundas (-24 m)',
            ],
            infrastructureHighlightsEn: [
              '725 m continuous quay spanning Container Berth (275 m, -11.0 m) & Fiscal I/II (450 m, -10.0 m) with on-dock rail',
              'Supported by new West Breakwater deep-water outer harbor expansion (-24 m)',
            ],
            vesselTypesServed: ['Portacontenedores Feeder / Panamax', 'Buques Heavy-Lift (eólicos/proyecto) y Carga General'],
            vesselTypesServedEn: ['Feeder / Panamax Containerships', 'Wind-Project Heavy-Lift & General Cargo Ships'],
            connectivity:
              'Ferrocarril del Istmo de Tehuantepec (Línea Z hacia Coatzacoalcos y Línea K hacia Chiapas) más Carretera Transístmica 185.',
            connectivityEn:
              'Interoceanic Railway (Line Z to Coatzacoalcos & Line K to Chiapas) plus Trans-Isthmic Hwy 185.',
            operationalAdvantages: ['Única terminal del Pacífico Sur mexicano integrada por ferrocarril directo al Golfo de México.'],
            operationalAdvantagesEn: ['Only Southern Pacific port with direct cross-isthmus rail to the Gulf of Mexico.'],
            certifications: ['ISPS / PBIP', 'Corredor CIIT'],
          },
          procedures: ['Monitoreo estricto de vientos Tehuanos en maniobras de grúas y carga proyecto eólica.'],
          restrictionsSummary: 'Contenedores: 10.00 m op.; Fiscal I/II: 8.75 – 10.00 m op.',
          berths: [
            {
              idSuffix: 'scz-cont-tum',
              name: 'Terminal de Contenedores (275m / 10.0m) & Fiscal I y II (450m / 8.75–10.0m)',
              lengthM: 725,
              maxLoaM: 250,
              maxBeamM: 32.3,
              berthDepthM: 11.0,
              maxDraftM: 10.0,
              products: ['Contenedores CIIT', 'Componentes eólicos', 'Acero y maquinaria', 'Carga general'],
              cargoGroups: ['Carga General y Contenedores', 'Carga Proyecto'],
              equipment: ['Grúas móviles portuarias', 'Reach stackers', 'Patios ferroviarios CIIT'],
              connections: ['Ferrocarril del Istmo de Tehuantepec (Salina Cruz – Coatzacoalcos)'],
              loadingRate: '22 – 28 mov/h · 3,500 MT/día',
              notes: 'Puerta Pacífico del puente terrestre interoceánico.',
            },
          ],
        },
        {
          idSuffix: 'pemex-monoboyas',
          areaKey: 'pemex',
          name: 'Puerto Interior PEMEX (5.65–9.70 m) & Monoboyas Offshore 1, 2 y 3',
          operator: 'PEMEX Logística · Refinería Antonio Dovalí Jaime',
          shortDesc:
            'Muelles petroleros interiores (5.65 a 9.70 m de calado) más 3 Monoboyas Offshore en aguas profundas (hasta 24.00 m de profundidad / Monoboya 3 14.00–22.00 m calado).',
          shortDescEn:
            'Inner refinery berths (5.65–9.70 m draft) plus 3 deep-water Offshore SPMs (up to 24.00 m depth; SPM 3 14.00–22.00 m draft).',
          coordinates: "16°08'58\"N · 95°12'08\"W",
          mapX: 66,
          mapY: 56,
          imageType: 'pajaritos',
          cargoGroups: ['Hidrocarburos y Gas', 'Petroquímica y Líquidos'],
          storageSummary: {
            coveredSqm: 2000,
            openYardSqm: 120000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Terminal Marítima y tanques de Refinería Antonio Dovalí Jaime conectada al oleoducto transístmico Nuevo Teapa–Salina Cruz y 3 Monoboyas Offshore en -24.0 m.',
            warehousesBreakdownEn:
              'Antonio Dovalí Jaime Refinery tank farm linked to Nuevo Teapa–Salina Cruz trunk pipeline plus 3 deep-water Offshore SPMs (-24.0 m).',
          },
          commercialProfile: {
            positioningHeadline:
              'Complejo Petrolero Pacífico de PEMEX: Puerto Interior y Monoboyas Offshore (-24.0 m / Suezmax)',
            positioningHeadlineEn:
              'PEMEX Pacific Hydrocarbon Hub: Inner Refinery Berths & Deep-Water Offshore SPMs (-24.0 m)',
            address: 'Puerto Interior PEMEX / Bahía La Ventosa, Salina Cruz, Oaxaca',
            customsRegime: 'Terminal Marítima Estratégica PEMEX Logística · Aduana de Salina Cruz',
            customsRegimeEn: 'PEMEX Logística Strategic Crude & Refined Terminal · Salina Cruz Customs',
            commercialServices: [
              'Exportación y recepción de crudo Istmo/Maya en Monoboya 3 (hasta 22.0 m calado / buques Suezmax/VLCC alijeados)',
              'Cabotaje de gasolinas, diésel, turbosina y combustóleo hacia puertos del Pacífico mexicano desde Puerto Interior y SPM 1–2',
            ],
            commercialServicesEn: [
              'Crude oil export/import at deep-water SPM 3 (up to 22.0 m draft / Suezmax & VLCC)',
              'Pacific coast cabotage of gasoline, diesel, jet fuel & fuel oil from Refinería Dovalí Jaime',
            ],
            infrastructureHighlights: [
              '3 Monoboyas Offshore hasta -24.0 m de profundidad (Monoboya 3 de 14–22 m calado, tasa 2,500–4,500 m³/h)',
              'Puerto Interior PEMEX con muelles dedicados para buques producto (5.65–9.70 m)',
            ],
            infrastructureHighlightsEn: [
              '3 Offshore SPM buoys in -24.0 m water depth (SPM 3 rated 14–22 m draft @ 2,500–4,500 m³/hr)',
              'Inner PEMEX harbor berths serving Pacific coastal product tankers (5.65–9.70 m)',
            ],
            vesselTypesServed: ['Buques Crudo Suezmax / VLCC (SPM 3)', 'Tanqueros Producto MR1/MR2 (Puerto Interior)'],
            vesselTypesServedEn: ['Suezmax / VLCC Crude Tankers (SPM 3)', 'MR1/MR2 Clean Product Tankers'],
            connectivity: 'Oleoducto transístmico Nuevo Teapa (Coatzacoalcos) – Salina Cruz y Refinería Dovalí Jaime.',
            connectivityEn: 'Trans-Isthmic pipeline Nuevo Teapa (Coatzacoalcos) – Salina Cruz & refinery feed.',
            operationalAdvantages: ['Única terminal offshore en México con calado operativo hasta 22.0 m para exportación/descarga de crudo en el Pacífico.'],
            operationalAdvantagesEn: ['Deepest crude mooring terminal in Pacific Mexico rated to 22.0 m operating draft.'],
            certifications: ['OCIMF / SIRE', 'ISGOTT', 'SASISOPA / ASEA'],
          },
          procedures: ['Vetting OCIMF/SIRE y verificación de límite operativo de marejada/viento para SPM.'],
          restrictionsSummary: 'Interior PEMEX: 5.65–9.70 m; Monoboya 3: 14.00–22.00 m.',
          berths: [
            {
              idSuffix: 'scz-spm',
              name: 'Puerto Interior PEMEX (5.65–9.70m) & Monoboyas Offshore 1–3 (-24.0m)',
              lengthM: 600,
              maxLoaM: 320,
              maxBeamM: 52.0,
              berthDepthM: 24.0,
              maxDraftM: 22.0,
              products: ['Crudo Istmo / Maya', 'Gasolina', 'Diésel UBA', 'Turbosina', 'Combustóleo'],
              cargoGroups: ['Hidrocarburos y Gas'],
              equipment: ['Mangueras submarinas y flotantes SPM', 'Brazos de carga interior PEMEX'],
              connections: ['Oleoducto transístmico Nuevo Teapa – Salina Cruz', 'Refinería Dovalí Jaime'],
              loadingRate: '2,500 – 4,500 m³/h en Monoboyas',
              notes: 'Monoboya 3 permite buques Suezmax/VLCC alijeados hasta 22.0 m.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'tehuanos',
          category: 'Operativa',
          title: 'Alerta por Vientos "Tehuanos" (Ráfagas N/NNE 35 – 55 kt)',
          titleEn: 'Severe "Tehuano" Gap Winds Advisory (35 – 55 kt N/NNE)',
          detail:
            'Vientos catabáticos del norte ("Tehuanos") entre octubre y marzo cierran maniobras de atraque, grúas y monoboyas con ráfagas > 30–55 kt.',
          detailEn:
            'Oct–Mar northerly "Tehuano" gap winds exceeding 30–55 kt suspend berthing, cranes and offshore SPM operations.',
          limitValue: 'Cierre > 30 kt',
          verificationStatus: 'verified',
          source: 'Capitanía de Puerto Salina Cruz',
        },
        {
          idSuffix: 'berth-drafts',
          category: 'Física',
          title: 'Calados por Zona: Contenedores (10.0 m) vs. PEMEX Interior (9.7 m) vs. SPM 3 (22 m)',
          titleEn: 'Zonal Draft Limits: Containers (10.0 m) vs. PEMEX (9.7 m) vs. SPM 3 (22 m)',
          detail:
            'Canal acceso 14.00 m (12.00 m op.); Contenedores 10.00 m; Fiscal I/II 8.75–10.00 m; Interior PEMEX 5.65–9.70 m; Monoboya 3 hasta 14.00–22.00 m.',
          detailEn:
            'Access channel 14.00 m (12.00 m op.); Containers 10.00 m; Fiscal I/II 8.75–10.00 m; PEMEX inner 5.65–9.70 m; SPM 3 14.00–22.00 m.',
          limitValue: '8.75 – 22.0 m',
          verificationStatus: 'verified',
          source: 'ASIPONA Salina Cruz · Características Técnicas',
        },
      ],
      sampleVessel: 'MT Istmo Pacific',
      sampleImo: '9729901',
      sampleBerth: 'Monoboya Offshore 3 PEMEX',
      sampleCargo: 'Crudo Maya / Refinados · 78,000 MT',
      sampleStatus: 'EXPECTED',
    },
    // 16. COZUMEL (MAR CARIBE)
    {
      id: 'mxczm',
      shortCode: 'COZ',
      name: 'Puerto de Cozumel',
      unLocode: 'MXCZM',
      region: 'MAR CARIBE',
      state: 'Quintana Roo · Mar Caribe',
      coordinates: "20°29'24\"N · 86°58'22\"W",
      vhfChannel: 'CH 16 / CH 14 (Capitanía Cozumel)',
      authority: 'APIQROO · Capitanía de Puerto Cozumel',
      lineupSourceUrl: 'https://www.apiqroo.com.mx/',
      lineupConnector: 'APIQROO_CRUISE',
      operatingRulesSummary:
        'Reglas de Operación Puerto de Cozumel: Restricciones ambientales estrictas dentro del Parque Nacional Arrecifes de Cozumel; prohibido fondear sobre zonas arrecifales; prioridad de atraque para cruceros en Puerta Maya, SSA México (Muelle Internacional) y Punta Langosta; cruce de transbordadores San Miguel–Playa del Carmen cada 30–60 min.',
      operatingRulesUrl: 'https://www.apiqroo.com.mx/',
      headlineEs: 'Cozumel. Hub internacional de cruceros y tráfico del Caribe.',
      headlineEn: 'Cozumel. International Caribbean cruise & ferry hub.',
      overviewEs:
        'Principal puerto de cruceros de México en el Mar Caribe, operado bajo reglas ambientales estrictas (Parque Nacional Arrecifes de Cozumel). Integra tres terminales internacionales de cruceros (Puerta Maya, SSA Muelle Internacional y Punta Langosta) además de la terminal marítima de transbordadores y cabotaje San Miguel / Caletita.',
      overviewEn:
        'Mexico’s premier Caribbean cruise destination operating under strict marine reserve protections. Integrates Puerta Maya, SSA International Pier and Punta Langosta cruise terminals plus San Miguel / Caletita passenger ferries.',
      heroImageType: 'hero',
      channels: [
        {
          id: 'ch-czm-canal',
          name: 'Canal de Yucatán — Aproximación Muelles Internacionales Cozumel',
          lengthNm: 1.8,
          widthM: 250,
          channelDepthM: 15.0,
          operationalDraftM: 10.5,
          squatAllowanceNote:
            'Aproximación directa desde aguas profundas del Canal de Cozumel con corriente dominante hacia el Norte (2.0 – 3.5 kt); respetar zona arrecifal al sur.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-czm-1',
          name: 'Zona de Posicionamiento Dinámico y Embarque de Pilotos (Canal Cozumel)',
          purpose: 'Cruceros internacionales y buques de apoyo',
          coordinates: "20°28.8'N · 086°59.6'W",
          depthM: '35.0 – 120.0 m (pendiente pronunciada)',
          maxVesselOrNotes:
            'Prohibido fondear sobre arrecifes coralinos; esperar turno en deriva controlada / posicionamiento dinámico a 1.5 MN al W de Punta Langosta.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'cruceros',
          name: 'Corredor Internacional de Cruceros (Puerta Maya · SSA · Punta Langosta)',
          nameEn: 'International Cruise Corridor (Puerta Maya · SSA · Punta Langosta)',
          summary:
            'Tres complejos especializados con 6 posiciones simultáneas para megacruceros Oasis/Icon class.',
          summaryEn:
            'Three dedicated cruise piers accommodating up to 6 Oasis/Icon class cruise ships simultaneously.',
          channelDepthM: 15.0,
          operationalDraftM: 10.5,
          turningBasinM: 500,
          daylightOnly: false,
          tugRequirement: 'Sin remolcador obligatorio para cruceros con bow/stern thrusters operativos',
          pilotRequirement: 'Practicaje obligatorio 1.5 MN al W del muelle asignado',
        },
        {
          key: 'san-miguel',
          name: 'Muelle Fiscal San Miguel y Transbordadores Caletita',
          nameEn: 'San Miguel Ferry Terminal & Caletita Cabotage',
          summary:
            'Tráfico regular de pasajeros, carga ligera y transbordadores RoPax hacia Playa del Carmen y Calica.',
          summaryEn:
            'High-frequency passenger ferries and coastal RoPax supply craft serving mainland Quintana Roo.',
          channelDepthM: 6.5,
          operationalDraftM: 4.5,
          turningBasinM: 180,
          daylightOnly: false,
          tugRequirement: 'No requerido para transbordadores con propulsión azimutal/jet',
          pilotRequirement: 'Control directo VHF CH 14 con Capitanía Cozumel',
        },
      ],
      terminals: [
        {
          idSuffix: 'puerta-maya-ssa',
          areaKey: 'cruceros',
          name: 'Puerta Maya · SSA Muelle Internacional · Punta Langosta',
          operator: 'Carnival Corp / SSA México / Punta Langosta',
          shortDesc:
            'Terminales de cruceros de clase mundial con espigones en "T" capaces de recibir hasta 6 cruceros simultáneos en el Mar Caribe.',
          shortDescEn:
            'World-class T-shaped piers hosting up to 6 mega cruise vessels concurrently in the Mexican Caribbean.',
          coordinates: "20°28'35\"N · 86°58'45\"W",
          mapX: 46,
          mapY: 42,
          imageType: 'hero',
          cargoGroups: ['Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 18500,
            openYardSqm: 32000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Complejos turísticos Puerta Maya (Carnival), SSA Muelle Internacional (>460 m para clases Oasis/Icon) y Punta Langosta centro con terminales de pasaje, duty-free y suministro certificado.',
            warehousesBreakdownEn:
              'Puerta Maya (Carnival), SSA International Pier (>460 m Oasis/Icon capable) & Punta Langosta passenger complexes with duty-free & provisioned staging.',
          },
          commercialProfile: {
            positioningHeadline:
              'Primer Destino de Cruceros de México y del Caribe (+4M Pasajeros/Año · Clases Oasis e Icon)',
            positioningHeadlineEn:
              'Mexico’s #1 Cruise Port Serving Oasis & Icon Class Mega-Liners (4M+ Pax/Year)',
            address: 'Carretera Costera Sur Km 4.5 / Centro, Cozumel, Quintana Roo',
            customsRegime: 'Recintos Portuarios de Pasaje (APIQROO · Puerta Maya · SSA · Punta Langosta) · Aduana Cancún/Cozumel',
            customsRegimeEn: 'Authorized International Cruise Terminals · Cozumel Customs & INM Port Clearance',
            commercialServices: [
              'Atraque simultáneo de hasta 6 megacruceros en espigones en "T" de Puerta Maya (Carnival/HAL/Princess), SSA Internacional (Royal Caribbean Oasis/Icon >360 m) y Punta Langosta (Disney/NCL/MSC)',
              'Operación logística de provisiones hoteleras, agua potable tratada y manejo certificado MARPOL bajo cero descarga arrecifal',
              'Despacho migratorio ágil INM, sanidad internacional y coordinación de excursiones en Riviera Maya y Cozumel',
            ],
            commercialServicesEn: [
              'Simultaneous berthing for up to 6 mega-ships across Puerta Maya, SSA International (>360 m Oasis/Icon class) & Punta Langosta',
              'Provisioning logistics, potable water supply & strict zero-discharge MARPOL reef protection',
              'Fast-track INM immigration, health clearance & shore excursion dispatch',
            ],
            infrastructureHighlights: [
              'SSA Muelle Internacional (>460 m), Puerta Maya y Punta Langosta con calado operativo 10.5 m',
              'Capacidad para megacruceros >362 m LOA y 7,000–9,500 pasajeros+tripulación',
            ],
            infrastructureHighlightsEn: [
              'SSA International (>460 m), Puerta Maya & Punta Langosta T-piers at 10.5 m draft',
              'Engineered for mega cruise vessels >362 m LOA carrying 7,000–9,500 pax & crew',
            ],
            vesselTypesServed: ['Megacruceros Oasis / Icon / Excel Class', 'Cruceros de Lujo y Expedición'],
            vesselTypesServedEn: ['Oasis / Icon / Excel Class Mega Cruise Liners', 'Luxury & Expedition Cruise Ships'],
            connectivity: 'Vialidad costera directa a Aeropuerto Internacional de Cozumel (CZM) y enlace ferry a Playa del Carmen.',
            connectivityEn: 'Direct coastal road access to Cozumel International Airport (CZM) & mainland ferries.',
            operationalAdvantages: [
              'Cero fondeo necesario para 6 buques simultáneos gracias a espigones en aguas profundas.',
              'Operación consolidada para las principales líneas globales de cruceros del Caribe.',
            ],
            operationalAdvantagesEn: [
              'Up to 6 simultaneous alongside berths eliminating tendering delays.',
              'Premier Western Caribbean turnaround and port-of-call logistics.',
            ],
            certifications: ['ISPS / PBIP', 'CONANP Arrecifes', 'Blue Flag / MARPOL'],
          },
          procedures: [
            'Cero descargas de aguas residuales y cumplimiento estricto de protección arrecifal.',
            'Coordinar corriente norte del Canal de Yucatán durante atraque.',
          ],
          restrictionsSummary: 'Calado máx. 10.5 m; eslora hasta 362 m; prohibido fondear cerca de arrecife.',
          berths: [
            {
              idSuffix: 'pm1',
              name: 'Espigones Puerta Maya (2), SSA Internacional (2) y Punta Langosta (2)',
              lengthM: 380,
              maxLoaM: 362,
              maxBeamM: 49.0,
              berthDepthM: 11.5,
              maxDraftM: 10.5,
              products: ['Cruceros internacionales', 'Pasajeros en tránsito', 'Avituallamiento hotelero'],
              cargoGroups: ['Carga General y Contenedores'],
              equipment: ['Pasarelas marítimas de embarque', 'Defensas neumáticas Yokohama'],
              connections: ['Suministro de agua potable tratada y recolección selectiva MARPOL'],
              loadingRate: 'Desembarque 4,000 – 6,500 pasajeros/h',
              notes: 'Bunkering pesado restringido en Parque Nacional.',
            },
          ],
        },
        {
          idSuffix: 'san-miguel',
          areaKey: 'san-miguel',
          name: 'Muelle Fiscal San Miguel & Cabotaje Caletita',
          operator: 'APIQROO Cozumel',
          shortDesc: 'Terminal de ferries de alta velocidad a Playa del Carmen y transbordadores vehiculares RoPax.',
          shortDescEn: 'High-speed ferry hub to Playa del Carmen and RoPax coastal supply pier.',
          coordinates: "20°30'38\"N · 86°57'15\"W",
          mapX: 62,
          mapY: 60,
          imageType: 'channel',
          cargoGroups: ['Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 2800,
            openYardSqm: 12000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Terminal de pasajeros San Miguel centro + patio de carga y rampa RoPax en Caletita para abasto diario de mercancías y combustible a la isla.',
            warehousesBreakdownEn:
              'San Miguel downtown passenger terminal + Caletita RoPax vehicle yard & ramp supplying daily island freight.',
          },
          commercialProfile: {
            positioningHeadline: 'Enlace Vital de Ferries de Alta Velocidad y Abasto RoPax de Cozumel',
            positioningHeadlineEn: 'Cozumel’s High-Frequency Passenger Ferry & Mainland Freight Supply Link',
            address: 'Av. Rafael E. Melgar / Caletita, San Miguel de Cozumel, Q. Roo',
            customsRegime: 'Terminal Marítima Estatal APIQROO · Tráfico de Cabotaje',
            customsRegimeEn: 'APIQROO State Maritime Terminal · Coastal Cabotage',
            commercialServices: [
              'Tránsito continuo cada 30–60 min de pasajeros hacia Playa del Carmen',
              'Carga rodada RoPax de camiones de alimentos, materiales, gas e insumos desde Calica / Punta Venado',
            ],
            commercialServicesEn: [
              'High-frequency 30–60 min fast ferries connecting Playa del Carmen',
              'Daily RoPax truck freight & essential island supply transfers from Calica / Punta Venado',
            ],
            infrastructureHighlights: [
              '160 m en posiciones San Miguel / Caletita con rampa hidráulica RoRo a 4.5 m de calado',
              'Edificio terminal de pasajeros climatizado en centro de Cozumel + patio logístico en Caletita',
            ],
            infrastructureHighlightsEn: [
              '160 m San Miguel / Caletita berths with hydraulic RoPax ramp at 4.5 m draft',
              'Air-conditioned downtown Cozumel ferry terminal plus Caletita island freight staging yard',
            ],
            vesselTypesServed: ['Catamaranes de alta velocidad', 'Transbordadores vehiculares RoPax'],
            vesselTypesServedEn: ['High-Speed Passenger Catamarans', 'Coastal RoPax Cargo Ferries'],
            connectivity: 'Conexión marítima directa al corredor Riviera Maya (Playa del Carmen / Calica).',
            connectivityEn: 'Direct sea bridge to Riviera Maya mainland (Playa del Carmen / Calica).',
            operationalAdvantages: ['Rotación continua de 30–45 minutos manteniendo la cadena de abasto insular.'],
            operationalAdvantagesEn: ['30–45 minute fast turnaround sustaining island supply chains.'],
            certifications: ['ISPS / PBIP', 'APIQROO'],
          },
          procedures: ['Ventanas fijas cada 30 min para tráfico de pasajeros.'],
          restrictionsSummary: 'Calado máximo 4.5 m; velocidad máx. 6 kt dentro de dársena.',
          berths: [
            {
              idSuffix: 'sm1',
              name: 'Posiciones San Miguel / Caletita',
              lengthM: 160,
              maxLoaM: 95,
              maxBeamM: 20.0,
              berthDepthM: 5.2,
              maxDraftM: 4.5,
              products: ['Pasajeros y equipaje', 'Carga general paletizada', 'Abasto isleño RoPax'],
              cargoGroups: ['Carga General y Contenedores'],
              equipment: ['Rampa RoRo hidráulica en Caletita'],
              connections: ['Red eléctrica y agua potable APIQROO'],
              loadingRate: 'Rotación 30 – 45 min por viaje',
              notes: 'Sujeto a cierre rápido ante suradas o huracanes.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'arrecifes',
          category: 'Seguridad y Aduana',
          title: 'Protección Estricta Parque Nacional Arrecifes y Prohibición de Fondeo',
          titleEn: 'Strict Coral Reef Protection & No-Anchoring Mandate',
          detail:
            'Prohibido arrojar anclas en todo el litoral poniente de Cozumel; maniobras únicamente en deriva controlada o posición dinámica.',
          detailEn:
            'Anchoring prohibited along western Cozumel reefs; vessels hold outside approaches on dynamic positioning.',
          limitValue: 'Cero Anclaje',
          verificationStatus: 'verified',
          source: 'Capitanía de Puerto Cozumel / CONANP',
        },
        {
          idSuffix: 'corriente',
          category: 'Física',
          title: 'Corriente Dominante Norte en Canal de Cozumel (2.0 – 3.5 kt)',
          titleEn: 'Strong Northbound Cozumel Channel Current (2.0 – 3.5 kt)',
          detail:
            'Corriente permanente hacia el norte requiere ángulo de aproximación controlado al atracar en los espigones en "T".',
          detailEn:
            'Continuous northbound Yucatan branch current demands calculated approach angle onto T-piers.',
          limitValue: '2.0 – 3.5 kt N',
          verificationStatus: 'verified',
          source: 'Reglas de Operación Puerto de Cozumel',
        },
      ],
      sampleVessel: 'MV Caribbean Star',
      sampleImo: '9834412',
      sampleBerth: 'Puerta Maya Banda Norte',
      sampleCargo: 'Crucero Internacional · 4,800 pax',
      sampleStatus: 'BERTHED',
    },
    // 17. CANCÚN / PUERTO JUÁREZ (MAR CARIBE)
    {
      id: 'mxcun',
      shortCode: 'CUN',
      name: 'Puerto de Cancún (Puerto Juárez)',
      unLocode: 'MXCUN',
      region: 'MAR CARIBE',
      state: 'Quintana Roo · Mar Caribe',
      coordinates: "21°10'52\"N · 86°48'26\"W",
      vhfChannel: 'CH 16 / CH 12 (Capitanía Puerto Juárez)',
      authority: 'APIQROO · Capitanía de Puerto Cancún / Puerto Juárez',
      lineupSourceUrl: 'https://www.apiqroo.com.mx/',
      lineupConnector: 'APIQROO_FERRY',
      operatingRulesSummary:
        'Reglas de Operación Cancún / Puerto Juárez: Regulación estricta de tráfico entre Puerto Juárez, Punta Sam, Playa Tortugas e Isla Mujeres; calado somero (-3.5 a -4.5 m); control de vientos > 20–25 kt para navegación menor y transbordadores.',
      operatingRulesUrl: 'https://www.apiqroo.com.mx/',
      headlineEs: 'Cancún / Puerto Juárez. Enlace marítimo del Caribe Norte.',
      headlineEn: 'Cancún / Puerto Juárez. Northern Caribbean marine gateway.',
      overviewEs:
        'Complejo portuario turístico y de cabotaje integrado por la Terminal Marítima de Puerto Juárez, Punta Sam (transbordadores RoPax a Isla Mujeres), Zona Hotelera y Costa Mujeres.',
      overviewEn:
        'Coastal passenger, RoPax ferry and marine logistics gateway linking Puerto Juárez, Punta Sam, Hotel Zone and Isla Mujeres.',
      heroImageType: 'channel',
      channels: [
        {
          id: 'ch-cun-juarez',
          name: 'Canal de Navegación Bahía de Mujeres (Puerto Juárez – Punta Sam)',
          lengthNm: 2.6,
          widthM: 75,
          channelDepthM: 4.5,
          operationalDraftM: 3.6,
          squatAllowanceNote:
            'Canal somero entre Puerto Juárez y Punta Sam; bancos de arena vigilados por señalización marítima.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-cun-1',
          name: 'Fondeadero de Bahía de Mujeres (Sector Oeste Isla Mujeres)',
          purpose: 'Embarcaciones de cabotaje, yates y transbordadores en espera',
          coordinates: "21°12.5'N · 086°46.2'W",
          depthM: '6.0 – 9.0 m (arena blanca)',
          maxVesselOrNotes:
            'Resguardo natural tras Isla Mujeres ante marejada del Este; evitar pastos marinos protegidos.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'puerto-juarez',
          name: 'Puerto Juárez y Punta Sam (Pasaje, RoPax y Cabotaje)',
          nameEn: 'Puerto Juárez & Punta Sam Terminals',
          summary:
            'Muelles de alta frecuencia de transbordadores de pasajeros, vehículos y abasto logístico insular.',
          summaryEn:
            'High-frequency ferry terminals handling passenger transit, RoPax vehicles and island supply.',
          channelDepthM: 4.5,
          operationalDraftM: 3.6,
          turningBasinM: 150,
          daylightOnly: false,
          tugRequirement: 'No requerido para embarcaciones menores y catamarán',
          pilotRequirement: 'Control de tráfico con Capitanía Puerto Juárez VHF CH 12',
        },
      ],
      terminals: [
        {
          idSuffix: 'juarez-puntasam',
          areaKey: 'puerto-juarez',
          name: 'Terminal Marítima Puerto Juárez & Transbordadores Punta Sam',
          operator: 'APIQROO / Ultramar / Naviera Magna',
          shortDesc:
            'Principal nodo de conectividad de pasajeros, vehículos y abasto hacia Isla Mujeres con operación continua.',
          shortDescEn:
            'Primary passenger, RoPax vehicle and island supply hub serving Isla Mujeres.',
          coordinates: "21°10'55\"N · 86°48'24\"W",
          mapX: 50,
          mapY: 48,
          imageType: 'channel',
          cargoGroups: ['Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 2200,
            openYardSqm: 14000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Terminal de pasaje Puerto Juárez (Ultramar/APIQROO) y patio de embarque RoPax Punta Sam para autotransporte comercial hacia Isla Mujeres.',
            warehousesBreakdownEn:
              'Puerto Juárez fast-ferry passenger hall plus Punta Sam RoPax commercial truck marshaling yard serving Isla Mujeres.',
          },
          commercialProfile: {
            positioningHeadline:
              'Puerta Marítima del Caribe Norte: Ferries de Pasaje Puerto Juárez y RoPax Punta Sam',
            positioningHeadlineEn:
              'Northern Caribbean Maritime Hub: Puerto Juárez Fast Ferries & Punta Sam RoPax Supply',
            address: 'Av. José López Portillo / Carretera a Punta Sam, Cancún, Quintana Roo',
            customsRegime: 'Terminales Marítimas APIQROO · Tráfico de Cabotaje y Turismo Insular',
            customsRegimeEn: 'APIQROO Maritime Passenger & Coastal Cabotage Terminals',
            commercialServices: [
              'Operación continua cada 30 min de catamaranes de pasaje Puerto Juárez – Isla Mujeres',
              'Embarque vehicular y de carga comercial paletizada en rampa hidráulica RoPax de Punta Sam',
            ],
            commercialServicesEn: [
              'Continuous 30-minute fast passenger ferry shuttles connecting Puerto Juárez & Isla Mujeres',
              'Commercial freight truck, provisions & vehicle RoPax loading at Punta Sam ramp',
            ],
            infrastructureHighlights: [
              '185 m de atraque combinado a 3.60 m de calado operativo con rampa RoPax en Punta Sam',
              'Salas de abordaje en Puerto Juárez y patios de carga vehicular comercial en Punta Sam',
            ],
            infrastructureHighlightsEn: [
              '185 m combined berthing at 3.60 m operational draft with hydraulic RoPax ramp at Punta Sam',
              'Dedicated fast-ferry boarding concourses in Puerto Juárez and freight truck marshaling pads at Punta Sam',
            ],
            vesselTypesServed: ['Catamaranes de alta velocidad', 'Transbordadores vehiculares RoPax'],
            vesselTypesServedEn: ['High-Speed Passenger Catamarans', 'RoPax Commercial Vehicle Ferries'],
            connectivity: 'Conexión vial directa con Av. López Portillo, Arco Norte y Zona Hotelera de Cancún.',
            connectivityEn: 'Direct link to Av. López Portillo, Arco Norte & Cancún Hotel Zone.',
            operationalAdvantages: ['Frecuencias continuas garantizando el abasto hotelero y residencial de Isla Mujeres.'],
            operationalAdvantagesEn: ['High-frequency departures sustaining Isla Mujeres tourism & commercial supply.'],
            certifications: ['ISPS / PBIP', 'APIQROO'],
          },
          procedures: ['Despacho diario de pasaje y vehículos conforme a boletín meteorológico de Capitanía.'],
          restrictionsSummary: 'Calado máx. 3.60 m; cierre preventivo a navegación menor con vientos > 22 kt.',
          berths: [
            {
              idSuffix: 'pj1',
              name: 'Muelles Puerto Juárez (Pasaje) & Rampa RoPax Punta Sam',
              lengthM: 185,
              maxLoaM: 85,
              maxBeamM: 18.0,
              berthDepthM: 4.2,
              maxDraftM: 3.6,
              products: ['Pasajeros', 'Vehículos de abasto RoPax', 'Insumos turísticos e isleños'],
              cargoGroups: ['Carga General y Contenedores'],
              equipment: ['Rampa hidráulica RoPax en Punta Sam', 'Pasarelas de embarque rápido'],
              connections: ['Enlace vial Av. José López Portillo y Arco Norte'],
              loadingRate: 'Frecuencias continuas cada 30 min',
              notes: 'Restricción absoluta de maniobras ante aviso de surada o ciclón tropical.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'draft-cierre',
          category: 'Física',
          title: 'Calado Operativo Somero (3.60 m) en Bahía de Mujeres',
          titleEn: 'Shallow Operational Draft (3.60 m) in Bahía de Mujeres',
          detail:
            'Canal de Puerto Juárez y Punta Sam restringido a embarcaciones de calado ≤ 3.60 m por bajos arenosos naturales.',
          detailEn:
            'Puerto Juárez and Punta Sam fairways limited to ≤ 3.60 m draft due to natural sandbars.',
          limitValue: '3.60 m máx.',
          verificationStatus: 'verified',
          source: 'APIQROO / Capitanía Puerto Juárez',
        },
        {
          idSuffix: 'norte-surada',
          category: 'Operativa',
          title: 'Cierre Preventivo a Navegación Menor por Vientos E/SE (> 20–25 kt)',
          titleEn: 'Preventive Small-Craft Closure for Winds > 20–25 kt',
          detail:
            'Capitanía restringe embarcaciones menores de 500 TRB cuando ráfagas superan 20–25 kt en Bahía de Mujeres.',
          detailEn:
            'Harbor Master suspends craft under 500 GRT when gusts exceed 20–25 kt across Bahía de Mujeres.',
          limitValue: 'Cierre > 22 kt',
          verificationStatus: 'verified',
          source: 'Capitanía de Puerto Cancún',
        },
      ],
      sampleVessel: 'MV Caribe Express',
      sampleImo: '9755120',
      sampleBerth: 'Rampa RoPax Punta Sam',
      sampleCargo: 'Abasto y Vehículos RoPax · 650 MT',
      sampleStatus: 'BERTHED',
    },
    // 18. SEYBAPLAYA (MAR CARIBE / PENÍNSULA)
    {
      id: 'mxsey',
      shortCode: 'SEY',
      name: 'Puerto de Seybaplaya',
      unLocode: 'MXSEY',
      region: 'MAR CARIBE',
      state: 'Campeche · Península de Yucatán',
      coordinates: "19°38'24\"N · 90°42'06\"W",
      vhfChannel: 'CH 16 / CH 12 (Capitanía Seybaplaya)',
      authority: 'APICAM Campeche · Capitanía de Puerto Seybaplaya',
      lineupSourceUrl: 'https://apicampeche.com.mx/',
      lineupConnector: 'APICAM_SEY',
      operatingRulesSummary:
        'Reglas de Operación APICAM Seybaplaya: Puerto industrial, granelero y de soporte logístico offshore con viaducto mar adentro de 1,450 m hacia plataforma portuaria multipropósito; calado de referencia 7.50 – 8.50 m; maniobras diurnas preferentes para buques de carga > 120 m.',
      operatingRulesUrl: 'https://apicampeche.com.mx/',
      headlineEs: 'Seybaplaya. Viaducto industrial y plataforma logística offshore.',
      headlineEn: 'Seybaplaya. Industrial trestle port & offshore supply platform.',
      overviewEs:
        'Puerto estatal estratégico operado por APICAM en Campeche. Cuenta con un viaducto de acceso de 1.45 km mar adentro que conecta con posiciones de altura/cabotaje para cemento, piedra caliza, clinker, carga proyecto y embarcaciones offshore de la Sonda de Campeche.',
      overviewEn:
        'Strategic industrial port operated by APICAM in Campeche, built around a 1.45 km offshore trestle supporting limestone, cement, project cargo and Bay of Campeche OSV supply.',
      heroImageType: 'recintoSur',
      channels: [
        {
          id: 'ch-sey-acceso',
          name: 'Canal de Acceso y Dársena Plataforma Offshore Seybaplaya',
          lengthNm: 2.2,
          widthM: 120,
          channelDepthM: 9.0,
          operationalDraftM: 7.8,
          squatAllowanceNote:
            'Acceso marítimo hasta la plataforma de atraque al final del viaducto (calado operativo de referencia 7.80 m).',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-sey-1',
          name: 'Fondeadero Exterior Seybaplaya',
          purpose: 'Graneleros costeros, buques de cemento y flota OSV',
          coordinates: "19°40.5'N · 090°45.5'W",
          depthM: '10.0 – 13.0 m (fango y concha)',
          maxVesselOrNotes:
            'Área expuesta a Norte franco; mantener guardia VHF CH 16/12 con Capitanía Seybaplaya.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'plataforma',
          name: 'Plataforma Multipropósito Offshore y Terminal de Usos Múltiples APICAM',
          nameEn: 'Offshore Multipurpose Platform & APICAM Quay',
          summary:
            'Muelles marginales sobre plataforma artificial a 1.45 km de la costa para graneles minerales de construcción y logística petrolera.',
          summaryEn:
            'Offshore artificial island quay 1.45 km out for mineral construction bulk and OSV oilfield logistics.',
          channelDepthM: 9.0,
          operationalDraftM: 7.8,
          turningBasinM: 320,
          daylightOnly: true,
          tugRequirement: '1 a 2 remolcadores de apoyo para buques > 110 m LOA',
          pilotRequirement: 'Practicaje obligatorio > 500 UAB',
        },
      ],
      terminals: [
        {
          idSuffix: 'tum-apicam',
          areaKey: 'plataforma',
          name: 'Terminal Multipropósito y Plataforma Industrial Seybaplaya',
          operator: 'APICAM / Operadores Graneleros y Offshore',
          shortDesc:
            'Muelles industriales al extremo del viaducto para piedra caliza, clinker, cemento, abastecimiento offshore y barcazas.',
          shortDescEn:
            'Industrial trestle-head berths handling limestone, clinker, cement, project cargo and OSV supply.',
          coordinates: "19°38'55\"N · 90°42'48\"W",
          mapX: 50,
          mapY: 46,
          imageType: 'recintoSur',
          cargoGroups: ['Granel Mineral', 'Carga Proyecto', 'Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 3200,
            openYardSqm: 68000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Plataformas 1, 2 y Plataforma 3 (-6.0 m) conectadas por viaducto de 1.45 km a patios terrestres en Seybaplaya para balasto, piedra caliza, carga proyecto y mantenimiento naval.',
            warehousesBreakdownEn:
              'Platforms 1, 2 & Platform 3 (-6.0 m) linked by 1.45 km trestle to onshore stockyards for limestone ballast, cement, heavy project cargo & ship repair.',
          },
          commercialProfile: {
            positioningHeadline:
              'Plataforma Industrial Costa Afuera APICAM (Plataformas 1–3) para Balasto, Carga Proyecto y Astillero',
            positioningHeadlineEn:
              'APICAM Offshore Trestle Port (Platforms 1–3) for Limestone Bulk, Heavy-Lift & Ship Repair',
            address: 'Km 16.5 Carretera Campeche–Champotón, Seybaplaya, Campeche',
            customsRegime: 'Recinto Portuario Estatal APICAM · Sección Aduanera Campeche/Seybaplaya',
            customsRegimeEn: 'APICAM State Port Precinct · Campeche/Seybaplaya Customs',
            commercialServices: [
              'Operación en Plataformas 1, 2 y Plataforma 3 (-6.0 m) para piedra caliza, balasto ferroviario, cemento y clinker',
              'Descarga de módulos industriales, carga proyecto peninsular (Tren Maya / energía) y soporte a flota OSV',
              'Servicios de reparación naval, carenado menor y avituallamiento de barcazas y embarcaciones costa afuera',
            ],
            commercialServicesEn: [
              'Dry bulk handling across Platforms 1, 2 & 3 (-6.0 m) for limestone aggregates, rail ballast, cement & clinker',
              'Peninsular heavy project cargo discharge & Campeche Sound OSV offshore logistics',
              'Afloat vessel repair, marine servicing & barge provisioning',
            ],
            infrastructureHighlights: [
              'Viaducto marítimo de 1,450 m hacia plataformas multipropósito de 310 m de frente (calado 7.80 m)',
              'Plataforma 3 dedicada a ampliación industrial, heavy-lift y mantenimiento naval',
            ],
            infrastructureHighlightsEn: [
              '1,450 m offshore access trestle serving 310 m multi-platform quay (7.80 m op. draft)',
              'Expanded Platform 3 engineered for offshore support, heavy-lift & ship repair',
            ],
            vesselTypesServed: ['Barcazas y Graneleros Costeros (hasta 145 m LOA)', 'Buques OSV / Carga Proyecto'],
            vesselTypesServedEn: ['Coastal Bulkers & Barges (up to 145 m LOA)', 'OSV & Project Cargo Ships'],
            connectivity: 'Conexión carretera Campeche–Champotón (Fed. 180) y cercanía a red logística Tren Maya.',
            connectivityEn: 'Direct link to Campeche–Champotón Federal Hwy 180 & Tren Maya freight corridor.',
            operationalAdvantages: ['Alternativa profunda del litoral de Campeche descongestionando el abasto de agregados y proyecto.'],
            operationalAdvantagesEn: ['Deep coastal alternative relieving aggregate & project cargo pressure in Campeche.'],
            certifications: ['ISPS / PBIP', 'APICAM'],
          },
          procedures: ['Confirmar calado en boletín batimétrico APICAM y ventana diurna para esloras > 120 m.'],
          restrictionsSummary: 'Calado op. 7.80 m; carga eje restringida en viaducto carretero de acceso.',
          berths: [
            {
              idSuffix: 'sey1',
              name: 'Muelles Plataforma Norte y Sur APICAM',
              lengthM: 310,
              maxLoaM: 145,
              maxBeamM: 25.0,
              berthDepthM: 8.8,
              maxDraftM: 7.8,
              products: ['Piedra caliza / balasto', 'Cemento y clinker', 'Carga proyecto Tren Maya', 'Suministros offshore'],
              cargoGroups: ['Granel Mineral', 'Carga Proyecto', 'Carga General y Contenedores'],
              equipment: ['Grúas móviles sobre neumático', 'Tolvas de embarque de agregados'],
              connections: ['Viaducto 1.45 km hacia Carretera Campeche–Champotón'],
              loadingRate: '3,500 – 5,000 MT/día',
              notes: 'Expansión clave de infraestructura en Campeche.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'calado-viaducto',
          category: 'Física',
          title: 'Calado Operativo de Plataforma (7.80 m) y Eslora Máx. 145 m',
          titleEn: 'Platform Operational Draft (7.80 m) & 145 m Max LOA',
          detail:
            'Restricción de calado a 7.80 m en frente de atraque exterior y límite de carga vehicular sobre viaducto de acceso.',
          detailEn:
            'Berth draft limited to 7.80 m alongside offshore platform; trestle axle load limits apply.',
          limitValue: '7.80 m / 145 m LOA',
          verificationStatus: 'verified',
          source: 'APICAM Campeche · Seybaplaya',
        },
        {
          idSuffix: 'nortes-campeche',
          category: 'Operativa',
          title: 'Restricción Diurna y Cierre por Nortes en Sonda de Campeche',
          titleEn: 'Daylight Window & Cold Front Restrictions',
          detail:
            'Atraque diurno preferente para buques > 120 m; suspensión de maniobras ante marejada NNW > 1.8 m.',
          detailEn:
            'Daylight berthing preferred for LOA > 120 m; operations pause when NNW swell exceeds 1.8 m.',
          limitValue: 'Ventana diurna',
          verificationStatus: 'verified',
          source: 'Capitanía de Puerto Seybaplaya',
        },
      ],
      sampleVessel: 'MV Maya Limestone',
      sampleImo: '9621045',
      sampleBerth: 'Muelle Plataforma Norte APICAM',
      sampleCargo: 'Piedra caliza / balasto · 9,200 MT',
      sampleStatus: 'EXPECTED',
    },
    // 19. ROSARITO (PACÍFICO NORTE)
    {
      id: 'mxrst',
      shortCode: 'RST',
      name: 'Puerto de Rosarito (Terminal PEMEX)',
      unLocode: 'MXRST',
      region: 'PACÍFICO NORTE',
      state: 'Baja California · Pacífico Norte',
      coordinates: "32°19'30\"N · 117°04'12\"W",
      vhfChannel: 'CH 16 / CH 14 (Control Marino PEMEX Rosarito)',
      authority: 'Capitanía de Puerto Ensenada / Rosarito · PEMEX Logística',
      lineupSourceUrl: 'https://www.puertoensenada.com.mx/',
      lineupConnector: 'PEMEX_TAR_ROSARITO',
      operatingRulesSummary:
        'Reglas de Operación Terminal Marítima PEMEX Rosarito: Operación en mar abierto mediante Campo de Boyas Múltiples (CBM) y mangueras submarinas; calado operativo hasta 12.80–13.70 m (buques hasta ~60,000 DWT); maniobras únicamente diurnas de amarre (Mooring Master PEMEX) y desamarre 24/7 si la mar lo permite; suspensión inmediata con marejada > 2.5 m o viento > 25 kt.',
      operatingRulesUrl: 'https://www.puertoensenada.com.mx/',
      headlineEs: 'Rosarito. Terminal energética de boyas múltiples en el Pacífico Norte.',
      headlineEn: 'Rosarito. North Pacific offshore CBM oil & fuel terminal.',
      overviewEs:
        'Terminal Marítima de Almacenamiento y Reparto (TMAR PEMEX Rosarito) ubicada al sur de Tijuana. Atiende buques tanque de cabotaje e importación de gasolinas, diésel, combustóleo y turbosina mediante amarre a campo de boyas costa afuera (CBM) conectado por líneas submarinas.',
      overviewEn:
        'Offshore multi-buoy mooring (CBM) marine fuel terminal operated by PEMEX Logística south of Tijuana, supplying Baja California with gasoline, diesel, jet fuel and fuel oil via subsea pipelines.',
      heroImageType: 'pajaritos',
      channels: [
        {
          id: 'ch-rst-offshore',
          name: 'Aproximación Mar Abierto al Campo de Boyas Múltiples (CBM PEMEX Rosarito)',
          lengthNm: 2.0,
          widthM: 500,
          channelDepthM: 18.0,
          operationalDraftM: 13.7,
          squatAllowanceNote:
            'Aproximación directa desde mar abierto hacia campo de boyas de 7 puntos de amarre con profundidad natural 16–18 m.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-rst-1',
          name: 'Fondeadero de Espera Offshore Rosarito (Oeste del Campo de Boyas)',
          purpose: 'Buques tanque de refinados y GLP en espera de ventana diurna CBM',
          coordinates: "32°19.0'N · 117°06.8'W",
          depthM: '28.0 – 40.0 m (fondo firme arena)',
          maxVesselOrNotes:
            'Respetar zona de seguridad de líneas submarinas; esperar instrucciones del Mooring Master PEMEX en VHF CH 14.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'cbm-pemex',
          name: 'Campo de Boyas Múltiples (CBM) PEMEX Logística Rosarito',
          nameEn: 'PEMEX Offshore Multi-Buoy Mooring (CBM)',
          summary:
            'Sistema costa afuera con anclas propias del buque + boyas de popa y alije mediante mangueras submarinas hacia planta de almacenamiento.',
          summaryEn:
            'Offshore 7-point CBM spread utilizing vessel bow anchors and stern mooring buoys connected to subsea manifold.',
          channelDepthM: 18.0,
          operationalDraftM: 13.7,
          turningBasinM: 650,
          daylightOnly: true,
          tugRequirement: '1 a 2 remolcadores / lanchas de amarre para tendido de cabos a boyas',
          pilotRequirement: 'Mooring Master PEMEX + Práctico obligatorio en aproximación diurna',
        },
      ],
      terminals: [
        {
          idSuffix: 'pemex-cbm',
          areaKey: 'cbm-pemex',
          name: 'Terminal Marítima PEMEX Rosarito (Campo de Boyas CBM)',
          operator: 'PEMEX Logística · TMAR Rosarito',
          shortDesc:
            'Amarre a boyas múltiples en mar abierto para descarga de refinados (gasolinas, diésel, turbosina y combustóleo).',
          shortDescEn:
            'Offshore CBM tanker terminal discharging clean refined fuels and heavy fuel oil via subsea hoses.',
          coordinates: "32°19'28\"N · 117°04'38\"W",
          mapX: 50,
          mapY: 46,
          imageType: 'pajaritos',
          cargoGroups: ['Hidrocarburos y Gas'],
          storageSummary: {
            coveredSqm: 1200,
            openYardSqm: 95000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Terminal de Almacenamiento y Despacho PEMEX Rosarito con más de 1.3 millones de barriles en parque de tanques (incluyendo 130–155k bbl en capacidad abierta) y poliductos a Ensenada y Mexicali.',
            warehousesBreakdownEn:
              'PEMEX TAD Rosarito tank farm exceeding 1.3M bbl total capacity (130–155k bbl open-season storage) tied to Ensenada & Mexicali fuel pipelines.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal Energética Offshore CBM y Hub de Almacenamiento (>1.3M bbl) para Baja California',
            positioningHeadlineEn:
              'Offshore CBM Tanker Terminal & 1.3M+ bbl Fuel Storage Hub Supplying Baja California',
            address: 'Km 21.5 Carretera Libre Tijuana–Ensenada, Playas de Rosarito, B.C.',
            customsRegime: 'Terminal Marítima PEMEX Logística (TMAR / TAD Rosarito) · Aduana de Tijuana/Ensenada',
            customsRegimeEn: 'PEMEX Logística Strategic Offshore Terminal (TMAR / TAD) · Baja Customs',
            commercialServices: [
              'Descarga costa afuera en Campo de Boyas Múltiples (CBM) de gasolinas, diésel automotriz, turbosina y combustóleo',
              'Almacenamiento estratégico (>1.3M bbl totales) con capacidad regulada de acceso abierto (130–155k bbl)',
              'Inyección directa por poliducto hacia Tijuana, Ensenada y Mexicali y llenaderas de autotanques',
            ],
            commercialServicesEn: [
              'Offshore Multi-Buoy Mooring (CBM) unloading of gasoline, diesel, jet A-1 & heavy fuel oil',
              'Strategic 1.3M+ bbl tank farm storage including open-access third-party capacity (130–155k bbl)',
              'Direct pipeline distribution to Tijuana, Ensenada & Mexicali plus automated truck-loading racks',
            ],
            infrastructureHighlights: [
              'Campo de boyas CBM de 7 puntos en aguas profundas (13.70 m calado op.) con 2 mangueras submarinas de 12"',
              'Parque de tanques superior a 1.3 millones de barriles y red de poliductos interurbanos',
            ],
            infrastructureHighlightsEn: [
              '7-point offshore CBM spread rated to 13.70 m draft with dual 12" subsea PLEM hoses',
              '1.3M+ bbl onshore tank farm feeding regional Baja California pipelines',
            ],
            vesselTypesServed: ['Buques Tanque Producto MR1 / MR2 / Panamax (hasta ~60,000 DWT)', 'Abastecimiento cabotaje Pacífico'],
            vesselTypesServedEn: ['MR1 / MR2 / Panamax Product Tankers (up to ~60,000 DWT)', 'Pacific Coastal Tankers'],
            connectivity: 'Poliductos directos a Tijuana, Ensenada y Mexicali más Carretera Escénica Transpeninsular.',
            connectivityEn: 'Trunk refined-product pipelines to Tijuana, Ensenada & Mexicali plus coastal highway.',
            operationalAdvantages: ['Único punto de descarga petrolero de gran calado cercano a la zona metropolitana Tijuana–Mexicali.'],
            operationalAdvantagesEn: ['Closest deep-water hydrocarbon offloading spread serving the Tijuana–Mexicali corridor.'],
            certifications: ['OCIMF / SIRE', 'ISGOTT', 'ASEA / CRE'],
          },
          procedures: [
            'Amarre a campo de boyas únicamente con luz solar y marejada < 2.2 m.',
            'Vetting SIRE / Q88 aprobado por PEMEX Logística y prueba de fondeo de anclas.',
          ],
          restrictionsSummary: 'Calado máx. 13.70 m (~45 ft); eslora hasta 215 m; maniobra diurna de amarre.',
          berths: [
            {
              idSuffix: 'cbm1',
              name: 'Campo de Boyas CBM Rosarito (Posición Única Offshore)',
              lengthM: 250,
              maxLoaM: 215,
              maxBeamM: 34.0,
              berthDepthM: 16.5,
              maxDraftM: 13.7,
              products: ['Gasolina regular y premium', 'Diésel automotriz', 'Turbosina', 'Combustóleo'],
              cargoGroups: ['Hidrocarburos y Gas'],
              equipment: ['2 Mangueras submarinas 12" PLEM', 'Lanchas de manejo de cabos y amarre'],
              connections: ['Poliducto y tanques de almacenamiento TAR Rosarito / Tijuana'],
              loadingRate: '1,200 – 2,200 m³/h',
              notes: 'Buque debe contar con winches de amarre y bitas popa certificadas.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'oleaje-cbm',
          category: 'Operativa',
          title: 'Amarre Diurno CBM y Suspensión por Oleaje Pacífico (> 2.2 – 2.5 m)',
          titleEn: 'Daylight CBM Mooring & Pacific Swell Limit (> 2.2 – 2.5 m)',
          detail:
            'Por ser terminal costa afuera sin escolleras, el amarre se realiza solo en horario diurno y se desconectan mangueras ante mar de fondo > 2.5 m.',
          detailEn:
            'Exposed open-sea CBM requires daylight mooring and immediate hose disconnection above 2.5 m swell.',
          limitValue: 'Diurno · Swell < 2.5 m',
          verificationStatus: 'verified',
          source: 'PEMEX TMAR Rosarito',
        },
        {
          idSuffix: 'vetting-sire',
          category: 'Practicaje y Remolque',
          title: 'Mooring Master PEMEX, Ambas Anclas Operativas y SIRE Vigente',
          titleEn: 'PEMEX Mooring Master, Dual Anchors & Valid SIRE Vetting',
          detail:
            'Obligatorio contar con dos anclas de proa en perfecto estado, winches de popa con tensión adecuada y vetting OCIMF/SIRE.',
          detailEn:
            'Vessel must have both bow anchors operational, certified stern winches and cleared OCIMF/SIRE report.',
          limitValue: 'CBM 7 puntos',
          verificationStatus: 'verified',
          source: 'PEMEX Logística / Capitanía',
        },
      ],
      sampleVessel: 'MT Baja Spirit',
      sampleImo: '9691234',
      sampleBerth: 'Campo de Boyas CBM Rosarito',
      sampleCargo: 'Gasolina / Diésel · 38,000 MT',
      sampleStatus: 'ANCHORED',
    },
    // 20. PUERTO CHIAPAS (PACÍFICO SUR)
    {
      id: 'mxpmd',
      shortCode: 'CHP',
      name: 'Puerto Chiapas',
      unLocode: 'MXPMD',
      region: 'PACÍFICO SUR',
      state: 'Chiapas · Pacífico Sur',
      coordinates: "14°42'18\"N · 92°24'12\"W",
      vhfChannel: 'CH 16 / CH 12 (Control Portuario Puerto Chiapas)',
      authority: 'ASIPONA Puerto Chiapas · Capitanía de Puerto',
      lineupSourceUrl: 'https://www.puertochiapas.com.mx/',
      lineupConnector: 'ASIPONA_CHP',
      operatingRulesSummary:
        'Reglas de Operación ASIPONA Puerto Chiapas: Canal de acceso protegido por escolleras de 1.75 km con -11.50 m NBMI (calado operativo 9.75 – 10.20 m); dársena de ciaboga de 400 m; atención a cruceros turísticos, atuneros, contenedores, granel agrícola (banano/soya/azúcar), clinker y terminal PEMEX.',
      operatingRulesUrl: 'https://www.puertochiapas.com.mx/',
      headlineEs: 'Puerto Chiapas. Puerta agroindustrial y de cruceros del Pacífico Sur.',
      headlineEn: 'Puerto Chiapas. Southern Pacific agro-bulk & cruise gateway.',
      overviewEs:
        'Puerto comercial, pesquero y turístico ubicado en Tapachula (frontera sur de México). Atiende carga refrigerada y granel agrícola, clinker y cemento, combustibles PEMEX, flota atunera industrial y cruceros en el corredor del Pacífico Centroamericano.',
      overviewEn:
        'Commercial, fishing and cruise port located near Tapachula on Mexico’s southern Pacific coast, handling refrigerated agro-exports, bulk cement/clinker, PEMEX fuels and international cruise ships.',
      heroImageType: 'recintoSur',
      channels: [
        {
          id: 'ch-chp-ext',
          name: 'Canal de Acceso y Escolleras Puerto Chiapas',
          lengthNm: 1.5,
          widthM: 120,
          channelDepthM: 11.5,
          operationalDraftM: 9.8,
          squatAllowanceNote:
            'Canal entre escolleras dragado a -11.5 m NBMI; dársena interior de ciaboga de 400 m con azolvamiento estacional vigilado.',
          verificationStatus: 'verified',
        },
      ],
      anchorageZones: [
        {
          id: 'az-chp-1',
          name: 'Fondeadero Principal Pacífico Sur — Puerto Chiapas',
          purpose: 'Buques mercantes, graneleros, cruceros y flota pesquera',
          coordinates: "14°40.2'N · 092°26.0'W (1.8 MN al SW de bocana)",
          depthM: '16.0 – 22.0 m (arena gris)',
          maxVesselOrNotes:
            'Buen tenedero frente a barra; atenuar deriva ante corrientes costeras del Pacífico Sur.',
          verificationStatus: 'verified',
        },
      ],
      areas: [
        {
          key: 'comercial-chp',
          name: 'Dársena Comercial, Usos Múltiples, Cruceros y PEMEX',
          nameEn: 'Commercial, Multipurpose, Cruise & PEMEX Basin',
          summary:
            'Integra la Terminal de Usos Múltiples (TUM), Terminal de Cruceros, Terminal de Contenedores/Graneles y Muelle de Hidrocarburos PEMEX.',
          summaryEn:
            'Houses the Multipurpose Terminal (TUM), Cruise Terminal, Container/Agro-Bulk berth and PEMEX fluid jetty.',
          channelDepthM: 11.5,
          operationalDraftM: 9.8,
          turningBasinM: 400,
          daylightOnly: false,
          tugRequirement: '2 remolcadores para buques mercantes > 130 m y cruceros',
          pilotRequirement: 'Practicaje obligatorio > 500 UAB; embarque 1.5 MN SW escolleras',
        },
      ],
      terminals: [
        {
          idSuffix: 'tum-chp',
          areaKey: 'comercial-chp',
          name: 'Terminal de Usos Múltiples (TUM) y Agrícola · ASIPONA Puerto Chiapas',
          operator: 'ASIPONA Puerto Chiapas / Terminal de Contenedores y Graneles',
          shortDesc:
            'Muelle comercial y multipropósito para carga refrigerada (banano/mango), granel agrícola, azúcar, clinker, contenedores y fertilizantes.',
          shortDescEn:
            'Multipurpose commercial berth handling reefer fruit, agro-bulk, sugar, clinker, containers and fertilizers.',
          coordinates: "14°42'22\"N · 92°24'05\"W",
          mapX: 44,
          mapY: 44,
          imageType: 'recintoSur',
          cargoGroups: ['Granel Agrícola', 'Granel Mineral', 'Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 9500,
            openYardSqm: 75000,
            containerYardSqm: 28000,
            warehousesBreakdown:
              'Bodegas frigoríficas y de tránsito para banano/agroexportación del Soconusco, patios de clinker/cemento y contenedores refrigerados con tomas reefer.',
            warehousesBreakdownEn:
              'Reefer/transit sheds for Soconusco tropical produce exports, clinker/cement yards & reefer-equipped container pads.',
          },
          commercialProfile: {
            positioningHeadline:
              'Hub Agroindustrial, Refrigerado y Multipropósito del Pacífico Sur (Frontera Guatemala)',
            positioningHeadlineEn:
              'Southern Pacific Reefer Agro-Export & Multipurpose Gateway Near Guatemala Border',
            address: 'Recinto Portuario de Puerto Chiapas, Tapachula, Chiapas',
            customsRegime: 'Recinto Fiscal Portuario ASIPONA Puerto Chiapas · Aduana Ciudad Hidalgo / Tapachula',
            customsRegimeEn: 'ASIPONA Puerto Chiapas Fiscal Port · Tapachula Customs',
            commercialServices: [
              'Exportación refrigerada (reefer y bodega fría) de banano, mango y productos agrícolas del Soconusco',
              'Importación/cabotaje de maíz, soya, fertilizantes, azúcar, clinker y cemento en 430 m de TUM',
              'Atención intermodal transfronteriza de contenedores hacia el sur de Chiapas y occidente de Guatemala',
            ],
            commercialServicesEn: [
              'Cold-chain reefer exports (bananas, mangoes & Soconusco agribusiness)',
              'Bulk stevedoring of corn, soy, fertilizers, sugar, clinker & cement across 430 m TUM',
              'Cross-border container & breakbulk distribution serving Southern Chiapas & Western Guatemala',
            ],
            infrastructureHighlights: [
              '430 m en Muelles 1 y 2 TUM a 9.80 m de calado operativo con grúas móviles y tomas reefer',
              'Bodegas frigoríficas y de tránsito para perecederos del Soconusco + patios de clinker',
            ],
            infrastructureHighlightsEn: [
              '430 m across Berths 1–2 TUM at 9.80 m draft with mobile cranes & reefer racks',
              'Cold-storage transit warehouses for Soconusco produce plus dedicated clinker/cement staging pads',
            ],
            vesselTypesServed: ['Buques Frigoríficos / Reefer Containerships', 'Graneleros Costeros y Handysize'],
            vesselTypesServedEn: ['Reefer Ships & Container Feeders', 'Handysize / Coastal Dry Bulkers'],
            connectivity: 'Carretera Costera 200 hacia Tapachula, frontera con Guatemala y Corredor Interoceánico Línea K.',
            connectivityEn: 'Coastal Hwy 200 to Tapachula, Guatemala border & Interoceanic Railway Line K.',
            operationalAdvantages: ['Puerto estratégico más austral de México para exportaciones perecederas y carga centroamericana.'],
            operationalAdvantagesEn: ['Mexico’s southernmost Pacific gateway ideal for reefer exports & Guatemala trade.'],
            certifications: ['ISPS / PBIP', 'SENASICA'],
          },
          procedures: ['Inspección fitosanitaria SENASICA y control de temperatura para carga reefer.'],
          restrictionsSummary: 'Calado op. 9.80 m; eslora máx. 210 m en dársena interior.',
          berths: [
            {
              idSuffix: 'chp-tum',
              name: 'Muelles 1 y 2 TUM / Contenedores y Graneles',
              lengthM: 430,
              maxLoaM: 210,
              maxBeamM: 32.2,
              berthDepthM: 11.0,
              maxDraftM: 9.8,
              products: ['Banano y fruta refrigerada', 'Maíz / Soya / Azúcar', 'Clinker y cemento', 'Contenedores'],
              cargoGroups: ['Granel Agrícola', 'Granel Mineral', 'Carga General y Contenedores'],
              equipment: ['Grúas móviles de muelle', 'Conexiones reefer y bodegas frigoríficas'],
              connections: ['Patios intermodales y red carretera Soconusco – Tapachula'],
              loadingRate: '3,500 – 5,000 MT/día granel',
              notes: 'Verificar último boletín de sondeo posterior a temporada de lluvias (jun–oct).',
            },
          ],
        },
        {
          idSuffix: 'cruceros-pemex',
          areaKey: 'comercial-chp',
          name: 'Terminal de Cruceros y Muelle PEMEX / Pesca Industrial',
          operator: 'ASIPONA Puerto Chiapas / PEMEX Logística',
          shortDesc:
            'Muelle exclusivo para cruceros turísticos del Pacífico centroamericano y posición especializada para refinados PEMEX y flota atunera.',
          shortDescEn:
            'Dedicated cruise passenger pier plus PEMEX fuel jetty and industrial tuna fleet berths.',
          coordinates: "14°42'02\"N · 92°23'52\"W",
          mapX: 66,
          mapY: 60,
          imageType: 'pajaritos',
          cargoGroups: ['Hidrocarburos y Gas', 'Carga General y Contenedores'],
          storageSummary: {
            coveredSqm: 5500,
            openYardSqm: 24000,
            containerYardSqm: 0,
            warehousesBreakdown:
              'Terminal Turística de Cruceros, parque pesquero/atunero con cámaras de congelación y ducto de combustibles hacia TAR Tapachula.',
            warehousesBreakdownEn:
              'Cruise Welcome Terminal, industrial tuna cold storage & fuel pipeline to TAR Tapachula.',
          },
          commercialProfile: {
            positioningHeadline:
              'Terminal Internacional de Cruceros Ruta Centroamérica, Combustibles PEMEX y Parque Atunero',
            positioningHeadlineEn:
              'Central America Cruise Gateway, PEMEX Tapachula Fuel Berth & Tuna Fleet Complex',
            address: 'Dársena Sur, Puerto Chiapas, Tapachula, Chiapas',
            customsRegime: 'Terminal Turística Internacional y Muelle Fiscal PEMEX · Aduana Puerto Chiapas',
            customsRegimeEn: 'International Cruise Terminal & PEMEX Fuel Jetty · Puerto Chiapas Customs',
            commercialServices: [
              'Recepción de cruceros internacionales en ruta Panamá–Acapulco con centro turístico y despacho INM',
              'Descarga de diésel UBA y gasolinas para abastecimiento regional vía TAR Tapachula',
              'Descarga y congelación de atún industrial en instalaciones frigoríficas de muelle',
            ],
            commercialServicesEn: [
              'Central American corridor cruise calls with dedicated welcome pavilion & INM passenger clearance',
              'Clean fuel imports (ULSD & gasoline) feeding TAR Tapachula distribution depot',
              'Industrial tuna fleet discharge & dockside blast-freezing storage',
            ],
            infrastructureHighlights: [
              '360 m de frente en Cruceros y PEMEX a 9.50 m calado op. y brazos marinos a 900 m³/h',
              'Pabellón turístico internacional de cruceros, poliducto a TAR Tapachula y frigoríficos atuneros',
            ],
            infrastructureHighlightsEn: [
              '360 m combined Cruise & PEMEX quay at 9.50 m op. draft with 900 m³/hr marine arms',
              'International cruise welcome pavilion, TAR Tapachula fuel pipeline and tuna blast-freeze storage',
            ],
            vesselTypesServed: ['Cruceros Internacionales (hasta 245 m LOA)', 'Tanqueros Costeros PEMEX y Atuneros'],
            vesselTypesServedEn: ['International Cruise Ships (up to 245 m LOA)', 'Coastal Tankers & Tuna Seiners'],
            connectivity: 'Enlace carretero directo a Tapachula, Izapa y Aeropuerto Internacional TAP.',
            connectivityEn: 'Direct highway access to Tapachula, Izapa archaeological zone & TAP Airport.',
            operationalAdvantages: ['Atención integral turística y energética en un puerto protegido por escolleras de 1.75 km.'],
            operationalAdvantagesEn: ['Combined passenger & regional fuel logistics inside a breakwater-sheltered basin.'],
            certifications: ['ISPS / PBIP', 'OCIMF / SIRE (PEMEX)', 'Sanidad Internacional'],
          },
          procedures: ['Prioridad de atraque para itinerarios programados de cruceros; checklist ISGOTT en PEMEX.'],
          restrictionsSummary: 'Calado op. 9.50 m en Cruceros / 8.50 m en PEMEX; control por mar de fondo.',
          berths: [
            {
              idSuffix: 'chp-cru',
              name: 'Muelle de Cruceros & Terminal PEMEX',
              lengthM: 360,
              maxLoaM: 245,
              maxBeamM: 32.3,
              berthDepthM: 10.6,
              maxDraftM: 9.5,
              products: ['Cruceros turísticos', 'Diésel UBA y Gasolinas PEMEX', 'Atún congelado'],
              cargoGroups: ['Hidrocarburos y Gas', 'Carga General y Contenedores'],
              equipment: ['Centro turístico de bienvenida', 'Brazos marinos PEMEX y frigorífico pesquero'],
              connections: ['Ductos TAR Tapachula'],
              loadingRate: '900 m³/h refinados · 2,500 pax/h',
              notes: 'Cumplir normas sanitarias y de protección marítima.',
            },
          ],
        },
      ],
      restrictions: [
        {
          idSuffix: 'azolvamiento',
          category: 'Física',
          title: 'Calado Operativo (9.80 m) y Control de Azolve en Bocana',
          titleEn: 'Operational Draft (9.80 m) & Entrance Shoaling Control',
          detail:
            'El transporte litoral de arena en Chiapas exige revisar boletín batimétrico mensual antes de confirmar calados > 9.50 m.',
          detailEn:
            'High littoral sediment drift requires monthly bathymetric check prior to clearing drafts > 9.50 m.',
          limitValue: '9.80 m máx.',
          verificationStatus: 'verified',
          source: 'ASIPONA Puerto Chiapas',
        },
        {
          idSuffix: 'mar-fondo',
          category: 'Operativa',
          title: 'Precaución por Mar de Fondo (Pacífico Sur) en Entrada de Escolleras',
          titleEn: 'South Pacific Swell Advisory at Breakwater Entrance',
          detail:
            'Durante eventos de Mar de Fondo del S/SW (> 2.2 m), reforzar amarras y mantener máquinas en standby en bocana.',
          detailEn:
            'During S/SW long-period swell events (> 2.2 m), double mooring lines and stand by engines.',
          limitValue: 'Swell > 2.2 m',
          verificationStatus: 'verified',
          source: 'Capitanía de Puerto Chiapas',
        },
      ],
      sampleVessel: 'MV Tapachula Reefer',
      sampleImo: '9609112',
      sampleBerth: 'Muelle 1 TUM Puerto Chiapas',
      sampleCargo: 'Banano / Carga Refrigerada · 7,400 MT',
      sampleStatus: 'EXPECTED',
    },
  ];

  const ports: PortProfile[] = blueprints.map((bp) => ({
    id: bp.id,
    shortCode: bp.shortCode,
    country: 'México',
    region: bp.region,
    name: bp.name,
    unLocode: bp.unLocode,
    state: bp.state,
    coordinates: bp.coordinates,
    timezone: 'America/Mexico_City (UTC-6)',
    vhfChannel: bp.vhfChannel,
    authority: bp.authority,
    lineupSourceUrl: bp.lineupSourceUrl,
    lineupConnector: bp.lineupConnector,
    operatingRulesSummary: bp.operatingRulesSummary,
    operatingRulesUrl: bp.operatingRulesUrl,
    heroHeadline: bp.headlineEs,
    heroHeadlineEn: bp.headlineEn,
    heroSubheadline: `Ficha ASIPONA integrada con el Line-Up Nacional ISS (${bp.shortCode}) · Canales, zonas de fondeo, terminales, reglas de operación, tarifarios PDA y exportación Sedna.`,
    heroSubheadlineEn: `ASIPONA port profile synced with ISS National Vessel Line-Up (${bp.shortCode}) · Channels, anchorages, terminals, operating rules, PDA tariffs and Sedna export.`,
    overview: bp.overviewEs,
    overviewEn: bp.overviewEn,
    heroImageUrl: resolveImage(bp.heroImageType),
    channelImageUrl: images.channel,
    isCompleteProfile: true,
    channels: bp.channels,
    anchorageZones: bp.anchorageZones,
  }));

  const areas: PortArea[] = blueprints.flatMap((bp) =>
    bp.areas.map((a) => ({
      id: `area-${bp.id}-${a.key}`,
      portId: bp.id,
      name: a.name,
      nameEn: a.nameEn,
      summary: a.summary,
      summaryEn: a.summaryEn,
      channelDepthM: a.channelDepthM,
      operationalDraftM: a.operationalDraftM,
      turningBasinM: a.turningBasinM,
      daylightOnly: a.daylightOnly,
      tugRequirement: a.tugRequirement,
      pilotRequirement: a.pilotRequirement,
      verificationStatus: 'verified' as const,
    }))
  );

  const terminals: Terminal[] = blueprints.flatMap((bp) =>
    bp.terminals.map((t) => ({
      id: `term-${bp.id}-${t.idSuffix}`,
      portId: bp.id,
      areaId: `area-${bp.id}-${t.areaKey}`,
      name: t.name,
      operator: t.operator,
      shortDesc: t.shortDesc,
      shortDescEn: t.shortDescEn,
      coordinates: t.coordinates,
      mapX: t.mapX,
      mapY: t.mapY,
      imageUrl: resolveImage(t.imageType),
      cargoGroups: t.cargoGroups,
      storageSummary: t.storageSummary,
      commercialProfile: t.commercialProfile,
      berths: t.berths.map(
        (b): Berth => ({
          id: `berth-${bp.id}-${b.idSuffix}`,
          name: b.name,
          lengthM: b.lengthM,
          maxLoaM: b.maxLoaM,
          maxBeamM: b.maxBeamM,
          berthDepthM: b.berthDepthM,
          maxDraftM: b.maxDraftM,
          airDraftM: b.airDraftM,
          products: b.products,
          cargoGroups: b.cargoGroups,
          equipment: b.equipment,
          connections: b.connections,
          loadingRate: b.loadingRate,
          notes: b.notes,
          verificationStatus: 'verified',
        })
      ),
      procedures: t.procedures,
      restrictionsSummary: t.restrictionsSummary,
      audit: {
        updatedAt: '2026-11-26',
        updatedBy: 'ISS Port Intelligence Hub',
        source: `ASIPONA ${bp.name.replace('Puerto de ', '')} · Reglas de Operación (${bp.lineupConnector})`,
        verificationStatus: 'verified',
      },
    }))
  );

  const restrictions: PortRestriction[] = blueprints.flatMap((bp) => [
    ...bp.restrictions.map((r) => ({
      id: `rest-${bp.id}-${r.idSuffix}`,
      portId: bp.id,
      areaId: r.areaKey ? `area-${bp.id}-${r.areaKey}` : undefined,
      category: r.category,
      title: r.title,
      titleEn: r.titleEn,
      detail: r.detail,
      detailEn: r.detailEn,
      limitValue: r.limitValue,
      verificationStatus: r.verificationStatus,
      source: r.source,
    })),
    {
      id: `rest-${bp.id}-vumce`,
      portId: bp.id,
      category: 'Seguridad y Aduana' as const,
      title: 'Ventana VUMCE / PIS y Despacho 48h',
      titleEn: 'VUMCE / PIS Filing & 48h Clearance Window',
      detail: `Declaración de arribo en VUMCE, lista de tripulación e IMDG 48h pre-ETA. Programación monitoreada vía ${bp.lineupConnector}.`,
      detailEn: `VUMCE arrival notice, crew list and IMDG manifest due 48h pre-ETA. Line-up tracked via ${bp.lineupConnector}.`,
      limitValue: '48 h pre-ETA',
      verificationStatus: 'verified' as const,
      source: `Capitanía / Aduana Marítima ${bp.shortCode}`,
    },
  ]);

  const tariffs: TariffItem[] = blueprints.flatMap((bp) => [
    {
      id: `tar-${bp.id}-port`,
      portId: bp.id,
      areaId: 'ALL',
      code: `${bp.shortCode}-PORT-01`,
      concept: 'Derecho de Puerto (Infraestructura)',
      conceptEn: 'Port Infrastructure Dues',
      provider: bp.authority,
      unit: 'per_gt',
      rate: 0.41,
      currency: 'USD',
      effectiveFrom: '2026-01-01',
      notes: 'Tarifa referencial editable en Content Manager según tabulador ASIPONA vigente.',
      verificationStatus: 'pending_validation',
      active: true,
      chargeSection: 'port' as const,
    },
    {
      id: `tar-${bp.id}-berth`,
      portId: bp.id,
      areaId: 'ALL',
      code: `${bp.shortCode}-BERTH-01`,
      concept: 'Atraque y Estadía en Muelle',
      conceptEn: 'Berthage & Quay Stay',
      provider: bp.authority,
      unit: 'per_loa_m',
      rate: 14.8,
      currency: 'USD',
      effectiveFrom: '2026-01-01',
      notes: 'Base por metro de eslora total (LOA).',
      verificationStatus: 'pending_validation',
      active: true,
      chargeSection: 'port' as const,
    },
    {
      id: `tar-${bp.id}-pilot`,
      portId: bp.id,
      areaId: 'ALL',
      code: `${bp.shortCode}-PILOT-01`,
      concept: 'Practicaje de Puerto (Entrada + Salida)',
      conceptEn: 'Harbor Pilotage (In + Out)',
      provider: `Cuerpo de Pilotos de Puerto ${bp.shortCode}`,
      unit: 'per_gt',
      rate: 0.23,
      currency: 'USD',
      effectiveFrom: '2026-01-01',
      notes: 'Referencia maniobra diurna estándar.',
      verificationStatus: 'pending_validation',
      active: true,
      chargeSection: 'port' as const,
    },
    {
      id: `tar-${bp.id}-tug`,
      portId: bp.id,
      areaId: 'ALL',
      code: `${bp.shortCode}-TUG-01`,
      concept: 'Servicio de Remolcadores',
      conceptEn: 'Tugboat Assistance',
      provider: `Operador de Remolque ${bp.shortCode}`,
      unit: 'per_tug_hour',
      rate: 2350,
      currency: 'USD',
      effectiveFrom: '2026-01-01',
      notes: 'Tarifa referencial por hora-remolcador.',
      verificationStatus: 'pending_validation',
      active: true,
      chargeSection: 'port' as const,
    },
    {
      id: `tar-${bp.id}-agy`,
      portId: bp.id,
      areaId: 'ALL',
      code: `ISS-${bp.shortCode}-AGY`,
      concept: 'Honorarios de Agenciamiento Naviero (Agency Fee)',
      conceptEn: 'ISS Port Agency Fee',
      provider: 'Inchcape Shipping Services México',
      unit: 'flat',
      rate: 4650,
      currency: 'USD',
      effectiveFrom: '2026-01-01',
      notes: 'Confirmar acuerdo comercial con cliente.',
      verificationStatus: 'pending_validation',
      active: true,
      chargeSection: 'agency' as const,
    },
  ]);

  const directory: DirectoryEntry[] = blueprints.map((bp) => ({
    id: `dir-${bp.id}-iss`,
    portId: bp.id,
    category: 'ISS',
    organization: `ISS México · Desk Operativo ${bp.name.replace('Puerto de ', '')}`,
    contactName: `Coordinación Portuaria ${bp.shortCode}`,
    role: 'Agenciamiento Naviero y Atención a Escalas (24/7)',
    email: `${bp.shortCode.toLowerCase()}.ops@iss-shipping.example`,
    phone: '+52 55 0000 0100',
    accessLevel: 'Público Operativo',
    notes: `Coordinación directa de escalas, Line-Up y despacho VUMCE para ${bp.name}.`,
  }));

  const weather: WeatherStatus[] = blueprints.map((bp) => ({
    id: `wx-${bp.id}`,
    portId: bp.id,
    portStatus: 'Abierto a toda navegación',
    windDirection:
      bp.region === 'GOLFO DE MÉXICO' || bp.region === 'MAR CARIBE' ? 'ENE' : 'WNW',
    windKnots: 11,
    waveHeightM: 1.2,
    visibilityNm: '9.0 MN · Despejado',
    visibilityNmEn: '9.0 NM · Clear',
    barCurrentKnots: 1.0,
    advisory: `Condiciones operativas estables en ${bp.name.replace('Puerto de ', '')}. Consultar boletín meteorológico de Capitanía antes de maniobra.`,
    advisoryEn: `Stable operating conditions at ${bp.name.replace('Puerto de ', '')}. Check daily Harbor Master weather bulletin before maneuvering.`,
    externalWeatherUrl: 'https://smn.conagua.gob.mx/es/',
    lastChecked: 'Actualizado para operación diaria · Sistema Meteorológico ISS',
    lastCheckedEn: 'Updated for daily operations · ISS Marine Weather System',
  }));

  const statusHistory: PortStatusEvent[] = blueprints.flatMap((bp) => [
    {
      id: `st-${bp.id}-1`,
      portId: bp.id,
      status: 'Abierto a toda navegación',
      navigationScope: 'Apertura a toda navegación de altura y menor',
      navigationScopeEn: 'Open to all ocean-going & small craft traffic',
      timestamp: '21/11/26 07:30',
      notes: `Reapertura tras mejoría de condiciones meteorológicas en ${bp.name.replace('Puerto de ', '')}.`,
      notesEn: `Reopened following improved weather conditions at ${bp.name.replace('Puerto de ', '')}.`,
    },
    {
      id: `st-${bp.id}-2`,
      portId: bp.id,
      status: 'Cerrado a embarcaciones menores',
      navigationScope: 'Cierre preventivo a embarcaciones menores (< 500 TRB)',
      navigationScopeEn: 'Preventive closure to vessels under 500 GRT',
      timestamp: '19/11/26 16:45',
      notes: 'Incremento de viento y marejada en bocana.',
      notesEn: 'Increasing winds and swell at harbor entrance.',
    },
    {
      id: `st-${bp.id}-3`,
      portId: bp.id,
      status: 'Abierto a toda navegación',
      navigationScope: 'Apertura a toda navegación',
      navigationScopeEn: 'Open to all navigation',
      timestamp: '14/11/26 09:00',
      notes: 'Condiciones normales de operación en canal y dársenas.',
      notesEn: 'Normal channel and basin operating conditions.',
    },
  ]);

  const lineup: VesselLineupEntry[] = blueprints.map((bp) => ({
    id: `lu-${bp.id}-1`,
    portId: bp.id,
    vesselName: bp.sampleVessel,
    imo: bp.sampleImo,
    terminalOrBerth: bp.sampleBerth,
    cargo: bp.sampleCargo,
    etaOrEtd: '2026-11-21 08:00',
    status: bp.sampleStatus,
    agencyOrOperator: 'ISS México',
    updatedAt: '2026-11-21',
  }));

  return {
    ports,
    areas,
    terminals,
    restrictions,
    tariffs,
    directory,
    weather,
    statusHistory,
    lineup,
  };
}
