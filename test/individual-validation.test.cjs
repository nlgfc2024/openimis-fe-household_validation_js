const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { createIntl } = require('react-intl');
const { act, create } = require('react-test-renderer');
const { parse } = require('graphql');
const createLoader = require('./load-module.cjs');

const load = createLoader();
const api = load('src/util/individualValidation.js');
const { IndividualValidateDialogComponent: Validate } = load('src/components/dialogs/IndividualValidateDialog.js');
const Panel = load('src/components/IndividualValidationPanel.js').default;
const History = load('src/components/ValidationAttemptHistory.js').default;
const Filters = load('src/components/ValidationListFiltersPanel.js').default;
const Head = load('src/components/HouseholdValidationHeadPanel.js').default;
const householdConstants = load('src/constants.js');
const { resolveActiveFilterSet, DEFAULT_VALIDATION_LIST_FILTERS_CONFIG: defaults } = load('src/util/validationFilters.js');
const rights = [958001, 958002, 958003, 958004];
const batchId = '11111111-1111-4111-8111-111111111111';
const attemptId = '22222222-2222-4222-8222-222222222222';
const secondAttempt = '33333333-3333-4333-8333-333333333333';
const contract = { benefitPlanCode: 'CUSTOM', subject: 'INDIVIDUAL', decisionValues: ['VERIFIED', 'NOT_VERIFIED'], blankDecisionBehavior: 'SKIP_ROW' };
const filters = { program: { code: 'CUSTOM' }, district: { code: 'D' }, targetCount: 2 };
const response = (data) => ({ ok: true, json: async () => ({ data }) });
const button = (view, key) => view.root.findAllByType('Button').find((node) => node.props.children === `individualValidation.${key}`);
const nodeText = (node) => {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(nodeText).join(' ');
  return nodeText(node.children);
};
const text = (view) => nodeText(view.toJSON());
let requests;
let downloads;
const mounted = new Set();
test.afterEach(() => { act(() => { mounted.forEach((view) => view.unmount()); mounted.clear(); }); });

test.beforeEach(() => {
  load.reset();
  requests = [];
  downloads = [];
  global.__openBlob = (_bytes, fileName) => downloads.push(fileName);
  global.FileReader = class { readAsDataURL() { this.result = 'data:application/octet-stream;base64,V09SS0JPT0s='; this.onload(); } };
  global.document = {
    createElement: () => ({ click() { downloads.push(this.download); }, remove() {} }),
    body: { appendChild() {} },
  };
  URL.createObjectURL = () => 'blob:test';
  URL.revokeObjectURL = () => {};
});

function serve(handler = () => ({}), batches = () => ({ count: 1, hasNextPage: false, items: [{ batchId, benefitPlanCode: 'CUSTOM', generatedAt: '2026-11-20', selectedIndividuals: 2 }] })) {
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    requests.push({ url, ...body, signal: options.signal, headers: options.headers });
    if (body.query === api.PROGRAMMES_QUERY) return response({ validationProgrammes: [contract] });
    if (body.query === api.INDIVIDUAL_BATCHES) return response({ individualValidationBatches: await batches(body.variables) });
    return response(await handler(body));
  };
}
async function mount(Component, props = {}) {
  let view;
  await act(async () => { view = create(React.createElement(load.Provider, { store: load.store }, React.createElement(Component, { intl: {}, rights, ...props }))); });
  const update = view.update.bind(view);
  view.update = (element) => update(React.createElement(load.Provider, { store: load.store }, element));
  mounted.add(view);
  return view;
}
async function click(view, key) { await act(async () => { button(view, key).props.onClick(); }); }
async function openAndSelect(view, name = 'validation.xlsx') {
  await act(async () => { view.root.findByType('SearcherActionButton').props.onClick(); });
  await act(async () => { view.root.findByType('Input').props.onChange({ target: { files: [{ name }] } }); });
}

test('all operations parse as GraphQL; individual variables exclude household/date criteria', () => {
  for (const [key, value] of Object.entries(api)) {
    if (typeof value === 'string' && /^(query|mutation)/.test(value)) assert.doesNotThrow(() => parse(value), key);
  }
  const variables = api.individualSelectionVariables({
    ...filters, excludeVerifiedAfter: '2026-01-01', excludeValidated: true,
    gvhs: [{ code: 'GVH' }], villages: [{ code: 'V' }], targetCount: '2',
  });
  assert.equal(variables.targetCount, 2);
  assert.equal(variables.excludeValidated, true);
  assert.equal(variables.gvhCodes, undefined);
  assert.deepEqual(variables.villageCodes, ['V']);
  assert.equal('excludeVerifiedAfter' in variables, false);
  assert.equal(api.programmeFor([contract], { code: 'custom' }), contract);
  assert.equal(api.programmeFor([contract], { code: 'UMEP' }), undefined);
});

