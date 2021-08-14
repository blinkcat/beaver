import { Configuration } from 'webpack';
import path from 'path';
import fs from 'fs';
import cherrio, { CheerioAPI } from 'cheerio';
import merge from 'deepmerge';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import Webpackbar from 'webpackbar';
import { IApi } from '../api';
import { extensions, getAssetRule, getBabelRule, getCssRules, getDefaultRule } from './common';
import { ETriggerType } from '../coreService';

export interface IClientDevArgs {
  port?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getConfig(api: IApi, args: IClientDevArgs = {}) {
  const {
    paths: { appSrcClientIndex, appOutputPath, appSrc, appTsconfig, appPackageJson },
    userConfig: { devtool, publicPath, jsPrefix = '' },
  } = api.context;

  const config: Configuration = {
    bail: false,
    mode: 'development',
    entry: { client: [appSrcClientIndex] },
  };

  if (devtool != null) {
    config.devtool = devtool;
  } else {
    config.devtool = 'cheap-module-source-map';
  }

  config.output = {
    path: appOutputPath,
    filename: path.join(jsPrefix, '[name].js'),
    chunkFilename: path.join(jsPrefix, '[name].chunk.js'),
    publicPath,
    globalObject: 'this',
  };

  config.optimization = {
    minimize: false,
    splitChunks: { chunks: 'all' },
    runtimeChunk: true,
  };

  config.resolve = {
    extensions,
  };

  // 暂时加上避免 hmr 失效
  // https://stackoverflow.com/questions/53905253/cant-set-up-the-hmr-stuck-with-waiting-for-update-signal-from-wds-in-cons
  // https://github.com/webpack/webpack-dev-server/issues/2758
  config.target = 'web';

  // https://github.com/webpack/changelog-v5/blob/master/guides/persistent-caching.md
  config.cache = {
    type: 'filesystem',
    version: require('../../package.json').version,
    buildDependencies: {
      config: [__filename, appPackageJson],
    },
    name: 'client-dev',
  };

  const babelConfig = await api.context.trigger({
    type: ETriggerType.modify,
    initialValue: {
      babelrc: false,
      configFile: false,
      presets: [['@beaver/babel-preset', {}]],
      plugins: [require.resolve('react-refresh/babel')],
    },
    name: 'modifyBabelConfig',
    args: { env: 'development', type: 'client' },
  });

  config.module = {
    rules: [
      {
        oneOf: [
          getAssetRule(),
          {
            test: /\.css$/,
            oneOf: [
              {
                resourceQuery: /modules/,
                use: [
                  'style-loader',
                  ...getCssRules({
                    importLoaders: 1,
                    modules: {
                      localIdentName: '[path][name]__[local]',
                    },
                  }),
                ],
              },
              {
                use: ['style-loader', ...getCssRules({ importLoaders: 1 })],
              },
            ],
          },
          merge(getBabelRule(), { include: [appSrc], options: babelConfig }),
          getDefaultRule(),
        ],
      },
    ],
  };

  const $: CheerioAPI = await api.context.trigger({
    name: 'modifyHtml',
    type: ETriggerType.modify,
    initialValue: cherrio.load(fs.readFileSync(path.join(__dirname, './template.html'), { encoding: 'utf-8' })),
    args: { env: 'development', type: 'client' },
  });

  config.plugins = [
    new HtmlWebpackPlugin({
      templateContent: $.html(),
    }),
    new ReactRefreshWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: appTsconfig,
        mode: 'write-references',
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
      },
    }),
    new Webpackbar({ name: 'client-dev' }),
    new WebpackManifestPlugin({
      filter(file) {
        return file.isChunk;
      },
    }),
  ];

  return config;
}
