import React, { useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Input,
  Typography,
} from '@material-ui/core';
import { fade, withStyles, withTheme } from '@material-ui/core/styles';
import {
  FeedbackBanner,
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

  const fm = (id) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, id);

  const resetResult = () => {
    setSubmitted(false);
    setDownloadRequested(false);
    clearUploadValidationList();
    clearRejectedHouseholds();
  };

  const handleOpen = () => setIsOpen(true);

  const handleClose = () => {
    if (uploadingValidationList) return;
    setIsOpen(false);
    setFile(null);
    resetResult();
  };

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] ?? null);
    resetResult();
  };

  const onSubmit = async () => {
    if (!file) return;
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
          {fm('uploadValidationList.dialogTitle')}
        </DialogTitle>
        <DialogContent>
          <Grid container direction="column">
            <Grid item className={classes.item}>
              <Input
                onChange={handleFileChange}
                required
                id="household-validation-upload-input"
                inputProps={{
                  accept: '.xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                }}
                type="file"
                disabled={uploadingValidationList}
              />
            </Grid>

            {(showResult || showError) && (
              <Grid item className={classes.item}>
                <Divider className={classes.divider} />
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
              disabled={uploadingValidationList}
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
            {!showResult && (
              <Button
                variant="contained"
                color="primary"
                onClick={onSubmit}
                disabled={!file || uploadingValidationList}
              >
                {uploadingValidationList
                  ? fm('uploadValidationList.uploading')
                  : fm('uploadValidationList.upload')}
              </Button>
            )}
          </div>
        </DialogActions>
      </Dialog>
      <LoadingOverlay open={uploadingValidationList} label={fm('uploadValidationList.uploading')} />
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