test('household upload requests stable error codes for primary-worker guidance', () => {
  assert.ok(householdConstants.UPLOAD_VALIDATION_LIST_RESULT_PROJECTION.includes('errorCodes'));
  assert.equal(
    householdConstants.PRIMARY_WORKER_NATIONAL_ID_REQUIRED,
    'PRIMARY_WORKER_NATIONAL_ID_REQUIRED',
  );
});

test('backend subjects enable individual filters without requiring a frontend programme entry', () => {
  const config = { ...defaults, programs: [{ code: 'PWP', filters: ['district'] }] };
  const individual = resolveActiveFilterSet(config, filters.program, contract);
  assert.equal(individual.programUnmatched, false);
  assert.deepEqual(individual.filters, ['district', 'ta', 'gvh', 'village', 'targetCount', 'excludeValidated']);
  assert.deepEqual(individual.requiredFilters, ['program', 'district']);
  assert.deepEqual(resolveActiveFilterSet(defaults).filters, defaults.filters);
  const household = resolveActiveFilterSet(config, { code: 'PWP' }, { subject: 'HOUSEHOLD' });
  assert.deepEqual(household.filters, ['district']);
});

test('permission codes are independent and read-only prevents validation', () => {
  assert.deepEqual(api.validationPermissions([958002, 958004]), { query: false, upload: true, history: false, errors: true });
  assert.equal(api.validationPermissions(rights, true).upload, false);
  assert.deepEqual(api.validationPermissions([953001, 953002, 953003, 953004]), { query: false, upload: false, history: false, errors: false });
});

test('Validate is hidden without permissions, configuration or editable context', async () => {
  serve();
  for (const props of [{ rights: [] }, { rights: [958001] }, { rights, readOnly: true }]) {
    const view = await mount(Validate, props);
    assert.equal(view.toJSON(), null);
    act(() => view.unmount());
  }
  global.fetch = async () => response({ validationProgrammes: [{ benefitPlanCode: 'PWP', subject: 'HOUSEHOLD' }] });
  const view = await mount(Validate);
  assert.equal(view.toJSON(), null);
  act(() => view.unmount());
});

test('individual Validate contribution preserves normal Upload refs and household contribution', () => {
  const module = load('src/index.js').HouseholdValidationModule({});
  assert.ok(module['individual.IndividualsUploadDialog']);
  assert.ok(module['individual.group.GroupMenu']);
  assert.equal(module.refs.some((ref) => ref.key === 'individual.IndividualsUploadDialog'), false);
  assert.equal(module.refs.some((ref) => ref.key === 'individual.IndividualsUploadHistoryDialog'), false);
  assert.ok(module.refs.some((ref) => ref.key === 'householdValidation.UploadValidatedListDialog'));
});

test('programme changes clear target, dates, geography and opt-in exclusion; individual geography has usable options', async () => {
  let changed;
  const view = await mount(Filters, {
    classes: {}, modulesManager: { getConf: () => defaults }, contract, programmes: [contract],
    filters: { ...filters, tas: [{ code: 'CONST', uuid: 'const-id' }], district: { code: 'CITY', uuid: 'city-id' }, excludeVerifiedAfter: '2026-01-01', excludeValidated: true, villages: [{ code: 'V' }] },
    onChangeFilters: (value) => { changed = value; },
  });
  const published = view.root.findAllByType('PublishedComponent');
  const picker = published.find((node) => node.props.pubRef === 'socialProtection.BenefitPlanPicker');
  act(() => picker.props.onChange({ code: 'PWP' }));
  assert.equal(changed.targetCount, undefined);
  assert.equal(changed.excludeVerifiedAfter, undefined);
  assert.equal(changed.excludeValidated, undefined);
  assert.deepEqual(changed.villages, []);
  const options = [{ uuid: 'one' }, { uuid: 'two' }];
  assert.deepEqual(published.find((node) => node.props.pubRef === 'location.MwGVHPicker').props.filterOptions(options), options);
  assert.deepEqual(published.find((node) => node.props.pubRef === 'location.MwGVHPicker').props.parentLocations, ['const-id']);
  assert.equal(published.some((node) => node.props.pubRef === 'location.MwTAPicker'), true);
  assert.deepEqual(published.find((node) => node.props.pubRef === 'location.MwVillagePicker').props.filterOptions(options), options);
  act(() => view.unmount());
});

