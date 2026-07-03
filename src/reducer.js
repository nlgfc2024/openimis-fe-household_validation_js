// Disabled due to consistency with other modules
/* eslint-disable default-param-last */

import {
  formatServerError,
  formatGraphQLError,
  pageInfo,
} from '@openimis/fe-core';
import {
  REQUEST, SUCCESS, ERROR, CLEAR,
} from './util/action-type';

export const ACTION_TYPE = {
  // Household members list (generate validation list)
  GENERATE_VALIDATION_LIST: 'GENERATE_VALIDATION_LIST'
};

const INITIAL_STATE = {
  // Household members list
  generatingValidationLists: false,
  generatedValidationLists: false,
  validationListResult: {},
  validationListsPageInfo: {},
  validationListsTotalCount: 0,
  errorValidationLists: null,
};

function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    // -------------------------
    // Fetch household members
    // -------------------------
    case REQUEST(ACTION_TYPE.GENERATE_VALIDATION_LIST):
      return {
        ...state,
        generatingValidationLists: true,
        generatedValidationLists: false,
        validationListResult: {},
        validationListsPageInfo: {},
        validationListsTotalCount: 0,
        errorValidationLists: null,
      };

    case SUCCESS(ACTION_TYPE.GENERATE_VALIDATION_LIST):
      return {
        ...state,
        generatingValidationLists: false,
        generatedValidationLists: true,
        validationListResult: action.payload.data?.householdMember ?? {},
        validationListsPageInfo: pageInfo(action.payload.data?.householdMember),
        validationListsTotalCount: action.payload.data?.householdMember?.totalCount ?? 0,
        errorValidationLists: formatGraphQLError(action.payload),
      };

    case ERROR(ACTION_TYPE.GENERATE_VALIDATION_LIST):
      return {
        ...state,
        fetchingHouseholdMembers: false,
        errorValidationLists: formatServerError(action.payload),
      };

    case CLEAR(ACTION_TYPE.GENERATE_VALIDATION_LIST):
      return {
        ...state,
        fetchingHouseholdMembers: false,
        generatedValidationLists: false,
        householdMembers: [],
        validationListsPageInfo: {},
        validationListsTotalCount: 0,
        errorValidationLists: null,
      };

    default:
      return state;
  }
}

export default reducer;
