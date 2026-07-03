import React from 'react';
import { injectIntl } from 'react-intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { formatMessage, withModulesManager } from '@openimis/fe-core';
import { HOUSEHOLD_VALIDATION_MODULE_NAME } from '../../constants';
import ValidationListSearcher from '../ValidationListSearcher';

function HouseholdPreviewDialog({ intl, open, onClose, validationListsResults }) {
  const fm = (id) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '75%',
          maxWidth: '75%',
        },
      }}
    >
      <DialogTitle style={{ marginTop: '10px' }}>
        {fm('generateValidationList.previewHouseholdsButton')}
      </DialogTitle>
      <DialogContent>
        <div style={{ backgroundColor: '#DFEDEF' }}>
          <ValidationListSearcher validationListsResults={validationListsResults} />
        </div>
      </DialogContent>
      <DialogActions
        style={{
          display: 'inline',
          paddingLeft: '10px',
          marginTop: '25px',
          marginBottom: '15px',
          width: '100%',
        }}
      >
        <div style={{ maxWidth: '3000px' }}>
          <div style={{ float: 'left' }} />
          <div style={{ float: 'right', paddingRight: '16px' }}>
            <Button
              onClick={onClose}
              variant="outlined"
              autoFocus
              style={{ margin: '0 16px' }}
            >
              {fm('dialog.close')}
            </Button>
          </div>
        </div>
      </DialogActions>
    </Dialog>
  );
}

export default withModulesManager(injectIntl(HouseholdPreviewDialog));
