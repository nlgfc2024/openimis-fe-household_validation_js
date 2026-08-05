import React, { useEffect } from 'react';
import { injectIntl } from 'react-intl';
import {
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
} from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import {
  withModulesManager,
  formatMessage,
} from '@openimis/fe-core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ValidationListFiltersPanel from './ValidationListFiltersPanel';
import HouseholdPreviewDialog from './dialogs/HouseholdPreviewDialog';
import { HOUSEHOLD_VALIDATION_MODULE_NAME } from '../constants';
import { hasRequiredGenerationFilters } from '../util/filters';
import {
  generateValidationList,
  fetchHouseholdValidationSummary,
  fetchHouseholdValidationPreview,
} from '../actions';

const styles = (theme) => ({
  item: theme.paper.item,
  divider: {
    margin: theme.spacing(1, 0),
  },
  card: {
    height: '100%',
    backgroundColor: theme.palette?.background?.paper ?? '#fff',
  },
  cardNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: theme.palette?.primary?.main ?? '#006273',
  },
  actionsRow: {
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    padding: theme.spacing(1),
  },
  title: theme.paper.title,
});

function HouseholdValidationHeadPanel({
  intl,
  classes,
  edited,
  onEditedChanged,
  // Generate mutation state
  generatingValidationLists,
  generatedValidationLists,
  validationListResult,
  fetchedValidationPreview,
  // Summary state
  validationSummary,
  fetchedValidationSummary,
  // Actions
  generateValidationList,
  fetchHouseholdValidationSummary,
  fetchHouseholdValidationPreview,
}) {
  const [showPreview, setShowPreview] = React.useState(false);
  const fm = (id) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, id);
  const canGenerate = hasRequiredGenerationFilters(edited);

  // Fetch summary after generation
  useEffect(() => {
    if (generatedValidationLists && !fetchedValidationSummary) {
      fetchHouseholdValidationSummary(edited);
    }
  }, [generatedValidationLists, fetchedValidationSummary, edited, fetchHouseholdValidationSummary]);

  const exportToCSV = () => {
    const byteCharacters = atob(validationListResult.fileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = validationListResult?.fileName ?? 'validation_list.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Grid container>
      {/* ── Filter panel ── */}
      <Grid item xs={12} className={classes.item}>
        <ValidationListFiltersPanel
          intl={intl}
          filters={edited}
          onChangeFilters={onEditedChanged}
        />
      </Grid>

      {/* ── Generate button ── */}
      <Grid item xs={12} className={classes.item}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => generateValidationList(edited)}
          disabled={generatingValidationLists || !canGenerate}
        >
          {generatingValidationLists
            ? fm('generateValidationList.generatingButton')
            : fm('generateValidationList.generateButton')}
        </Button>
        {!canGenerate && (
          <Typography variant="body2" color="textSecondary">
            {fm('generateValidationList.missingRequiredFilters')}
          </Typography>
        )}
      </Grid>

      {/* ── Validation List Results Summary (only after list generation) ── */}
      {generatedValidationLists && (
        <>
          <Grid item xs={12} className={classes.item}>
            <Divider className={classes.divider} />
          </Grid>
          <Grid item xs={12} >
            <Typography className={classes.title}>
              {fm('generateValidationList.summaryTitle')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4} className={classes.item}>
            <Card className={classes.card} variant="outlined">
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  {fm('generateValidationList.totalHouseholds')}
                </Typography>
                <Typography className={classes.cardNumber}>
                  {validationSummary?.totalHouseholds?.toLocaleString() ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} className={classes.item}>
            <Card className={classes.card} variant="outlined">
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  {fm('generateValidationList.totalIndividuals')}
                </Typography>
                <Typography className={classes.cardNumber}>
                  {validationSummary?.totalIndividuals?.toLocaleString() ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} className={classes.item}>
            <Card className={classes.card} variant="outlined">
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  {fm('generateValidationList.selectedHouseholds')}
                </Typography>
                <Typography className={classes.cardNumber}>
                  {validationSummary?.selectedHouseholds?.toLocaleString() ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} className={classes.item}>
            <Card className={classes.card} variant="outlined">
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  {fm('generateValidationList.selectedIndividuals')}
                </Typography>
                <Typography className={classes.cardNumber}>
                  {validationSummary?.selectedIndividuals?.toLocaleString() ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} className={classes.item}>
            <Card className={classes.card} variant="outlined">
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  {fm('generateValidationList.selectedFemaleHeaded')}
                </Typography>
                <Typography className={classes.cardNumber}>
                  {validationSummary?.selectedFemaleHeadedHouseholds?.toLocaleString() ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} className={classes.item}>
            <Card className={classes.card} variant="outlined">
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  {fm('generateValidationList.selectedYouthHeaded')}
                </Typography>
                <Typography className={classes.cardNumber}>
                  {validationSummary?.selectedYouthHouseholds?.toLocaleString() ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} className={classes.item}>
            <Card className={classes.card} variant="outlined">
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  {fm('generateValidationList.selectedReserve')}
                </Typography>
                <Typography className={classes.cardNumber}>
                  {validationSummary?.reserveHouseholds?.toLocaleString() ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}

      {/* ── Action buttons (only after generate) ── */}
      {generatedValidationLists && (
        <Grid item xs={12}>
          <div className={classes.actionsRow}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowPreview(true)}
            >
              {fm('generateValidationList.previewHouseholdsButton')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={exportToCSV}
              disabled={!validationListResult?.fileBase64}
            >
              {fm('export.label')}
            </Button>
          </div>
        </Grid>
      )}

      {/* ── Preview dialog ── */}
      <HouseholdPreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        filters={edited}
      />
    </Grid>
  );
}

const mapStateToProps = (state) => ({
  generatingValidationLists: state.householdValidation?.generatingValidationLists,
  generatedValidationLists: state.householdValidation?.generatedValidationLists,
  validationListResult: state.householdValidation?.validationListResult ?? {},
  validationSummary: state.householdValidation?.validationSummary ?? {},
  fetchedValidationSummary: state.householdValidation?.fetchedValidationSummary,
  validationPreviewData: state.householdValidation?.validationPreviewData ?? [],
  fetchedValidationPreview: state.householdValidation?.fetchedValidationPreview,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  generateValidationList,
  fetchHouseholdValidationSummary,
  fetchHouseholdValidationPreview,
}, dispatch);

export default withModulesManager(
  injectIntl(
    withTheme(
      withStyles(styles)(
        connect(mapStateToProps, mapDispatchToProps)(HouseholdValidationHeadPanel),
      ),
    ),
  ),
);
