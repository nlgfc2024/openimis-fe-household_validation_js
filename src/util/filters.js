import { REQUIRED_GENERATION_FILTERS } from '../constants';

export const hasRequiredGenerationFilters = (filters) => REQUIRED_GENERATION_FILTERS
  .every((field) => {
    const value = filters?.[field];
    return Array.isArray(value) ? value.length > 0 : !!value?.code;
  });
