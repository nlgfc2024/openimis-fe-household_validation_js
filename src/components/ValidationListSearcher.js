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
  rights,
  fetchHouseholdMembers,
  downloadHouseholdMembers,
  clearHouseholdMembers,
  clearHouseholdMembersExport,
  fetchingHouseholdMembers,
  fetchedHouseholdMembers,
  errorHouseholdMembers,
  householdMembers,
  householdMembersPageInfo,
  householdMembersTotalCount,
  householdMembersExport,
  errorHouseholdMembersExport,
}) {
  const modulesManager = useModulesManager();
  const [failedExport, setFailedExport] = useState(false);
  const [appliedCustomFilters, setAppliedCustomFilters] = useState([CLEARED_STATE_FILTER]);
  const [appliedFiltersRowStructure, setAppliedFiltersRowStructure] = useState([CLEARED_STATE_FILTER]);

  const fetch = (params) => fetchHouseholdMembers(params);

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

  // ---- export handling ----
  useEffect(() => {
    if (errorHouseholdMembersExport) {
      setFailedExport(true);
    }
  }, [errorHouseholdMembersExport]);

  useEffect(() => {
    if (householdMembersExport) {
      downloadExport(
        householdMembersExport,
        `${formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'export.filename')}.csv`,
      )();
      clearHouseholdMembersExport();
    }
    return () => setFailedExport(false);
  }, [householdMembersExport]);

  const filterPane = (props) => (
    <ValidationListFiltersPanel
      intl={props.intl}
      classes={props.classes}
      filters={props.filters}
      onChangeFilters={props.onChangeFilters}
    />
  );

  return (
    <>
      <Searcher
        module={HOUSEHOLD_VALIDATION_MODULE_NAME}
        FilterPane={filterPane}
        fetch={fetch}
        items={householdMembers}
        itemsPageInfo={householdMembersPageInfo}
        fetchingItems={fetchingHouseholdMembers}
        fetchedItems={fetchedHouseholdMembers}
        errorItems={errorHouseholdMembers}
        tableTitle={formatMessageWithValues(
          intl,
          HOUSEHOLD_VALIDATION_MODULE_NAME,
          'generateValidationList.searcherResultsTitle',
          { count: householdMembersTotalCount },
        )}
        exportable
        exportFetch={downloadHouseholdMembers}
        exportFields={[
          'individual.first_name',
          'individual.last_name',
          'individual.dob',
          'household.micro_catchment',
          'household.is_hotspot',
          'individual.location.name',
          'household.prospective_projects',
          'household.validation_status',
        ]}
        exportFieldsColumns={{
          individual__first_name: formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'export.firstName'),
          individual__last_name: formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'export.lastName'),
          individual__dob: formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'export.dob'),
          household__micro_catchment: formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'export.microCatchment'),
          household__is_hotspot: formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'export.hotspot'),
          individual__location__name: formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'export.village'),
          household__prospective_projects: formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'export.prospectiveProjects'),
          household__validation_status: formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'export.validationStatus'),
        }}
        exportFieldLabel={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'export.label')}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        defaultPageSize={DEFAULT_PAGE_SIZE}
        cacheFiltersKey="householdValidationListFilterCache"
        appliedCustomFilters={appliedCustomFilters}
        setAppliedCustomFilters={setAppliedCustomFilters}
        appliedFiltersRowStructure={appliedFiltersRowStructure}
        setAppliedFiltersRowStructure={setAppliedFiltersRowStructure}
      />
      {failedExport && (
        <Dialog open={failedExport} fullWidth maxWidth="sm">
          <DialogTitle>{formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'export.label')}</DialogTitle>
          <DialogActions>
            <Button onClick={() => setFailedExport(false)} color="primary">
              {formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'dialog.close')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
  fetchingHouseholdMembers: state.householdValidation?.fetchingHouseholdMembers,
  fetchedHouseholdMembers: state.householdValidation?.fetchedHouseholdMembers,
  householdMembers: state.householdValidation?.householdMembers ?? [],
  householdMembersPageInfo: state.householdValidation?.householdMembersPageInfo ?? {},
  householdMembersTotalCount: state.householdValidation?.householdMembersTotalCount ?? 0,
  errorHouseholdMembers: state.householdValidation?.errorHouseholdMembers,
  householdMembersExport: state.householdValidation?.householdMembersExport,
  errorHouseholdMembersExport: state.householdValidation?.errorHouseholdMembersExport,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  {
    fetchHouseholdMembers,
    downloadHouseholdMembers,
    clearHouseholdMembers,
    clearHouseholdMembersExport,
  },
  dispatch,
);

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(ValidationListSearcher));
