# openimis-fe-household_validation_js

openIMIS Frontend Household Validation module (`@openimis/fe-household_validation`). Provides the "Generate Validation List" page: a configurable filter panel, list generation/preview against the `openimis-be-household_validation` backend, and the "Upload Validated List" action contributed into the individual/group search screen.

## Individual validation

The generation page reads `validationProgrammes` and resolves the selected benefit-plan code's backend `subject`. `INDIVIDUAL` programmes use person counts, individual-location filters, saved-list preview and Excel generation. Household programmes retain their existing generation, preview and upload paths. A programme change clears geography, targets, date/exclusion filters and generated results. Pending responses are invalidated when their filters or programme change.

When an individual programme is configured, the programme picker also appears for deployments using the historical default frontend configuration. The frontend never infers the subject from a programme name. An unknown programme or a failed contract query cannot generate a list.

Individual defaults use the existing R/W/V pickers (`district`, `gvh`, `village`) without requiring a D/TA location. UMEP maps these to City, Ward and Neighbourhood. Deployments can set the labels and include `ta` if their hierarchy uses it; they should retain their other frontend programme entries when applying configuration:

```json
{
  "validationListFilters": {
    "programs": [
      {
        "code": "UMEP",
        "filters": ["district", "gvh", "village", "targetCount"],
        "requiredFilters": ["district"],
        "labels": { "district": "City", "gvh": "Ward", "village": "Neighbourhood" }
      }
    ]
  }
}
```

`excludeValidated` is added for individual programmes and defaults to false; household `lastVerifiedDate` is omitted. Counts/targets refer to people outside active households. A target is optional unless required by the deployment's frontend filter configuration.

The individual generation response contains the workbook from the backend's saved selection. Preview requests `individualValidationList` by that batch ID and paginates its saved rows, without querying live candidates. It shows issued and currently available/deleted/missing/inaccessible counts. Protected display fields and configured business columns come from the saved response, including legacy saved lists. Export from the summary downloads the generated snapshot; export inside the preview requests an authorized re-export of that batch.

### Validate action and results

`IndividualValidateDialog` is contributed under the **action contribution** key `individual.IndividualsUploadDialog`. It does not register or replace the published reference with that name. Individuals' ordinary Upload and Upload History, and `individual.group.GroupMenu`'s household upload contribution, remain registered. The host only renders this contribution on editable screens; the contributed dialog also honors an explicit `readOnly` prop.

The dialog appears only when an individual backend contract is configured and the caller can query and upload validation workbooks. It accepts `.xlsx` files, displays backend decision labels and blank-row behavior, and offers separate dry-run and commit buttons. A dry run saves no attempt and never refreshes Individuals. A committed result with valid rows invokes the host's `refetch` callback, including partial successes. The workbook's saved batch determines processing; the dialog does not supply a UI-selected programme or hardcoded UMEP fields.

The agreed backend decisions are VERIFIED and NOT_VERIFIED. Blank decisions skip all row changes. Applicable business fields are required for VERIFIED; NOT_VERIFIED may omit them, while supplied values still undergo backend validation. Per-attempt feedback includes applied/skipped/error counts and actual or prospective individual updates. Committed workbooks cannot be resubmitted accidentally through the same dialog result; choose the corrected file to submit another attempt.

Validation history is separate from ordinary individual import history. With history permission, enter a generated batch UUID to load previous validation attempts, or inspect the attempt returned by a commit. The selected batch/attempt pair is used for both result rows and CSV error downloads. Result columns come from backend `raw_row` data, including configured workbook columns. Access-redacted rows are displayed as returned by the backend. Dry-run errors are shown inline; a dry run has no persisted error report.

Attempt results load 20 rows per page using `first`/`offset`, show the total row count and provide Previous/Next controls. Changing attempts or batches resets the page. Error downloads contain the entire selected attempt's error report, independently of the page being viewed.

### Permissions and backend dependencies

| Backend right | Frontend behavior |
| --- | --- |
| `958001` | Generation route/menu, programme contract, generation and generated-workbook download |
| `958002` | Individual Validate/dry-run/commit and existing household upload |
| `958003` | Validation attempt history/results and saved-list preview/re-export |
| `958004` | Individual attempt error downloads and household error-report action |

No new rights are introduced. Validate additionally needs `958001` to discover configured individual programmes. Saved-list preview/re-export additionally require `958001` in this UI, and **the backend currently requires `958003`** for those saved reads; a user with only `958001` can still generate and download the initial workbook. Error-report permission is independent of history permission: an uploader with `958004` can download errors for their returned committed attempt without loading history. Backend access checks remain authoritative.

Requires the APIs from backend work packages [1](https://github.com/nlgfc2024/openimis-be-household_validation_py/pull/40), [2](https://github.com/nlgfc2024/openimis-be-household_validation_py/pull/41) and [3](https://github.com/nlgfc2024/openimis-be-household_validation_py/pull/42). Deliver the [beneficiary-update preservation fix](https://github.com/nlgfc2024/openimis-be-social_protection_py/pull/23) with the workflow. No backend/deployment configuration is changed by this frontend module.

### Verification

Use Node 22 or newer for the test tooling:

```bash
npm install --ignore-scripts --no-package-lock
npm test
npm run lint
npm run build
```

Component and request regressions cover subject/filter dispatch, UMEP's skipped TA level, configured columns, saved pagination/export, independent permissions/read-only actions, contribution preservation, dry-run versus commit, host refresh, batch/attempt-scoped errors and stale response invalidation. These use mocked backend responses; full frontend assembly compilation runs in the existing Malawi CI job.

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

A deployment's override is shallow-merged with the default (`getValidationListFiltersConfig`), so a partial override only needs to specify the top-level keys (`filters`, `requiredFilters`, `programs`) it actually wants to change — an omitted key falls back to the default rather than being silently treated as empty. To deliberately make no filters required, set `requiredFilters: []` explicitly; that's honored as-is, distinct from leaving the key out.

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
