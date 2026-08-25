import React, { useState } from 'react';
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
  MenuItem
} from '@material-ui/core';
import { withStyles, withTheme } from '@material-ui/core/styles';
import { formatMessage, coreAlert } from '@openimis/fe-core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  HOUSEHOLD_VALIDATION_MODULE_NAME,
  RIGHT_HOUSEHOLD_VALIDATION_UPLOAD,
} from '../../constants';
import { uploadValidationList, clearUploadValidationList } from '../../actions';

const RESULT_FIELDS = [
  'rowsRead',
  'householdsVerified',
  'householdsNotVerified',
  'participantUpdates',
  'householdsWithMultiplePrimaryWorkers',
  'errors',
];

const styles = (theme) => ({
  item: theme.paper.item,
  dialogPaper: {
    width: 600,
    maxWidth: 800,
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
  errorList: {
    maxHeight: 160,
    overflowY: 'auto',
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette?.error?.light ?? '#fdecea',
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

function UploadValidatedListDialog({
  intl,
  classes,
  rights,
  // Upload mutation state
  uploadingValidationList,
  uploadedValidationList,
  validationUploadResult,
  errorValidationUpload,
  // Actions
  uploadValidationList,
  clearUploadValidationList,
  coreAlert,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const fm = (id) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, id);

  if (!rights.includes(RIGHT_HOUSEHOLD_VALIDATION_UPLOAD)) return null;

  const resetResult = () => {
    setSubmitted(false);
    clearUploadValidationList();
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

  const showResult = submitted && uploadedValidationList
    && !uploadingValidationList && !errorValidationUpload;
  const showError = submitted && !!errorValidationUpload;

  return (
    <>
      <MenuItem onClick={handleOpen}>
        {fm('uploadValidationList.buttonLabel')}
      </MenuItem>
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
                <Typography className={classes.resultTitle} color="error">
                  {fm('uploadValidationList.uploadFailed')}
                </Typography>
                <Typography variant="body2">
                  {errorValidationUpload?.code ? `${errorValidationUpload.code}: ` : ''}
                  {errorValidationUpload?.message}
                </Typography>
                {!!errorValidationUpload?.detail && (
                  <Typography variant="body2">{errorValidationUpload.detail}</Typography>
                )}
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
          </div>
        </DialogActions>
      </Dialog>
    </>
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
  uploadingValidationList: state.householdValidation?.uploadingValidationList,
  uploadedValidationList: state.householdValidation?.uploadedValidationList,
  validationUploadResult: state.householdValidation?.validationUploadResult ?? {},
  errorValidationUpload: state.householdValidation?.errorValidationUpload,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  uploadValidationList,
  clearUploadValidationList,
  coreAlert,
}, dispatch);

export default injectIntl(
  withTheme(
    withStyles(styles)(
      connect(mapStateToProps, mapDispatchToProps)(UploadValidatedListDialog),
    ),
  ),
);
