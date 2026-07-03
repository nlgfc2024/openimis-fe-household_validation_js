// Disable due to core architecture
/* eslint-disable camelcase */
import { 
  graphqlMutation, 
  graphql,
  formatMutation,
  formatGQLString,
} from '@openimis/fe-core';
import { ACTION_TYPE } from './reducer';
import { REQUEST, SUCCESS, ERROR, CLEAR } from './util/action-type';

// ---------------------
// Mutations
// ---------------------
// function buildGenerateValidationListMutationInput(filters) {
//   // Map an in-memory form object to the camelCased input fields exposed by the backend
//   const input = [];
//   if (filters?.location?.regionCode) input.push(`regionCode: "${formatGQLString(filters.location.regionCode)}"`);
//   if (filters?.location?.districtCode) input.push(`districtCode: "${formatGQLString(filters.location.districtCode)}"`);
//   if (filters?.location?.taCode) input.push(`taCode: "${formatGQLString(filters.location.taCode)}"`);
//   if (filters?.location?.villageCode) input.push(`villageCode: "${formatGQLString(filters.location.villageCode)}"`);
//   if (filters?.catchmentCode) input.push(`catchmentCode: "${formatGQLString(filters.catchmentCode)}"`);
//   if (filters?.femaleHeadedPercentage) input.push(`femaleHeadedPercentage: ${filters.femaleHeadedPercentage}`);
//   if (filters?.youthPercentage) input.push(`youthPercentage: ${filters.youthPercentage}`);
//   if (filters?.reservedPercentage) input.push(`reservedPercentage: ${filters.reservedPercentage}`);
//   return input.join(', ');
// }

// export function generateValidationList(filters) {
//   const input = buildGenerateValidationListMutationInput(filters);
//   const mutation = formatMutation('generateHouseholdValidationList', input);
//   const requestedDateTime = new Date();
//   return graphql(
//     mutation.payload,
//     [
//       REQUEST(ACTION_TYPE.GENERATE_VALIDATION_LIST), 
//       SUCCESS(ACTION_TYPE.GENERATE_VALIDATION_LIST), 
//       ERROR(ACTION_TYPE.GENERATE_VALIDATION_LIST)
//     ],
//     {
//       actionType: ACTION_TYPE.GENERATE_VALIDATION_LIST,
//       // clientMutationId: mutation.clientMutationId,
//       // clientMutationLabel: mutation.clientMutationLabel,
//       // requestedDateTime,
//     },
//   );
// }

const GENERATE_HOUSEHOLD_VALIDATION_LIST_MUTATION = `
  mutation generateHouseholdValidationList($input: HouseholdValidationGenerateResult!) {
    generateHouseholdValidationList(input: $input) {
      batch_id
      file_name
      file_base64
      households_selected
      reserve_households
      members_roles
    }
  }
`;

export function generateValidationList(params) {
  return graphqlMutation(
    GENERATE_HOUSEHOLD_VALIDATION_LIST_MUTATION,
    { input: params },
    ACTION_TYPE.GENERATE_VALIDATION_LIST
  );
}

// ---------------------
// Clear actions
// ---------------------

export const clearValidationLists = () => (dispatch) => {
  dispatch({ type: CLEAR(ACTION_TYPE.GENERATE_VALIDATION_LIST) });
};