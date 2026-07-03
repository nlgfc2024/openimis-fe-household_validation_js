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
  FormPanel,
  formatMessage,
} from '@openimis/fe-core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ValidationListFiltersPanel from './ValidationListFiltersPanel';
import HouseholdPreviewDialog from './dialogs/HouseholdPreviewDialog';
import { HOUSEHOLD_VALIDATION_MODULE_NAME } from '../constants';
import { generateValidationList } from '../actions';

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
  summaryLabel: {
    ...theme.typography?.subtitle1,
    fontWeight: 'bold',
    padding: theme.spacing(1),
  },
});

function HouseholdValidationHeadPanel ({
  intl, 
  classes, 
  validationListResults,
  generatedValidationLists,
  generateValidationList,
}) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [edited, setEdited] = React.useState({});

  const fm = (id) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, id);

  const exportToCSV = () => {
    // The validationListResults contains file in base64 format, we need to convert it to a Blob and then create a download link
    // It also contains a fileName, which we can use to name the downloaded file
    const byteCharacters = atob(validationListResults?.file ?? '');
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = validationListResults?.fileName ?? 'validation_list.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onHandleGenerate = () => {
    console.log('Generating validation list with filters:', edited);
    generateValidationList(edited);
  }

  return (
    <Grid container>
      {/* ── Filter panel ── */}
      <Grid item xs={12} className={classes.item}>
        <ValidationListFiltersPanel
          intl={intl}
          filters={edited}
          onChangeFilters={setEdited}
        />
      </Grid>

      {/* ── Generate button ── */}
      <Grid item xs={12} className={classes.item}>
        <Button variant="contained" color="primary" onClick={onHandleGenerate}>
          {fm('generateValidationList.generateButton')}
        </Button>
      </Grid>


      {/* ── Validation List Results Summary (only after list generation) ── */}
      {generatedValidationLists && (
        <>
          <Grid item xs={12} className={classes.item}>
              <Divider className={classes.divider} />
          </Grid>
          <Grid item xs={12}>
            <Typography className={classes.summaryLabel}>
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
                  {validationListResults.totalHouseholds?.toLocaleString() ?? 0}
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
                  {validationListResults.totalIndividuals?.toLocaleString() ?? 0}
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
                  {validationListResults.householdsSelected?.toLocaleString() ?? 0}
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
                  {validationListResults.memberRows?.toLocaleString() ?? 0}
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
                  {validationListResults.selectedFemaleHeaded?.toLocaleString() ?? 0}
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
                  {validationListResults.selectedYouthHeaded?.toLocaleString() ?? 0}
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
                  {validationListResults.selectedReserve?.toLocaleString() ?? 0}
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
        validationListsResults={validationListResults.selectedMembers ?? []}
      />
    </Grid>
  );
}

const mapStateToProps = (state) => ({
  validationListResults: state.householdValidation?.validationListResult,
  generatedValidationLists: state.householdValidation?.generatedValidationLists,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  generateValidationList,
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
