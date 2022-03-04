import { tapable } from '@beaver/utils';
import {
  IBeaverPluginFactory,
  IModifyWebpackConfigArgs,
  TCreateWebpackConfig,
  TBabelTransformOptions,
  IModifyBabelOptionArgs,
} from '@beaver/types';
import webpack from 'webpack';
import pkg from './package.json';
import webpackConfigFactory from './webpackConfigFactory';

const { AsyncSeriesWaterfallHook } = tapable;

const webpack5Plugin: IBeaverPluginFactory = context => {
  const hooks = {
    webpack: new AsyncSeriesWaterfallHook<[webpack.Configuration, IModifyWebpackConfigArgs]>(['config', 'args']),
    // collect webpack configs
    webpackConfigs: new AsyncSeriesWaterfallHook<[webpack.Configuration[]]>(['configs']),
    babel: new AsyncSeriesWaterfallHook<[TBabelTransformOptions, IModifyBabelOptionArgs]>(['options', 'args']),
  };
  const createWebpackConfig: TCreateWebpackConfig = async ({ env, isServer }) =>
    hooks.webpack.promise(await webpackConfigFactory(env, context, isServer), { env, isServer, webpack });

  return {
    name: pkg.name,
    // handle webpack hook, everyone can modify webpackConfig here
    register({ addNewMethod, addNewHook }) {
      // add some methods for other plugins
      addNewMethod('getWebpack', () => webpack, true);
      addNewMethod('createWebpackConfig', createWebpackConfig);
      addNewMethod(
        'getWebpackConfigs',
        (initialConfig: webpack.Configuration) => hooks.webpackConfigs.promise([initialConfig]),
        true
      );
      addNewMethod('modifyBabelOptions', (initialOptions: TBabelTransformOptions = {}, args: IModifyBabelOptionArgs) =>
        hooks.babel.promise(initialOptions, args)
      );

      // add webpack hook
      addNewHook(
        'webpack',
        ({ pluginName, callback }) => {
          hooks.webpack.tapPromise(pluginName, callback);
        },
        true
      );
      addNewHook(
        'webpackConfigs',
        ({ pluginName, callback }) => {
          hooks.webpackConfigs.tapPromise(pluginName, callback);
        },
        true
      );
      addNewHook('babel', ({ pluginName, callback }) => {
        hooks.babel.tapPromise(pluginName, callback);
      });
    },
  };
};

export default webpack5Plugin;