test('dry run saves no attempt and commit refreshes results and downloads the matching error report', async () => {
  let refreshes = 0;
  serve(({ query, variables }) => {
    if (query === api.UPLOAD_INDIVIDUAL_LIST) return { uploadIndividualValidationList: {
      batchId, uploadAttemptId: variables.dryRun ? null : attemptId, dryRun: variables.dryRun,
      status: 'PARTIAL_SUCCESS', rowsRead: 3, rowsApplied: 1, rowsSkipped: 1, errors: 1,
      individualsVerified: 1, individualsNotVerified: 0, individualsUpdated: variables.dryRun ? 0 : 1,
      wouldUpdate: 1, errorMessages: ['Row 3: configured field is required'],
    } };
    if (query === api.INDIVIDUAL_ERROR_REPORT) return { individualValidationErrorReport: { batchId, uploadAttemptId: attemptId, fileName: 'errors.csv', fileBase64: 'ZXJyb3Jz' } };
    return {};
  });
  const view = await mount(Validate, { rights: [958001, 958002, 958004], downloadWithIconButton: true, refetch: () => { refreshes += 1; } });
  await openAndSelect(view);
  await click(view, 'dryRun');
  assert.equal(refreshes, 0);
  assert.ok(text(view).includes('dryRunNotice'));
  assert.equal(button(view, 'downloadErrors'), undefined);
  assert.equal(requests.some((r) => r.query === api.INDIVIDUAL_ATTEMPTS), false);
  await click(view, 'commit');
  assert.equal(refreshes, 1);
  assert.ok(text(view).includes('PARTIAL_SUCCESS'));
  assert.ok(text(view).includes('configured field is required'));
  assert.equal(!!button(view, 'commit').props.disabled, true);
  await click(view, 'downloadErrors');
  const report = requests.find((r) => r.query === api.INDIVIDUAL_ERROR_REPORT);
  assert.deepEqual(report.variables, { batchId, uploadAttemptId: attemptId });
  assert.deepEqual(downloads, ['errors.csv']);
  const uploads = requests.filter((r) => r.query === api.UPLOAD_INDIVIDUAL_LIST);
  assert.deepEqual(uploads.map((r) => r.variables.dryRun), [true, false]);
  assert.equal(uploads[0].variables.sourceFileName, 'validation.xlsx');
  assert.equal(uploads[0].headers['X-CSRFToken'], 'test-csrf');
  await click(view, 'close');
  assert.equal(view.root.findByType('Dialog').props.open, false);
  act(() => view.unmount());
});

test('history renders backend-configured fields and uses the selected attempt for rows and errors', async () => {
  serve(({ query, variables }) => {
    if (query === api.INDIVIDUAL_ATTEMPTS) return { individualValidationAttempts: { attempts: [
      { upload_attempt_id: attemptId, status: 'PROCESSED' }, { upload_attempt_id: secondAttempt, status: 'PARTIAL_SUCCESS' },
    ] } };
    if (query === api.INDIVIDUAL_ATTEMPT_ROWS) return { individualValidationAttemptRows: { items: [
      { id: 'row', row_number: 2, status: 'ERROR', raw_row: { 'Deployment field': variables.uploadAttemptId }, error_message: 'Required' },
      { id: 'redacted', row_number: 3, status: 'ERROR', raw_row: {}, redacted: true, error_message: 'Row data is not currently accessible.' },
    ] } };
    if (query === api.INDIVIDUAL_ERROR_REPORT) return { individualValidationErrorReport: { fileName: `${variables.uploadAttemptId}.csv`, fileBase64: 'ZXJyb3Jz' } };
    return {};
  });
  const view = await mount(History, { result: { batchId, uploadAttemptId: attemptId } });
  assert.ok(text(view).includes('Deployment field'));
  assert.ok(text(view).includes('Row data is not currently accessible.'));
  await act(async () => { view.root.findAllByType('TextField').find((node) => node.props.label === 'individualValidation.attempt').props.onChange({ target: { value: secondAttempt } }); });
  await click(view, 'downloadErrors');
  assert.equal(requests.filter((r) => r.query === api.INDIVIDUAL_ATTEMPT_ROWS).at(-1).variables.uploadAttemptId, secondAttempt);
  assert.deepEqual(downloads, [`${secondAttempt}.csv`]);
  await act(async () => { view.update(React.createElement(History, { intl: {}, rights: [958003], result: { batchId, uploadAttemptId: attemptId } })); });
  assert.equal(button(view, 'downloadErrors'), undefined);
  act(() => view.unmount());
});

