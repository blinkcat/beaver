import fs from 'fs';
import { resolve } from '@beaver/utils';
import type { IBeaverConfig } from '@beaver/types';
import paths from './paths';

const defaultConfig: IBeaverConfig = {
  port: 3000,
  host: '0.0.0.0',
  imageInlineSizeLimit: 10000,
  profile: false,
  sourceMap: false,
  fastRefresh: true,
  jsxRuntime: true,
  publicPath: '/',
};

export class ConfigManager {
  inputConfig: IBeaverConfig = {};

  resolvedConfig: IBeaverConfig = {};

  loadConfig() {
    if (!fs.existsSync(paths.appBeaverConfig)) {
      this.inputConfig = { ...defaultConfig };
    } else {
      const allDeps = this.resolveAllDeps(paths.appBeaverConfig);

      /** @see https://babeljs.io/docs/en/babel-register#specifying-options */
      require('@babel/register')({
        //   extensions: ['.es6', '.es', '.js', '.mjs', '.ts'],
        extensions: ['.ts'],
        only: allDeps,
        configFile: false,
        babelrc: false,
        targets: {
          node: 'current',
        },
        presets: [
          [
            require.resolve('@beaver/babel-preset'),
            { react: false, transformRuntime: false, noAnonymousDefaultExport: false, typescript: true, dev: false },
          ],
        ],
      });

      const userConfig = require(paths.appBeaverConfig);

      this.inputConfig = { ...defaultConfig, ...(userConfig.default || userConfig) };
    }
  }

  // find all relative ts import
  private resolveAllDeps(entry: string) {
    const crequire = require('crequire');
    const deps = [entry];
    const found = new Set<string>(deps);

    while (deps.length) {
      const currentDep = deps.pop();
      const fileDeps = crequire(fs.readFileSync(currentDep!, { encoding: 'utf-8' }));

      if (Array.isArray(fileDeps)) {
        fileDeps.forEach(dep => {
          const absDep = resolve.sync(dep.path as string, { basedir: currentDep, extensions: ['.js', '.ts'] });

          if (!found.has(absDep) && !/node_modules/.test(absDep)) {
            deps.push(absDep);
            found.add(absDep);
          }
        });
      }
    }

    return Array.from(found);
  }
}

const configManager = new ConfigManager();

export default configManager;
