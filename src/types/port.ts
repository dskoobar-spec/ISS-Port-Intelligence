export type Language = 'es' | 'en';

export type VerificationStatus = 'verified' | 'pending_validation';

export type DirectoryCategory =
  | 'ISS'
  | 'Subagentes'
  | 'Proveedores'
  | 'CLS_HUB'
  | 'Clientes'
  | 'Dow_Jones';

export type CargoGroup =
  | 'Petroquímica y Líquidos'
  | 'Granel Agrícola'
  | 'Granel Mineral'
  | 'Carga General y Contenedores'
  | 'Hidrocarburos y Gas'
  | 'Carga Proyecto';

export type TariffUnit =
  | 'per_gt'
  | 'per_loa_m'
  | 'per_day'
  | 'per_ton'
  | 'per_tug_hour'
  | 'flat';

export interface AuditInfo {
  updatedAt: string;
  updatedBy: string;
  source: string;
  verificationStatus: VerificationStatus;
}

export interface PierProductCondition {
  id: string;
  product: string;
  line: string;
  connectionType: string;
  connection: string;
  maxAvgPerHour: string;
  minAvgPerHour: string;
  mergedRateNote?: string;
}

export interface PierSpecificationSheet {
  pierNumber: string;
  pierTitle: string;
  pierSide: string;
  subtitle: string;
  bcmMaxHeightNote?: string;
  measurementNote: string;
  bannerImageUrl?: string;
  brandPrimary?: string;
  brandSecondary?: string;
  motto?: string;
  maxDwt: string;
  maxDisplacement: string;
  berthingVelocity: string;
  maxTransverseWindage: string;
  maxLongitudinalWindage: string;
  operatingDraftDisplay: string;
  maxAcceptedLoa: string;
  maxAcceptedBeam: string;
  conditions: PierProductCondition[];
  footerLocation?: string;
  footerOffice?: string;
  footerNoticeTitle?: string;
  footerNoticeBody?: string;
}

export interface Berth {
  id: string;
  name: string;
  nameEn?: string;
  lengthM: number;
  maxLoaM: number;
  maxBeamM: number;
  berthDepthM: number;
  maxDraftM: number;
  airDraftM?: number;
  products: string[];
  productsEn?: string[];
  cargoGroups: CargoGroup[];
  equipment: string[];
  equipmentEn?: string[];
  connections: string[];
  connectionsEn?: string[];
  loadingRate: string;
  loadingRateEn?: string;
  muellajeTariff?: string;
  muellajeTariffEn?: string;
  restrictions?: string;
  restrictionsEn?: string;
  maneuvers?: string;
  maneuversEn?: string;
  notes: string;
  notesEn?: string;
  verificationStatus: VerificationStatus;
  pierSheet?: PierSpecificationSheet;
}

export interface ConcessionaireTerminal {
  id: string;
  name: string;
  cargoCategory: string;
  cargoCategoryEn: string;
  berthsUsed: string;
  infrastructure: string;
  infrastructureEn: string;
}

export interface ProductHandlingSpec {
  id: string;
  product: string;
  productEn: string;
  berths: string;
  dischargeRate: string;
  dischargeRateEn: string;
  muellajeTariff: string;
  muellajeTariffEn: string;
  restrictions: string;
  restrictionsEn: string;
  maneuvers: string;
  maneuversEn: string;
}

export interface StorageSummary {
  coveredSqm: number;
  openYardSqm: number;
  containerYardSqm: number;
  warehousesBreakdown: string;
  warehousesBreakdownEn: string;
}

export interface Terminal {
  id: string;
  portId: string;
  areaId: string;
  name: string;
  nameEn?: string;
  operator: string;
  shortDesc: string;
  shortDescEn: string;
  coordinates: string;
  mapX: number;
  mapY: number;
  imageUrl: string;
  cargoGroups: CargoGroup[];
  berths: Berth[];
  productSpecs?: ProductHandlingSpec[];
  concessionaires?: ConcessionaireTerminal[];
  storageSummary?: StorageSummary;
  procedures: string[];
  proceduresEn?: string[];
  restrictionsSummary: string;
  restrictionsSummaryEn?: string;
  audit: AuditInfo;
}

