import React, { useEffect, useRef, useState } from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl,
  Grid, Input, MenuItem, Typography,
} from '@material-ui/core';
import FactCheckIcon from '@material-ui/icons/AssignmentTurnedIn';
import { formatMessage, SearcherActionButton } from '@openimis/fe-core';
import { HOUSEHOLD_VALIDATION_MODULE_NAME } from '../../constants';
import {
  INDIVIDUAL_ERROR_REPORT, UPLOAD_INDIVIDUAL_LIST, openValidationFile,
  readValidationFile, validationPermissions,
} from '../../util/individualValidation';
import useValidationProgrammes from '../../util/useValidationProgrammes';
import useIndividualValidationRequest from '../../util/useIndividualValidationRequest';
import ValidationAttemptHistory from '../ValidationAttemptHistory';

export function IndividualValidateDialogComponent({
  intl, rights, readOnly = false, refetch, renderTrigger, downloadWithIconButton,
}) {
  const permissions = validationPermissions(rights, readOnly);
  const {
    programmes, loaded, error: programmeError, retry,
  } = useValidationProgrammes(permissions.query && permissions.upload);
  const contracts = programmes.filter((programme) => programme.subject === 'INDIVIDUAL');
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [reading, setReading] = useState(false);
  const fileVersion = useRef(0);
  const upload = useIndividualValidationRequest();
  const report = useIndividualValidationRequest();
  const fm = (key) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, `individualValidation.${key}`);
  const visible = loaded && contracts.length > 0 && permissions.query && permissions.upload;

  useEffect(() => () => { fileVersion.current += 1; }, []);
  useEffect(() => {
    if (!visible) {
      fileVersion.current += 1;
      upload.reset();
      report.reset();
      setOpen(false);
      setFile(null);
      setResult(null);
      setReading(false);
    }
  }, [visible, upload.reset, report.reset]);

  useEffect(() => {
    if (!permissions.errors) report.reset();
  }, [permissions.errors, report.reset]);

  const close = () => {
    if (upload.loading || reading) return;
    fileVersion.current += 1;
    upload.reset();
    report.reset();
    setOpen(false);
    setFile(null);
    setResult(null);
    setFileError(null);
  };
  const changeFile = (event) => {
    fileVersion.current += 1;
    upload.reset();
    setResult(null);
    const selected = event.target.files?.[0];
    setFile(selected?.name?.toLowerCase().endsWith('.xlsx') ? selected : null);
    setFileError(selected && !selected.name.toLowerCase().endsWith('.xlsx') ? fm('invalidFile') : null);
  };
  const process = async (dryRun) => {
    if (!visible || !file || upload.loading || reading) return;
    const version = fileVersion.current;
    report.reset();
    setResult(null);
    setFileError(null);
    setReading(true);
    try {
      const fileBase64 = await readValidationFile(file);
      if (version !== fileVersion.current) return;
      setReading(false);
      await upload.run(UPLOAD_INDIVIDUAL_LIST, { fileBase64, sourceFileName: file.name, dryRun }, (data) => {
        const uploaded = data.uploadIndividualValidationList;
        setResult(uploaded);
        if (!uploaded.dryRun && uploaded.rowsApplied > 0) refetch?.();
      });
    } catch (error) {
      if (version === fileVersion.current) setFileError(error.message);
    } finally {
      if (version === fileVersion.current) setReading(false);
    }
  };

  if (!visible) {
    if (!programmeError || !permissions.query || !permissions.upload) return null;
    return (
      <>
        <Typography color="error" role="alert">{`${fm('programmeLoadFailed')}: ${programmeError}`}</Typography>
        <Button onClick={retry}>{fm('retryProgrammes')}</Button>
      </>
    );
  }
  const trigger = { onClick: () => setOpen(true), label: fm('validate') };
  const busy = reading || upload.loading;
  return (
    <>
      {renderTrigger && renderTrigger(trigger)}
      {!renderTrigger && (downloadWithIconButton ? (
        <SearcherActionButton onClick={trigger.onClick} label={trigger.label} startIcon={<FactCheckIcon />} variant="outlined" />
      ) : <MenuItem onClick={trigger.onClick}>{trigger.label}</MenuItem>)}
      <Dialog open={open} onClose={close} fullWidth maxWidth="lg">
        <DialogTitle>{fm('title')}</DialogTitle>
        <DialogContent>
          <Typography>{fm('description')}</Typography>
          {contracts.map((contract) => (
            <Typography key={contract.benefitPlanCode}>
              {`${contract.benefitPlanCode}: ${(contract.decisionValues ?? []).join(' / ')}`}
              {contract.blankDecisionBehavior === 'SKIP_ROW' && ` — ${fm('blankDecision')}`}
            </Typography>
          ))}
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Typography component="label" htmlFor="individual-validation-file">{fm('file')}</Typography>
              <FormControl fullWidth>
                <Input
                  id="individual-validation-file"
                  type="file"
                  inputProps={{ accept: '.xlsx', 'aria-label': fm('file') }}
                  disabled={busy}
                  onChange={changeFile}
                />
              </FormControl>
            </Grid>
          </Grid>
          {fileError && <Typography color="error" role="alert">{fileError}</Typography>}
          {upload.error && <Typography color="error" role="alert">{upload.error}</Typography>}
          {busy && <Typography role="status">{fm('processing')}</Typography>}
          {result && (
            <div role="status">
              <Typography variant="h6">{fm(result.dryRun ? 'dryRunResult' : 'commitResult')}</Typography>
              <Typography>{fm(`${result.dryRun ? 'dryRunStatus' : 'status'}.${result.status}`)}</Typography>
              {['batchId', 'uploadAttemptId', 'rowsRead', 'rowsApplied', 'rowsSkipped', 'errors',
                'individualsVerified', 'individualsNotVerified', result.dryRun ? 'wouldUpdate' : 'individualsUpdated']
                .filter((key) => result[key] != null).map((key) => (
                  <Grid container key={key} spacing={1}>
                    <Grid item xs={6}><Typography>{fm(key)}</Typography></Grid>
                    <Grid item xs={6}><Typography align="right">{result[key]}</Typography></Grid>
                  </Grid>
                ))}
              {result.errorMessages?.map((message, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Typography color="error" key={index}>{message}</Typography>
              ))}
              {result.dryRun && <Typography>{fm('dryRunNotice')}</Typography>}
              {permissions.errors && result.uploadAttemptId && result.errors > 0 && (
                <Button
                  disabled={report.loading}
                  onClick={() => report.run(
                    INDIVIDUAL_ERROR_REPORT,
                    { batchId: result.batchId, uploadAttemptId: result.uploadAttemptId },
                    (data) => openValidationFile(data.individualValidationErrorReport),
                  )}
                >
                  {fm('downloadErrors')}
                </Button>
              )}
              {report.error && <Typography color="error" role="alert">{report.error}</Typography>}
            </div>
          )}
          {permissions.history && (
            <>
              <Divider />
              <ValidationAttemptHistory intl={intl} rights={rights} result={result?.dryRun ? null : result} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={!file || busy || (result && !result.dryRun)} onClick={() => process(true)}>{fm('dryRun')}</Button>
          <Button color="primary" variant="contained" disabled={!file || busy || (result && !result.dryRun)} onClick={() => process(false)}>{fm('commit')}</Button>
          <Button disabled={busy} onClick={close}>{fm('close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default injectIntl(connect(mapStateToProps)(IndividualValidateDialogComponent));
