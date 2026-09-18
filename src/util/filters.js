const isFilled = (field, value) => {
  if (field === 'targetCount') return Number(value) > 0;
  if (Array.isArray(value)) return value.length > 0;
  return !!(value?.uuid || value?.code);
};

export const hasRequiredGenerationFilters = (filters, requiredFilters = []) => requiredFilters
  .every((field) => isFilled(field, filters?.[field]));
