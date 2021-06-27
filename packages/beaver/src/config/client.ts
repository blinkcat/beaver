import { Configuration, RuleSetUseItem } from 'webpack';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
// If you are using webpack v5 or above you do not need to install this plugin.
// Webpack v5 comes with the latest terser-webpack-plugin out of the box.
// eslint-disable-next-line import/no-extraneous-dependencies
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import cherrio, { CheerioAPI } from 'cheerio';
import { ITHIS } from './types';
import { ETriggerType } from '../coreService';

export async function client(this: ITHIS, args: any) {
  assert.strictEqual(this.options.type, 'client');

  const {
    paths: { appSrcClientIndex, appOutputPath, appSrc },
    userConfig: { devtool, publicPath, jsPrefix, cssPrefix },
  } = this.api.context;
  const { env } = this.options;

  const isDev = env === 'development';
  const isProd = env === 'production';

  const config: Configuration = {
    bail: env === 'production',
    mode: env,
    entry: { client: [appSrcClientIndex] },
  };

  if (devtool != null) {
    config.devtool = devtool;
  } else {
    config.devtool = isProd ? 'source-map' : 'cheap-module-source-map';
  }

  config.output = {
    clean: isProd,
    path: appOutputPath,
    filename: path.join(jsPrefix || '', isDev ? '[name].js' : '[name].[contenthash:8].js'),
    chunkFilename: path.join(jsPrefix || '', isDev ? '[name].chunk.js' : '[name].[contenthash:8].chunk.js'),
    publicPath,
    globalObject: 'this',
  };

  const profile = args.profile || false;

  config.optimization = {
    minimize: isProd,
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
    ],
    splitChunks: isProd
      ? {
          // https://twitter.com/wSokra/status/969633336732905474
          chunks: 'all',
          // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
          // https://webpack.js.org/plugins/split-chunks-plugin/#splitchunksname
          // https://github.com/facebook/create-react-app/pull/9569
          name: false,
        }
      : { chunks: 'all' },
    // https://twitter.com/wSokra/status/969679223278505985
    runtimeChunk: true,
  };

  config.resolve = {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      // https://github.com/facebook/create-react-app/issues/7734
      // https://gist.github.com/bvaughn/25e6233aeb1b4f0cdb8d8366e54a3977
      // https://kentcdodds.com/blog/profile-a-react-app-for-performance
      ...(isProd && profile
        ? { 'react-dom$': 'react-dom/profiling', 'scheduler/tracing': 'scheduler/tracing-profiling' }
        : {}),
    },
  };

  const babelConfig = await this.api.context.trigger({
    type: ETriggerType.modify,
    initialValue: {
      babelrc: false,
      configFile: false,
      presets: [['@beaver/babel-preset', {}]],
    },
    name: 'modifyBabelConfig',
    args: { env, type: 'client' },
  });

  function getStyleRule(cssOptions: any): RuleSetUseItem[] {
    return [
      isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
      {
        loader: 'css-loader',
        options: cssOptions,
      },
      {
        // https://webpack.js.org/loaders/postcss-loader/
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: [
              'postcss-flexbugs-fixes',
              [
                'postcss-preset-env',
                // https://github.com/csstools/postcss-preset-env#options
                {
                  autoprefixer: {
                    flexbox: 'no-2009',
                  },
                  stage: 3,
                },
              ],
            ],
          },
        },
      },
    ];
  }

  config.module = {
    rules: [
      {
        oneOf: [
          // https://webpack.js.org/guides/asset-modules/#general-asset-type
          {
            test: /\.(jpe?g|png|gif|bmp|svg)$/,
            type: 'asset',
            parser: {
              dataUrlCondition: {
                maxSize: 4 * 1024, // 4kb
              },
            },
          },
          {
            test: /\.css$/,
            oneOf: [
              {
                resourceQuery: /modules/,
                use: getStyleRule({
                  importLoaders: 1,
                  modules: {
                    localIdentName: isDev ? '[path][name]__[local]' : '[hash:base64]',
                  },
                }),
              },
              {
                use: getStyleRule({ importLoaders: 1 }),
              },
            ],
          },
          {
            test: /\.(jsx?|tsx?|mjs)$/,
            include: [appSrc],
            use: {
              loader: 'babel-loader',
              options: {
                ...babelConfig,
              },
            },
          },
          // default rule
          // https://webpack.js.org/migrate/3/#json-loader-is-not-required-anymore
          {
            exclude: /\.(jsx?|tsx?|mjs|jpe?g|png|gif|bmp|svg|json|html)$/,
            type: 'asset/source',
          },
        ],
      },
    ],
  };

  const $: CheerioAPI = await this.api.context.trigger({
    name: 'modifyHtml',
    type: ETriggerType.modify,
    initialValue: cherrio.load(fs.readFileSync(path.join(__dirname, './template.html'), { encoding: 'utf-8' })),
    args: { env, type: 'client' },
  });

  // @ts-ignore
  config.plugins = [
    new HtmlWebpackPlugin({
      templateContent: $.html(),
    }),
    isProd &&
      new MiniCssExtractPlugin({
        filename: path.join(cssPrefix || '', '[name].[contenthash:8].css'),
        chunkFilename: path.join(cssPrefix || '', '[name].[contenthash:8].chunk.css'),
      }),
  ].filter(Boolean);

  return config;
}
