import React from 'react';
import { injectIntl } from 'react-intl';
import { Grid } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import {
  NumberInput,
  PublishedComponent,
  formatMessage,
} from '@openimis/fe-core';
import { HOUSEHOLD_VALIDATION_MODULE_NAME } from '../constants';
import { defaultFilterStyles } from '../util/styles';

function ValidationListFiltersPanel({
  intl, classes, filters, onChangeFilters,
}) {
  const catchmentLocationUuids = (links) => new Set(
    (links ?? []).map((link) => link?.location?.uuid).filter(Boolean),
  );

  const filterCatchmentLocations = (links) => {
    const allowedUuids = catchmentLocationUuids(links);
    return (options) => options.filter((option) => allowedUuids.has(option.uuid));
  };

  const onChange = (field) => (value) => {
    onChangeFilters({ ...filters, [field]: value });
  };

  const onChangeDistrict = (district) => {
    onChangeFilters({
      ...filters,
      district,
      microCatchment: null,
      tas: [],
      gvhs: [],
      villages: [],
    });
  };

  const onChangeMicroCatchment = (microCatchment) => {
    onChangeFilters({
      ...filters,
      microCatchment,
      tas: [],
      gvhs: [],
      villages: [],
    });
  };

  const onChangeTas = (tas) => {
    onChangeFilters({
      ...filters,
      tas: tas ?? [],
      gvhs: [],
      villages: [],
    });
  };

  const onChangeGvhs = (gvhs) => {
    onChangeFilters({
      ...filters,
      gvhs: gvhs ?? [],
      villages: [],
    });
  };

  return (
    <Grid container className={classes.form}>
      {/* District Picker */}
      <Grid item xs={12} md={6} className={classes.item}>
        <PublishedComponent
          pubRef="location.LocationPicker"
          withNull
          required
          multiple={false}
          value={filters?.district}
          onChange={onChangeDistrict}
          filterLabels={false}
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.district')}
        />
      </Grid>

      {/* Micro-Catchment */}
      <Grid item xs={12} md={6} className={classes.item}>
        <PublishedComponent
          pubRef="location.MicroCatchmentPicker"
          module={HOUSEHOLD_VALIDATION_MODULE_NAME}
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.microCatchment')}
          value={filters?.microCatchment}
          district={filters?.district}
          readOnly={!filters?.district}
          onChange={onChangeMicroCatchment}
          required
        />
      </Grid>

      {/* TA Picker */}
      <Grid item xs={12} md={4} className={classes.item}>
        <PublishedComponent
          pubRef="location.MwTAPicker"
          multiple
          parentLocation={filters?.district}
          value={filters?.tas ?? []}
          readOnly={!filters?.microCatchment}
          onChange={onChangeTas}
          filterOptions={filterCatchmentLocations(filters?.microCatchment?.traditionalAuthorities)}
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.ta')}
          required
        />
      </Grid>

      {/* GVHs */}
      <Grid item xs={12} md={4} className={classes.item}>
        <PublishedComponent
          pubRef="location.MwGVHPicker"
          multiple
          parentLocations={(filters?.tas ?? []).map((ta) => ta.uuid)}
          value={filters?.gvhs ?? []}
          readOnly={!filters?.tas?.length}
          onChange={onChangeGvhs}
          filterOptions={filterCatchmentLocations(filters?.microCatchment?.gvhs)}
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.gvh')}
        />
      </Grid>

      {/* Villages */}
      <Grid item xs={12} md={4} className={classes.item}>
        <PublishedComponent
          pubRef="location.MwVillagePicker"
          multiple
          parentLocations={(filters?.gvhs ?? []).map((gvh) => gvh.uuid)}
          value={filters?.villages ?? []}
          readOnly={!filters?.gvhs?.length}
          onChange={(value) => onChange('villages')(value ?? [])}
          label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.village')}
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
