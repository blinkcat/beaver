import webpack, { Configuration } from 'webpack';
import path from 'path';
import fs from 'fs';
import cherrio, { CheerioAPI } from 'cheerio';
import merge from 'deepmerge';
import nodeExternals from 'webpack-node-externals';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import Webpackbar from 'webpackbar';
import { IApi } from '../api';
import { extensions, getAssetRule, getBabelRule, getCssRules, getDefaultRule } from './common';
import { ETriggerType } from '../coreService';

export interface IClientDevArgs {
  port?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getConfig(api: IApi, args: IClientDevArgs = {}, isNode = false) {
  const {
    paths: { appSrcClientIndex, appOutputPath, appSrc, appTsconfig, appPackageJson, appSrcServerIndex },
    userConfig: { devtool, publicPath, jsPrefix = '', mediaPrefix = '', ssr },
  } = api;

  const config: Configuration = {
    bail: false,
    mode: 'development',
  };

  config.entry = isNode ? { server: [appSrcServerIndex] } : { client: [appSrcClientIndex] };

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
    assetModuleFilename: path.join(mediaPrefix, '[name].[hash:8].[ext]'),
    globalObject: 'this',
  };

  if (isNode) {
    config.output.library = { type: 'commonjs2' };
  }

  config.optimization = {
    minimize: false,
    splitChunks: isNode ? false : { chunks: 'all' },
    runtimeChunk: true,
  };

  config.resolve = {
    extensions,
  };

  if (isNode) {
    config.target = 'node';
    config.node = false;
    config.externalsPresets = {
      node: true,
    };
    config.externals = [
      nodeExternals({
        allowlist: [/webpack\/hot/, (request: string) => !/\.(jsx?|tsx?|json|mjs)(\?.+)?/.test(request)],
      }),
    ];
  }

  // https://github.com/webpack/changelog-v5/blob/master/guides/persistent-caching.md
  config.cache = {
    type: 'filesystem',
    version: require('../../package.json').version,
    buildDependencies: {
      config: [__filename, appPackageJson],
    },
    name: isNode ? 'server-dev' : 'client-dev',
  };

  function triggerModifyBabelConfig(type: string) {
    return api.trigger({
      type: ETriggerType.modify,
      initialValue: {
        babelrc: false,
        configFile: false,
        presets: [['@beaver/babel-preset', { dev: true }]],
        plugins: [!isNode && require.resolve('react-refresh/babel')].filter(Boolean),
      },
      name: 'modifyBabelConfig',
      args: { env: 'development', type },
    });
  }

  const babelConfig = await triggerModifyBabelConfig(isNode ? 'server' : 'client');

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
                  ...(ssr ? ['MiniCssExtractPlugin.loader'] : ['style-loader']),
                  ...getCssRules({
                    importLoaders: 1,
                    modules: {
                      localIdentName: '[path][name]__[local]',
                      exportOnlyLocals: ssr,
                    },
                  }),
                ],
              },
              {
                use: [
                  ...(ssr ? ['MiniCssExtractPlugin.loader'] : ['style-loader']),
                  ...getCssRules({ importLoaders: 1 }),
                ],
              },
            ],
          },
          merge(getBabelRule(), { include: [appSrc], options: babelConfig }),
          getDefaultRule(),
        ],
      },
    ],
  };

  let $: CheerioAPI | null = null;

  if (!isNode && !ssr) {
    $ = await api.trigger({
      name: 'modifyHtml',
      type: ETriggerType.modify,
      initialValue: cherrio.load(fs.readFileSync(path.join(__dirname, './template.html'), { encoding: 'utf-8' })),
      args: { env: 'development', type: 'client' },
    });
  }

  config.plugins = [
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
  ];

  if (ssr) {
    config.plugins.push(
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      })
    );
  }

  if (isNode) {
    config.plugins.push(new Webpackbar({ name: 'server-dev' }), new webpack.HotModuleReplacementPlugin());
  } else {
    if (!ssr) {
      config.plugins.push(
        new HtmlWebpackPlugin({
          templateContent: $?.html(),
        })
      );
    }
    config.plugins.push(
      new ReactRefreshWebpackPlugin(),
      new WebpackManifestPlugin({
        writeToFileEmit: true,
        filter(file) {
          return file.isChunk;
        },
      }),
      new Webpackbar({ name: 'client-dev' })
    );
  }

  return config;
}
