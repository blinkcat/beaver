/* eslint-disable consistent-return */
// highly inspired by create-react-app/packages/react-scripts/config/modules.js
import fs from 'fs';
import path from 'path';
import { chalk, resolve } from '@beaver/utils';
import { IBeaverPaths } from '@beaver/types';

export default function createModules(paths: IBeaverPaths) {
  /**
   * Get additional module paths based on the baseUrl of a compilerOptions object.
   *
   * @param {Object} options
   */
  function getAdditionalModulePaths(options: any = {}) {
    const { baseUrl } = options;

    if (!baseUrl) {
      return '';
    }

    const baseUrlResolved = path.resolve(paths.appRoot, baseUrl);

    // We don't need to do anything if `baseUrl` is set to `node_modules`. This is
    // the default behavior.
    if (path.relative(paths.appNodeModules, baseUrlResolved) === '') {
      return null;
    }

    // Allow the user set the `baseUrl` to `appSrc`.
    if (path.relative(paths.appSrc, baseUrlResolved) === '') {
      return [paths.appSrc];
    }

    // If the path is equal to the root directory we ignore it here.
    // We don't want to allow importing from the root directly as source files are
    // not transpiled outside of `src`. We do allow importing them with the
    // absolute path (e.g. `src/Components/Button.js`) but we set that up with
    // an alias.
    if (path.relative(paths.appRoot, baseUrlResolved) === '') {
      return null;
    }

    // Otherwise, throw an error.
    throw new Error(
      chalk.red.bold(
        "Your project's `baseUrl` can only be set to `src` or `node_modules`." +
          ' Create React App does not support other values at this time.'
      )
    );
  }

  /**
   * Get webpack aliases based on the baseUrl of a compilerOptions object.
   *
   * @param {*} options
   */
  function getWebpackAliases(options: any = {}) {
    const { baseUrl } = options;

    if (!baseUrl) {
      return {};
    }

    const baseUrlResolved = path.resolve(paths.appRoot, baseUrl);

    if (path.relative(paths.appRoot, baseUrlResolved) === '') {
      return {
        src: paths.appSrc,
      };
    }
  }

  function getModules() {
    // Check if TypeScript is setup
    const hasTsConfig = fs.existsSync(paths.appTsConfig);
    let config;

    // If there's a tsconfig.json we assume it's a
    // TypeScript project and set up the config
    // based on tsconfig.json
    if (hasTsConfig) {
      const ts = require(resolve.sync('typescript', {
        basedir: paths.appNodeModules,
      }));
      config = ts.readConfigFile(paths.appTsConfig, ts.sys.readFile).config;
      // Otherwise we'll check if there is jsconfig.json
      // for non TS projects.
    }

    config = config || {};
    const options = config.compilerOptions || {};

    const additionalModulePaths = getAdditionalModulePaths(options);

    return {
      additionalModulePaths,
      webpackAliases: getWebpackAliases(options),
      hasTsConfig,
    };
  }

  return getModules();
}
