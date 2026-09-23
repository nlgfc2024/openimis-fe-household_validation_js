import { HOUSEHOLD_VALIDATION_CONFIG_MODULE_NAME } from '../constants';

// Default Validation List Filters config,
// used when the deployment does not provide a custom config.
export const DEFAULT_VALIDATION_LIST_FILTERS_CONFIG = {
  filters: ['district', 'microCatchment', 'ta', 'hotspot', 'gvh', 'village', 'lastVerifiedDate', 'targetCount'],
  requiredFilters: ['district', 'microCatchment', 'targetCount'],
};

export const getValidationListFiltersConfig = (modulesManager) => {
  const configured = modulesManager?.getConf(
    HOUSEHOLD_VALIDATION_CONFIG_MODULE_NAME,
    'validationListFilters',
    DEFAULT_VALIDATION_LIST_FILTERS_CONFIG,
  );

  return { ...DEFAULT_VALIDATION_LIST_FILTERS_CONFIG, ...configured };
};

const matchProgram = (program, programs) => {
  const code = program?.code?.toUpperCase() ?? '';
  return programs.find((p) => p?.code?.toUpperCase() === code) ?? null;
};

// Resolves which filters should be shown/required for the current selection.
// When the config defines "programs", a Program picker is shown and the active
// location filters depend on which program is selected.
export const resolveActiveFilterSet = (config, program) => {
  const programs = config?.programs ?? [];
  if (programs.length > 0) {
    const matched = matchProgram(program, programs);
    const programUnmatched = !!program && !matched;
    const requiredFilters = matched?.requiredFilters ?? config?.requiredFilters ?? [];
    return {
      showProgramPicker: true,
      programUnmatched,
      filters: matched?.filters ?? [],
      requiredFilters: ['program', ...requiredFilters],
    };
  }
  return {
    showProgramPicker: false,
    programUnmatched: false,
    filters: config?.filters ?? [],
    requiredFilters: config?.requiredFilters ?? [],
  };
};
