/**
 * @babel/polyfill
 * As of Babel 7.4.0, this package has been deprecated in favor of directly including core-js/stable (to polyfill ECMAScript features)
 * and regenerator-runtime/runtime (needed to use transpiled generator functions)
 *
 * 强烈建议配合 @babel-preset-env 使用
 * @see https://babeljs.io/docs/en/babel-preset-env#targets
 * @see https://babeljs.io/docs/en/babel-preset-env#usebuiltins
 */
require("core-js/stable");
require("regenerator-runtime/runtime");
