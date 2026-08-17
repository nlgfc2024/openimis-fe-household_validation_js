// Disabled due to consistency with other modules
/* eslint-disable default-param-last */

import {
  formatServerError,
  formatGraphQLError,
} from '@openimis/fe-core';
import {
  REQUEST, SUCCESS, ERROR, CLEAR,
} from './util/action-type';

export const ACTION_TYPE = {
  // Generate validation list mutation
  GENERATE_VALIDATION_LIST: 'GENERATE_VALIDATION_LIST',
  // Upload validated list mutation
  UPLOAD_VALIDATION_LIST: 'UPLOAD_VALIDATION_LIST',
  // Fetch validation summary query
  FETCH_VALIDATION_SUMMARY: 'FETCH_VALIDATION_SUMMARY',
  // Fetch validation preview query
  FETCH_VALIDATION_PREVIEW: 'FETCH_VALIDATION_PREVIEW',
};

const INITIAL_STATE = {
  // Generate validation list
  generatingValidationLists: false,
  generatedValidationLists: false,
  validationListResult: {},
  errorValidationLists: null,

  // Upload validated list
  uploadingValidationList: false,
  uploadedValidationList: false,
  validationUploadResult: {},
  errorValidationUpload: null,

  // Validation summary
  fetchingValidationSummary: false,
  fetchedValidationSummary: false,
  validationSummary: {},
  errorValidationSummary: null,

  // Validation preview
  fetchingValidationPreview: false,
  fetchedValidationPreview: false,
  validationPreviewData: [],
  validationPreviewPageInfo: {},
  validationPreviewTotalCount: 0,
  errorValidationPreview: null,
};

function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    // -------- GENERATE VALIDATION LIST MUTATION --------
    case REQUEST(ACTION_TYPE.GENERATE_VALIDATION_LIST):
      return {
        ...state,
        generatingValidationLists: true,
        generatedValidationLists: false,
        validationListResult: {},
        errorValidationLists: null,
        fetchedValidationSummary: false,
        validationSummary: {},
        fetchedValidationPreview: false,
        validationPreviewData: [],
        validationPreviewPageInfo: {},
        validationPreviewTotalCount: 0,
      };

    case SUCCESS(ACTION_TYPE.GENERATE_VALIDATION_LIST):
      return {
        ...state,
        generatingValidationLists: false,
        generatedValidationLists: true,
        validationListResult: action.payload.data?.generateHouseholdValidationList ?? {},
        errorValidationLists: formatGraphQLError(action.payload),
      };

    case ERROR(ACTION_TYPE.GENERATE_VALIDATION_LIST):
      return {
        ...state,
        generatingValidationLists: false,
        errorValidationLists: formatServerError(action.payload),
      };

    case CLEAR(ACTION_TYPE.GENERATE_VALIDATION_LIST):
      return {
        ...state,
        generatingValidationLists: false,
        generatedValidationLists: false,
        validationListResult: {},
        errorValidationLists: null,
      };

    // -------- UPLOAD VALIDATED LIST MUTATION --------
    case REQUEST(ACTION_TYPE.UPLOAD_VALIDATION_LIST):
      return {
        ...state,
        uploadingValidationList: true,
        uploadedValidationList: false,
        validationUploadResult: {},
        errorValidationUpload: null,
      };

    case SUCCESS(ACTION_TYPE.UPLOAD_VALIDATION_LIST):
      return {
        ...state,
        uploadingValidationList: false,
        uploadedValidationList: true,
        validationUploadResult: action.payload.data?.uploadHouseholdValidationList ?? {},
        errorValidationUpload: formatGraphQLError(action.payload),
      };

    case ERROR(ACTION_TYPE.UPLOAD_VALIDATION_LIST):
      return {
        ...state,
        uploadingValidationList: false,
        errorValidationUpload: formatServerError(action.payload),
      };

    case CLEAR(ACTION_TYPE.UPLOAD_VALIDATION_LIST):
      return {
        ...state,
        uploadingValidationList: false,
        uploadedValidationList: false,
        validationUploadResult: {},
        errorValidationUpload: null,
      };

    // -------- FETCH VALIDATION SUMMARY QUERY --------
    case REQUEST(ACTION_TYPE.FETCH_VALIDATION_SUMMARY):
      return {
        ...state,
        fetchingValidationSummary: true,
        fetchedValidationSummary: false,
        validationSummary: {},
        errorValidationSummary: null,
      };

    case SUCCESS(ACTION_TYPE.FETCH_VALIDATION_SUMMARY):
      return {
        ...state,
        fetchingValidationSummary: false,
        fetchedValidationSummary: true,
        validationSummary: action.payload.data?.householdValidationSummary ?? {},
        errorValidationSummary: formatGraphQLError(action.payload),
      };

    case ERROR(ACTION_TYPE.FETCH_VALIDATION_SUMMARY):
      return {
        ...state,
        fetchingValidationSummary: false,
        errorValidationSummary: formatServerError(action.payload),
      };

    case CLEAR(ACTION_TYPE.FETCH_VALIDATION_SUMMARY):
      return {
        ...state,
        fetchingValidationSummary: false,
        fetchedValidationSummary: false,
        validationSummary: {},
        errorValidationSummary: null,
      };

    // -------- FETCH VALIDATION PREVIEW QUERY --------
    case REQUEST(ACTION_TYPE.FETCH_VALIDATION_PREVIEW):
      return {
        ...state,
        fetchingValidationPreview: true,
        fetchedValidationPreview: false,
        validationPreviewData: [],
        validationPreviewPageInfo: {},
        validationPreviewTotalCount: 0,
        errorValidationPreview: null,
      };

    case SUCCESS(ACTION_TYPE.FETCH_VALIDATION_PREVIEW): {
      const previewData = action.payload.data?.householdValidationPreview;
      return {
        ...state,
        fetchingValidationPreview: false,
        fetchedValidationPreview: true,
        validationPreviewData: previewData?.edges?.map((e) => e.node) ?? [],
        validationPreviewPageInfo: previewData?.pageInfo ?? {},
        validationPreviewTotalCount: previewData?.totalCount ?? 0,
        errorValidationPreview: formatGraphQLError(action.payload),
      };
    }

    case ERROR(ACTION_TYPE.FETCH_VALIDATION_PREVIEW):
      return {
        ...state,
        fetchingValidationPreview: false,
        errorValidationPreview: formatServerError(action.payload),
      };

    case CLEAR(ACTION_TYPE.FETCH_VALIDATION_PREVIEW):
      return {
        ...state,
        fetchingValidationPreview: false,
        fetchedValidationPreview: false,
        validationPreviewData: [],
        validationPreviewPageInfo: {},
        validationPreviewTotalCount: 0,
        errorValidationPreview: null,
      };

    default:
      return state;
  }
}

export default reducer;
