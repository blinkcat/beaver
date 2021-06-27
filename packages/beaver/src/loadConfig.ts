import fs from 'fs';
import resolve from 'resolve';
import type { Configuration as WebpackConfig } from 'webpack';
import type { Configuration as WebpackDevServerConfig } from 'webpack-dev-server';
import paths from './paths';

export interface IBeaverConfig {
  devtool?: WebpackConfig['devtool'];
  jsPrefix?: string;
  cssPrefix?: string;
  mediaPrefix?: string;
  publicPath?: Required<WebpackConfig>['output']['publicPath'];

  title?: string;
  cache?: WebpackConfig['cache'];
  alias?: Required<WebpackConfig>['resolve']['alias'];
  devServer?: WebpackDevServerConfig;
  fastRefresh?: boolean;
  plugins?: Array<string | [string, { [index: string]: any }]>;
}

const defaultConfig: IBeaverConfig = {
  jsPrefix: 'static/js',
  cssPrefix: 'static/css',
  mediaPrefix: 'static/media',
  publicPath: '/',
};

export default function loadConfig() {
  if (!fs.existsSync(paths.appBeaverConfig)) {
    return defaultConfig;
  }

  const allDeps = resolveAllDeps(paths.appBeaverConfig);

  /** @see https://babeljs.io/docs/en/babel-register#specifying-options */
  require('@babel/register')({
    extensions: ['.es6', '.es', '.js', '.mjs', '.ts'],
    only: allDeps,
    configFile: false,
    babelrc: false,
    targets: {
      node: 'current',
    },
    presets: [
      [
        require.resolve('@beaver/babel-preset-beaver'),
        { react: false, transformRuntime: false, noAnonymousDefaultExport: false, typescript: true, dev: false },
      ],
    ],
  });

  const userConfig = require(paths.appBeaverConfig);

  return { ...defaultConfig, ...(userConfig as object) };
}

function resolveAllDeps(entry: string) {
  const crequire = require('crequire');
  const deps = [entry];
  const seen = new Set<string>(deps);

  while (deps.length) {
    const currentDep = deps.pop();
    const fileDeps = crequire(fs.readFileSync(currentDep!, { encoding: 'utf-8' }));

    if (Array.isArray(fileDeps)) {
      fileDeps.forEach(dep => {
        const absDep = resolve.sync(dep.path as string, { basedir: currentDep, extensions: ['.js', '.ts'] });
        if (!seen.has(absDep)) {
          deps.push(absDep);
          seen.add(absDep);
        }
      });
    }
  }

  return Array.from(seen);
}