test('attempt history pages rows and resets paging on attempt changes without limiting error reports', async () => {
  serve(({ query, variables }) => {
    if (query === api.INDIVIDUAL_ATTEMPTS) return { individualValidationAttempts: { attempts: [
      { upload_attempt_id: attemptId }, { upload_attempt_id: secondAttempt },
    ] } };
    if (query === api.INDIVIDUAL_ATTEMPT_ROWS) return { individualValidationAttemptRows: {
      count: 21, hasNextPage: variables.offset === 0,
      items: [{ id: `${variables.offset}`, row_number: variables.offset + 2, status: 'ERROR', raw_row: { 'Configured field': 'Invalid' } }],
    } };
    if (query === api.INDIVIDUAL_ERROR_REPORT) return { individualValidationErrorReport: { fileName: 'all-errors.csv', fileBase64: 'ZXJyb3Jz' } };
    return {};
  });
  const view = await mount(History, { result: { batchId, uploadAttemptId: attemptId } });
  assert.deepEqual(requests.filter((r) => r.query === api.INDIVIDUAL_ATTEMPT_ROWS).at(-1).variables,
    { batchId, uploadAttemptId: attemptId, first: 20, offset: 0 });
  assert.equal(button(view, 'previous').props.disabled, true);
  assert.ok(text(view).includes('attemptRowCount: 21'));
  await click(view, 'next');
  assert.deepEqual(requests.filter((r) => r.query === api.INDIVIDUAL_ATTEMPT_ROWS).at(-1).variables,
    { batchId, uploadAttemptId: attemptId, first: 20, offset: 20 });
  assert.equal(button(view, 'next').props.disabled, true);
  await click(view, 'downloadErrors');
  assert.deepEqual(requests.find((r) => r.query === api.INDIVIDUAL_ERROR_REPORT).variables,
    { batchId, uploadAttemptId: attemptId });
  assert.deepEqual(downloads, ['all-errors.csv']);
  await act(async () => { view.root.findAllByType('TextField').find((node) => node.props.label === 'individualValidation.attempt').props.onChange({ target: { value: secondAttempt } }); });
  assert.deepEqual(requests.filter((r) => r.query === api.INDIVIDUAL_ATTEMPT_ROWS).at(-1).variables,
    { batchId, uploadAttemptId: secondAttempt, first: 20, offset: 0 });
  act(() => view.unmount());
});

test('individual preview uses saved batch and configured fields, with person counts and snapshot export', async () => {
  serve(({ query, variables }) => {
    if (query === api.GENERATE_INDIVIDUAL_LIST) return { generateIndividualValidationList: { batchId, eligibleIndividuals: 8, selectedIndividuals: 2, fileName: 'saved.xlsx', fileBase64: 'c2F2ZWQ=' } };
    if (query === api.EXPORT_INDIVIDUAL_LIST) return { individualValidationListExport: { batchId, fileName: 'authorized.xlsx', fileBase64: 'c2F2ZWQ=' } };
    if (query === api.SAVED_INDIVIDUAL_LIST) return { individualValidationList: {
      batchId, selectedIndividuals: 2, availableIndividuals: 1, deletedIndividuals: 1, missingIndividuals: 0, inaccessibleIndividuals: 0,
      displayFields: [{ column_name: 'District', location_type: 'D' }],
      columns: [{ key: 'custom', column_name: 'Custom configured value' }],
      items: [{ individual_uuid: 'saved-person', first_name: 'Saved Name', District: 'Saved district', 'Custom configured value': 'Snapshot value' }],
      hasNextPage: variables.offset === 0,
    } };
    return {};
  });
  const view = await mount(Panel, { filters, canGenerate: true });
  await click(view, 'generate');
  assert.ok(text(view).includes('eligibleIndividuals: 8'));
  assert.ok(text(view).includes('selectedIndividuals: 2'));
  await click(view, 'preview');
  assert.ok(text(view).includes('Saved Name'));
  assert.ok(text(view).includes('Custom configured value'));
  assert.ok(text(view).includes('Snapshot value'));
  assert.ok(text(view).includes('Saved district'));
  await click(view, 'next');
  assert.deepEqual(requests.filter((r) => r.query === api.SAVED_INDIVIDUAL_LIST).at(-1).variables, { batchId, first: 20, offset: 20 });
  await act(async () => { view.root.findByType('Dialog').findAllByType('Button').find((node) => node.props.children === 'individualValidation.export').props.onClick(); });
  assert.deepEqual(requests.find((r) => r.query === api.EXPORT_INDIVIDUAL_LIST).variables, { batchId });
  await click(view, 'export');
  assert.deepEqual(downloads, ['authorized.xlsx', 'saved.xlsx']);
  await act(async () => { view.update(React.createElement(Panel, { intl: {}, rights, filters: { ...filters, targetCount: 1 }, canGenerate: true })); });
  assert.equal(button(view, 'export'), undefined);
  assert.equal(view.root.findByType('Dialog').props.open, false);
  act(() => view.unmount());
});

test('programme/filter edits invalidate in-flight individual generation responses', async () => {
  let resolve;
  serve(() => new Promise((done) => { resolve = done; }));
  const view = await mount(Panel, { filters, canGenerate: true });
  await click(view, 'generate');
  const request = requests.at(-1);
  await act(async () => { view.update(React.createElement(Panel, { intl: {}, rights, filters: { ...filters, program: { code: 'OTHER' } }, canGenerate: true })); });
  assert.equal(Object.keys(load.getState().householdValidation.individualRequests).length, 0);
  await act(async () => { resolve({ generateIndividualValidationList: { batchId, fileName: 'old.xlsx', fileBase64: 'b2xk' } }); });
  assert.equal(button(view, 'export'), undefined);
  act(() => view.unmount());
});

