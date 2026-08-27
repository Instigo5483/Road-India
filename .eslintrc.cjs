module.exports = {
  root: true,
  ignorePatterns: ['dist'],
  env: { browser: true, es2021: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  settings: { react: { version: '18.3' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Runs as a Firebase Cloud Messaging service worker, not a normal
      // browser script -- `importScripts` and the `firebase` compat-SDK
      // global it loads are only defined in that environment.
      files: ['public/firebase-messaging-sw.js'],
      env: { serviceworker: true },
      globals: { firebase: 'readonly' },
    },
  ],
}
