import { REQUIRED_GENERATION_FILTERS } from '../constants';

export const hasRequiredGenerationFilters = (filters) => REQUIRED_GENERATION_FILTERS
  .every((field) => !!filters?.[field]?.code);
