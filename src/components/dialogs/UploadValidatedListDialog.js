import React, { useEffect, useRef, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  Input,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@material-ui/core';
import { fade, withStyles, withTheme } from '@material-ui/core/styles';
import {
  FeedbackBanner,
  apiHeaders,
  baseApiUrl,
  formatMessage,
  LoadingOverlay,
  coreAlert,
  SearcherActionButton,
} from '@openimis/fe-core';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  HOUSEHOLD_VALIDATION_MODULE_NAME,
  RIGHT_HOUSEHOLD_VALIDATION_UPLOAD,
  RIGHT_INDIVIDUAL_CREATE,
  KYC_DETAILS_WORKFLOW_NAME,
  KYC_DETAILS_WORKFLOW_GROUP,
} from '../../constants';
import {
  clearRejectedHouseholds,
  clearUploadValidationList,
  fetchRejectedHouseholds,
  uploadValidationList,
} from '../../actions';

const RESULT_FIELDS = [
  'rowsRead',
  'participantsVerified',
  'participantsNotVerified',
  'participantsRejected',
  'householdsVerified',
  'householdsNotVerified',
  'householdsWithMultiplePrimaryWorkers',
  'participantUpdates',
  'errors',
];

const KYC_RESULT_FIELDS = [
  'rows_read',
  'records_ready_for_approval',
  'records_rejected',
  'primary_recipients_matched',
  'payment_accounts_submitted',
  'national_ids_submitted',
];

const IGNORED_KYC_ERROR_KEYS = new Set(['timestamp', 'upload_id', 'data_upload_id']);

const UPLOAD_TYPE = {
  VALIDATION_LIST: 'validationList',
  KYC_DETAILS: 'kycDetails',
};

const styles = (theme) => ({
  item: theme.paper.item,
  dialogPaper: {
    width: 800,
    maxWidth: 900,
  },
  divider: {
    margin: theme.spacing(1, 0),
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(0.5, 0),
  },
  issueMetrics: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  issueMetric: {
    border: `1px solid ${fade(theme.palette.error.main, 0.3)}`,
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.75rem',
    padding: theme.spacing(0.25, 0.75),
  },
  errorList: {
    maxHeight: 160,
    overflowY: 'auto',
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: fade(theme.palette.error.main, 0.12),
    borderRadius: theme.shape?.borderRadius ?? 4,
  },
  actionsContainer: {
    display: 'inline',
    paddingLeft: theme.spacing(1),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    width: '100%',
  },
  actionsLeft: {
    float: 'left',
  },
  actionsRight: {
    float: 'right',
    paddingRight: theme.spacing(1),
  },
  closeButton: {
    margin: theme.spacing(0, 2),
  },
});

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result);
    resolve(result.slice(result.indexOf(',') + 1));
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const isXlsxFile = (file) => file.name?.toLowerCase().endsWith('.xlsx')
  || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const isKycFile = (file) => /\.(csv|xls|xlsx)$/i.test(file.name ?? '');

const getKycUploadErrorMessage = (payload) => {
  const formatError = (value) => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(formatError).filter(Boolean).join('\n');
    if (value && typeof value === 'object') {
      return Object.entries(value)
        .filter(([key]) => !IGNORED_KYC_ERROR_KEYS.has(key))
        .map(([key, item]) => `${key.replace(/_/g, ' ')}: ${formatError(item)}`)
        .filter((entry) => !entry.endsWith(': '))
        .join('\n');
    }
    return value == null ? '' : String(value);
  };
  return formatError(payload?.error ?? payload?.detail ?? payload?.message);
};

const multipartApiHeaders = () => {
  const { 'Content-Type': ignoredContentType, ...headers } = apiHeaders();
  return headers;
};

