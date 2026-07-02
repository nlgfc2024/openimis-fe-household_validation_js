import React from 'react';
import { Helmet, withModulesManager, formatMessage } from '@openimis/fe-core';
import { injectIntl } from 'react-intl';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import {
  RIGHT_HOUSEHOLD_VALIDATION_SEARCH,
  HOUSEHOLD_VALIDATION_MODULE_NAME,
} from '../constants';
import ValidationListSearcher from '../components/ValidationListSearcher';

const styles = (theme) => ({
  page: theme.page,
});

function HouseholdValidationPage(props) {
  const { intl, classes, rights } = props;

  return (
    rights.includes(RIGHT_HOUSEHOLD_VALIDATION_SEARCH) && (
      <div className={classes.page}>
        <Helmet title={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'generateValidationList.helmetTitle')} />
        <ValidationListSearcher rights={rights} />
      </div>
    )
  );
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

export default withModulesManager(
  injectIntl(
    withTheme(
      withStyles(styles)(
        connect(mapStateToProps)(HouseholdValidationPage),
      ),
    ),
  ),
);
