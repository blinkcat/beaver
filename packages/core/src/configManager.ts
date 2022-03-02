import fs from 'fs';
import { debuglog, inspect } from 'util';
import { resolve } from '@beaver/utils';
import type { IBeaverConfig } from '@beaver/types';
import paths from './paths';

const debug = debuglog('config');

const defaultConfig: IBeaverConfig = {
  port: 3000,
  host: '0.0.0.0',
  imageInlineSizeLimit: 10000,
  profile: false,
  sourceMap: false,
  fastRefresh: true,
  jsxRuntime: true,
  publicPath: '/',
  ssg: false,
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

      debug(`loadConfig is done, userConfig is:\n${inspect(userConfig)}`);

      this.inputConfig = { ...defaultConfig, ...(userConfig.default || userConfig) };
    }
  }

  resolveConfig(resolvedConfig: IBeaverConfig) {
    Object.assign(this.resolvedConfig, resolvedConfig);
    debug(`config resolved, resolvedConfig is:\n${inspect(this.resolvedConfig)}`);
  }

  // find all relative ts import
  private resolveAllDeps(entry: string) {
    const crequire = require('crequire');
    const deps = [entry];
    const found = new Set<string>(deps);

    while (deps.length) {
      const currentDep = deps.pop();
      const fileDeps = crequire(fs.readFileSync(currentDep!, { encoding: 'utf-8' }));

      if (!Array.isArray(fileDeps)) {
        continue;
      }

      for (let i = 0; i < fileDeps.length; i++) {
        const absDep = resolve.sync(fileDeps[i].path as string, { basedir: currentDep, extensions: ['.js', '.ts'] });
        if (!found.has(absDep) && !/node_modules/.test(absDep) && absDep[0] === '/') {
          deps.push(absDep);
          found.add(absDep);
        }
      }
    }

    return Array.from(found);
  }
}

const configManager = new ConfigManager();

export default configManager;
