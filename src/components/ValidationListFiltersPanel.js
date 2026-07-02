import React from 'react';
import _debounce from 'lodash/debounce';
import { injectIntl } from 'react-intl';
import { Grid, MenuItem, TextField } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import {
  TextInput,
  NumberInput,
  PublishedComponent,
  formatMessage,
} from '@openimis/fe-core';
import {
  CONTAINS_LOOKUP,
  DEFAULT_DEBOUNCE_TIME,
  EMPTY_STRING,
  HOTSPOT_OPTIONS,
  HOUSEHOLD_VALIDATION_MODULE_NAME,
} from '../constants';
import { defaultFilterStyles } from '../util/styles';

function ValidationListFiltersPanel({
  intl, classes, filters, onChangeFilters,
}) {
  const debouncedOnChangeFilters = _debounce(onChangeFilters, DEFAULT_DEBOUNCE_TIME);

  const filterValue = (filterName) => filters?.[filterName]?.value;
  const filterTextFieldValue = (filterName) => filters?.[filterName]?.value ?? EMPTY_STRING;

  const onChangeStringFilter = (filterName, lookup = null) => (value) => {
    if (lookup) {
      debouncedOnChangeFilters([{
        id: filterName,
        value,
        filter: `${filterName}_${lookup}: "${value}"`,
      }]);
    } else {
      onChangeFilters([{
        id: filterName,
        value,
        filter: `${filterName}: "${value}"`,
      }]);
    }
  };

  const onChangeNumberFilter = (filterName, suffix) => (value) => {
    onChangeFilters([{
      id: filterName,
      value,
      filter: value != null && value !== '' ? `${filterName}_${suffix}: ${value}` : '',
    }]);
  };

  return (
    <Grid container className={classes.form}>
      {/* Location — cascading Region / District / TA / Village */}
      <Grid item xs={12} md={6} className={classes.item}>
        <PublishedComponent
          pubRef="location.LocationCascader"
          value={filterValue('location')}
          onChange={(location) => onChangeFilters([{
            id: 'location',
            value: location,
            filter: location?.uuid ? `individual_Location_Uuid: "${location.uuid}"` : '',
          }])}
          withLabel
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.location')}
        />
      </Grid>

      {/* Micro-Catchment */}
      <Grid item xs={12} md={3} className={classes.item}>
        <TextInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.microCatchment"
          value={filterTextFieldValue('microCatchment')}
          onChange={onChangeStringFilter('microCatchment', CONTAINS_LOOKUP)}
        />
      </Grid>

      {/* Hotspot */}
      <Grid item xs={12} md={3} className={classes.item}>
        <TextField
          select
          fullWidth
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.hotspot')}
          value={filterValue('hotspot') ?? ''}
          onChange={(e) => onChangeFilters([{
            id: 'hotspot',
            value: e.target.value || null,
            filter: e.target.value ? `hotspot_Icontains: "${e.target.value}"` : '',
          }])}
          variant="standard"
        >
          <MenuItem value="">
            <em>{formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.hotspot.any')}</em>
          </MenuItem>
          {HOTSPOT_OPTIONS.map((area) => (
            <MenuItem key={area} value={area}>{area}</MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* % Female-Headed Household — min */}
      <Grid item xs={6} md={3} className={classes.item}>
        <NumberInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.femaleHeadedPctMin"
          min={0}
          max={100}
          value={filterValue('femaleHeadedPctMin') ?? EMPTY_STRING}
          onChange={onChangeNumberFilter('femaleHeadedHouseholdPct', 'Gte')}
        />
      </Grid>

      {/* % Female-Headed Household — max */}
      <Grid item xs={6} md={3} className={classes.item}>
        <NumberInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.femaleHeadedPctMax"
          min={0}
          max={100}
          value={filterValue('femaleHeadedPctMax') ?? EMPTY_STRING}
          onChange={onChangeNumberFilter('femaleHeadedHouseholdPct', 'Lte')}
        />
      </Grid>

      {/* % Youth — min */}
      <Grid item xs={6} md={3} className={classes.item}>
        <NumberInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.youthPctMin"
          min={0}
          max={100}
          value={filterValue('youthPctMin') ?? EMPTY_STRING}
          onChange={onChangeNumberFilter('youthPct', 'Gte')}
        />
      </Grid>

      {/* % Youth — max */}
      <Grid item xs={6} md={3} className={classes.item}>
        <NumberInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.youthPctMax"
          min={0}
          max={100}
          value={filterValue('youthPctMax') ?? EMPTY_STRING}
          onChange={onChangeNumberFilter('youthPct', 'Lte')}
        />
      </Grid>
    </Grid>
  );
}

export default injectIntl(withTheme(withStyles(defaultFilterStyles)(ValidationListFiltersPanel)));