export interface PortArea {
  id: string;
  portId: string;
  name: string;
  nameEn: string;
  summary: string;
  summaryEn: string;
  channelDepthM: number;
  operationalDraftM: number;
  turningBasinM: number;
  daylightOnly: boolean;
  tugRequirement: string;
  tugRequirementEn?: string;
  pilotRequirement: string;
  pilotRequirementEn?: string;
  verificationStatus: VerificationStatus;
}

export interface NavigationChannel {
  id: string;
  name: string;
  nameEn?: string;
  lengthNm: number;
  widthM: number;
  channelDepthM: number;
  operationalDraftM: number;
  squatAllowanceNote: string;
  squatAllowanceNoteEn?: string;
  verificationStatus: VerificationStatus;
}

export interface PortRestriction {
  id: string;
  portId: string;
  areaId?: string;
  category: 'Física' | 'Operativa' | 'Practicaje y Remolque' | 'Seguridad y Aduana';
  title: string;
  titleEn: string;
  detail: string;
  detailEn: string;
  limitValue: string;
  verificationStatus: VerificationStatus;
  source: string;
}

export interface PhysicalRestrictionSpec {
  id: string;
  label: string;
  labelEn: string;
  value: string;
  valueEn: string;
  remarks: string;
  remarksEn: string;
  highlight?: 'default' | 'danger' | 'success' | 'warning';
}

export interface PortServiceItem {
  id: string;
  category: string;
  categoryEn: string;
  name: string;
  nameEn: string;
  detail: string;
  detailEn: string;
  available: boolean;
}

export interface StrategicHighlightItem {
  label: string;
  labelEn: string;
  value: string;
  valueEn: string;
  note?: string;
  noteEn?: string;
}

export interface PortGeneralInfo {
  geographicalNote: string;
  geographicalNoteEn: string;
  ispsLevel: string;
  utcOffset: string;
  workingHours: string;
  workingHoursEn: string;
  holidays: string;
  holidaysEn: string;
  approachNote?: string;
  approachNoteEn?: string;
  strategicHighlights?: StrategicHighlightItem[];
  diagramLeftTitle?: string;
  diagramLeftSub?: string;
  diagramLeftTitleEn?: string;
  diagramLeftSubEn?: string;
  diagramRightTitle?: string;
  diagramRightSub?: string;
  diagramRightTitleEn?: string;
  diagramRightSubEn?: string;
}

export interface TariffItem {
  id: string;
  portId: string;
  areaId: string | 'ALL';
  code: string;
  concept: string;
  conceptEn: string;
  provider: string;
  unit: TariffUnit;
  rate: number;
  currency: 'USD' | 'MXN';
  effectiveFrom: string;
  notes: string;
  notesEn?: string;
  verificationStatus: VerificationStatus;
  active: boolean;
}

export interface PdaInput {
  portId: string;
  areaId: string;
  vesselName: string;
  gt: number;
  loaM: number;
  daysAlongside: number;
  cargoTons: number;
  tugHours: number;
  usdToMxn: number;
}

export interface PdaLineItem {
  tariffId: string;
  code: string;
  concept: string;
  conceptEn: string;
  provider: string;
  unit: TariffUnit;
  quantity: number;
  unitRate: number;
  currency: 'USD' | 'MXN';
  amountOriginal: number;
  amountUsd: number;
  amountMxn: number;
  verificationStatus: VerificationStatus;
}

export interface PdaResult {
  lineItems: PdaLineItem[];
  totalUsd: number;
  totalMxn: number;
  pendingItemsCount: number;
}

export interface DirectoryEntry {
  id: string;
  portId: string;
  category: DirectoryCategory;
  organization: string;
  contactName: string;
  role: string;
  roleEn?: string;
  email: string;
  phone: string;
  accessLevel: 'Público Operativo' | 'Interno ISS' | 'Comercial Restringido';
  notes: string;
  notesEn?: string;
}

export interface OrgChartNode {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  titleEn: string;
  department: string;
  departmentEn: string;
  holderOrTeam: string;
  holderOrTeamEn?: string;
  email?: string;
  reportsTo?: string;
}

export interface OperationalProcedure {
  id: string;
  portId: string;
  phase: 'Pre-Arribo' | 'Atraque y Maniobras' | 'Operación de Carga' | 'Despacho y Zarpe';
  title: string;
  titleEn: string;
  summary: string;
  summaryEn?: string;
  steps: string[];
  stepsEn?: string[];
  requiredDocs: string[];
  requiredDocsEn?: string[];
  updatedAt: string;
}

