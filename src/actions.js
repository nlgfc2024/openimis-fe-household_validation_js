// Disable due to core architecture
/* eslint-disable camelcase */
import {
  graphql,
  formatGQLString,
  formatPageQueryWithCount,
} from '@openimis/fe-core';
import { ACTION_TYPE } from './reducer';
import { REQUEST, SUCCESS, ERROR, CLEAR } from './util/action-type';
import {
  GENERATE_VALIDATION_LIST_RESULT_PROJECTION,
  UPLOAD_VALIDATION_LIST_RESULT_PROJECTION,
  VALIDATION_PREVIEW_PROJECTION,
  VALIDATION_SUMMARY_PROJECTION,
} from './constants';

function buildGenerateValidationListFilters(filters) {
  const lines = [];
  if (filters?.district?.code) {
    lines.push(`districtCode: \"${formatGQLString(filters.district.code)}\"`);
  }

  if (filters?.tas?.length) {
    lines.push(`taCodes: ${JSON.stringify(filters.tas.map((ta) => ta.code))}`);
  } else if (filters?.ta?.code) {
    // Keep compatibility with filters saved before TA became multi-select.
    lines.push(`taCode: \"${formatGQLString(filters.ta.code)}\"`);
  }

  if (filters?.microCatchment?.code) {
    lines.push(`catchmentCode: \"${formatGQLString(filters.microCatchment.code)}\"`);
  }

  if (filters?.villages?.length) {
    lines.push(`villageCodes: ${JSON.stringify(filters.villages.map((v) => v.code))}`);
  } else if (filters?.gvhs?.length) {
    lines.push(`gvhCodes: ${JSON.stringify(filters.gvhs.map((gvh) => gvh.code))}`);
  }

  if (filters?.excludeVerifiedAfter) lines.push(`excludeVerifiedAfter: \"${formatGQLString(filters.excludeVerifiedAfter)}\"`);

  if (filters?.femaleHeadedPercentage !== null && filters?.femaleHeadedPercentage !== undefined) {
    lines.push(`femaleHeadedPercentage: ${parseInt(filters.femaleHeadedPercentage, 10)}`);
  }
  if (filters?.youthPercentage !== null && filters?.youthPercentage !== undefined) {
    lines.push(`youthPercentage: ${parseInt(filters.youthPercentage, 10)}`);
  }
  if (filters?.reservedPercentage !== null && filters?.reservedPercentage !== undefined) {
    lines.push(`reservePercentage: ${parseInt(filters.reservedPercentage, 10)}`);
  }

  if (filters?.targetCount !== null && filters?.targetCount !== undefined) {
    lines.push(`targetCount: ${parseInt(filters.targetCount, 10)}`);
  }

  return lines;
}

export function generateValidationList(filters) {
  const args = buildGenerateValidationListFilters(filters);
  const payload = `
    mutation {
      generateHouseholdValidationList(
        ${args.join('\n')}
      ) {
        ${GENERATE_VALIDATION_LIST_RESULT_PROJECTION.join('\n')}
      }
    }`;
  const requestedDateTime = new Date();
  return graphql(
    payload,
    [REQUEST(ACTION_TYPE.GENERATE_VALIDATION_LIST), SUCCESS(ACTION_TYPE.GENERATE_VALIDATION_LIST), ERROR(ACTION_TYPE.GENERATE_VALIDATION_LIST)],
    {
      actionType: ACTION_TYPE.GENERATE_VALIDATION_LIST,
      requestedDateTime,
    },
  );
}

export function uploadValidationList(fileBase64, sourceFileName) {
  const args = [
    `fileBase64: "${fileBase64}"`,
    `sourceFileName: "${formatGQLString(sourceFileName ?? '')}"`,
  ];
  const payload = `
    mutation {
      uploadHouseholdValidationList(
        ${args.join('\n')}
      ) {
        ${UPLOAD_VALIDATION_LIST_RESULT_PROJECTION.join('\n')}
      }
    }`;
  const requestedDateTime = new Date();
  return graphql(
    payload,
    [REQUEST(ACTION_TYPE.UPLOAD_VALIDATION_LIST), SUCCESS(ACTION_TYPE.UPLOAD_VALIDATION_LIST), ERROR(ACTION_TYPE.UPLOAD_VALIDATION_LIST)],
    {
      actionType: ACTION_TYPE.UPLOAD_VALIDATION_LIST,
      requestedDateTime,
    },
  );
}

export function fetchHouseholdValidationSummary(filters) {
  const args = buildGenerateValidationListFilters(filters);
  const payload = `
    query {
      householdValidationSummary${args.length ? `(${args.join(',')})` : ''} {
        ${VALIDATION_SUMMARY_PROJECTION.join('\n')}
      }
    }`;
  return graphql(payload, ACTION_TYPE.FETCH_VALIDATION_SUMMARY);
}

export function fetchHouseholdValidationPreview(filters, pageSize = 10, offset = 0) {
  const args = buildGenerateValidationListFilters(filters);
  args.push(`first: ${parseInt(pageSize, 10)}`, `offset: ${parseInt(offset, 10)}`);
  const payload = formatPageQueryWithCount('householdValidationPreview', args, VALIDATION_PREVIEW_PROJECTION);
  return graphql(payload, ACTION_TYPE.FETCH_VALIDATION_PREVIEW);
}

export const clearValidationLists = () => (dispatch) => {
  dispatch({ type: CLEAR(ACTION_TYPE.GENERATE_VALIDATION_LIST) });
};

export const clearUploadValidationList = () => (dispatch) => {
  dispatch({ type: CLEAR(ACTION_TYPE.UPLOAD_VALIDATION_LIST) });
};

export const clearValidationSummary = () => (dispatch) => {
  dispatch({ type: CLEAR(ACTION_TYPE.FETCH_VALIDATION_SUMMARY) });
};

export const clearValidationPreview = () => (dispatch) => {
  dispatch({ type: CLEAR(ACTION_TYPE.FETCH_VALIDATION_PREVIEW) });
};