test('GraphQL errors and HTTP 400 details are surfaced through the core request actions', async () => {
  const { requestIndividualValidation } = load('src/actions.js');
  global.fetch = async () => ({ ok: true, json: async () => ({ errors: [{ message: 'Permission denied' }] }) });
  await load.dispatch(requestIndividualValidation('errors', api.PROGRAMMES_QUERY, {}));
  assert.match(load.getState().householdValidation.individualRequests.errors.error, /Permission denied/);
  global.fetch = async () => ({ ok: false, status: 400, statusText: 'Bad Request', json: async () => ({ errors: [{ message: 'Invalid batch variable' }] }) });
  await load.dispatch(requestIndividualValidation('errors', api.PROGRAMMES_QUERY, {}));
  assert.match(load.getState().householdValidation.individualRequests.errors.error, /Invalid batch variable/);
});

test('invalid files never upload, and upload permission alone cannot expose reports or history', async () => {
  serve(({ query }) => query === api.UPLOAD_INDIVIDUAL_LIST ? {
    uploadIndividualValidationList: { batchId, uploadAttemptId: attemptId, dryRun: false, status: 'FAILED', rowsApplied: 0, errors: 1 },
  } : {});
  let refreshed = false;
  const view = await mount(Validate, { rights: [958001, 958002], downloadWithIconButton: true, refetch: () => { refreshed = true; } });
  await openAndSelect(view, 'incorrect.csv');
  assert.equal(!!button(view, 'dryRun').props.disabled, true);
  assert.ok(text(view).includes('invalidFile'));
  assert.equal(requests.some((request) => request.query === api.UPLOAD_INDIVIDUAL_LIST), false);
  await act(async () => { view.root.findByType('Input').props.onChange({ target: { files: [{ name: 'valid.xlsx' }] } }); });
  await click(view, 'commit');
  assert.equal(refreshed, false);
  assert.equal(button(view, 'downloadErrors'), undefined);
  assert.equal(button(view, 'loadHistory'), undefined);
  act(() => view.unmount());
});

test('read-only/permission changes invalidate pending validation responses and prevent refresh', async () => {
  let finish;
  let refreshes = 0;
  serve(() => new Promise((resolve) => { finish = resolve; }));
  const props = { intl: {}, rights, downloadWithIconButton: true, refetch: () => { refreshes += 1; } };
  const view = await mount(Validate, props);
  await openAndSelect(view);
  await click(view, 'commit');
  const pending = requests.at(-1);
  await act(async () => { view.update(React.createElement(Validate, { ...props, readOnly: true })); });
  assert.equal(Object.keys(load.getState().householdValidation.individualRequests).length, 0);
  await act(async () => { finish({ uploadIndividualValidationList: { batchId, uploadAttemptId: attemptId, rowsApplied: 1, dryRun: false } }); });
  assert.equal(refreshes, 0);
  assert.equal(view.toJSON(), null);
  act(() => view.unmount());
});

test('generation and saved preview enforce their distinct permissions', async () => {
  serve(({ query }) => query === api.GENERATE_INDIVIDUAL_LIST ? {
    generateIndividualValidationList: { batchId, fileName: 'saved.xlsx', fileBase64: 'c2F2ZWQ=' },
  } : {});
  const view = await mount(Panel, { rights: [], filters, canGenerate: true });
  assert.equal(button(view, 'generate').props.disabled, true);
  await click(view, 'generate');
  assert.equal(requests.length, 0);
  await act(async () => { view.update(React.createElement(Panel, { intl: {}, rights: [958001], filters, canGenerate: true })); });
  await click(view, 'generate');
  assert.equal(button(view, 'preview').props.disabled, true);
  await click(view, 'preview');
  assert.equal(requests.some((request) => request.query === api.SAVED_INDIVIDUAL_LIST), false);
  assert.equal(button(view, 'export').props.disabled, false);
  act(() => view.unmount());
});

test('late household generation and preview responses cannot repopulate cleared programme state', () => {
  const { default: reducer, ACTION_TYPE } = load('src/reducer.js');
  for (const [type, field] of [[ACTION_TYPE.GENERATE_VALIDATION_LIST, 'validationListResult'], [ACTION_TYPE.FETCH_VALIDATION_PREVIEW, 'validationPreviewData']]) {
    let state = reducer(undefined, { type: `${type}_REQ`, meta: { requestId: 1 } });
    state = reducer(state, { type: `${type}_CLEAR` });
    assert.equal(reducer(state, { type: `${type}_RESP`, meta: { requestId: 1 }, payload: { data: { generateHouseholdValidationList: { batchId: 'old' }, householdValidationPreview: { edges: [{ node: { groupUuid: 'old' } }] } } } }), state, field);
    assert.equal(reducer(state, { type: `${type}_ERR`, meta: { requestId: 1 }, payload: 'old failure' }), state);
  }
});

