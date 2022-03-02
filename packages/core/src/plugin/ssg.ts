/* eslint-disable no-param-reassign */
// eslint-disable-next-line max-classes-per-file
import { IBeaverPluginFactory, TWebpackCompiler, TWebpackStatsCompilation } from '@beaver/types';
import { fs } from '@beaver/utils';
import path from 'path';
import { debuglog, inspect } from 'util';

const SSG_SCRIPT_NAME = 'ssg.js';
const debug = debuglog('ssgPlugin');

function createNotify() {
  let oresolve: any;
  let oreject: any;

  const promise = new Promise((resolve, reject) => {
    oresolve = resolve;
    oreject = reject;
  }) as Promise<TWebpackStatsCompilation> & {
    resolve: (value: TWebpackStatsCompilation) => void;
    reject: (reason?: any) => void;
  };

  promise.resolve = oresolve;
  promise.reject = oreject;

  return promise;
}

const notify = createNotify();

function extractAssets(stats: TWebpackStatsCompilation) {
  const assets: { js: string[]; css: string[] } = {
    js: [],
    css: [],
  };

  const jsSet = new Set<string>();
  const cssSet = new Set<string>();

  Object.keys(stats.entrypoints || {}).forEach(entryName => {
    stats.entrypoints?.[entryName].assets?.forEach(asset => {
      if (asset.name.endsWith('.js')) {
        jsSet.add(path.join('/', asset.name));
      } else if (asset.name.endsWith('.css')) {
        cssSet.add(path.join('/', asset.name));
      }
    });
  });

  assets.js = [...jsSet];
  assets.css = [...cssSet];

  return assets;
}

class StaticSiteGenerationPlugin {
  apply(compiler: TWebpackCompiler) {
    compiler.hooks.done.tapPromise('StaticSiteGenerationPlugin', async stats => {
      try {
        const clientStats = await notify;
        const clientAssets = extractAssets(clientStats);

        debug(`client assets: ${inspect(clientAssets)}`);

        const { outputPath } = stats.toJson({ all: false, outputPath: true });

        debug(`StaticSiteGenerationPlugin outputPath: ${outputPath}`);

        const { render, routes } = require(path.join(outputPath!, SSG_SCRIPT_NAME));
        const pageUrls: string[] = await Promise.resolve(routes());

        debug(`pageUrls: ${inspect(pageUrls)}`);

        if (Array.isArray(pageUrls)) {
          for (const pageUrl of pageUrls) {
            const assetPath = path.join(outputPath!, pageUrl, 'index.html');

            debug(`url -> ${assetPath}`);
            fs.outputFileSync(assetPath, render({ url: pageUrl, assets: clientAssets }).html);
          }
        } else {
          throw Error('routes must return a string array!');
        }
      } catch (err) {
        console.log('ssg failed!');
        console.error(err);
      }
    });
  }
}

class SSGNotifyPlugin {
  apply(compiler: TWebpackCompiler) {
    compiler.hooks.afterCompile.tap('SSGNotifyPlugin', compilation => {
      notify.resolve(compilation.getStats().toJson({ all: false, entrypoints: true }));
    });
    compiler.hooks.failed.tap('SSGNotifyPlugin', err => {
      notify.reject(err);
    });
  }
}

const ssgPlugin: IBeaverPluginFactory = context => ({
  name: '__ssgPlugin',
  async webpack(config, { isServer }) {
    const paths = context.methods.getPaths();
    const webpack = context.methods.getWebpack();
    const { ssg } = context.methods.getResolvedConfig();

    if (context.methods.getResolvedConfig().ssg && process.env.NODE_ENV === 'production') {
      if (isServer) {
        config.entry = { ssg: paths.appSrcSsgIndex };

        config.target = 'node';
        config.output!.library = { type: 'commonjs2' };
        config.output!.filename = '[name].js';
        config.output!.chunkFilename = '[name].chunk.js';
        config.externalsPresets = { node: true };

        delete config.optimization!.splitChunks;
        delete config.optimization!.runtimeChunk;

        // https://webpack.js.org/configuration/externals/#function
        // eslint-disable-next-line @typescript-eslint/no-shadow
        config.externals = ({ context, request, getResolve }, callback) => {
          if (getResolve) {
            const resolve = getResolve();
            resolve(context!, request!, (_, res = '') => {
              // prevent error
              if (/mini-css-extract-plugin|css-loader/.test(res)) {
                callback();
              } else if (/node_modules[/\\].*\.js$/.test(res)) {
                callback(undefined, `commonjs ${request}`);
              } else {
                callback();
              }
            });
          } else {
            callback();
          }
        };

        config.plugins!.push(new StaticSiteGenerationPlugin());
      } else {
        // if ssg is on, we don't need HtmlWebpackPlugin
        const index = config.plugins!.findIndex(plugin => plugin.constructor.name === 'HtmlWebpackPlugin');

        if (index !== -1) {
          config.plugins!.splice(index, 1);
        }

        config.plugins!.push(new SSGNotifyPlugin());
      }
    }
    config.plugins!.push(
      new webpack.DefinePlugin({
        'process.env.SSG': ssg,
      })
    );
    return config;
  },
  async webpackConfigs(configs) {
    const { createWebpackConfig, getResolvedConfig } = context.methods;
    const config = getResolvedConfig();

    if (config.ssg && process.env.NODE_ENV === 'production') {
      debug('ssg feature is on');
      configs.push(await createWebpackConfig({ env: 'production', isServer: true }));
    }
    return configs;
  },
});

export default ssgPlugin;
