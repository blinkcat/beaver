/**
 * 自定义一套lint规则有难度，暂时留下个空架子
 */

//  "@babel/core": "^7.13.15",
//  "@babel/eslint-parser": "^7.13.14",
//  "@typescript-eslint/eslint-plugin": "^4.21.0",
//  "@typescript-eslint/parser": "^4.21.0",
//  "eslint": "^7.24.0",
//  "eslint-plugin-import": "^2.22.1",
//  "eslint-plugin-react": "^7.23.2",
//  "eslint-plugin-jsx-a11y": "^6.4.1",
//  "eslint-plugin-jest": "^24.3.5"

module.exports = {
  root: true,
  /** @see https://eslint.org/docs/user-guide/configuring/language-options#specifying-environments */
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  /** @see https://eslint.org/docs/user-guide/configuring/language-options#using-configuration-files-1 */
  globals: {},
  parser: '@babel/eslint-parser',
  /** @see https://eslint.org/docs/user-guide/configuring/language-options#specifying-parser-options */
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  /** @see https://eslint.org/docs/user-guide/configuring/configuration-files#extending-configuration-files */
  extends: {},
  /** @see https://eslint.org/docs/user-guide/configuring/plugins */
  plugins: ['react', 'import', 'jsx-a11y', 'react-hooks'],
  /** @see https://eslint.org/docs/user-guide/configuring/configuration-files#configuration-based-on-glob-patterns */
  overrides: [
    {
      files: ['**/*.ts?(x)'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
    },
    {
      files: ['**/__tests__/**/*', '**/*.{spec,test}.*'],
      plugins: ['jest'],
    },
  ],
  /** @see https://eslint.org/docs/user-guide/configuring/rules */
  rules: {},
};