const headProps = () => ({
  classes: {}, modulesManager: { getConf: () => defaults },
  edited: { district: { code: 'CITY' }, microCatchment: { code: 'CATCHMENT' }, targetCount: 2 },
  onEditedChanged() {}, generateValidationList() {}, clearValidationLists() {}, clearValidationPreview() {},
});

const hintIntl = () => createIntl({
  locale: 'en',
  messages: {
    ...Object.fromEntries(Object.entries(require('../src/translations/en.json')).map(([key, value]) => [`householdValidation.${key}`, value])),
    'location.Location0Picker.label': 'City',
    'location.Location1Picker.label': 'Constituency',
    'location.Location2Picker.label': 'Ward',
    'location.Location3Picker.label': 'Neighbourhood',
  },
});
const touchHeadFilters = (view) => act(() => {
  const panel = view.root.findByType(Filters);
  panel.props.onChangeFilters(panel.props.filters);
});
const missingHint = (view) => view.root.findAllByType('WarningBox').find((node) => node.props.title === 'Missing required filters')?.props.description;

test('household hint names only missing default required filters and clears when complete', async () => {
  global.fetch = async () => ({ ok: false, status: 400, json: async () => ({ errors: [{ message: 'Unavailable' }] }) });
  const props = { ...headProps(), intl: hintIntl(), edited: {} };
  const view = await mount(Head, props);
  touchHeadFilters(view);
  assert.equal(missingHint(view), 'Complete these required filters to generate a validation list: District, Micro Catchment, Total Households Target.');
  const updated = { ...props, edited: { district: { code: 'CITY' } } };
  await act(async () => view.update(React.createElement(Head, { ...updated, rights })));
  assert.equal(missingHint(view), 'Complete these required filters to generate a validation list: Micro Catchment, Total Households Target.');
  await act(async () => view.update(React.createElement(Head, { ...props, rights, edited: headProps().edited })));
  assert.equal(missingHint(view), undefined);
});

test('programme hints use configured required filters, UMEP language labels and selected multi-value state', async () => {
  global.fetch = async () => response({ validationProgrammes: [contract, { benefitPlanCode: 'PWP', subject: 'HOUSEHOLD' }] });
  const props = {
    ...headProps(), intl: hintIntl(), edited: { program: { code: 'CUSTOM' } },
    modulesManager: { getConf: () => ({ programs: [
      { code: 'CUSTOM', filters: ['district', 'ta', 'gvh', 'village', 'targetCount'], requiredFilters: ['district', 'ta', 'gvh', 'village', 'targetCount'] },
      { code: 'PWP', filters: ['district', 'microCatchment', 'targetCount'], requiredFilters: ['microCatchment'] },
    ] }) },
  };
  const view = await mount(Head, props);
  touchHeadFilters(view);
  assert.equal(missingHint(view), 'Complete these required filters to generate a validation list: City, Constituency, Ward, Neighbourhood, Total Individuals Target.');
  const edited = { ...props.edited, district: { uuid: 'city' }, tas: [{ uuid: 'constituency' }], gvhs: [{ uuid: 'ward' }], villages: [{ uuid: 'neighbourhood' }], targetCount: 0 };
  await act(async () => view.update(React.createElement(Head, { ...props, rights, edited })));
  assert.equal(missingHint(view), 'Complete these required filters to generate a validation list: Total Individuals Target.');
  await act(async () => view.update(React.createElement(Head, { ...props, rights, edited: { ...edited, targetCount: 2 } })));
  assert.equal(missingHint(view), undefined);
  await act(async () => view.update(React.createElement(Head, { ...props, rights, edited: { program: { code: 'PWP' } } })));
  assert.equal(missingHint(view), 'Complete these required filters to generate a validation list: Micro Catchment.');
});

test('required-filter checks share alias, date and positive-target semantics with the hint', () => {
  const { missingRequiredGenerationFilters, hasRequiredGenerationFilters } = load('src/util/filters.js');
  const required = ['ta', 'gvh', 'village', 'lastVerifiedDate', 'targetCount', 'ta'];
  const values = { tas: [{ uuid: 'ta' }], gvhs: [{ uuid: 'ward' }], villages: [{ uuid: 'village' }], excludeVerifiedAfter: '2026-11-20', targetCount: '2' };
  assert.equal(hasRequiredGenerationFilters(values, required), true);
  assert.deepEqual(missingRequiredGenerationFilters({ ...values, tas: [], targetCount: -1 }, required), ['ta', 'targetCount']);
  assert.deepEqual(missingRequiredGenerationFilters({}, []), []);
});

