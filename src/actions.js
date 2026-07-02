// Disable due to core architecture
/* eslint-disable camelcase */
import {
  graphql,
  formatPageQueryWithCount,
} from '@openimis/fe-core';
import { ACTION_TYPE } from './reducer';
import { CLEAR } from './util/action-type';

// ---------------------
// Field projections
// ---------------------

const HOUSEHOLD_MEMBER_PROJECTION = () => [
  'id',
  'individual { firstName lastName dob location { name code parent { name code parent { name code parent { name code } } } } }',
  'household { code microCatchment isHotspot prospectiveProjects validationStatus }',
  'role',
];

// ---------------------
// Queries
// ---------------------

export function fetchHouseholdMembers(params) {
  const payload = formatPageQueryWithCount('householdMember', params, HOUSEHOLD_MEMBER_PROJECTION());
  return graphql(payload, ACTION_TYPE.FETCH_HOUSEHOLD_MEMBERS);
}

// ---------------------
// Export
// ---------------------

export function downloadHouseholdMembers(params) {
  const payload = `
    {
      householdMemberExport${!!params && params.length ? `(${params.join(',')})` : ''}
    }`;
  return graphql(payload, ACTION_TYPE.HOUSEHOLD_MEMBERS_EXPORT);
}

// ---------------------
// Clear actions
// ---------------------

export const clearHouseholdMembers = () => (dispatch) => {
  dispatch({ type: CLEAR(ACTION_TYPE.FETCH_HOUSEHOLD_MEMBERS) });
};

export const clearHouseholdMembersExport = () => (dispatch) => {
  dispatch({ type: CLEAR(ACTION_TYPE.HOUSEHOLD_MEMBERS_EXPORT) });
};
