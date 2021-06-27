import { Configuration } from 'webpack';
import path from 'path';
import fs from 'fs';
import cherrio, { CheerioAPI } from 'cheerio';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import merge from 'deepmerge';
import { IApi } from '../api';
import { extensions, getAssetRule, getBabelRule, getCssRules, getDefaultRule } from './common';
import { ETriggerType } from '../coreService';

export interface IClientDevArgs {
  port?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getConfig(api: IApi, args: IClientDevArgs = {}) {
  const {
    paths: { appSrcClientIndex, appOutputPath, appSrc },
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

  const babelConfig = await api.context.trigger({
    type: ETriggerType.modify,
    initialValue: {
      babelrc: false,
      configFile: false,
      presets: [['@beaver/babel-preset', {}]],
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
  ];

  return config;
}
