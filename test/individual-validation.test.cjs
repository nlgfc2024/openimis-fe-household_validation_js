const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { act, create } = require('react-test-renderer');
const { parse } = require('graphql');
const createLoader = require('./load-module.cjs');

const load = createLoader();
const api = load('src/util/individualValidation.js');
const { IndividualValidateDialogComponent: Validate } = load('src/components/dialogs/IndividualValidateDialog.js');
const Panel = load('src/components/IndividualValidationPanel.js').default;
const History = load('src/components/ValidationAttemptHistory.js').default;
const Filters = load('src/components/ValidationListFiltersPanel.js').default;
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

test.beforeEach(() => {
  requests = [];
  downloads = [];
  global.FileReader = class { readAsDataURL() { this.result = 'data:application/octet-stream;base64,V09SS0JPT0s='; this.onload(); } };
  global.document = {
    createElement: () => ({ click() { downloads.push(this.download); }, remove() {} }),
    body: { appendChild() {} },
  };
  URL.createObjectURL = () => 'blob:test';
  URL.revokeObjectURL = () => {};
});

function serve(handler = () => ({})) {
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    requests.push({ url, ...body, signal: options.signal, headers: options.headers });
    if (body.query === api.PROGRAMMES_QUERY) return response({ validationProgrammes: [contract] });
    return response(await handler(body));
  };
}
async function mount(Component, props = {}) {
  let view;
  await act(async () => { view = create(React.createElement(Component, { intl: {}, rights, ...props })); });
  return view;
}
async function click(view, key) { await act(async () => { button(view, key).props.onClick(); }); }
async function openAndSelect(view, name = 'validation.xlsx') {
  await act(async () => { view.root.findByType('SearcherActionButton').props.onClick(); });
  await act(async () => { view.root.findByType('input').props.onChange({ target: { files: [{ name }] } }); });
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

test('backend subjects enable individual filters without requiring a frontend programme entry', () => {
  const config = { ...defaults, programs: [{ code: 'PWP', filters: ['district'] }] };
  const individual = resolveActiveFilterSet(config, filters.program, contract);
  assert.equal(individual.programUnmatched, false);
  assert.deepEqual(individual.filters, ['district', 'gvh', 'village', 'targetCount', 'excludeValidated']);
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
    filters: { ...filters, district: { code: 'CITY', uuid: 'city-id' }, excludeVerifiedAfter: '2026-01-01', excludeValidated: true, villages: [{ code: 'V' }] },
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
  assert.deepEqual(published.find((node) => node.props.pubRef === 'location.MwGVHPicker').props.parentLocations, ['city-id']);
  assert.equal(published.some((node) => node.props.pubRef === 'location.MwTAPicker'), false);
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
  await act(async () => { view.root.findAllByType('TextField').find((node) => node.props.select).props.onChange({ target: { value: secondAttempt } }); });
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
  await act(async () => { view.root.findAllByType('TextField').find((node) => node.props.select).props.onChange({ target: { value: secondAttempt } }); });
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
  assert.equal(request.signal.aborted, true);
  await act(async () => { resolve({ generateIndividualValidationList: { batchId, fileName: 'old.xlsx', fileBase64: 'b2xk' } }); });
  assert.equal(button(view, 'export'), undefined);
  act(() => view.unmount());
});

test('GraphQL and HTTP failures are surfaced without a successful result', async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ errors: [{ message: 'Permission denied' }] }) });
  await assert.rejects(api.validationRequest(api.PROGRAMMES_QUERY, {}), /Permission denied/);
  global.fetch = async () => ({ ok: false, status: 403, statusText: 'Forbidden' });
  await assert.rejects(api.validationRequest(api.PROGRAMMES_QUERY, {}), /403 Forbidden/);
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
  await act(async () => { view.root.findByType('input').props.onChange({ target: { files: [{ name: 'valid.xlsx' }] } }); });
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
  assert.equal(pending.signal.aborted, true);
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
