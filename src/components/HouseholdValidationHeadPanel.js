import React from 'react';
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
  formatMessageWithValues,
  WarningBox,
} from '@openimis/fe-core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ValidationListFiltersPanel from './ValidationListFiltersPanel';
import HouseholdPreviewDialog from './dialogs/HouseholdPreviewDialog';
import { HOUSEHOLD_VALIDATION_MODULE_NAME } from '../constants';
import IndividualValidationPanel from './IndividualValidationPanel';
import useValidationProgrammes from '../util/useValidationProgrammes';
import { openValidationFile, programmeFor, validationPermissions } from '../util/individualValidation';
import { missingRequiredGenerationFilters } from '../util/filters';
import { getValidationListFiltersConfig, resolveActiveFilterSet } from '../util/validationFilters';
import { generateValidationList, clearValidationLists, clearValidationPreview } from '../actions';

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
  summaryContext: {
    padding: theme.spacing(1),
    fontWeight: 500,
  },
});

const LOCATION_LEVELS = {
  district: 0, ta: 1, gvh: 2, village: 3,
};

function HouseholdValidationHeadPanel({
  intl,
  classes,
  edited,
  onEditedChanged,
  modulesManager,
  // Generate mutation state
  generatingValidationLists,
  generatedValidationLists,
  validationListResult,
  // Actions
  generateValidationList,
  clearValidationLists,
  clearValidationPreview,
  errorValidationLists,
  rights,
}) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [generatedCatchment, setGeneratedCatchment] = React.useState(null);
  const [filtersTouched, setFiltersTouched] = React.useState(false);
  const fm = (id) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, id);
  const permissions = validationPermissions(rights);
  const { programmes, loaded, error: programmeError } = useValidationProgrammes(permissions.query);
  const contract = programmeFor(programmes, edited?.program);
  const individual = contract?.subject === 'INDIVIDUAL'
    || (!contract && edited?.program?.type === 'INDIVIDUAL');
  const filtersConfig = getValidationListFiltersConfig(modulesManager);
  const { requiredFilters, programUnmatched } = resolveActiveFilterSet(filtersConfig, edited?.program, contract);
  const needsProgram = programmes.some((item) => item.subject === 'INDIVIDUAL');
  const missingFilters = missingRequiredGenerationFilters(edited, [
    ...requiredFilters, ...(needsProgram ? ['program'] : []),
  ]);
  const filterLabel = (field) => {
    if (individual && field in LOCATION_LEVELS) {
      return formatMessage(intl, 'location', `Location${LOCATION_LEVELS[field]}Picker.label`);
    }
    const label = field === 'targetCount'
      ? `total${individual ? 'Individuals' : 'Households'}Target` : field;
    return fm(`filter.${label === 'excludeVerifiedAfter' ? 'lastVerifiedDate' : label}`);
  };
  const programmeReady = loaded
    ? ((!edited?.program || !!contract) && (!needsProgram || !!edited?.program)) : !individual;
  const canGenerate = permissions.query && programmeReady && !programUnmatched
    && missingFilters.length === 0;

  React.useEffect(() => {
    clearValidationLists();
    clearValidationPreview();
    return () => { clearValidationLists(); clearValidationPreview(); };
  }, [clearValidationLists, clearValidationPreview]);

  const handleFiltersChange = (newFilters) => {
    clearValidationLists();
    clearValidationPreview();
    setShowPreview(false);
    setFiltersTouched(true);
    onEditedChanged(newFilters);
  };

  const handleGenerate = () => {
    if (!canGenerate || individual) return;
    setGeneratedCatchment(edited?.microCatchment ?? null);
    generateValidationList(edited);
  };

  const exportToCSV = () => openValidationFile({
    ...validationListResult, fileName: validationListResult?.fileName ?? 'validation_list.xlsx',
  });

  return (
    <Grid container>
      {/* ── Filter panel ── */}
      <Grid item xs={12} className={classes.item}>
        <ValidationListFiltersPanel
          intl={intl}
          filters={edited}
          onChangeFilters={handleFiltersChange}
          modulesManager={modulesManager}
          contract={contract}
          programmes={programmes}
        />
        {filtersTouched && (programUnmatched || missingFilters.length > 0) && (
          <WarningBox
            title={fm(programUnmatched
              ? 'generateValidationList.unmatchedProgramFiltersTitle'
              : 'generateValidationList.missingRequiredFiltersTitle')}
            description={programUnmatched
              ? fm('generateValidationList.unmatchedProgramFilters')
              : formatMessageWithValues(
                intl,
                HOUSEHOLD_VALIDATION_MODULE_NAME,
                'generateValidationList.missingRequiredFilters',
                { filters: missingFilters.map(filterLabel).join(', ') },
              )}
          />
        )}
      </Grid>

      {programmeError && <Typography color="error" role="alert">{programmeError}</Typography>}
      {individual && (
        <IndividualValidationPanel intl={intl} filters={edited} canGenerate={canGenerate} rights={rights} />
      )}
      {!individual && (
        <>

          {/* ── Generate button ── */}
          <Grid item xs={12} className={classes.item}>
            <Grid container alignItems="center">
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerate}
                  disabled={generatingValidationLists || !canGenerate}
                >
                  {generatingValidationLists
                    ? fm('generateValidationList.generatingButton')
                    : fm('generateValidationList.generateButton')}
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {/* ── Validation List Results Summary (only after list generation) ── */}
          {generatedValidationLists && !errorValidationLists && (
          <>
            <Grid item xs={12} className={classes.item}>
              <Divider className={classes.divider} />
            </Grid>
            <Grid item xs={12}>
              <Typography className={classes.title}>
                {fm('generateValidationList.summaryTitle')}
              </Typography>
              <Typography className={classes.summaryContext} variant="subtitle1">
                {fm('generateValidationList.catchment')}
                {': '}
                {generatedCatchment?.name ?? generatedCatchment?.code ?? '-'}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4} className={classes.item}>
              <Card className={classes.card} variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    {fm('generateValidationList.totalHouseholds')}
                  </Typography>
                  <Typography className={classes.cardNumber}>
                    {validationListResult?.totalHouseholds?.toLocaleString() ?? 0}
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
                    {validationListResult?.totalIndividuals?.toLocaleString() ?? 0}
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
                    {validationListResult?.selectedHouseholds?.toLocaleString() ?? 0}
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
                    {validationListResult?.selectedIndividuals?.toLocaleString() ?? 0}
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
                    {validationListResult?.selectedFemaleHeadedHouseholds?.toLocaleString() ?? 0}
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
                    {validationListResult?.selectedYouthHouseholds?.toLocaleString() ?? 0}
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
                    {validationListResult?.reserveHouseholds?.toLocaleString() ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
          )}

          {/* ── Action buttons (only after generate) ── */}
          {generatedValidationLists && !errorValidationLists && (
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
          {errorValidationLists && <Typography color="error" role="alert">{errorValidationLists.detail || errorValidationLists.message || String(errorValidationLists)}</Typography>}
        </>
      )}
    </Grid>
  );
}

const mapStateToProps = (state) => ({
  generatingValidationLists: state.householdValidation?.generatingValidationLists,
  generatedValidationLists: state.householdValidation?.generatedValidationLists,
  validationListResult: state.householdValidation?.validationListResult ?? {},
  errorValidationLists: state.householdValidation?.errorValidationLists,
  rights: state.core?.user?.i_user?.rights ?? [],
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  generateValidationList,
  clearValidationLists,
  clearValidationPreview,
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
