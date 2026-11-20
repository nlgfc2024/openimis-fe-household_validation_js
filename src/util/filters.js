const isFilled = (field, value) => {
  if (field === 'targetCount') return Number(value) > 0;
  if (field === 'lastVerifiedDate' || field === 'excludeVerifiedAfter') return !!value;
  if (Array.isArray(value)) return value.length > 0;
  return !!(value?.uuid || value?.code);
};

// Configuration uses picker names; multi-selects and dates use different state keys.
const STATE_FIELD = {
  ta: 'tas', gvh: 'gvhs', village: 'villages', lastVerifiedDate: 'excludeVerifiedAfter',
};

export const missingRequiredGenerationFilters = (filters, requiredFilters = []) => [...new Set(requiredFilters)]
  .filter((field) => !isFilled(field, filters?.[STATE_FIELD[field] ?? field]));

export const hasRequiredGenerationFilters = (filters, requiredFilters = []) => missingRequiredGenerationFilters(filters, requiredFilters).length === 0;