test('household generation stays available when programme discovery fails and shows backend details', async () => {
  global.fetch = async () => ({ ok: false, status: 400, statusText: 'Bad Request', json: async () => ({ errors: [{ message: 'Programme discovery unavailable' }] }) });
  let generated = 0;
  const props = { ...headProps(), generateValidationList() { generated += 1; }, errorValidationLists: { message: 'Server returned data error status', detail: 'Backend selection explanation' } };
  const view = await mount(Head, props);
  const generate = view.root.findAllByType('Button').find((node) => node.props.children === 'generateValidationList.generateButton');
  assert.equal(generate.props.disabled, false);
  act(() => generate.props.onClick());
  assert.equal(generated, 1);
  assert.ok(text(view).includes('Backend selection explanation'));
  assert.equal(text(view).includes('Server returned data error status'), false);
  await act(async () => view.update(React.createElement(Head, { intl: {}, rights, ...props, edited: { ...props.edited, program: { code: 'UMEP', type: 'INDIVIDUAL' } } })));
  assert.equal(button(view, 'generate').props.disabled, true);
});

test('programme failure is visible and can be retried instead of looking like empty configuration', async () => {
  let failed = true;
  global.fetch = async () => failed
    ? { ok: false, status: 400, statusText: 'Bad Request', json: async () => ({ errors: [{ message: 'Programme service unavailable' }] }) }
    : response({ validationProgrammes: [contract] });
  const view = await mount(Validate, { downloadWithIconButton: true });
  assert.ok(text(view).includes('programmeLoadFailed'));
  assert.ok(text(view).includes('Programme service unavailable'));
  failed = false;
  await click(view, 'retryProgrammes');
  assert.ok(view.root.findByType('SearcherActionButton'));
  assert.equal(button(view, 'retryProgrammes'), undefined);
});

test('all individual geographic pickers inherit language-pack labels and direct-parent scopes', async () => {
  const view = await mount(Filters, {
    classes: {}, modulesManager: { getConf: () => ({ ...defaults, labels: { district: 'Wrong override' } }) },
    contract, programmes: [contract],
    filters: { ...filters, district: { code: 'CITY', uuid: 'city' }, tas: [{ uuid: 'constituency' }], gvhs: [{ uuid: 'ward' }] },
    onChangeFilters() {},
  });
  const pickers = view.root.findAllByType('PublishedComponent');
  const find = (ref) => pickers.find((node) => node.props.pubRef === `location.${ref}`).props;
  for (const ref of ['LocationPicker', 'MwTAPicker', 'MwGVHPicker', 'MwVillagePicker']) assert.equal(find(ref).label, undefined);
  assert.equal(find('MwTAPicker').parentLocation.uuid, 'city');
  assert.deepEqual(find('MwGVHPicker').parentLocations, ['constituency']);
  assert.deepEqual(find('MwVillagePicker').parentLocations, ['ward']);
  assert.equal(find('MwGVHPicker').readOnly, false);
});

test('saved preview and export can finish independently', async () => {
  let finishPreview;
  serve(({ query }) => {
    if (query === api.GENERATE_INDIVIDUAL_LIST) return { generateIndividualValidationList: { batchId, fileName: 'initial.xlsx', fileBase64: 'eA==' } };
    if (query === api.SAVED_INDIVIDUAL_LIST) return new Promise((resolve) => { finishPreview = resolve; });
    if (query === api.EXPORT_INDIVIDUAL_LIST) return { individualValidationListExport: { fileName: 'export.xlsx', fileBase64: 'eA==' } };
    return {};
  });
  const view = await mount(Panel, { filters, canGenerate: true });
  await click(view, 'generate');
  await click(view, 'preview');
  const exportButton = view.root.findByType('Dialog').findAllByType('Button').find((node) => node.props.children === 'individualValidation.export');
  assert.equal(exportButton.props.disabled, false);
  await act(async () => { exportButton.props.onClick(); });
  assert.deepEqual(downloads, ['export.xlsx']);
  await act(async () => finishPreview({ individualValidationList: { items: [{ first_name: 'Preview survives export' }], columns: [], displayFields: [] } }));
  assert.ok(text(view).includes('Preview survives export'));
});

test('history page and attempt changes do not cancel the original error-report download', async () => {
  let finishReport;
  serve(({ query, variables }) => {
    if (query === api.INDIVIDUAL_ATTEMPTS) return { individualValidationAttempts: { attempts: [{ upload_attempt_id: attemptId }, { upload_attempt_id: secondAttempt }] } };
    if (query === api.INDIVIDUAL_ATTEMPT_ROWS) return { individualValidationAttemptRows: { count: 21, hasNextPage: variables.offset === 0, items: [{ id: `${variables.offset}`, row_number: variables.offset + 2, raw_row: {} }] } };
    if (query === api.INDIVIDUAL_ERROR_REPORT) return new Promise((resolve) => { finishReport = resolve; });
    return {};
  });
  const view = await mount(History, { result: { batchId, uploadAttemptId: attemptId } });
  await click(view, 'downloadErrors');
  await click(view, 'next');
  await act(async () => view.root.findAllByType('TextField').find((node) => node.props.label === 'individualValidation.attempt').props.onChange({ target: { value: secondAttempt } }));
  await act(async () => finishReport({ individualValidationErrorReport: { fileName: 'original-attempt.csv', fileBase64: 'eA==' } }));
  assert.deepEqual(downloads, ['original-attempt.csv']);
  assert.equal(requests.find((request) => request.query === api.INDIVIDUAL_ERROR_REPORT).variables.uploadAttemptId, attemptId);
});

