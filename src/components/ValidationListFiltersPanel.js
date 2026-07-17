import React from 'react';
import { injectIntl } from 'react-intl';
import { Grid, MenuItem } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import {
  NumberInput,
  PublishedComponent,
  formatMessage,
  Autocomplete,
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
  const onChange = (field) => (value) => {
    const newData = { ...filters, [field]: value };
      onChangeFilters(newData);
  }

  return (
    <Grid container className={classes.form}>
      {/* District Picker */}
      <Grid item xs={12} md={6} className={classes.item}>
        <PublishedComponent
          pubRef="location.LocationPicker"
          withNull
          multiple={false}
          value={filters?.district}
          onChange={(district) => onChange('district')(district)}
          filterLabels={false}
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.district')}
        />
      </Grid>

      {/* TA Picker */}
      <Grid item xs={12} md={6} className={classes.item}>
        <PublishedComponent
          pubRef="location.LocationPicker"
          withNull
          required={false}
          locationLevel={1}
          parentLocation={filters?.district}
          value={filters?.ta}
          onChange={(ta) => onChange('ta')(ta)}
          filterLabels={false}
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.ta')}
        />
      </Grid>

      {/* Micro-Catchment */}
      <Grid item xs={12} md={4} className={classes.item}>
        <PublishedComponent
          pubRef="location.MicroCatchmentPicker"
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.microCatchment')}
          value={filters?.microCatchment}
          district={filters?.district}
          onChange={(value) => onChange('microCatchment')(value)}
        />
      </Grid>

      {/* hotspots */}
      <Grid item xs={12} md={4} className={classes.item}>
        <Autocomplete
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.hotspots')}
          options={MICRO_CATCHMENT_OPTIONS.map((option) => ({ value: option, label: option }))}
          value={filters?.hotspotCode}
          onChange={(value) => onChange('hotspotCode')(value)}
          onInputChange={() => {}}
          getOptionLabel={(option) => option.label}
          getOptionSelected={(option, v) => option.value === v?.value}
        />
      </Grid>

      {/* Last Verified Date */}
      <Grid item xs={12} md={4} className={classes.item}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.lastVerifiedDate"
          value={filters?.excludeVerifiedAfter ?? null}
          onChange={(value) => onChange('excludeVerifiedAfter')(value)}
        />
      </Grid>

      {/* % Female-Headed Household */}
      <Grid item xs={12} md={4} className={classes.item}>
        <NumberInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.femaleHeadedPct"
          max={100}
          value={filters?.femaleHeadedPercentage}
          onChange={ (value) => onChange('femaleHeadedPercentage')(value)}
        />
      </Grid>

      {/* % Youths */}
      <Grid item xs={12} md={4} className={classes.item}>
        <NumberInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.youthPct"
          max={100}
          value={filters?.youthPercentage}
          onChange={ (value) => onChange('youthPercentage')(value)}
        />
      </Grid>

      {/* % Reserved */}
      <Grid item xs={12} md={4} className={classes.item}>
        <NumberInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.reservedPct"
          max={100}
          value={filters?.reservedPercentage}
          onChange={ (value) => onChange('reservedPercentage')(value)}
        />
      </Grid>

      {/* % Total Households Target */}
      <Grid item xs={12} md={4} className={classes.item}>
        <NumberInput
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label="filter.totalHouseholdsTarget"
          value={filters?.targetCount}
          onChange={ (value) => onChange('targetCount')(value)}
        />
      </Grid>
    </Grid>
  );
}

export default injectIntl(withTheme(withStyles(defaultFilterStyles)(ValidationListFiltersPanel)));