export interface OpticConcept {
  id: string;
  code: string;
  term: string;
  termEn?: string;
  category: 'Contabilidad Portuaria' | 'Facturación PDA/FDA' | 'Cuentas de Terceros' | 'Conciliación';
  definition: string;
  definitionEn?: string;
  usageNote: string;
  usageNoteEn?: string;
}

export type OfficialPortStatus =
  | 'Abierto a toda navegación'
  | 'Cerrado a embarcaciones menores'
  | 'Cierre a embarcaciones mayores a 500 TRB'
  | 'Cerrado a toda navegación'
  | 'Restringido por Norte';

export interface WeatherStatus {
  id: string;
  portId: string;
  portStatus: OfficialPortStatus;
  windDirection: string;
  windKnots: number;
  waveHeightM: number;
  visibilityNm: string;
  visibilityNmEn?: string;
  barCurrentKnots: number;
  advisory: string;
  advisoryEn: string;
  externalWeatherUrl: string;
  lastChecked: string;
  lastCheckedEn?: string;
}

export interface PortStatusEvent {
  id: string;
  portId: string;
  status: OfficialPortStatus;
  navigationScope: string;
  navigationScopeEn: string;
  timestamp: string;
  notes?: string;
  notesEn?: string;
}

export interface AppsScriptTool {
  id: string;
  name: string;
  nameEn?: string;
  role: string;
  roleEn?: string;
  status: 'Enlace activo' | 'Pendiente de mapeo de hojas';
  url: string;
  integrationMode: 'Acceso directo' | 'Lectura progresiva';
}

export type PortRegion =
  | 'GOLFO DE MÉXICO'
  | 'MAR CARIBE'
  | 'PACÍFICO NORTE'
  | 'PACÍFICO CENTRO'
  | 'PACÍFICO SUR';

export type VesselStatus =
  | 'EXPECTED'
  | 'ANCHORED'
  | 'BERTHED'
  | 'SAILED'
  | 'CANCELLED'
  | 'UNCONFIRMED';

export interface VesselLineupEntry {
  id: string;
  portId: string;
  vesselName: string;
  imo?: string;
  terminalOrBerth: string;
  cargo: string;
  etaOrEtd: string;
  status: VesselStatus;
  agencyOrOperator: string;
  updatedAt: string;
}

export interface AnchorageZone {
  id: string;
  name: string;
  nameEn?: string;
  purpose: string;
  purposeEn?: string;
  coordinates: string;
  depthM?: string;
  maxVesselOrNotes: string;
  maxVesselOrNotesEn?: string;
  verificationStatus: VerificationStatus;
}

export interface PortProfile {
  id: string;
  shortCode: string;
  country: string;
  region: PortRegion;
  name: string;
  unLocode: string;
  state: string;
  stateEn?: string;
  coordinates: string;
  timezone: string;
  vhfChannel: string;
  authority: string;
  lineupSourceUrl: string;
  lineupConnector: string;
  operatingRulesSummary?: string;
  operatingRulesSummaryEn?: string;
  operatingRulesUrl?: string;
  heroHeadline: string;
  heroHeadlineEn: string;
  heroSubheadline: string;
  heroSubheadlineEn: string;
  overview: string;
  overviewEn: string;
  heroImageUrl: string;
  channelImageUrl: string;
  isCompleteProfile: boolean;
  channels: NavigationChannel[];
  anchorageZones?: AnchorageZone[];
  generalInfo?: PortGeneralInfo;
  physicalSpecs?: PhysicalRestrictionSpec[];
  marineServices?: PortServiceItem[];
}

export interface HubState {
  ports: PortProfile[];
  areas: PortArea[];
  terminals: Terminal[];
  restrictions: PortRestriction[];
  tariffs: TariffItem[];
  directory: DirectoryEntry[];
  orgChart?: OrgChartNode[];
  procedures: OperationalProcedure[];
  opticGlossary: OpticConcept[];
  weather: WeatherStatus[];
  statusHistory?: PortStatusEvent[];
  appsScripts: AppsScriptTool[];
  lineup: VesselLineupEntry[];
}
