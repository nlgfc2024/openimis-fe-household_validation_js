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
import ValidationListFiltersPanel from './ValidationListFiltersPanel';
import HouseholdPreviewDialog from './dialogs/HouseholdPreviewDialog';
import { HOUSEHOLD_VALIDATION_MODULE_NAME } from '../constants';

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

class HouseholdValidationHeadPanel extends FormPanel {
  constructor(props) {
    super(props);
    this.state = {
      isGenerated: false,
      showPreview: false,
    };
  }

  onGenerateValidationList = () => {
    this.setState({ isGenerated: true, showPreview: false });
  };

  onPreviewHouseholds = () => {
    this.setState({ showPreview: true });
  };

  render() {
    const {
      intl, classes, edited, onEditedChanged,
    } = this.props;
    const { isGenerated, showPreview } = this.state;

    const summary = {
      totalHouseholds: 12450,
      totalIndividuals: 68320,
      selectedHouseholds: isGenerated ? 20 : 0,
      selectedIndividuals: isGenerated ? 87 : 0,
      selectedFemaleHeaded: isGenerated ? 15 : 0,
      selectedYouthHeaded: isGenerated ? 8 : 0,
      selectedReserve: isGenerated ? 12 : 0,
    };

    const householdMembers = [
      { id: 1, firstName: 'John', lastName: 'Doe', dob: '1990-01-01', microCatchment: 'MC1', isHotspot: true, village: 'Village A', prospectiveProjects: ['Project X'], validationStatus: 'Pending' },
      { id: 2, firstName: 'Jane', lastName: 'Smith', dob: '1985-05-15', microCatchment: 'MC2', isHotspot: false, village: 'Village B', prospectiveProjects: ['Project Y'], validationStatus: 'Validated' },
      { id: 3, firstName: 'Alice', lastName: 'Johnson', dob: '1992-09-10', microCatchment: 'MC1', isHotspot: true, village: 'Village A', prospectiveProjects: ['Project Z'], validationStatus: 'Pending' },
      { id: 4, firstName: 'Bob', lastName: 'Brown', dob: '1988-03-22', microCatchment: 'MC3', isHotspot: false, village: 'Village C', prospectiveProjects: ['Project X'], validationStatus: 'Validated' },
      { id: 5, firstName: 'Charlie', lastName: 'Davis', dob: '1995-07-30', microCatchment: 'MC2', isHotspot: true, village: 'Village B', prospectiveProjects: ['Project Y'], validationStatus: 'Pending' },
      { id: 6, firstName: 'Eve', lastName: 'Miller', dob: '1991-11-05', microCatchment: 'MC1', isHotspot: false, village: 'Village A', prospectiveProjects: ['Project Z'], validationStatus: 'Validated' },
      { id: 7, firstName: 'Frank', lastName: 'Wilson', dob: '1987-02-14', microCatchment: 'MC3', isHotspot: true, village: 'Village C', prospectiveProjects: ['Project X'], validationStatus: 'Pending' },
      { id: 8, firstName: 'Grace', lastName: 'Taylor', dob: '1993-06-18', microCatchment: 'MC2', isHotspot: false, village: 'Village B', prospectiveProjects: ['Project Y'], validationStatus: 'Validated' },
      { id: 9, firstName: 'Hank', lastName: 'Anderson', dob: '1989-12-25', microCatchment: 'MC1', isHotspot: true, village: 'Village A', prospectiveProjects: ['Project Z'], validationStatus: 'Pending' },
      { id: 10, firstName: 'Ivy', lastName: 'Thomas', dob: '1994-04-12', microCatchment: 'MC3', isHotspot: false, village: 'Village C', prospectiveProjects: ['Project X'], validationStatus: 'Validated' },
      { id: 11, firstName: 'Jack', lastName: 'Jackson', dob: '1990-08-08', microCatchment: 'MC2', isHotspot: true, village: 'Village B', prospectiveProjects: ['Project Y'], validationStatus: 'Pending' },
      { id: 12, firstName: 'Kathy', lastName: 'White', dob: '1986-01-20', microCatchment: 'MC1', isHotspot: false, village: 'Village A', prospectiveProjects: ['Project Z'], validationStatus: 'Validated' },
      { id: 13, firstName: 'Leo', lastName: 'Harris', dob: '1992-05-05', microCatchment: 'MC3', isHotspot: true, village: 'Village C', prospectiveProjects: ['Project X'], validationStatus: 'Pending' },
      { id: 14, firstName: 'Mia', lastName: 'Martin', dob: '1991-09-15', microCatchment: 'MC2', isHotspot: false, village: 'Village B', prospectiveProjects: ['Project Y'], validationStatus: 'Validated' },
      { id: 15, firstName: 'Nate', lastName: 'Thompson', dob: '1988-03-30', microCatchment: 'MC1', isHotspot: true, village: 'Village A', prospectiveProjects: ['Project Z'], validationStatus: 'Pending' },
      { id: 16, firstName: 'Olivia', lastName: 'Garcia', dob: '1993-07-22', microCatchment: 'MC3', isHotspot: false, village: 'Village C', prospectiveProjects: ['Project X'], validationStatus: 'Validated' },
      { id: 17, firstName: 'Paul', lastName: 'Martinez', dob: '1987-11-11', microCatchment: 'MC2', isHotspot: true, village: 'Village B', prospectiveProjects: ['Project Y'], validationStatus: 'Pending' },
      { id: 18, firstName: 'Quinn', lastName: 'Robinson', dob: '1994-02-28', microCatchment: 'MC1', isHotspot: false, village: 'Village A', prospectiveProjects: ['Project Z'], validationStatus: 'Validated' },
      { id: 19, firstName: 'Rachel', lastName: 'Clark', dob: '1990-06-06', microCatchment: 'MC3', isHotspot: true, village: 'Village C', prospectiveProjects: ['Project X'], validationStatus: 'Pending' },
      { id: 20, firstName: 'Sam', lastName: 'Rodriguez', dob: '1989-10-10', microCatchment: 'MC2', isHotspot: false, village: 'Village B', prospectiveProjects: ['Project Y'], validationStatus: 'Validated' },
    ];

    const fm = (id) => formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, id);

