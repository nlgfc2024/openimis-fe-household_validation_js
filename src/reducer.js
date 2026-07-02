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
  FETCH_HOUSEHOLD_MEMBERS: 'HOUSEHOLD_VALIDATION_FETCH_MEMBERS',
  HOUSEHOLD_MEMBERS_EXPORT: 'HOUSEHOLD_VALIDATION_MEMBERS_EXPORT',
};

const INITIAL_STATE = {
  // Household members list
  fetchingHouseholdMembers: false,
  fetchedHouseholdMembers: false,
  householdMembers: [],
  householdMembersPageInfo: {},
  householdMembersTotalCount: 0,
  errorHouseholdMembers: null,

  // Export
  fetchingHouseholdMembersExport: false,
  fetchedHouseholdMembersExport: false,
  householdMembersExport: null,
  householdMembersExportPageInfo: {},
  errorHouseholdMembersExport: null,
};

function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    // -------------------------
    // Fetch household members
    // -------------------------
    case REQUEST(ACTION_TYPE.FETCH_HOUSEHOLD_MEMBERS):
      return {
        ...state,
        fetchingHouseholdMembers: true,
        fetchedHouseholdMembers: false,
        householdMembers: [],
        householdMembersPageInfo: {},
        householdMembersTotalCount: 0,
        errorHouseholdMembers: null,
      };

    case SUCCESS(ACTION_TYPE.FETCH_HOUSEHOLD_MEMBERS):
      return {
        ...state,
        fetchingHouseholdMembers: false,
        fetchedHouseholdMembers: true,
        householdMembers: action.payload.data?.householdMember?.edges?.map((e) => e.node) ?? [],
        householdMembersPageInfo: pageInfo(action.payload.data?.householdMember),
        householdMembersTotalCount: action.payload.data?.householdMember?.totalCount ?? 0,
        errorHouseholdMembers: formatGraphQLError(action.payload),
      };

    case ERROR(ACTION_TYPE.FETCH_HOUSEHOLD_MEMBERS):
      return {
        ...state,
        fetchingHouseholdMembers: false,
        errorHouseholdMembers: formatServerError(action.payload),
      };

    case CLEAR(ACTION_TYPE.FETCH_HOUSEHOLD_MEMBERS):
      return {
        ...state,
        fetchingHouseholdMembers: false,
        fetchedHouseholdMembers: false,
        householdMembers: [],
        householdMembersPageInfo: {},
        householdMembersTotalCount: 0,
        errorHouseholdMembers: null,
      };

    // -------------------------
    // Export household members
    // -------------------------
    case CLEAR(ACTION_TYPE.HOUSEHOLD_MEMBERS_EXPORT):
      return {
        ...state,
        fetchingHouseholdMembersExport: false,
        fetchedHouseholdMembersExport: false,
        householdMembersExport: null,
        householdMembersExportPageInfo: {},
        errorHouseholdMembersExport: null,
      };

    case REQUEST(ACTION_TYPE.HOUSEHOLD_MEMBERS_EXPORT):
      return {
        ...state,
        fetchingHouseholdMembersExport: true,
        fetchedHouseholdMembersExport: false,
        householdMembersExport: null,
        householdMembersExportPageInfo: {},
        errorHouseholdMembersExport: null,
      };

    case SUCCESS(ACTION_TYPE.HOUSEHOLD_MEMBERS_EXPORT):
      return {
        ...state,
        fetchingHouseholdMembersExport: false,
        fetchedHouseholdMembersExport: true,
        householdMembersExport: action.payload.data.householdMemberExport,
        householdMembersExportPageInfo: pageInfo(action.payload.data.householdMemberExport),
        errorHouseholdMembersExport: formatGraphQLError(action.payload),
      };

    case ERROR(ACTION_TYPE.HOUSEHOLD_MEMBERS_EXPORT):
      return {
        ...state,
        fetchingHouseholdMembersExport: false,
        errorHouseholdMembersExport: formatServerError(action.payload),
      };

    default:
      return state;
  }
}

export default reducer;
