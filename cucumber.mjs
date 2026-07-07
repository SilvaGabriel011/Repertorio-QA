export default {
  import: ['tests/bdd/support/**/*.ts', 'tests/bdd/steps/**/*.ts'],
  paths: ['tests/bdd/features/**/*.feature'],
  format: ['summary', 'progress'],
  formatOptions: { snippetInterface: 'async-await' },
};
