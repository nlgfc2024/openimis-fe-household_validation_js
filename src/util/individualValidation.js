import { openBlob } from '@openimis/fe-core';
import {
  RIGHT_HOUSEHOLD_VALIDATION_SEARCH, RIGHT_HOUSEHOLD_VALIDATION_UPLOAD,
  RIGHT_HOUSEHOLD_VALIDATION_HISTORY, RIGHT_HOUSEHOLD_VALIDATION_ERROR_REPORT,
} from '../constants';

export const INDIVIDUAL = 'INDIVIDUAL';

export const programmeFor = (programmes, program) => programmes.find(
  (item) => item.benefitPlanCode.toUpperCase() === program?.code?.toUpperCase(),
);

export const validationPermissions = (rights = [], readOnly = false) => ({
  query: rights.includes(RIGHT_HOUSEHOLD_VALIDATION_SEARCH),
  upload: !readOnly && rights.includes(RIGHT_HOUSEHOLD_VALIDATION_UPLOAD),
  history: rights.includes(RIGHT_HOUSEHOLD_VALIDATION_HISTORY),
  errors: rights.includes(RIGHT_HOUSEHOLD_VALIDATION_ERROR_REPORT),
});

export const PROGRAMMES_QUERY = `query {
  validationProgrammes { benefitPlanCode subject dataSource columns decisionValues blankDecisionBehavior }
}`;

const WORKBOOK_FIELDS = `batchId fileName fileBase64 eligibleIndividuals selectedIndividuals
  availableIndividuals deletedIndividuals missingIndividuals inaccessibleIndividuals generatedAt`;

export const GENERATE_INDIVIDUAL_LIST = `mutation (
  $benefitPlanCode: String!, $districtCode: String, $taCodes: [String], $gvhCodes: [String],
  $villageCodes: [String], $catchmentCode: String, $catchmentId: String, $hotspotCode: String,
  $targetCount: Int, $excludeValidated: Boolean
) {
  generateIndividualValidationList(benefitPlanCode: $benefitPlanCode, districtCode: $districtCode,
    taCodes: $taCodes, gvhCodes: $gvhCodes, villageCodes: $villageCodes,
    catchmentCode: $catchmentCode, catchmentId: $catchmentId, hotspotCode: $hotspotCode,
    targetCount: $targetCount, excludeValidated: $excludeValidated) { ${WORKBOOK_FIELDS} }
}`;

export const SAVED_INDIVIDUAL_LIST = `query ($batchId: UUID!, $first: Int!, $offset: Int!) {
  individualValidationList(batchId: $batchId, first: $first, offset: $offset) {
    batchId eligibleIndividuals selectedIndividuals availableIndividuals deletedIndividuals
    missingIndividuals inaccessibleIndividuals displayFields columns items hasNextPage
  }
}`;

export const EXPORT_INDIVIDUAL_LIST = `query ($batchId: UUID!) {
  individualValidationListExport(batchId: $batchId) { ${WORKBOOK_FIELDS} }
}`;

export const UPLOAD_INDIVIDUAL_LIST = `mutation (
  $fileBase64: String!, $sourceFileName: String, $dryRun: Boolean
) {
  uploadIndividualValidationList(fileBase64: $fileBase64, sourceFileName: $sourceFileName, dryRun: $dryRun) {
    batchId uploadAttemptId dryRun status rowsRead rowsApplied rowsSkipped errors errorMessages
    individualsVerified individualsNotVerified individualsUpdated wouldUpdate
  }
}`;

export const INDIVIDUAL_ATTEMPTS = `query ($batchId: UUID!) {
  individualValidationAttempts(batchId: $batchId) { count attempts }
}`;

export const INDIVIDUAL_BATCHES = `query ($first: Int!, $offset: Int!) {
  individualValidationBatches(first: $first, offset: $offset) {
    count hasNextPage items { batchId benefitPlanCode generatedAt uploadedAt sourceFileName status selectedIndividuals }
  }
}`;

export const INDIVIDUAL_ATTEMPT_ROWS = `query ($batchId: UUID!, $uploadAttemptId: UUID!, $first: Int!, $offset: Int!) {
  individualValidationAttemptRows(batchId: $batchId, uploadAttemptId: $uploadAttemptId, first: $first, offset: $offset) {
    count items hasNextPage
  }
}`;

export const INDIVIDUAL_ERROR_REPORT = `query ($batchId: UUID!, $uploadAttemptId: UUID!) {
  individualValidationErrorReport(batchId: $batchId, uploadAttemptId: $uploadAttemptId) {
    batchId uploadAttemptId fileName fileBase64 errorCount
  }
}`;

export const individualSelectionVariables = (filters) => ({
  benefitPlanCode: filters.program.code,
  districtCode: filters.district?.code,
  taCodes: filters.tas?.map((item) => item.code),
  gvhCodes: filters.villages?.length ? undefined : filters.gvhs?.map((item) => item.code),
  villageCodes: filters.villages?.map((item) => item.code),
  catchmentCode: filters.microCatchment?.code,
  catchmentId: filters.microCatchment?.uuid,
  hotspotCode: filters.hotspot?.code,
  targetCount: filters.targetCount === '' || filters.targetCount == null ? undefined : Number(filters.targetCount),
  excludeValidated: !!filters.excludeValidated,
});

export const readValidationFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1]);
  reader.onerror = () => reject(new Error('Unable to read the selected workbook.'));
  reader.readAsDataURL(file);
});

export function openValidationFile({ fileBase64, fileName }) {
  if (!fileBase64 || !fileName) throw new Error('No downloadable file received.');
  const bytes = Uint8Array.from(atob(fileBase64), (value) => value.charCodeAt(0));
  openBlob(bytes, fileName, fileName.toLowerCase().endsWith('.csv')
    ? 'csv' : 'vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

// Saved rows and attempts contain GenericScalar objects with snake_case keys.
export const savedSelectionColumns = (selection) => {
  const base = ['batch_id', 'individual_uuid', 'first_name', 'last_name', 'dob'];
  const configured = (selection.columns ?? []).map((column) => column.column_name);
  const display = selection.displayFields?.map((field) => field.column_name)
    ?? Object.keys(selection.items?.[0] ?? {}).filter((key) => ![
      ...base, ...configured, 'decision', 'validation_notes',
    ].includes(key));
  return [...base, ...display, ...configured].map((key) => ({ key, label: key }));
};

export const displayValue = (value) => (value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''));
