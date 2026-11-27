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
  subdivision?: string;
  subdivisionEn?: string;
  imageUrl?: string;
  coordinates?: string;
  cargoCategory: string;
  cargoCategoryEn: string;
  berthsUsed: string;
  connectionSpecs?: string;
  connectionSpecsEn?: string;
  dischargeMethod?: string;
  dischargeMethodEn?: string;
  storageCapacity?: string;
  storageCapacityEn?: string;
  productsList?: string[];
  infrastructure: string;
  infrastructureEn: string;
  restrictions?: string;
  restrictionsEn?: string;
  procedures?: string[];
  proceduresEn?: string[];
  auditSource?: string;
}

export interface ProductTechnicalDossier {
  id: string;
  portId: string;
  code: string;
  name: string;
  nameEn: string;
  cargoGroup: CargoGroup;
  unNumber: string;
  imoClass: string;
  casNumber?: string;
  flashPoint?: string;
  flashPointEn?: string;
  nfpa704?: string;
  hdsPemexSummary?: string;
  hdsPemexSummaryEn?: string;
  ppeRequired?: string;
  ppeRequiredEn?: string;
  coatzacoalcosBerths: string;
  concessionaires: string;
  summary: string;
  summaryEn: string;
  identity: string;
  identityEn: string;
  stateAndHazard: string;
  stateAndHazardEn: string;
  compatibility: string;
  compatibilityEn: string;
  qualityControl: string;
  qualityControlEn: string;
  temperatureLimits: string;
  temperatureLimitsEn: string;
  connectionSpecs: string;
  connectionSpecsEn: string;
  transferRates: string;
  transferRatesEn: string;
  stabilityControl: string;
  stabilityControlEn: string;
  terminationProcedure: string;
  terminationProcedureEn: string;
  rejectionCriteria: string;
  rejectionCriteriaEn: string;
  referenceSource: string;
  verificationStatus: VerificationStatus;
}

