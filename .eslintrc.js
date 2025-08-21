module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    'no-unused-vars': 'off', // Turn off for now since these are existing constructs
    'no-var': 'error',
    'prefer-const': 'error',
  },
  ignorePatterns: [
    'lib/',
    'node_modules/',
    '*.js',
    '!.eslintrc.js',
    '!jest.config.js',
  ],
};