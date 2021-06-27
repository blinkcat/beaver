import { Configuration } from 'webpack';
import path from 'path';
import fs from 'fs';
// If you are using webpack v5 or above you do not need to install this plugin.
// Webpack v5 comes with the latest terser-webpack-plugin out of the box.
// eslint-disable-next-line import/no-extraneous-dependencies
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import cherrio, { CheerioAPI } from 'cheerio';
import merge from 'deepmerge';
import { IApi } from '../api';
import { ETriggerType } from '../coreService';
import { getAssetRule, getBabelRule, getCssRules, getDefaultRule, extensions } from './common';

export interface IClientProdArgs {
  profile?: boolean;
}

export async function getConfig(api: IApi, args: IClientProdArgs = {}) {
  const {
    paths: { appSrcClientIndex, appOutputPath, appSrc, appTsconfig },
    userConfig: { devtool, publicPath, jsPrefix = '', cssPrefix = '', mediaPrefix = '' },
  } = api;
  const { profile } = args;

  const config: Configuration = {
    bail: true,
    mode: 'production',
    entry: { client: [appSrcClientIndex] },
  };

  if (devtool != null) {
    config.devtool = devtool;
  } else {
    config.devtool = 'source-map';
  }

  config.output = {
    clean: true,
    path: appOutputPath,
    filename: path.join(jsPrefix, '[name].[contenthash:8].js'),
    chunkFilename: path.join(jsPrefix, '[name].[contenthash:8].chunk.js'),
    publicPath,
    assetModuleFilename: path.join(mediaPrefix, '[name].[hash:8].[ext]'),
    globalObject: 'this',
  };

  config.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        // Using supported devtool values enable source map generation
        terserOptions: {
          // help profiling react app on production build
          keep_classnames: profile,
          keep_fnames: profile,
          safari10: true,
          //   compress: {
          // no need, fixed
          // https://github.com/facebook/create-react-app/issues/2376
          // comparisons: false,
          // seems fixed
          // https://github.com/facebook/create-react-app/issues/5250
          // https://github.com/terser/terser/issues/120
          // inline: 2,
          //   },
          format: {
            // https://github.com/facebook/create-react-app/issues/2488
            ascii_only: true,
          },
        },
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: 'default',
        },
      }),
    ],
    splitChunks: {
      // https://twitter.com/wSokra/status/969633336732905474
      chunks: 'all',
      // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
      // https://webpack.js.org/plugins/split-chunks-plugin/#splitchunksname
      // https://github.com/facebook/create-react-app/pull/9569
      name: false,
    },
    // https://twitter.com/wSokra/status/969679223278505985
    runtimeChunk: true,
  };

  config.resolve = {
    extensions,
  };

  const babelConfig = await api.trigger({
    type: ETriggerType.modify,
    initialValue: {
      babelrc: false,
      configFile: false,
      presets: [['@beaver/babel-preset', { transformReactRemovePropTypes: true }]],
    },
    name: 'modifyBabelConfig',
    args: { env: 'production', type: 'client' },
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
                  MiniCssExtractPlugin.loader,
                  ...getCssRules({
                    importLoaders: 1,
                    modules: {
                      localIdentName: '[hash:base64:8]',
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

  const $: CheerioAPI = await api.trigger({
    name: 'modifyHtml',
    type: ETriggerType.modify,
    initialValue: cherrio.load(fs.readFileSync(path.join(__dirname, './template.html'), { encoding: 'utf-8' })),
    args: { env: 'production', type: 'client' },
  });

  config.plugins = [
    new HtmlWebpackPlugin({
      templateContent: $.html(),
    }),
    new MiniCssExtractPlugin({
      filename: path.join(cssPrefix, '[name].[contenthash:8].css'),
      chunkFilename: path.join(cssPrefix, '[name].[contenthash:8].chunk.css'),
    }),
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
    new WebpackManifestPlugin({
      filter(file) {
        return file.isChunk;
      },
    }),
  ];

  return config;
}
