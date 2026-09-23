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
import { getValidationListFiltersConfig, resolveActiveFilterSet } from '../util/validationFilters';
import HotspotPicker from './HotspotPicker';

// Maps a configurable filter key to the field it stores its value under in `filters`.
const STATE_FIELD = {
  district: 'district',
  microCatchment: 'microCatchment',
  ta: 'tas',
  hotspot: 'hotspot',
  gvh: 'gvhs',
  village: 'villages',
};

const EMPTY_VALUE = {
  district: null,
  microCatchment: null,
  tas: [],
  hotspot: null,
  gvhs: [],
  villages: [],
};

const isFilled = (value) => (Array.isArray(value) ? value.length > 0 : !!(value?.uuid || value?.code));

function ValidationListFiltersPanel({
  intl, classes, filters, onChangeFilters, modulesManager,
}) {
  const filtersConfig = getValidationListFiltersConfig(modulesManager);
  const { showProgramPicker, filters: activeFilters } = resolveActiveFilterSet(filtersConfig, filters?.program);
  const hasMicroCatchmentFilter = activeFilters.includes('microCatchment');

  const catchmentLocationUuids = (links) => new Set(
    (links ?? []).map((link) => link?.location?.uuid).filter(Boolean),
  );

  const filterCatchmentLocations = (links) => {
    const allowedUuids = catchmentLocationUuids(links);
    return (options) => options.filter((option) => allowedUuids.has(option.uuid));
  };

  const filterDistrictMicroCatchments = (options) => {
    const districtUuid = filters?.district?.uuid;
    if (!districtUuid) return [];
    return options.filter(
      (microCatchment) => microCatchment?.district?.uuid === districtUuid,
    );
  };

  // Every location filter that comes after `key` in the active, ordered filter
  // set is stale once `key` changes, so it gets cleared back to its empty value.
  // Non-cascading filters (e.g. lastVerifiedDate, targetCount) are left alone.
  const resetFollowing = (key) => {
    const index = activeFilters.indexOf(key);
    if (index === -1) return {};
    return activeFilters.slice(index + 1)
      .filter((filterKey) => filterKey in STATE_FIELD)
      .reduce((acc, filterKey) => {
        acc[STATE_FIELD[filterKey]] = EMPTY_VALUE[STATE_FIELD[filterKey]];
        return acc;
      }, {});
  };

  // A cascading location filter is read-only until the filter immediately before
  // it (in the active, ordered filter set) has a value. Non-cascading filters
  // (e.g. lastVerifiedDate, targetCount) are always enabled.
  const isReadOnly = (key) => {
    if (!(key in STATE_FIELD)) return false;
    const index = activeFilters.indexOf(key);
    if (index <= 0) return false;
    const prevKey = activeFilters[index - 1];
    if (!(prevKey in STATE_FIELD)) return false;
    return !isFilled(filters?.[STATE_FIELD[prevKey]]);
  };

  const onChange = (field) => (value) => {
    onChangeFilters({ ...filters, [field]: value });
  };

  const onChangeProgram = (program) => {
    onChangeFilters({
      ...filters,
      program,
      ...EMPTY_VALUE,
    });
  };

  const onChangeDistrict = (district) => {
    onChangeFilters({ ...filters, district, ...resetFollowing('district') });
  };

  const onChangeMicroCatchment = (microCatchment) => {
    onChangeFilters({
      ...filters,
      district: microCatchment?.district ?? filters?.district ?? null,
      microCatchment,
      ...resetFollowing('microCatchment'),
    });
  };

  const onChangeTas = (tas) => {
    onChangeFilters({ ...filters, tas: tas ?? [], ...resetFollowing('ta') });
  };

  const onChangeHotspot = (hotspot) => {
    onChangeFilters({ ...filters, hotspot, ...resetFollowing('hotspot') });
  };

  const onChangeGvhs = (gvhs) => {
    onChangeFilters({ ...filters, gvhs: gvhs ?? [], ...resetFollowing('gvh') });
  };

  const renderFilter = (key) => {
    switch (key) {
      case 'district':
        return (
          <Grid item xs={12} md={6} className={classes.item} key="district">
            <PublishedComponent
              pubRef="location.LocationPicker"
              withNull
              required
              multiple={false}
              value={filters?.district}
              onChange={onChangeDistrict}
              filterLabels={false}
              readOnly={showProgramPicker && !filters?.program}
              label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.district')}
            />
          </Grid>
        );
      case 'microCatchment':
        return (
          <Grid item xs={12} md={6} className={classes.item} key="microCatchment">
            <PublishedComponent
              key={filters?.district?.uuid ?? 'no-district'}
              pubRef="location.MicroCatchmentPicker"
              module={HOUSEHOLD_VALIDATION_MODULE_NAME}
              label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.microCatchment')}
              value={filters?.microCatchment}
              district={filters?.district}
              readOnly={isReadOnly('microCatchment')}
              filterOptions={filterDistrictMicroCatchments}
              onChange={onChangeMicroCatchment}
              required
            />
          </Grid>
        );
      case 'ta':
        return (
          <Grid item xs={12} md={4} className={classes.item} key="ta">
            <PublishedComponent
              pubRef="location.MwTAPicker"
              multiple
              parentLocation={filters?.district}
              value={filters?.tas ?? []}
              readOnly={isReadOnly('ta')}
              onChange={onChangeTas}
              filterOptions={hasMicroCatchmentFilter
                ? filterCatchmentLocations(filters?.microCatchment?.traditionalAuthorities)
                : undefined}
              label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.ta')}
            />
          </Grid>
        );
      case 'hotspot':
        return (
          <Grid item xs={12} md={4} className={classes.item} key="hotspot">
            <HotspotPicker
              label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.hotspot')}
              microCatchment={filters?.microCatchment}
              tas={filters?.tas ?? []}
              value={filters?.hotspot}
              readOnly={isReadOnly('hotspot')}
              onChange={onChangeHotspot}
            />
          </Grid>
        );
      case 'gvh':
        return (
          <Grid item xs={12} md={4} className={classes.item} key="gvh">
            <PublishedComponent
              pubRef="location.MwGVHPicker"
              multiple
              parentLocations={(filters?.tas ?? []).map((ta) => ta.uuid)}
              value={filters?.gvhs ?? []}
              readOnly={isReadOnly('gvh')}
              onChange={onChangeGvhs}
              filterOptions={(options) => {
                const catchmentGvhUuids = catchmentLocationUuids(filters?.microCatchment?.gvhs);
                const hotspotGvhUuids = new Set(
                  (filters?.hotspot?.villages ?? []).map((village) => village?.parent?.uuid).filter(Boolean),
                );
                return options.filter(
                  (option) => catchmentGvhUuids.has(option.uuid) && hotspotGvhUuids.has(option.uuid),
                );
              }}
              label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.gvh')}
            />
          </Grid>
        );
      case 'village':
        return (
          <Grid item xs={12} md={4} className={classes.item} key="village">
            <PublishedComponent
              pubRef="location.MwVillagePicker"
              multiple
              parentLocations={(filters?.gvhs ?? []).map((gvh) => gvh.uuid)}
              value={filters?.villages ?? []}
              readOnly={isReadOnly('village')}
              onChange={(value) => onChange('villages')(value ?? [])}
              filterOptions={(options) => {
                const hotspotVillageUuids = new Set(
                  (filters?.hotspot?.villages ?? []).map((village) => village?.uuid).filter(Boolean),
                );
                return options.filter((option) => hotspotVillageUuids.has(option.uuid));
              }}
              label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.village')}
            />
          </Grid>
        );
      case 'lastVerifiedDate':
        return (
          <Grid item xs={12} md={4} className={classes.item} key="lastVerifiedDate">
            <PublishedComponent
              pubRef="core.DatePicker"
              module={HOUSEHOLD_VALIDATION_MODULE_NAME}
              label="filter.lastVerifiedDate"
              value={filters?.excludeVerifiedAfter ?? null}
              onChange={(value) => onChange('excludeVerifiedAfter')(value)}
            />
          </Grid>
        );
      case 'targetCount':
        return (
          <Grid item xs={12} md={4} className={classes.item} key="targetCount">
            <NumberInput
              module={HOUSEHOLD_VALIDATION_MODULE_NAME}
              label="filter.totalHouseholdsTarget"
              min={1}
              required
              value={filters?.targetCount}
              onChange={(value) => onChange('targetCount')(value)}
            />
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Grid container className={classes.form}>
      {/* Program (Benefit Plan) Picker — only when the deployment config defines programs */}
      {showProgramPicker && (
        <Grid item xs={12} md={6} className={classes.item}>
          <PublishedComponent
            pubRef="socialProtection.BenefitPlanPicker"
            withNull
            required
            filterLabels={false}
            type="EVERY_TYPE"
            value={filters?.program}
            onChange={onChangeProgram}
            label={formatMessage(intl, HOUSEHOLD_VALIDATION_MODULE_NAME, 'filter.program')}
          />
        </Grid>
      )}

      {/* Remaining filters, driven by the deployment's validationListFilters config */}
      {activeFilters.map((key) => renderFilter(key))}
    </Grid>
  );
}

export default injectIntl(withTheme(withStyles(defaultFilterStyles)(ValidationListFiltersPanel)));
