import React, { useEffect } from 'react';
import { injectIntl } from 'react-intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { formatMessage, withModulesManager } from '@openimis/fe-core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HOUSEHOLD_VALIDATION_MODULE_NAME } from '../../constants';
import { fetchHouseholdValidationPreview } from '../../actions';
import ValidationListSearcher from '../ValidationListSearcher';

function HouseholdPreviewDialog({
  intl,
  open,
  onClose,
  // From redux
  validationPreviewData,
  validationPreviewTotalCount,
  fetchingValidationPreview,
  // Actions
  fetchHouseholdValidationPreview,
}) {
  const fm = (id) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, id);

  // Fetch preview data when dialog opens
  useEffect(() => {
    if (open && validationPreviewData.length === 0) {
      fetchHouseholdValidationPreview({}, 10, 0);
    }
  }, [open, validationPreviewData.length, fetchHouseholdValidationPreview]);

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
          <ValidationListSearcher />
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

const mapStateToProps = (state) => ({
  validationPreviewData: state.householdValidation?.validationPreviewData ?? [],
  validationPreviewTotalCount: state.householdValidation?.validationPreviewTotalCount ?? 0,
  fetchingValidationPreview: state.householdValidation?.fetchingValidationPreview,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchHouseholdValidationPreview,
}, dispatch);

export default withModulesManager(
  injectIntl(
    connect(mapStateToProps, mapDispatchToProps)(HouseholdPreviewDialog),
  ),
);
