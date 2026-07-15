import React, { useEffect } from 'react';
import { injectIntl } from 'react-intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { withStyles, withTheme } from '@material-ui/core/styles';
import { formatMessage, withModulesManager } from '@openimis/fe-core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HOUSEHOLD_VALIDATION_MODULE_NAME } from '../../constants';
import { fetchHouseholdValidationPreview } from '../../actions';
import ValidationListSearcher from '../ValidationListSearcher';

const styles = (theme) => ({
  dialogPaper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
    maxWidth: '85%',
  },
  dialogContentRoot: {
    padding: 0,
    // Override the MUI's own `.MuiDialogContent-root:first-child { padding-top: 20px }` rule
    '&:first-child': {
      paddingTop: 0,
    },
  },
  dialogContent: {
    backgroundColor: theme.palette?.background?.default,
    marginTop: -(theme.paper?.body?.marginTop ?? 0),
  },
  actionsContainer: {
    display: 'inline',
    paddingLeft: theme.spacing(1),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    width: '100%',
  },
  actionsRight: {
    float: 'right',
    paddingRight: theme.spacing(1),
  },
  closeButton: {
    margin: theme.spacing(0, 2),
  },
});

function HouseholdPreviewDialog({
  intl,
  classes,
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
    <Dialog open={open} onClose={onClose} classes={{ paper: classes.dialogPaper }}>
      <DialogContent classes={{ root: classes.dialogContentRoot }}>
        <div className={classes.dialogContent}>
          <ValidationListSearcher />
        </div>
      </DialogContent>
      <DialogActions className={classes.actionsContainer}>
        <div className={classes.actionsRight}>
          <Button
            onClick={onClose}
            variant="outlined"
            autoFocus
            className={classes.closeButton}
          >
            {fm('dialog.close')}
          </Button>
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
    withTheme(
      withStyles(styles)(
        connect(mapStateToProps, mapDispatchToProps)(HouseholdPreviewDialog),
      ),
    ),
  ),
);
