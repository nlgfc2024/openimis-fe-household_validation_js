import React, { useEffect, useState } from 'react';
import {
  Button, MenuItem, TextField, Typography,
} from '@material-ui/core';
import { formatMessage } from '@openimis/fe-core';
import { HOUSEHOLD_VALIDATION_MODULE_NAME } from '../constants';
import {
  INDIVIDUAL_ATTEMPTS, INDIVIDUAL_ATTEMPT_ROWS, INDIVIDUAL_ERROR_REPORT,
  downloadValidationFile, validationPermissions,
} from '../util/individualValidation';
import useValidationRequest from '../util/useValidationRequest';
import ValidationDataTable from './ValidationDataTable';

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export default function ValidationAttemptHistory({ intl, rights, result }) {
  const permissions = validationPermissions(rights);
  const [batchId, setBatchId] = useState(result?.batchId ?? '');
  const [attempts, setAttempts] = useState([]);
  const [attemptId, setAttemptId] = useState('');
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const history = useValidationRequest();
  const rows = useValidationRequest();
  const report = useValidationRequest();
  const fm = (key) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, `individualValidation.${key}`);

  const clear = () => {
    history.reset();
    rows.reset();
    report.reset();
    setAttempts([]);
    setAttemptId('');
    setItems([]);
    setOffset(0);
    setTotalCount(0);
    setHasNextPage(false);
  };
  const loadHistory = (id, preferredAttempt = '') => {
    clear();
    if (!permissions.history || !isUuid(id)) return;
    history.run(INDIVIDUAL_ATTEMPTS, { batchId: id }, (data) => {
      const entries = data.individualValidationAttempts?.attempts ?? [];
      setAttempts(entries);
      setAttemptId(entries.find((item) => item.upload_attempt_id === preferredAttempt)?.upload_attempt_id
        ?? entries[0]?.upload_attempt_id ?? '');
    });
  };

  useEffect(() => {
    if (result?.batchId && result?.uploadAttemptId) {
      setBatchId(result.batchId);
      loadHistory(result.batchId, result.uploadAttemptId);
    }
    // Load only when a committed attempt changes, not when the form rerenders.
    // The trigger is the backend's committed batch/attempt pair.
  }, [result?.batchId, result?.uploadAttemptId]);

  useEffect(() => {
    setItems([]);
    setTotalCount(0);
    setHasNextPage(false);
    report.reset();
    if (attemptId && permissions.history) {
      rows.run(INDIVIDUAL_ATTEMPT_ROWS, {
        batchId, uploadAttemptId: attemptId, first: 20, offset,
      }, (data) => {
        const page = data.individualValidationAttemptRows;
        setItems(page?.items ?? []);
        setTotalCount(page?.count ?? 0);
        setHasNextPage(!!page?.hasNextPage);
      });
    }
    return rows.reset;
  }, [attemptId, batchId, offset, permissions.history, rows.run, rows.reset, report.reset]);

  if (!permissions.history) return null;
  const rawKeys = [...new Set(items.flatMap((item) => Object.keys(item.raw_row ?? {})))];
  const columns = [
    ...['row_number', 'status', 'error_message'].map((key) => ({ key, label: fm(key) })),
    ...rawKeys.map((key) => ({ key: `raw:${key}`, label: key })),
  ];
  const tableRows = items.map((item) => ({
    ...item,
    ...Object.fromEntries(rawKeys.map((key) => [`raw:${key}`, item.raw_row?.[key]])),
  }));

  return (
    <div>
      <Typography variant="h6">{fm('history')}</Typography>
      <TextField label={fm('batchId')} value={batchId} fullWidth onChange={(event) => { clear(); setBatchId(event.target.value.trim()); }} />
      <Button disabled={!isUuid(batchId) || history.loading} onClick={() => loadHistory(batchId)}>{fm('loadHistory')}</Button>
      {history.loading && <Typography role="status">{fm('processing')}</Typography>}
      {history.error && <Typography color="error" role="alert">{history.error}</Typography>}
      {attempts.length > 0 && (
        <TextField select fullWidth label={fm('attempt')} value={attemptId} onChange={(event) => { setOffset(0); setAttemptId(event.target.value); }}>
          {attempts.map((attempt) => (
            <MenuItem key={attempt.upload_attempt_id} value={attempt.upload_attempt_id}>
              {`${attempt.uploaded_at} — ${attempt.source_file_name ?? ''} — ${attempt.status} — ${attempt.upload_attempt_id}`}
            </MenuItem>
          ))}
        </TextField>
      )}
      {rows.loading && <Typography role="status">{fm('processing')}</Typography>}
      {rows.error && <Typography color="error" role="alert">{rows.error}</Typography>}
      {!!attemptId && !rows.loading && <ValidationDataTable columns={columns} rows={tableRows} />}
      {!!attemptId && (
        <>
          <Typography>{`${fm('attemptRowCount')}: ${totalCount}`}</Typography>
          <Button disabled={rows.loading || offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}>{fm('previous')}</Button>
          <Button disabled={rows.loading || !hasNextPage} onClick={() => setOffset(offset + 20)}>{fm('next')}</Button>
        </>
      )}
      {permissions.errors && !!attemptId && (
        <Button
          disabled={report.loading}
          onClick={() => report.run(
            INDIVIDUAL_ERROR_REPORT,
            { batchId, uploadAttemptId: attemptId },
            (data) => downloadValidationFile(data.individualValidationErrorReport),
          )}
        >
          {fm('downloadErrors')}
        </Button>
      )}
      {report.error && <Typography color="error" role="alert">{report.error}</Typography>}
    </div>
  );
}
