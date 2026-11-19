const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const React = require('react');

module.exports = function createLoader(extraMocks = {}) {
  const cache = new Map();
  const core = {
    apiHeaders: () => ({ 'Content-Type': 'application/json', 'X-CSRFToken': 'test-csrf' }),
    baseApiUrl: '/api',
    formatMessage: (_intl, _module, key) => key,
    formatGraphQLError: (payload) => payload.errors ?? null,
    formatServerError: (payload) => payload,
    withModulesManager: (component) => component,
    PublishedComponent: 'PublishedComponent',
    SearcherActionButton: 'SearcherActionButton',
    FormattedMessage: 'FormattedMessage',
    NumberInput: 'NumberInput',
    WarningBox: 'WarningBox',
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
      if (name === 'react-redux') return { connect: () => (component) => component };
      if (name === 'redux') return { bindActionCreators: (actions) => actions };
      if (name === '@material-ui/core/styles') return { withStyles: () => (component) => component, withTheme: (component) => component };
      if (name === '@material-ui/core') return new Proxy({}, { get: (_obj, key) => (
        key === 'Dialog' ? ({ children, ...props }) => React.createElement('Dialog', props, props.open ? children : null) : key
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
  return (relative) => load(path.resolve(__dirname, '..', relative));
};
