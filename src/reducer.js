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
  INDIVIDUAL_VALIDATION: 'INDIVIDUAL_VALIDATION',
  // Generate validation list mutation
  GENERATE_VALIDATION_LIST: 'GENERATE_VALIDATION_LIST',
  // Upload validated list mutation
  UPLOAD_VALIDATION_LIST: 'UPLOAD_VALIDATION_LIST',
  // Fetch rejected households for an uploaded batch
  FETCH_REJECTED_HOUSEHOLDS: 'FETCH_REJECTED_HOUSEHOLDS',
  // Fetch validation preview query
  FETCH_VALIDATION_PREVIEW: 'FETCH_VALIDATION_PREVIEW',
};

const INITIAL_STATE = {
  individualRequests: {},
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

  // Rejected households
  fetchingRejectedHouseholds: false,
  fetchedRejectedHouseholds: false,
  rejectedHouseholdsFileName: null,
  rejectedHouseholdsFileBase64: null,
  errorRejectedHouseholds: null,

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
    case REQUEST(ACTION_TYPE.INDIVIDUAL_VALIDATION):
      return {
        ...state,
        individualRequests: {
          ...state.individualRequests,
          [action.meta.requestKey]: { requestId: action.meta.requestId, loading: true, error: null },
        },
      };
    case SUCCESS(ACTION_TYPE.INDIVIDUAL_VALIDATION):
    case ERROR(ACTION_TYPE.INDIVIDUAL_VALIDATION): {
      const { requestKey, requestId } = action.meta;
      if (state.individualRequests?.[requestKey]?.requestId !== requestId) return state;
      const payload = action.payload ?? {};
      const error = formatGraphQLError(payload.response ?? payload)
        ?? (action.error ? formatServerError(payload) : null);
      return {
        ...state,
        individualRequests: {
          ...state.individualRequests,
          [requestKey]: {
            requestId,
            loading: false,
            error: error?.detail || error?.message || (action.error ? payload.message : null)
              || (!payload.data ? 'No validation response received.' : null),
          },
        },
      };
    }
    case CLEAR(ACTION_TYPE.INDIVIDUAL_VALIDATION): {
      const individualRequests = { ...state.individualRequests };
      delete individualRequests[action.meta.requestKey];
      return { ...state, individualRequests };
    }
    // -------- GENERATE VALIDATION LIST MUTATION --------
    case REQUEST(ACTION_TYPE.GENERATE_VALIDATION_LIST):
      return {
        ...state,
        generationRequestId: action.meta?.requestId,
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
      if (state.generationRequestId !== action.meta?.requestId) return state;
      return {
        ...state,
        generatingValidationLists: false,
        generatedValidationLists: true,
        validationListResult: action.payload.data?.generateHouseholdValidationList ?? {},
        errorValidationLists: formatGraphQLError(action.payload),
      };

    case ERROR(ACTION_TYPE.GENERATE_VALIDATION_LIST):
      if (state.generationRequestId !== action.meta?.requestId) return state;
      return {
        ...state,
        generatingValidationLists: false,
        errorValidationLists: formatServerError(action.payload),
      };

    case CLEAR(ACTION_TYPE.GENERATE_VALIDATION_LIST):
      return {
        ...state,
        generationRequestId: null,
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
        fetchingRejectedHouseholds: false,
        fetchedRejectedHouseholds: false,
        rejectedHouseholdsFileName: null,
        rejectedHouseholdsFileBase64: null,
        errorRejectedHouseholds: null,
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

    // -------- REJECTED HOUSEHOLDS QUERY --------
    case REQUEST(ACTION_TYPE.FETCH_REJECTED_HOUSEHOLDS):
      return {
        ...state,
        fetchingRejectedHouseholds: true,
        fetchedRejectedHouseholds: false,
        rejectedHouseholdsFileName: null,
        rejectedHouseholdsFileBase64: null,
        errorRejectedHouseholds: null,
      };

    case SUCCESS(ACTION_TYPE.FETCH_REJECTED_HOUSEHOLDS): {
      const rejectedHouseholds = action.payload.data?.householdValidationRejectedBatchRows;
      return {
        ...state,
        fetchingRejectedHouseholds: false,
        fetchedRejectedHouseholds: true,
        rejectedHouseholdsFileName: rejectedHouseholds?.fileName ?? null,
        rejectedHouseholdsFileBase64: rejectedHouseholds?.fileBase64 ?? null,
        errorRejectedHouseholds: formatGraphQLError(action.payload),
      };
    }

    case ERROR(ACTION_TYPE.FETCH_REJECTED_HOUSEHOLDS):
      return {
        ...state,
        fetchingRejectedHouseholds: false,
        errorRejectedHouseholds: formatServerError(action.payload),
      };

    case CLEAR(ACTION_TYPE.FETCH_REJECTED_HOUSEHOLDS):
      return {
        ...state,
        fetchingRejectedHouseholds: false,
        fetchedRejectedHouseholds: false,
        rejectedHouseholdsFileName: null,
        rejectedHouseholdsFileBase64: null,
        errorRejectedHouseholds: null,
      };

    // -------- FETCH VALIDATION PREVIEW QUERY --------
    case REQUEST(ACTION_TYPE.FETCH_VALIDATION_PREVIEW):
      return {
        ...state,
        previewRequestId: action.meta?.requestId,
        fetchingValidationPreview: true,
        fetchedValidationPreview: false,
        validationPreviewData: [],
        validationPreviewPageInfo: {},
        validationPreviewTotalCount: 0,
        errorValidationPreview: null,
      };

    case SUCCESS(ACTION_TYPE.FETCH_VALIDATION_PREVIEW): {
      if (state.previewRequestId !== action.meta?.requestId) return state;
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
      if (state.previewRequestId !== action.meta?.requestId) return state;
      return {
        ...state,
        fetchingValidationPreview: false,
        errorValidationPreview: formatServerError(action.payload),
      };

    case CLEAR(ACTION_TYPE.FETCH_VALIDATION_PREVIEW):
      return {
        ...state,
        previewRequestId: null,
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
