import React, { useEffect, useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography,
} from '@material-ui/core';
import { formatMessage } from '@openimis/fe-core';
import { HOUSEHOLD_VALIDATION_MODULE_NAME } from '../constants';
import {
  GENERATE_INDIVIDUAL_LIST, SAVED_INDIVIDUAL_LIST, EXPORT_INDIVIDUAL_LIST, openValidationFile,
  individualSelectionVariables, savedSelectionColumns, validationPermissions,
} from '../util/individualValidation';
import useIndividualValidationRequest from '../util/useIndividualValidationRequest';
import ValidationDataTable from './ValidationDataTable';

export default function IndividualValidationPanel({
  intl, filters, canGenerate, rights,
}) {
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const generation = useIndividualValidationRequest();
  const selection = useIndividualValidationRequest();
  const exportRequest = useIndividualValidationRequest();
  const permissions = validationPermissions(rights);
  const fm = (key) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, `individualValidation.${key}`);

  useEffect(() => {
    generation.reset();
    selection.reset();
    exportRequest.reset();
    setResult(null);
    setPreview(null);
    setOpen(false);
    setOffset(0);
  }, [filters, generation.reset, selection.reset, exportRequest.reset]);

  useEffect(() => {
    if (!permissions.query || !permissions.history) exportRequest.reset();
  }, [permissions.query, permissions.history, exportRequest.reset]);

  useEffect(() => {
    setPreview(null);
    if (open && result?.batchId && permissions.query && permissions.history) {
      selection.run(SAVED_INDIVIDUAL_LIST, { batchId: result.batchId, first: 20, offset }, (data) => {
        setPreview(data.individualValidationList);
      });
    }
    return selection.reset;
  }, [open, result?.batchId, offset, permissions.query, permissions.history, selection.run, selection.reset]);

  const generate = () => {
    if (!permissions.query || !canGenerate) return;
    setResult(null);
    generation.run(GENERATE_INDIVIDUAL_LIST, individualSelectionVariables(filters), (data) => {
      setResult(data.generateIndividualValidationList);
    });
  };

  return (
    <Grid item xs={12}>
      <Typography>{fm('geography')}</Typography>
      <Button color="primary" variant="contained" disabled={!permissions.query || !canGenerate || generation.loading} onClick={generate}>
        {fm(generation.loading ? 'processing' : 'generate')}
      </Button>
      {generation.error && <Typography color="error" role="alert">{generation.error}</Typography>}
      {result && (
        <>
          <Typography>{`${fm('batchId')}: ${result.batchId}`}</Typography>
          <Typography>{`${fm('eligibleIndividuals')}: ${result.eligibleIndividuals}`}</Typography>
          <Typography>{`${fm('selectedIndividuals')}: ${result.selectedIndividuals}`}</Typography>
          <Button disabled={!permissions.query || !permissions.history} onClick={() => { setOffset(0); setOpen(true); }}>
            {fm('preview')}
          </Button>
          <Button disabled={!permissions.query || !result.fileBase64} onClick={() => openValidationFile(result)}>
            {fm('export')}
          </Button>
          {!permissions.history && <Typography>{fm('previewRequiresHistory')}</Typography>}
        </>
      )}
      <Dialog open={open && permissions.query && permissions.history} onClose={() => setOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>{fm('preview')}</DialogTitle>
        <DialogContent>
          {selection.loading && <Typography role="status">{fm('processing')}</Typography>}
          {selection.error && <Typography color="error" role="alert">{selection.error}</Typography>}
          {exportRequest.error && <Typography color="error" role="alert">{exportRequest.error}</Typography>}
          {preview && (
            <>
              {['selectedIndividuals', 'availableIndividuals', 'deletedIndividuals', 'missingIndividuals', 'inaccessibleIndividuals'].map((key) => (
                <Typography key={key}>{`${fm(key)}: ${preview[key]}`}</Typography>
              ))}
              <ValidationDataTable
                rows={preview.items}
                columns={savedSelectionColumns(preview).map((column) => ({
                  ...column,
                  label: ['batch_id', 'individual_uuid', 'first_name', 'last_name', 'dob'].includes(column.key)
                    ? fm(`field.${column.key}`) : column.label,
                }))}
              />
              <Button disabled={offset === 0} onClick={() => setOffset(offset - 20)}>{fm('previous')}</Button>
              <Button disabled={!preview.hasNextPage} onClick={() => setOffset(offset + 20)}>{fm('next')}</Button>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={exportRequest.loading || !result?.batchId}
            onClick={() => exportRequest.run(
              EXPORT_INDIVIDUAL_LIST,
              { batchId: result.batchId },
              (data) => openValidationFile(data.individualValidationListExport),
            )}
          >
            {fm('export')}
          </Button>
          <Button onClick={() => setOpen(false)}>{fm('close')}</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
