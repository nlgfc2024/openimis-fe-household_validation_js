// Disable due to core architecture
/* eslint-disable camelcase */
import { 
  graphqlMutation, 
  graphql,
} from '@openimis/fe-core';
import { ACTION_TYPE } from './reducer';
import { REQUEST, SUCCESS, ERROR, CLEAR } from './util/action-type';

// ---------------------
// Mutations
// ---------------------

const GENERATE_HOUSEHOLD_VALIDATION_LIST_MUTATION = `
  mutation generateHouseholdValidationList(
    $regionId: Int,
    $regionCode: String,
    $districtId: Int,
    $districtCode: String,
    $taId: Int,
    $taCode: String,
    $villageId: Int,
    $villageCode: String,
    $hotspotId: String,
    $hotspotCode: String,
    $catchmentId: String,
    $catchmentCode: String,
    $excludeVerifiedAfter: Date,
    $targetCount: Int,
    $femaleHeadedPercentage: Int,
    $youthPercentage: Int,
    $reservePercentage: Int
  ) {
    generateHouseholdValidationList(
      regionId: $regionId,
      regionCode: $regionCode,
      districtId: $districtId,
      districtCode: $districtCode,
      taId: $taId,
      taCode: $taCode,
      villageId: $villageId,
      villageCode: $villageCode,
      hotspotId: $hotspotId,
      hotspotCode: $hotspotCode,
      catchmentId: $catchmentId,
      catchmentCode: $catchmentCode,
      excludeVerifiedAfter: $excludeVerifiedAfter,
      targetCount: $targetCount,
      femaleHeadedPercentage: $femaleHeadedPercentage,
      youthPercentage: $youthPercentage,
      reservePercentage: $reservePercentage
    ) {
      batchId
      fileName
      fileBase64
      householdsSelected
      reserveHouseholds
      memberRows
    }
  }
`;

// Transform frontend filter format to backend mutation variables
function buildGenerateValidationListVariables(filters) {
  const vars = {};
  
  // Extract location codes
  if (filters?.location) {
    if (filters.location.regionCode) vars.regionCode = filters.location.regionCode;
    if (filters.location.districtCode) vars.districtCode = filters.location.districtCode;
    if (filters.location.taCode) vars.taCode = filters.location.taCode;
    if (filters.location.villageCode) vars.villageCode = filters.location.villageCode;
  }
  
  // Hotspot and catchment
  if (filters?.hotspotCode) vars.hotspotCode = filters.hotspotCode;
  if (filters?.catchmentCode) vars.catchmentCode = filters.catchmentCode;
  
  // Dates
  if (filters?.excludeVerifiedAfter) vars.excludeVerifiedAfter = filters.excludeVerifiedAfter;
  
  // Percentages
  if (filters?.femaleHeadedPercentage !== null && filters?.femaleHeadedPercentage !== undefined) {
    vars.femaleHeadedPercentage = parseInt(filters.femaleHeadedPercentage, 10);
  }
  if (filters?.youthPercentage !== null && filters?.youthPercentage !== undefined) {
    vars.youthPercentage = parseInt(filters.youthPercentage, 10);
  }
  if (filters?.reservedPercentage !== null && filters?.reservedPercentage !== undefined) {
    vars.reservePercentage = parseInt(filters.reservedPercentage, 10);
  }
  
  // Target count
  if (filters?.targetCount !== null && filters?.targetCount !== undefined) {
    vars.targetCount = parseInt(filters.targetCount, 10);
  }
  
  return vars;
}

export function generateValidationList(filters) {
  const variables = buildGenerateValidationListVariables(filters);
  return graphqlMutation(
    GENERATE_HOUSEHOLD_VALIDATION_LIST_MUTATION,
    variables,
    ACTION_TYPE.GENERATE_VALIDATION_LIST,
  );
}

// ---------------------
// Queries
// ---------------------

