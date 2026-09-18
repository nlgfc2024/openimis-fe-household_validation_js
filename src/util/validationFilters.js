import { HOUSEHOLD_VALIDATION_CONFIG_MODULE_NAME } from '../constants';

// Default Validation List Filters config,
// used when the deployment does not provide a custom config.
export const DEFAULT_VALIDATION_LIST_FILTERS_CONFIG = {
  filters: ['district', 'microCatchment', 'ta', 'hotspot', 'gvh', 'village', 'lastVerifiedDate', 'targetCount'],
  requiredFilters: ['district', 'microCatchment', 'targetCount'],
};

export const getValidationListFiltersConfig = (modulesManager) => modulesManager?.getConf(
  HOUSEHOLD_VALIDATION_CONFIG_MODULE_NAME,
  'validationListFilters',
  DEFAULT_VALIDATION_LIST_FILTERS_CONFIG,
) ?? DEFAULT_VALIDATION_LIST_FILTERS_CONFIG;

const matchProgram = (program, programs) => {
  const name = program?.name?.toUpperCase() ?? '';
  return programs.find((candidate) => name.includes(String(candidate?.match ?? '').toUpperCase())) ?? null;
};

// Resolves which filters should be shown/required for the current selection.
// When the config defines "programs", a Program picker is shown and the active
// location filters depend on which program (e.g. RMEP vs UPG) is selected.
export const resolveActiveFilterSet = (config, program) => {
  const programs = config?.programs ?? [];
  if (programs.length > 0) {
    const matched = matchProgram(program, programs);
    const requiredFilters = matched?.requiredFilters ?? config?.requiredFilters ?? [];
    return {
      showProgramPicker: true,
      filters: matched?.filters ?? [],
      requiredFilters: ['program', ...requiredFilters],
    };
  }
  return {
    showProgramPicker: false,
    filters: config?.filters ?? [],
    requiredFilters: config?.requiredFilters ?? [],
  };
};
