import React from 'react';
import { injectIntl } from 'react-intl';
import {
  Searcher,
  formatMessageWithValues,
  useModulesManager,
} from '@openimis/fe-core';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  DEFAULT_PAGE_SIZE,
  ROWS_PER_PAGE_OPTIONS,
  HOUSEHOLD_VALIDATION_MODULE_NAME,
} from '../constants';
import { fetchHouseholdValidationPreview } from '../actions';

// Our `householdValidationPreview` query is offset-paginated (not a Relay connection), but its
// pageInfo cursors are literal stringified offsets, so we can parse the cursor/first/last params
// the generic Searcher builds and translate them back into an offset + page size.
const paramsToOffsetAndPageSize = (params) => {
  const paramsArr = Array.isArray(params) ? params : [];
  let pageSize = DEFAULT_PAGE_SIZE;
  let afterCursor = null;
  let beforeCursor = null;

  paramsArr.forEach((param) => {
    const firstMatch = /^first:\s*(\d+)$/.exec(param);
    const lastMatch = /^last:\s*(\d+)$/.exec(param);
    const afterMatch = /^after:\s*"([^"]*)"$/.exec(param);
    const beforeMatch = /^before:\s*"([^"]*)"$/.exec(param);
    if (firstMatch) pageSize = parseInt(firstMatch[1], 10);
    if (lastMatch) pageSize = parseInt(lastMatch[1], 10);
    if (afterMatch) [, afterCursor] = afterMatch;
    if (beforeMatch) [, beforeCursor] = beforeMatch;
  });

  let offset = 0;
  if (afterCursor !== null) {
    offset = parseInt(afterCursor, 10) + 1;
  } else if (beforeCursor !== null) {
    offset = Math.max(0, parseInt(beforeCursor, 10) - pageSize);
  }
  return { offset, pageSize };
};

function ValidationListSearcher({
  intl,
  filters,
  validationListsResults,
  validationPreviewPageInfo,
  validationPreviewTotalCount,
  fetchingValidationPreview,
  fetchedValidationPreview,
  fetchHouseholdValidationPreview,
}) {
  const modulesManager = useModulesManager();

  // ---- headers ----
  const headers = () => [
    'member.firstName',
    'member.lastName',
    'member.dob',
    'member.district',
    'member.village',
    'member.wealthQuintile',
    'member.prospectiveProjects',
    'member.validationStatus',
  ];

  // ---- item formatters ----
  const itemFormatters = () => [
    (member) => member.individualFirstName ?? '',
    (member) => member.individualLastName ?? '',
    (member) => member.individualDob ?? '',
    (member) => member.district ?? '',
    (member) => member.village ?? '',
    (member) => member.wealthQuintile ?? '',
    (member) => (member.prospectiveProjects ?? []).join(', '),
    (member) => member.validationStatus ?? '',
  ];

  // ---- sorts ----
  const sorts = () => [
    ['individualFirstName', true],
    ['individualLastName', true],
    ['individualDob', true],
    ['district', true],
    ['village', true],
    ['wealthQuintile', true],
    null, // prospective projects
    ['validationStatus', true],
  ];

  const fetch = (params) => {
    const { offset, pageSize } = paramsToOffsetAndPageSize(params);
    fetchHouseholdValidationPreview(filters, pageSize, offset);
  };

  return (
    <Searcher
      module={HOUSEHOLD_VALIDATION_MODULE_NAME}
      fetch={fetch}
      items={validationListsResults}
      itemsPageInfo={{ ...validationPreviewPageInfo, totalCount: validationPreviewTotalCount }}
      fetchingItems={fetchingValidationPreview}
      fetchedItems={fetchedValidationPreview}
      tableTitle={formatMessageWithValues(
        intl,
        HOUSEHOLD_VALIDATION_MODULE_NAME,
        'generateValidationList.searcherResultsTitle',
        { count: validationPreviewTotalCount ?? 0 },
      )}
      headers={headers}
      itemFormatters={itemFormatters}
      sorts={sorts}
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      defaultPageSize={DEFAULT_PAGE_SIZE}
    />
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
  validationListsResults: state.householdValidation?.validationPreviewData ?? [],
  validationPreviewPageInfo: state.householdValidation?.validationPreviewPageInfo ?? {},
  validationPreviewTotalCount: state.householdValidation?.validationPreviewTotalCount ?? 0,
  fetchingValidationPreview: state.householdValidation?.fetchingValidationPreview,
  fetchedValidationPreview: state.householdValidation?.fetchedValidationPreview,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchHouseholdValidationPreview,
}, dispatch);

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(ValidationListSearcher));
