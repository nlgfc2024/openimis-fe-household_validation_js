import React, { useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Searcher,
  downloadExport,
  formatMessage,
  formatMessageWithValues,
  useModulesManager,
  CLEARED_STATE_FILTER,
} from '@openimis/fe-core';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Dialog, DialogActions, DialogTitle, Button } from '@material-ui/core';
import {
  fetchHouseholdMembers,
  downloadHouseholdMembers,
  clearHouseholdMembers,
  clearHouseholdMembersExport,
} from '../actions';
import {
  DEFAULT_PAGE_SIZE,
  ROWS_PER_PAGE_OPTIONS,
  RIGHT_HOUSEHOLD_VALIDATION_SEARCH,
  HOUSEHOLD_VALIDATION_MODULE_NAME,
} from '../constants';
import ValidationListFiltersPanel from './ValidationListFiltersPanel';

// Extract the village name (deepest level) from a nested location object
const getVillage = (location) => {
  let loc = location;
  let deepest = null;
  while (loc) {
    deepest = loc;
    loc = loc.parent ?? null;
  }
  return deepest?.name ?? '';
};

function ValidationListSearcher({
  intl,
  validationListsResults
}) {
  const modulesManager = useModulesManager();

  // ---- headers ----
  const headers = () => [
    `${HOUSEHOLD_VALIDATION_MODULE_NAME}.member.firstName`,
    `${HOUSEHOLD_VALIDATION_MODULE_NAME}.member.lastName`,
    `${HOUSEHOLD_VALIDATION_MODULE_NAME}.member.dob`,
    `${HOUSEHOLD_VALIDATION_MODULE_NAME}.member.microCatchment`,
    `${HOUSEHOLD_VALIDATION_MODULE_NAME}.member.hotspot`,
    `${HOUSEHOLD_VALIDATION_MODULE_NAME}.member.village`,
    `${HOUSEHOLD_VALIDATION_MODULE_NAME}.member.prospectiveProjects`,
    `${HOUSEHOLD_VALIDATION_MODULE_NAME}.member.validationStatus`,
  ];

  // ---- item formatters ----
  const itemFormatters = () => [
    (member) => member.individual?.firstName ?? '',
    (member) => member.individual?.lastName ?? '',
    (member) => member.individual?.dob ?? '',
    (member) => member.household?.microCatchment ?? '',
    (member) => {
      const v = member.household?.isHotspot;
      if (v === true) return formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.hotspot.true');
      if (v === false) return formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.hotspot.false');
      return '';
    },
    (member) => getVillage(member.individual?.location),
    (member) => (member.household?.prospectiveProjects ?? []).join(', '),
    (member) => member.household?.validationStatus ?? '',
  ];

  // ---- sorts ----
  const sorts = () => [
    ['individual_FirstName', true],
    ['individual_LastName', true],
    ['individual_Dob', true],
    ['household_MicroCatchment', true],
    ['household_IsHotspot', false],
    null, // village (computed)
    null, // prospective projects
    ['household_ValidationStatus', true],
  ];

  console.log('householdMembers in ValidationListSearcher:', validationListsResults, 'count:', validationListsResults?.length);

  return (
    <>
      <Searcher
        module={HOUSEHOLD_VALIDATION_MODULE_NAME}
        fetch={() => {}}
        items={validationListsResults}
        tableTitle={formatMessageWithValues(
          intl,
          HOUSEHOLD_VALIDATION_MODULE_NAME,
          'generateValidationList.searcherResultsTitle',
          { count: validationListsResults?.length ?? 0 },
        )}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        defaultPageSize={DEFAULT_PAGE_SIZE}
      />
    </>
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default injectIntl(connect(mapStateToProps)(ValidationListSearcher));