const HOUSEHOLD_VALIDATION_SUMMARY_QUERY = `
  query householdValidationSummary(
    $regionId: Int,
    $regionCode: String,
    $districtId: Int,
    $districtCode: String,
    $taId: Int,
    $taCode: String,
    $villageId: Int,
    $villageCode: String,
    $hotspotId: String,
    $hotspotCode: String,
    $catchmentId: String,
    $catchmentCode: String,
    $excludeVerifiedAfter: Date,
    $targetCount: Int,
    $femaleHeadedPercentage: Int,
    $youthPercentage: Int,
    $reservePercentage: Int
  ) {
    householdValidationSummary(
      regionId: $regionId,
      regionCode: $regionCode,
      districtId: $districtId,
      districtCode: $districtCode,
      taId: $taId,
      taCode: $taCode,
      villageId: $villageId,
      villageCode: $villageCode,
      hotspotId: $hotspotId,
      hotspotCode: $hotspotCode,
      catchmentId: $catchmentId,
      catchmentCode: $catchmentCode,
      excludeVerifiedAfter: $excludeVerifiedAfter,
      targetCount: $targetCount,
      femaleHeadedPercentage: $femaleHeadedPercentage,
      youthPercentage: $youthPercentage,
      reservePercentage: $reservePercentage
    ) {
      totalHouseholds
      totalIndividuals
      eligibleHouseholds
      eligibleIndividuals
      selectedHouseholds
      selectedIndividuals
      selectedFemaleHeadedHouseholds
      selectedYouthHouseholds
      selectedOtherHouseholds
      reserveHouseholds
      mainHouseholds
      generatedAt
    }
  }
`;

const HOUSEHOLD_VALIDATION_PREVIEW_QUERY = `
  query householdValidationPreview(
    $first: Int,
    $offset: Int,
    $orderBy: String,
    $regionId: Int,
    $regionCode: String,
    $districtId: Int,
    $districtCode: String,
    $taId: Int,
    $taCode: String,
    $villageId: Int,
    $villageCode: String,
    $hotspotId: String,
    $hotspotCode: String,
    $catchmentId: String,
    $catchmentCode: String,
    $excludeVerifiedAfter: Date,
    $targetCount: Int,
    $femaleHeadedPercentage: Int,
    $youthPercentage: Int,
    $reservePercentage: Int
  ) {
    householdValidationPreview(
      first: $first,
      offset: $offset,
      orderBy: $orderBy,
      regionId: $regionId,
      regionCode: $regionCode,
      districtId: $districtId,
      districtCode: $districtCode,
      taId: $taId,
      taCode: $taCode,
      villageId: $villageId,
      villageCode: $villageCode,
      hotspotId: $hotspotId,
      hotspotCode: $hotspotCode,
      catchmentId: $catchmentId,
      catchmentCode: $catchmentCode,
      excludeVerifiedAfter: $excludeVerifiedAfter,
      targetCount: $targetCount,
      femaleHeadedPercentage: $femaleHeadedPercentage,
      youthPercentage: $youthPercentage,
      reservePercentage: $reservePercentage
    ) {
      edges {
        node {
          rowType
          category
          groupUuid
          groupCode
          headName
          individualUuid
          individualFirstName
          individualLastName
          individualDob
          individualAge
          individualGender
          fitForWork
          currentRecipientType
          region
          district
          municipality
          village
          wealthQuintile
          lastVerifiedDate
          validationStatus
          prospectiveProjects
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export function fetchHouseholdValidationSummary(filters) {
  const variables = buildGenerateValidationListVariables(filters);
  return graphql(
    HOUSEHOLD_VALIDATION_SUMMARY_QUERY,
    variables,
    [
      REQUEST(ACTION_TYPE.FETCH_VALIDATION_SUMMARY),
      SUCCESS(ACTION_TYPE.FETCH_VALIDATION_SUMMARY),
      ERROR(ACTION_TYPE.FETCH_VALIDATION_SUMMARY),
    ],
  );
}

export function fetchHouseholdValidationPreview(filters, pageSize = 10, offset = 0) {
  const variables = {
    ...buildGenerateValidationListVariables(filters),
    first: pageSize,
    offset,
  };
  return graphql(
    HOUSEHOLD_VALIDATION_PREVIEW_QUERY,
    variables,
    [
      REQUEST(ACTION_TYPE.FETCH_VALIDATION_PREVIEW),
      SUCCESS(ACTION_TYPE.FETCH_VALIDATION_PREVIEW),
      ERROR(ACTION_TYPE.FETCH_VALIDATION_PREVIEW),
    ],
  );
}

// ---------------------
// Clear actions
// ---------------------

export const clearValidationLists = () => (dispatch) => {
  dispatch({ type: CLEAR(ACTION_TYPE.GENERATE_VALIDATION_LIST) });
};

export const clearValidationSummary = () => (dispatch) => {
  dispatch({ type: CLEAR(ACTION_TYPE.FETCH_VALIDATION_SUMMARY) });
};

export const clearValidationPreview = () => (dispatch) => {
  dispatch({ type: CLEAR(ACTION_TYPE.FETCH_VALIDATION_PREVIEW) });
};