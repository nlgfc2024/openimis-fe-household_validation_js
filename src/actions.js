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
  'batch_id',
  'file_name',
  'file_base64',
  'households_selected',
  'reserve_households',
  'members_roles'
];

// ---------------------
// Queries
// ---------------------

export function generateValidationList(params) {
  const payload = formatPageQueryWithCount(
    'generateHouseholdValidationList', 
    params, 
    HOUSEHOLD_MEMBER_PROJECTION()
  );
  return graphql(payload, ACTION_TYPE.GENERATE_VALIDATION_LIST);
}

// ---------------------
// Clear actions
// ---------------------

export const clearValidationLists = () => (dispatch) => {
  dispatch({ type: CLEAR(ACTION_TYPE.GENERATE_VALIDATION_LIST) });
};