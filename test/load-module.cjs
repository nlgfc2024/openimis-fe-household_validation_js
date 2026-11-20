const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const React = require('react');
const { createStore, applyMiddleware } = require('redux');
const reactRedux = require('react-redux');

module.exports = function createLoader(extraMocks = {}) {
  const cache = new Map();
  const actions = [];
  let store;
  const Dialog = ({ children, ...props }) => React.createElement('Dialog', props, props.open ? children : null);
  const core = {
    apiHeaders: () => ({ 'Content-Type': 'application/json', 'X-CSRFToken': 'test-csrf' }),
    baseApiUrl: '/api',
    formatMessage: (_intl, _module, key) => key,
    formatGraphQLError: (payload) => payload.errors ? { message: 'Server returned data error status', detail: payload.errors.map((error) => error.message).join('; ') } : null,
    formatServerError: (payload) => ({ message: payload.statusText || payload.message, detail: payload.response?.errors?.map((error) => error.message).join('; ') }),
    graphqlWithVariables: (query, variables, types, meta) => async (dispatch) => {
      dispatch({ type: types[0], meta });
      const response = await global.fetch('/api/graphql', {
        method: 'POST', body: JSON.stringify({ query, variables }), credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': 'test-csrf' },
      });
      const payload = response.json ? await response.json() : {};
      if (response.status === 401) dispatch({ type: 'CORE_SESSION_EXPIRY_PROMPT' });
      if (!response.ok) dispatch({ type: 'CORE_ERROR_REPORTED' });
      return dispatch({
        type: types[response.ok ? 1 : 2], meta, error: !response.ok,
        payload: response.ok ? payload : { status: response.status, statusText: response.statusText, response: payload },
      });
    },
    openBlob: (...args) => global.__openBlob(...args),
    withModulesManager: (component) => component,
    PublishedComponent: 'PublishedComponent',
    SearcherActionButton: 'SearcherActionButton',
    FormattedMessage: 'FormattedMessage',
    NumberInput: 'NumberInput',
    WarningBox: 'WarningBox',
    useGraphqlQuery: () => ({ data: null, isLoading: false, error: null }),
    Autocomplete: 'Autocomplete',
  };
  function load(filename) {
    const absolute = path.resolve(filename);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const target = { exports: {} };
    cache.set(absolute, target);
    const source = fs.readFileSync(absolute, 'utf8');
    const { code } = babel.transformSync(source, {
      filename: absolute, babelrc: false, configFile: false,
      presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-react'],
    });
    const mockRequire = (name) => {
      if (Object.hasOwn(extraMocks, name)) return extraMocks[name];
      if (name === '@openimis/fe-core') return core;
      if (name === 'react-intl') return { injectIntl: (component) => component };
      if (name === 'react-redux') return { ...reactRedux, connect: () => (component) => component };
      if (name === 'redux') return { bindActionCreators: (actions) => actions };
      if (name === '@material-ui/core/styles') return { withStyles: () => (Component) => (props) => React.createElement(Component, { classes: {}, ...props }), withTheme: (component) => component };
      if (name === '@material-ui/core') return new Proxy({}, { get: (_obj, key) => (
        key === 'Dialog' ? Dialog : key
      ) });
      if (name.startsWith('@material-ui/icons/')) return 'Icon';
      if (name.startsWith('.')) {
        const resolved = path.resolve(path.dirname(absolute), name);
        return resolved.endsWith('.json') ? require(resolved) : load(`${resolved}.js`);
      }
      return require(name);
    };
    new Function('module', 'exports', 'require', `${code}\n//# sourceURL=${absolute}`)(target, target.exports, mockRequire);
    return target.exports;
  }
  const loader = (relative) => load(path.resolve(__dirname, '..', relative));
  const reducer = (state = {}, action) => action.type === 'TEST_RESET' ? {} : ({
    ...state, householdValidation: loader('src/reducer.js').default(state.householdValidation, action),
  });
  const thunk = ({ dispatch, getState }) => (next) => (action) => {
    if (typeof action === 'function') return action(dispatch, getState);
    actions.push(action);
    return next(action);
  };
  store = createStore(reducer, applyMiddleware(thunk));
  loader.dispatch = store.dispatch;
  loader.getState = store.getState;
  loader.store = store;
  loader.Provider = reactRedux.Provider;
  loader.actions = actions;
  loader.reset = () => { store.dispatch({ type: 'TEST_RESET' }); actions.length = 0; };
  return loader;
};
