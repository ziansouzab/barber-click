const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['.expo/**', 'dist/**', 'web-build/**'],
  },
  {
    files: ['**/*.test.js', 'jest.setup.js', 'src/test/**/*.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
]);