    return (
      <Grid container>
        {/* ── Filter panel ── */}
        <Grid item xs={12} className={classes.item}>
          <ValidationListFiltersPanel
            intl={intl}
            filters={edited ?? {}}
            onChangeFilters={(updates) => {
              const next = { ...(edited ?? {}) };
              updates.forEach((f) => {
                if (!f.filter) delete next[f.id];
                else next[f.id] = { value: f.value, filter: f.filter };
              });
              onEditedChanged(next);
            }}
          />
        </Grid>

        {/* ── Generate button ── */}
        <Grid item xs={12} className={classes.item}>
          <Button variant="contained" color="primary" onClick={this.onGenerateValidationList}>
            {fm('generateValidationList.generateButton')}
          </Button>
        </Grid>


        {/* ── Summary (only after generate) ── */}
        {isGenerated && (
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
                  <Typography className={classes.cardNumber}>{summary.totalHouseholds.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} className={classes.item}>
              <Card className={classes.card} variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    {fm('generateValidationList.totalIndividuals')}
                  </Typography>
                  <Typography className={classes.cardNumber}>{summary.totalIndividuals.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} className={classes.item}>
              <Card className={classes.card} variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    {fm('generateValidationList.selectedHouseholds')}
                  </Typography>
                  <Typography className={classes.cardNumber}>{summary.selectedHouseholds}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} className={classes.item}>
              <Card className={classes.card} variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    {fm('generateValidationList.selectedIndividuals')}
                  </Typography>
                  <Typography className={classes.cardNumber}>{summary.selectedIndividuals}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} className={classes.item}>
              <Card className={classes.card} variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    {fm('generateValidationList.selectedFemaleHeaded')}
                  </Typography>
                  <Typography className={classes.cardNumber}>{summary.selectedFemaleHeaded}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} className={classes.item}>
              <Card className={classes.card} variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    {fm('generateValidationList.selectedYouthHeaded')}
                  </Typography>
                  <Typography className={classes.cardNumber}>{summary.selectedYouthHeaded}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} className={classes.item}>
              <Card className={classes.card} variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    {fm('generateValidationList.selectedReserve')}
                  </Typography>
                  <Typography className={classes.cardNumber}>{summary.selectedReserve}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* ── Action buttons (only after generate) ── */}
        {isGenerated && (
          <Grid item xs={12}>
            <div className={classes.actionsRow}>
              <Button
                variant="contained"
                color="primary"
                onClick={this.onPreviewHouseholds}
              >
                {fm('generateValidationList.previewHouseholdsButton')}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={this.onPreviewHouseholds}
              >
                {fm('export.label')}
              </Button>
            </div>
          </Grid>

        )}



        {/* ── Preview dialog ── */}
        <HouseholdPreviewDialog
          open={showPreview}
          onClose={() => this.setState({ showPreview: false })}
          householdMembers={householdMembers}
        />
      </Grid>
    );
  }
}

export default withModulesManager(
  injectIntl(
    withTheme(
      withStyles(styles)(
        connect()(HouseholdValidationHeadPanel),
      ),
    ),
  ),
);