export interface TariffSheetSyncConfig {
  sheetUrl: string;
  lastSyncedAt?: string;
  lastRowCount?: number;
  mode: 'google_sheet' | 'apps_script' | 'manual_csv';
  notes?: string;
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

export interface TerminalCommercialProfile {
  positioningHeadline: string;
  positioningHeadlineEn: string;
  address?: string;
  customsRegime: string;
  customsRegimeEn: string;
  commercialServices: string[];
  commercialServicesEn: string[];
  infrastructureHighlights: string[];
  infrastructureHighlightsEn: string[];
  vesselTypesServed: string[];
  vesselTypesServedEn: string[];
  connectivity: string;
  connectivityEn: string;
  customsProcess?: string[];
  customsProcessEn?: string[];
  operationalAdvantages: string[];
  operationalAdvantagesEn: string[];
  keyClientsOrTrades?: string[];
  certifications?: string[];
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
  commercialProfile?: TerminalCommercialProfile;
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
  documentLinks?: AuthorityFormatLink[];
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

export type PdaVesselType =
  | 'Tanker / Chemical'
  | 'Crude / Aframax'
  | 'Gas Carrier (LPG/Ethane)'
  | 'Dry Bulk'
  | 'General Cargo / Steel'
  | 'Container'
  | 'Rail Ferry'
  | 'Offshore';

export type PdaPurpose =
  | 'DISCHARGE'
  | 'LOAD'
  | 'LOAD & DISCHARGE'
  | 'BUNKERING'
  | 'CREW CHANGE'
  | 'REPAIRS'
  | 'ANCHORAGE';

export type PdaChargeSection = 'port' | 'crew' | 'husbandry' | 'agency';

export type PdaFormulaType =
  | 'standard'
  | 'port_dues_hybrid'
  | 'dockage_loa_hours'
  | 'pilotage_gt_movements'
  | 'towage_tugs'
  | 'agency_extra_days'
  | 'flat_with_vat'
  | 'sub_items_breakdown'
  | 'custom_expression';

export type PdaSubItemCalcMode =
  | 'fixed'
  | 'per_qty'
  | 'grt_rate'
  | 'loa_hrs'
  | 'grt_mov'
  | 'tug_hrs';

export interface PdaSubItemDef {
  id: string;
  code?: string;
  label: string;
  labelEn: string;
  unitLabel?: string;
  rate: number;
  calcMode: PdaSubItemCalcMode;
  defaultQty: number;
  defaultIncluded?: boolean;
  notes?: string;
}

export interface PdaCustomField {
  id: string;
  label: string;
  value: string;
  column: 'left' | 'right';
  active: boolean;
}

export interface PdaFormatPreset {
  id: string;
  portId: string | 'ALL';
  name: string;
  nameEn: string;
  vesselType: PdaVesselType;
  purpose: PdaPurpose;
  defaultCargo: string;
  defaultQuantity: number;
  defaultOpsRateMtHr: number;
  defaultTugsCount: number;
  defaultTugHours: number;
  defaultMovements: number;
  defaultAreaId?: string;
  customFields?: PdaCustomField[];
  notes?: string;
}

export interface PdaOfficeAndBankProfile {
  officeTitle: string;
  addressLine1: string;
  addressLine2: string;
  telephone: string;
  emails: string[];
  bankTitle: string;
  bankName: string;
  bankAddress: string;
  accountNo: string;
  swiftNumber: string;
  currencyLabel: string;
  accountOwner: string;
  remittanceNotice: string;
  disclaimerText: string;
  billingNoteText: string;
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
  chargeSection?: PdaChargeSection;
  formulaType?: PdaFormulaType;
  customFormula?: string;
  baseFixed?: number;
  vatRate?: number;
  movements?: number;
  tugsCount?: number;
  includedDays?: number;
  applicableVesselTypes?: PdaVesselType[] | 'ALL';
  applicablePurposes?: PdaPurpose[] | 'ALL';
  remarksTemplate?: string;
  showZeroAmount?: boolean;
  subItems?: PdaSubItemDef[];
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
  principal?: string;
  invoiceNumber?: string;
  purpose?: PdaPurpose;
  vesselType?: PdaVesselType;
  cargoDescription?: string;
  dwt?: number;
  beamM?: number;
  opsRateMtHr?: number;
  portStayHours?: number;
  eta?: string;
  tugsCount?: number;
  movements?: number;
  customFields?: PdaCustomField[];
  inactiveFieldKeys?: string[];
  excludedTariffIds?: string[];
  serviceSubQuantities?: Record<string, Record<string, number>>;
  tariffSectionOverrides?: Record<string, PdaChargeSection>;
  tariffRateOverrides?: Record<
    string,
    { rate?: number; vatRate?: number; subRates?: Record<string, number> }
  >;
}

export interface PdaLineItemSubBreakdown {
  id: string;
  label: string;
  labelEn: string;
  unitLabel?: string;
  calcMode: PdaSubItemCalcMode;
  qty: number;
  unitRate: number;
  subtotalOriginal: number;
  subtotalUsd: number;
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
  chargeSection: PdaChargeSection;
  originalChargeSection?: PdaChargeSection;
  remarks: string;
  vatAmountUsd?: number;
  subBreakdown?: PdaLineItemSubBreakdown[];
}

export interface PdaResult {
  lineItems: PdaLineItem[];
  totalUsd: number;
  totalMxn: number;
  portChargesTotalUsd: number;
  crewChargesTotalUsd: number;
  husbandryChargesTotalUsd: number;
  agencyChargesTotalUsd: number;
  effectivePortStayHours: number;
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

export interface OrgCustomField {
  id: string;
  label: string;
  value: string;
}

export interface OrgSubDepartment {
  id: string;
  name: string;
  nameEn?: string;
  leadOrTeam: string;
  leadOrTeamEn?: string;
  email?: string;
  fields?: OrgCustomField[];
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
  subDepartments?: OrgSubDepartment[];
  customFields?: OrgCustomField[];
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

export type AuthorityAgency =
  | 'Aduana'
  | 'ASIPONA'
  | 'Capitanía de Puerto'
  | 'INM'
  | 'Sanidad Internacional'
  | 'SENASICA';

export interface AuthorityFormatLink {
  id: string;
  label: string;
  labelEn?: string;
  url: string;
  docType?: string;
}

export interface AuthorityDocumentRow {
  code?: string;
  name: string;
  nameEn?: string;
  timingOrFormat?: string;
  timingOrFormatEn?: string;
  notes?: string;
  notesEn?: string;
}

export interface AuthorityDocumentGroup {
  id: string;
  title: string;
  titleEn: string;
  rows: AuthorityDocumentRow[];
}

export interface AuthorityRequirement {
  id: string;
  agency: AuthorityAgency;
  portId: string | 'ALL';
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  newCircularNotice?: string;
  newCircularNoticeEn?: string;
  effectiveDate: string;
  requiredDocuments: string[];
  requiredDocumentsEn?: string[];
  documentGroups?: AuthorityDocumentGroup[];
  restrictions: string;
  restrictionsEn?: string;
  driveFolderUrl?: string;
  formatLinks: AuthorityFormatLink[];
  updatedAt: string;
}

export interface PdaHistoryRecord {
  id: string;
  monthKey: string;
  createdAt: string;
  updatedAt: string;
  filename: string;
  portId: string;
  areaId: string;
  vesselName: string;
  vesselType: PdaVesselType;
  purpose: PdaPurpose;
  cargoDescription: string;
  cargoTons: number;
  totalUsd: number;
  totalMxn: number;
  input: PdaInput;
  notes?: string;
}

export interface CrewChangeChecklistRow {
  id: string;
  item: string;
  itemEn: string;
  onSigner: string;
  offSigner: string;
}

export interface CrewChangeGuideConfig {
  title: string;
  subtitle: string;
  entryAdvisory: string;
  visaExemptNotes: string[];
  qualifyingAlternatives: string[];
  usC1d1Focus: string[];
  airArrivalMandatoryDocs: string[];
  riskAdvisoryBullets: string[];
  requiredDocsList: string[];
  minimumLeadTimeNotice: string;
  onSignerSteps: string[];
  offSignerSteps: string[];
  workingHoursBullets: string[];
  customsBaggageBullets: string[];
  customsBaggageFootnote: string;
  checklistRows: CrewChangeChecklistRow[];
  appendixIntro: string;
  appendixAC: string[];
  appendixDM: string[];
  appendixNZ: string[];
  officeAddress: string;
  regionalPhone: string;
  keyPersonnel: string[];
  emailDirectory: string[];
  officialPortals: { label: string; url: string }[];
  disclaimer: string;
  updatedAt: string;
}

export interface SparePartsTimelineRow {
  id: string;
  label: string;
  labelEn: string;
  duration: string;
}

export interface SparePartsProcedureConfig {
  title: string;
  subtitle: string;
  importationNoticeTitle: string;
  importationNoticeTitleEn: string;
  importationNotice: string;
  importationNoticeEn: string;
  consigneeFormulation: string;
  itemizedListingNote: string;
  detailedExplanationNote: string;
  smallPackageRouting: string;
  largePackageRouting: string;
  timelines: SparePartsTimelineRow[];
  customsHoursNote: string;
  restrictedItemsCol1: string[];
  restrictedItemsCol2: string[];
  preApprovalNote: string;
  invoiceAddressFootnote: string;
  officeCompany: string;
  officeAddress: string;
  officePhones: string;
  officeWebsite: string;
  legalFooter: string;
  updatedAt: string;
}

export interface HubState {
  ports: PortProfile[];
  areas: PortArea[];
  terminals: Terminal[];
  restrictions: PortRestriction[];
  tariffs: TariffItem[];
  tariffSheetSync?: TariffSheetSyncConfig;
  pdaFormats?: PdaFormatPreset[];
  pdaOfficeProfile?: PdaOfficeAndBankProfile;
  pdaDriveFolderUrl?: string;
  pdaHistory?: PdaHistoryRecord[];
  productDossiers?: ProductTechnicalDossier[];
  authorities?: AuthorityRequirement[];
  authoritiesDriveFolderUrl?: string;
  servicesDriveFolderUrl?: string;
  crewChangeProcedure?: CrewChangeGuideConfig;
  sparePartsProcedure?: SparePartsProcedureConfig;
  directory: DirectoryEntry[];
  orgChart?: OrgChartNode[];
  procedures: OperationalProcedure[];
  opticGlossary: OpticConcept[];
  weather: WeatherStatus[];
  statusHistory?: PortStatusEvent[];
  appsScripts: AppsScriptTool[];
  lineup: VesselLineupEntry[];
}
