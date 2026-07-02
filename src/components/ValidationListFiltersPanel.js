import React from 'react';
import _debounce from 'lodash/debounce';
import { injectIntl } from 'react-intl';
import { Grid, MenuItem, TextField } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import {
  NumberInput,
  PublishedComponent,
  formatMessage,
} from '@openimis/fe-core';
import {
  DEFAULT_DEBOUNCE_TIME,
  EMPTY_STRING,
  MICRO_CATCHMENT_OPTIONS,
  HOUSEHOLD_VALIDATION_MODULE_NAME,
} from '../constants';
import { defaultFilterStyles } from '../util/styles';

function ValidationListFiltersPanel({
  intl, classes, filters, onChangeFilters,
}) {
  const filterValue = (filterName) => filters?.[filterName]?.value;
  const debouncedOnChangeFilters = _debounce(onChangeFilters, DEFAULT_DEBOUNCE_TIME);

  const onChangeNumberFilter = (filterName) => (value) => {
    onChangeFilters([{
      id: filterName,
      value,
      filter: value != null && value !== '' ? `${filterName}: ${value}` : '',
    }]);
  };

  return (
    <Grid container className={classes.form}>
      {/* Location — detailed location picker (same pattern as IndividualHeadPanel) */}
      <Grid item xs={12} md={12} className={classes.item}>
        <PublishedComponent
          pubRef="location.DetailedLocation"
          withNull
          required={false}
          value={filterValue('location')}
          onChange={(location) => onChangeFilters([{
            id: 'location',
            value: location,
            filter: location?.uuid ? `individual_Location_Uuid: "${location.uuid}"` : '',
          }])}
          filterLabels={false}
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.location')}
        />
      </Grid>

      {/* Micro-Catchment */}
      <Grid item xs={12} md={6} className={classes.item}>
        <TextField
          select
          fullWidth
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.microCatchment')}
          value={filterValue('microCatchment') ?? ''}
          onChange={(e) => debouncedOnChangeFilters([{
            id: 'microCatchment',
            value: e.target.value || null,
            filter: e.target.value ? `microCatchment_Icontains: "${e.target.value}"` : '',
          }])}
          variant="standard"
        >
          <MenuItem value="">
            <em>{formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.microCatchment.any')}</em>
          </MenuItem>
          {MICRO_CATCHMENT_OPTIONS.map((microCatchment) => (
            <MenuItem key={microCatchment} value={microCatchment}>{microCatchment}</MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* Last Verified Date */}
      <Grid item xs={12} md={6} className={classes.item}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.lastVerifiedDate"
          value={filterValue('lastVerifiedDate')}
          onChange={(value) => onChangeFilters([{
            id: 'lastVerifiedDate',
            value,
            filter: value ? `lastVerifiedDate: "${value}"` : '',
          }])}
        />
      </Grid>

      {/* % Female-Headed Household */}
      <Grid item xs={12} md={4} className={classes.item}>
        <NumberInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.femaleHeadedPct"
          min={0}
          max={100}
          value={filterValue('femaleHeadedHouseholdPct') ?? EMPTY_STRING}
          onChange={onChangeNumberFilter('femaleHeadedHouseholdPct')}
        />
      </Grid>

      {/* % Youths */}
      <Grid item xs={12} md={4} className={classes.item}>
        <NumberInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.youthPct"
          min={0}
          max={100}
          value={filterValue('youthPct') ?? EMPTY_STRING}
          onChange={onChangeNumberFilter('youthPct')}
        />
      </Grid>

      {/* % Reserved */}
      <Grid item xs={12} md={4} className={classes.item}>
        <NumberInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.reservedPct"
          min={0}
          max={100}
          value={filterValue('reservedPct') ?? EMPTY_STRING}
          onChange={onChangeNumberFilter('reservedPct')}
        />
      </Grid>
    </Grid>
  );
}

export default injectIntl(withTheme(withStyles(defaultFilterStyles)(ValidationListFiltersPanel)));