const downloadRejectedHouseholds = (fileBase64, fileName) => {
  if (!fileBase64) return false;
  try {
    const byteCharacters = atob(fileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let index = 0; index < byteCharacters.length; index += 1) {
      byteNumbers[index] = byteCharacters.charCodeAt(index);
    }
    const blob = new Blob(
      [new Uint8Array(byteNumbers)],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName ?? 'rejected_households.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
};

function UploadValidatedListDialog({
  intl,
  classes,
  rights,
  // Upload mutation state
  uploadingValidationList,
  uploadedValidationList,
  validationUploadResult,
  errorValidationUpload,
  fetchingRejectedHouseholds,
  fetchedRejectedHouseholds,
  rejectedHouseholdsFileName,
  rejectedHouseholdsFileBase64,
  errorRejectedHouseholds,
  // Actions
  uploadValidationList,
  clearUploadValidationList,
  fetchRejectedHouseholds,
  clearRejectedHouseholds,
  coreAlert,
  renderTrigger,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [downloadRequested, setDownloadRequested] = useState(false);
  const [uploadType, setUploadType] = useState(UPLOAD_TYPE.VALIDATION_LIST);
  const [uploadingKycDetails, setUploadingKycDetails] = useState(false);
  const [kycUploadResult, setKycUploadResult] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const canUploadKycDetails = rights.includes(RIGHT_INDIVIDUAL_CREATE);
  const uploading = uploadingValidationList || uploadingKycDetails;

  const fm = (id) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, id);

  const resetResult = () => {
    setSubmitted(false);
    setDownloadRequested(false);
    setKycUploadResult(null);
    clearUploadValidationList();
    clearRejectedHouseholds();
  };

  const handleOpen = () => setIsOpen(true);

  const handleClose = () => {
    if (uploading) return;
    setIsOpen(false);
    setFile(null);
    setUploadType(UPLOAD_TYPE.VALIDATION_LIST);
    resetResult();
  };

  useEffect(() => () => {
    isMountedRef.current = false;
    abortControllerRef.current?.abort();
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] ?? null);
    resetResult();
  };

  const onSubmit = async () => {
    if (!file) return;
    if (uploadType === UPLOAD_TYPE.KYC_DETAILS) {
      if (!canUploadKycDetails) return;
      if (!isKycFile(file)) {
        setSubmitted(true);
        setKycUploadResult({
          status: 'error',
          message: fm('uploadKycDetails.invalidFormat.message'),
        });
        return;
      }

      setSubmitted(true);
      setUploadingKycDetails(true);
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workflow_name', KYC_DETAILS_WORKFLOW_NAME);
        formData.append('workflow_group', KYC_DETAILS_WORKFLOW_GROUP);
        formData.append('group_aggregation_column', '');
        const response = await fetch(`${baseApiUrl}/individual/import_individuals/`, {
          headers: multipartApiHeaders(),
          body: formData,
          method: 'POST',
          credentials: 'same-origin',
          signal: abortController.signal,
        });
        const body = await response.text();
        let result = {};
        let isJsonResponse = !body;
        if (body) {
          try {
            result = JSON.parse(body);
            isJsonResponse = true;
          } catch {
            result = { success: false };
          }
        }

        if (!response.ok || result.success === false) {
          if (isMountedRef.current) {
            setKycUploadResult({
              status: 'error',
              message: isJsonResponse
                ? getKycUploadErrorMessage(result) || fm('uploadKycDetails.failed.message')
                : `${fm('uploadKycDetails.failed.message')} (${response.status})`,
            });
          }
          return;
        }

        if (isMountedRef.current) {
          setKycUploadResult({
            status: 'success',
            message: fm('uploadKycDetails.success.message'),
            summary: result?.data?.summary ?? {},
          });
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMountedRef.current) {
          setKycUploadResult({
            status: 'error',
            message: error?.message || fm('uploadKycDetails.failed.message'),
          });
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
        if (isMountedRef.current) setUploadingKycDetails(false);
      }
      return;
    }

    if (!isXlsxFile(file)) {
      coreAlert(
        fm('uploadValidationList.invalidFormat.header'),
        fm('uploadValidationList.invalidFormat.message'),
      );
      return;
    }
    const fileBase64 = await readFileAsBase64(file);
    setSubmitted(true);
    uploadValidationList(fileBase64, file.name);
  };

  const onDownloadRejectedHouseholds = () => {
    if (fetchedRejectedHouseholds && rejectedHouseholdsFileBase64) {
      const downloaded = downloadRejectedHouseholds(
        rejectedHouseholdsFileBase64,
        rejectedHouseholdsFileName,
      );
      if (!downloaded) {
        coreAlert(
          fm('uploadValidationList.rejectedHouseholdsDownloadFailed.header'),
          fm('uploadValidationList.rejectedHouseholdsDownloadFailed.message'),
        );
      }
      return;
    }
    setDownloadRequested(true);
    fetchRejectedHouseholds(
      validationUploadResult.batchId,
      validationUploadResult.uploadAttemptId,
    );
  };

  useEffect(() => {
    if (!downloadRequested || !fetchedRejectedHouseholds) return;
    const downloaded = downloadRejectedHouseholds(
      rejectedHouseholdsFileBase64,
      rejectedHouseholdsFileName,
    );
    if (!downloaded && !errorRejectedHouseholds) {
      coreAlert(
        formatMessage(
          intl,
          HOUSEHOLD_VALIDATION_MODULE_NAME,
          'uploadValidationList.rejectedHouseholdsDownloadFailed.header',
        ),
        formatMessage(
          intl,
          HOUSEHOLD_VALIDATION_MODULE_NAME,
          'uploadValidationList.rejectedHouseholdsDownloadFailed.message',
        ),
      );
    }
    setDownloadRequested(false);
  }, [
    downloadRequested,
    fetchedRejectedHouseholds,
    rejectedHouseholdsFileBase64,
    rejectedHouseholdsFileName,
    errorRejectedHouseholds,
    coreAlert,
    intl,
  ]);

  useEffect(() => {
    if (downloadRequested && errorRejectedHouseholds) {
      coreAlert(
        formatMessage(
          intl,
          HOUSEHOLD_VALIDATION_MODULE_NAME,
          'uploadValidationList.rejectedHouseholdsDownloadFailed.header',
        ),
        errorRejectedHouseholds?.message
          ?? formatMessage(
            intl,
            HOUSEHOLD_VALIDATION_MODULE_NAME,
            'uploadValidationList.rejectedHouseholdsDownloadFailed.message',
          ),
      );
      setDownloadRequested(false);
    }
  }, [downloadRequested, errorRejectedHouseholds, coreAlert, intl]);

  const showResult = submitted && uploadedValidationList
    && !uploadingValidationList && !errorValidationUpload;
  const showError = submitted && !!errorValidationUpload;
  const showKycResult = uploadType === UPLOAD_TYPE.KYC_DETAILS
    && submitted && !uploadingKycDetails && kycUploadResult;
  const resultCount = (field) => Number(validationUploadResult?.[field] || 0);
  const hasValidationIssues = [
    'errors',
    'participantsNotVerified',
    'participantsRejected',
    'householdsNotVerified',
    'householdsWithMultiplePrimaryWorkers',
  ].some((field) => resultCount(field) > 0);
  const issueMetrics = [
    ['participantsNotVerified', 'uploadValidationList.participantsNotVerified'],
    ['participantsRejected', 'uploadValidationList.participantsRejected'],
    ['householdsNotVerified', 'uploadValidationList.householdsNotVerified'],
    ['householdsWithMultiplePrimaryWorkers', 'uploadValidationList.householdsWithMultiplePrimaryWorkers'],
    ['errors', 'uploadValidationList.errors'],
  ].filter(([field]) => resultCount(field) > 0);
  const canDownloadRejectedHouseholds = showResult
    && hasValidationIssues
    && validationUploadResult?.batchId
    && validationUploadResult?.uploadAttemptId;

  if (!rights.includes(RIGHT_HOUSEHOLD_VALIDATION_UPLOAD)) return null;

  return (
    <>
      {renderTrigger ? renderTrigger({
        onClick: handleOpen,
        label: fm('uploadValidationList.buttonLabel'),
      }) : (
        <SearcherActionButton
          onClick={handleOpen}
          startIcon={<CloudUploadIcon />}
          label={fm('uploadValidationList.buttonLabel')}
          variant="outlined"
          size="medium"
          borderless={false}
        />
      )}
      <Dialog open={isOpen} onClose={handleClose} classes={{ paper: classes.dialogPaper }}>
        <DialogTitle>
          {fm(uploadType === UPLOAD_TYPE.KYC_DETAILS
            ? 'uploadKycDetails.dialogTitle'
            : 'uploadValidationList.dialogTitle')}
        </DialogTitle>
        <DialogContent>
          <Grid container direction="column">
            {canUploadKycDetails && (
              <Grid item className={classes.item}>
                <FormControl fullWidth>
                  <InputLabel id="household-upload-type-label">
                    {fm('upload.dialog.uploadType')}
                  </InputLabel>
                  <Select
                    labelId="household-upload-type-label"
                    id="household-upload-type"
                    value={uploadType}
                    onChange={(event) => {
                      setUploadType(event.target.value);
                      setFile(null);
                      resetResult();
                    }}
                    disabled={uploading}
                  >
                    <MenuItem value={UPLOAD_TYPE.VALIDATION_LIST}>
                      {fm('upload.dialog.validationList')}
                    </MenuItem>
                    <MenuItem value={UPLOAD_TYPE.KYC_DETAILS}>
                      {fm('upload.dialog.kycDetails')}
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {uploadType === UPLOAD_TYPE.KYC_DETAILS && (
              <Grid item className={classes.item}>
                <Typography variant="body2">
                  {fm('uploadKycDetails.description')}
                </Typography>
              </Grid>
            )}
            <Grid item className={classes.item}>
              <Input
                onChange={handleFileChange}
                required
                id="household-validation-upload-input"
                inputProps={{
                  accept: uploadType === UPLOAD_TYPE.KYC_DETAILS
                    ? '.csv, .xls, .xlsx'
                    : '.xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                }}
                type="file"
                key={uploadType}
                disabled={uploading}
              />
            </Grid>

            {(showResult || showError || showKycResult) && (
              <Grid item className={classes.item}>
                <Divider className={classes.divider} />
              </Grid>
            )}

            {showKycResult && (
              <Grid item className={classes.item}>
                <FeedbackBanner
                  severity={kycUploadResult.status}
                  title={fm(
                    kycUploadResult.status === 'success'
                      ? 'uploadKycDetails.success.title'
                      : 'uploadKycDetails.failed.title',
                  )}
                >
                  <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                    {kycUploadResult.message}
                  </Typography>
                </FeedbackBanner>
                {kycUploadResult.status === 'success' && (
                  <>
                    <Typography className={classes.resultTitle}>
                      {fm('uploadKycDetails.uploadComplete')}
                    </Typography>
                    {KYC_RESULT_FIELDS.map((field) => (
                      <div key={field} className={classes.resultRow}>
                        <Typography variant="body2" color="textSecondary">
                          {fm(`uploadKycDetails.${field}`)}
                        </Typography>
                        <Typography variant="body2">
                          {Number(kycUploadResult.summary?.[field] || 0).toLocaleString()}
                        </Typography>
                      </div>
                    ))}
                    <Typography variant="caption" color="textSecondary">
                      {fm('uploadKycDetails.pendingApproval')}
                    </Typography>
                  </>
                )}
              </Grid>
            )}

            {showResult && (
              <Grid item className={classes.item}>
                <FeedbackBanner
                  severity={hasValidationIssues ? 'error' : 'success'}
                  title={fm(
                    hasValidationIssues
                      ? 'uploadValidationList.partial.title'
                      : 'uploadValidationList.success.title',
                  )}
                >
                  {hasValidationIssues
                    ? (
                      <>
                        <Typography variant="body2">
                          {fm('uploadValidationList.partial.message')}
                        </Typography>
                        <div className={classes.issueMetrics}>
                          {issueMetrics.map(([field, label]) => (
                            <Typography key={field} className={classes.issueMetric} component="span">
                              {`${resultCount(field).toLocaleString()} ${fm(label)}`}
                            </Typography>
                          ))}
                        </div>
                      </>
                    )
                    : fm('uploadValidationList.success.message')}
                </FeedbackBanner>
                <Typography className={classes.resultTitle}>
                  {fm('uploadValidationList.uploadComplete')}
                </Typography>
                {RESULT_FIELDS.map((field) => (
                  <div key={field} className={classes.resultRow}>
                    <Typography variant="body2" color="textSecondary">
                      {fm(`uploadValidationList.${field}`)}
                    </Typography>
                    <Typography variant="body2">
                      {validationUploadResult?.[field]?.toLocaleString() ?? 0}
                    </Typography>
                  </div>
                ))}
                {!!validationUploadResult?.errorMessages?.length && (
                  <div className={classes.errorList}>
                    {validationUploadResult.errorMessages.map((message, idx) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <Typography key={idx} variant="body2">
                        {message}
                      </Typography>
                    ))}
                  </div>
                )}
              </Grid>
            )}

            {showError && (
              <Grid item className={classes.item}>
                <FeedbackBanner severity="error" title={fm('uploadValidationList.uploadFailed')}>
                  {`${errorValidationUpload?.code ? `${errorValidationUpload.code}: ` : ''}${errorValidationUpload?.message || ''}`}
                </FeedbackBanner>
                {!!errorValidationUpload?.detail && <Typography variant="body2">{errorValidationUpload.detail}</Typography>}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions className={classes.actionsContainer}>
          <div className={classes.actionsLeft}>
            <Button
              onClick={handleClose}
              variant="outlined"
              autoFocus
              className={classes.closeButton}
              disabled={uploading}
            >
              {fm('uploadValidationList.close')}
            </Button>
          </div>
          <div className={classes.actionsRight}>
            {canDownloadRejectedHouseholds && (
              <Button
                variant="contained"
                color="primary"
                onClick={onDownloadRejectedHouseholds}
                disabled={fetchingRejectedHouseholds}
              >
                {fetchingRejectedHouseholds && downloadRequested
                  ? fm('uploadValidationList.preparingRejectedHouseholdsDownload')
                  : fm('uploadValidationList.downloadRejectedHouseholds')}
              </Button>
            )}
            {!showResult && !(showKycResult && kycUploadResult.status === 'success') && (
              <Button
                variant="contained"
                color="primary"
                onClick={onSubmit}
                disabled={!file || uploading}
              >
                {uploading
                  ? fm(uploadType === UPLOAD_TYPE.KYC_DETAILS
                    ? 'uploadKycDetails.uploading'
                    : 'uploadValidationList.uploading')
                  : fm(uploadType === UPLOAD_TYPE.KYC_DETAILS
                    ? 'uploadKycDetails.upload'
                    : 'uploadValidationList.upload')}
              </Button>
            )}
          </div>
        </DialogActions>
      </Dialog>
      <LoadingOverlay
        open={uploading}
        label={fm(uploadType === UPLOAD_TYPE.KYC_DETAILS
          ? 'uploadKycDetails.uploading'
          : 'uploadValidationList.uploading')}
      />
    </>
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
  uploadingValidationList: state.householdValidation?.uploadingValidationList,
  uploadedValidationList: state.householdValidation?.uploadedValidationList,
  validationUploadResult: state.householdValidation?.validationUploadResult ?? {},
  errorValidationUpload: state.householdValidation?.errorValidationUpload,
  fetchingRejectedHouseholds: state.householdValidation?.fetchingRejectedHouseholds,
  fetchedRejectedHouseholds: state.householdValidation?.fetchedRejectedHouseholds,
  rejectedHouseholdsFileName: state.householdValidation?.rejectedHouseholdsFileName,
  rejectedHouseholdsFileBase64: state.householdValidation?.rejectedHouseholdsFileBase64,
  errorRejectedHouseholds: state.householdValidation?.errorRejectedHouseholds,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  uploadValidationList,
  clearUploadValidationList,
  fetchRejectedHouseholds,
  clearRejectedHouseholds,
  coreAlert,
}, dispatch);

export default injectIntl(
  withTheme(
    withStyles(styles)(
      connect(mapStateToProps, mapDispatchToProps)(UploadValidatedListDialog),
    ),
  ),
);
