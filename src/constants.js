export const HOUSEHOLD_VALIDATION_MODULE_NAME = 'householdValidation';
export const HOUSEHOLD_VALIDATION_MAIN_MENU_CONTRIBUTION_KEY = 'householdValidation.MainMenu';
// Actions slot rendered in the header of the individual module's GroupSearcher
export const INDIVIDUAL_GROUP_MENU_CONTRIBUTION_KEY = 'individual.group.GroupMenu';

// Rights — must match the codes the BE (openimis-be-household_validation)
export const RIGHT_HOUSEHOLD_VALIDATION_SEARCH = 958001;
export const RIGHT_HOUSEHOLD_VALIDATION_GENERATE = 958001;
export const RIGHT_HOUSEHOLD_VALIDATION_UPLOAD = 958002;

// Search / Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
export const CONTAINS_LOOKUP = 'Icontains';
export const DEFAULT_DEBOUNCE_TIME = 500;
export const EMPTY_STRING = '';

// Filters that must be set before a validation list can be generated
export const REQUIRED_GENERATION_FILTERS = ['district', 'microCatchment'];

export const GENERATE_VALIDATION_LIST_RESULT_PROJECTION = [
  'batchId',
  'fileName',
  'fileBase64',
  'totalHouseholds',
  'totalIndividuals',
  'selectedHouseholds',
  'selectedIndividuals',
  'selectedFemaleHeadedHouseholds',
  'selectedYouthHouseholds',
  'reserveHouseholds',
  `villageBreakdown {
    villageId
    villageCode
    villageName
    eligibleHouseholds
    exactAllocation
    allocatedHouseholds
    selectedHouseholds
    selectedIndividuals
    reserveHouseholds
  }`,
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

export const UPLOAD_VALIDATION_LIST_RESULT_PROJECTION = [
  'batchId',
  'uploadAttemptId',
  'rowsRead',
  'householdsVerified',
  'householdsNotVerified',
  'participantUpdates',
  'householdsWithMultiplePrimaryWorkers',
  'errors',
  'errorMessages',
];