test('choosing another workbook preserves selected history and its page', async () => {
  serve(({ query, variables }) => {
    if (query === api.UPLOAD_INDIVIDUAL_LIST) return { uploadIndividualValidationList: { batchId, uploadAttemptId: attemptId, dryRun: false, rowsApplied: 1, status: 'PROCESSED' } };
    if (query === api.INDIVIDUAL_ATTEMPTS) return { individualValidationAttempts: { attempts: [{ upload_attempt_id: attemptId }] } };
    if (query === api.INDIVIDUAL_ATTEMPT_ROWS) return { individualValidationAttemptRows: { count: 21, hasNextPage: variables.offset === 0, items: [{ id: 'saved-page', row_number: variables.offset + 2, raw_row: {} }] } };
    return {};
  });
  const view = await mount(Validate, { downloadWithIconButton: true });
  await openAndSelect(view);
  await click(view, 'commit');
  await click(view, 'next');
  const count = requests.filter((request) => request.query === api.INDIVIDUAL_ATTEMPT_ROWS).length;
  await act(async () => view.root.findByType('Input').props.onChange({ target: { files: [{ name: 'correction.xlsx' }] } }));
  assert.equal(view.root.findAllByType('TextField').find((node) => node.props.label === 'individualValidation.batch').props.value, batchId);
  assert.equal(view.root.findAllByType('TextField').find((node) => node.props.label === 'individualValidation.attempt').props.value, attemptId);
  assert.equal(requests.filter((request) => request.query === api.INDIVIDUAL_ATTEMPT_ROWS).length, count);
  assert.equal(button(view, 'previous').props.disabled, false);
});

test('history picks issued lists by descriptive summaries and loads older pages', async () => {
  const oldBatch = '44444444-4444-4444-8444-444444444444';
  serve(({ query }) => query === api.INDIVIDUAL_ATTEMPTS ? { individualValidationAttempts: { attempts: [] } } : {}, ({ offset }) => ({
    count: 21, hasNextPage: offset === 0,
    items: [{ batchId: offset ? oldBatch : batchId, benefitPlanCode: 'UMEP', generatedAt: offset ? '2026-10-01' : '2026-11-20', sourceFileName: offset ? 'old-list.xlsx' : 'recent-list.xlsx', selectedIndividuals: 20 }],
  }));
  const view = await mount(History);
  const batchPicker = () => view.root.findAllByType('TextField').find((node) => node.props.label === 'individualValidation.batch');
  assert.equal(batchPicker().props.select, true);
  assert.ok(text(view).includes('recent-list.xlsx'));
  await click(view, 'olderBatches');
  assert.ok(text(view).includes('old-list.xlsx'));
  await act(async () => batchPicker().props.onChange({ target: { value: oldBatch } }));
  assert.equal(requests.filter((request) => request.query === api.INDIVIDUAL_ATTEMPTS).at(-1).variables.batchId, oldBatch);
});

test('core transport retains session handling and shared downloads receive decoded bytes', async () => {
  const { requestIndividualValidation } = load('src/actions.js');
  global.fetch = async () => ({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({ errors: [{ message: 'Session expired' }] }) });
  await load.dispatch(requestIndividualValidation('session', api.PROGRAMMES_QUERY, {}));
  assert.ok(load.actions.some((action) => action.type === 'CORE_SESSION_EXPIRY_PROMPT'));
  let opened;
  global.__openBlob = (...args) => { opened = args; };
  api.openValidationFile({ fileName: 'errors.csv', fileBase64: 'dGVzdA==' });
  assert.equal(Buffer.from(opened[0]).toString(), 'test');
  assert.equal(opened[1], 'errors.csv');
  assert.equal(opened[2], 'csv');
});

test('late individual responses cannot overwrite newer requests or resurrect cleared instances', () => {
  const { default: reducer, ACTION_TYPE } = load('src/reducer.js');
  const type = ACTION_TYPE.INDIVIDUAL_VALIDATION;
  let state = reducer(undefined, { type: `${type}_REQ`, meta: { requestKey: 'preview', requestId: 1 } });
  state = reducer(state, { type: `${type}_REQ`, meta: { requestKey: 'preview', requestId: 2 } });
  assert.equal(reducer(state, { type: `${type}_RESP`, meta: { requestKey: 'preview', requestId: 1 }, payload: { data: {} } }), state);
  state = reducer(state, { type: `${type}_CLEAR`, meta: { requestKey: 'preview' } });
  assert.equal(reducer(state, { type: `${type}_ERR`, meta: { requestKey: 'preview', requestId: 2 }, error: true, payload: { message: 'Old error' } }), state);
});
