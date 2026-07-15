export const HOUSEHOLD_VALIDATION_MODULE_NAME = 'householdValidation';
export const HOUSEHOLD_VALIDATION_MAIN_MENU_CONTRIBUTION_KEY = 'householdValidation.MainMenu';

// Rights
export const RIGHT_HOUSEHOLD_VALIDATION_SEARCH = 953001;
export const RIGHT_HOUSEHOLD_VALIDATION_GENERATE = 953002;

// Search / Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
export const CONTAINS_LOOKUP = 'Icontains';
export const DEFAULT_DEBOUNCE_TIME = 500;
export const EMPTY_STRING = '';

// Hotspot areas — stub list pending official hotspot register
export const HOTSPOT_OPTIONS = [
  'Shire Highlands',
  'Lower Shire Valley',
  'Lakeshore Plains',
  'Dzalanyama Forest Zone',
  'Phalombe Plain',
  'Thyolo Escarpment',
  'Viphya Plateau',
  'Karonga Lakeshore',
  'Nkhotakota Wildlife Corridor',
  'Mwanza Flood Plain',
];

// Micro-catchment areas — stub list pending official micro-catchment registry
export const MICRO_CATCHMENT_OPTIONS = [
  'Mvera Cluster',
  'Linthipe Basin',
  'Mpira Escarpment',
  'Neno Valley North',
  'Makanjira Belt',
  'Kasungu Ridge',
  'Nkhatabay South Shore',
  'Chingale Plains',
  'Mponela East Block',
  'Zomba Peri-Urban Ring',
];

export const GENERATE_VALIDATION_LIST_RESULT_PROJECTION = [
  'batchId',
  'fileName',
  'fileBase64',
  'householdsSelected',
  'reserveHouseholds',
  'memberRows',
];

export const VALIDATION_PREVIEW_PROJECTION = [
  'rowType',
  'category',
  'groupUuid',
  'groupCode',
  'headName',
  'individualUuid',
  'individualFirstName',
  'individualLastName',
  'individualDob',
  'individualAge',
  'individualGender',
  'fitForWork',
  'currentRecipientType',
  'region',
  'district',
  'municipality',
  'village',
  'wealthQuintile',
  'lastVerifiedDate',
  'validationStatus',
  'prospectiveProjects',
];

export const VALIDATION_SUMMARY_PROJECTION = [
  'totalHouseholds',
  'totalIndividuals',
  'eligibleHouseholds',
  'eligibleIndividuals',
  'selectedHouseholds',
  'selectedIndividuals',
  'selectedFemaleHeadedHouseholds',
  'selectedYouthHouseholds',
  'selectedOtherHouseholds',
  'reserveHouseholds',
  'mainHouseholds',
  'generatedAt',
];
