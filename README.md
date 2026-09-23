# openimis-fe-household_validation_js

openIMIS Frontend Household Validation module (`@openimis/fe-household_validation`). Provides the "Generate Validation List" page: a configurable filter panel, list generation/preview against the `openimis-be-household_validation` backend, and the "Upload Validated List" action contributed into the individual/group search screen.

## Installation

Register the module in the shell app's `openimis-fe_js/src/modules.js` (and `openimis.json`) the same way as other openIMIS frontend modules — see the shell app's own README for the general pattern. This module registers itself under the key `fe-household_validation`, which is also the key used to look up its `ModuleConfiguration` (see "Configuration" below).

## Module Contents

- `src/pages/HouseholdValidationPage.js` — the "Generate Validation List" page.
- `src/components/HouseholdValidationHeadPanel.js` — filter panel + Generate button, wired to the resolved filter config for required-field gating.
- `src/components/ValidationListFiltersPanel.js` — renders whichever filters are configured (see "Configuration" below): District, Micro Catchment, TA, Hotspot, GVH, Village, Last Verified Date, Total Households Target, and optionally a Program (Benefit Plan) picker.
- `src/components/dialogs/UploadValidatedListDialog.js` — the "Upload Validated List" dialog, contributed into the individual/group module's header via `INDIVIDUAL_GROUP_MENU_CONTRIBUTION_KEY`.
- `src/util/validationFilters.js` — resolves the active filter set from module config (`getValidationListFiltersConfig`, `resolveActiveFilterSet`).
- `src/util/filters.js` — `hasRequiredGenerationFilters`, used to gate the Generate button.
- `src/actions.js` — GraphQL actions for generating/previewing lists and uploading validated workbooks; sends the selected Program as `benefitPlanCode`.
- `src/constants.js` — module name, rights, GraphQL projections, and the config module key (`HOUSEHOLD_VALIDATION_CONFIG_MODULE_NAME = 'fe-household_validation'`).

## Configuration

The filter panel is entirely config-driven via `validationListFilters`, read from this module's `ModuleConfiguration` (`modulesManager.getConf('fe-household_validation', 'validationListFilters', ...)`). A deployment that doesn't set this config gets the built-in default below (PWP: a fixed location hierarchy, no Program picker).

### Default config (no `ModuleConfiguration` override)

```js
{
  filters: ['district', 'microCatchment', 'ta', 'hotspot', 'gvh', 'village', 'lastVerifiedDate', 'targetCount'],
  requiredFilters: ['district', 'microCatchment', 'targetCount'],
}
```

All of these filters are shown; only District, Micro Catchment, and Total Households Target are required to enable Generate. This matches the historical, hardcoded PWP behavior.

### Filter keys

| Key | Renders |
| --- | --- |
| `district` | District picker (single) |
| `microCatchment` | Micro Catchment picker (single), scoped to the selected district |
| `ta` | Traditional Authority picker (multi), scoped to the selected district/micro-catchment |
| `hotspot` | Hotspot picker (single), scoped to the selected micro-catchment/TAs |
| `gvh` | GVH picker (multi), scoped to the selected TAs/hotspot |
| `village` | Village picker (multi), scoped to the selected GVHs/hotspot |
| `lastVerifiedDate` | Last Verified Date filter |
| `targetCount` | Total Households Target (number input) |

Filters render in the order listed in `filters`, and each one is read-only until the filter immediately before it in that order has a value (a purely positional dependency — there's no hardcoded parent/child relationship baked into the component). `requiredFilters` controls which of the currently active filters must be filled in before the Generate button enables; it's independent of `filters`, so a field can be shown but optional.

### Program-based config (e.g. Jobs Now)

Setting a `programs` array switches the panel into program-based mode: a Program (Benefit Plan) picker appears first, and the active `filters`/`requiredFilters` are looked up from whichever entry in `programs` matches the selected Program's `code` (case-insensitive, exact match — the same `code` value `actions.js` sends the backend as `benefitPlanCode`, so make sure `programs[].code` matches the corresponding `openimis-be-household_validation` `program_eligibility_rules` key). `program` is always added to `requiredFilters` automatically in this mode, so a Program must be selected before Generate enables — no need to list it explicitly.

```json
{
  "validationListFilters": {
    "filters": [],
    "requiredFilters": ["district"],
    "programs": [
      { "code": "RMEP", "filters": ["district", "microCatchment"], "requiredFilters": ["district"] },
      { "code": "UPG", "filters": ["district", "ta"], "requiredFilters": ["district"] }
    ]
  }
}
```

With this config: selecting RMEP shows District + Micro Catchment; selecting UPG shows District + TA; in both cases only District is required (in addition to the Program itself). The top-level `filters`/`requiredFilters` (here `[]`/`["district"]`) are unused while `programs` is non-empty — they're only a fallback for other module code paths that resolve a filter set without a selected Program yet.

Set this via the `household_validation` module's `ModuleConfiguration` (layer `fe`, module `fe-household_validation`) on the backend, so it can be changed per deployment without a frontend rebuild. See the companion backend module (`openimis-be-household_validation_py`)'s README for the matching `program_eligibility_rules` configuration, which drives the actual eligibility/selection logic for each `benefitPlanCode`.
