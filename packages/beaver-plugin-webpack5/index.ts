/* eslint-disable no-underscore-dangle */
import { tapable } from '@beaver/utils';
import { IBeaverPluginFactory, IModifyWebpackConfigArgs } from '@beaver/types';
import webpack from 'webpack';
import pkg from './package.json';
import webpackConfigFactory from './webpackConfigFactory';

const { AsyncSeriesWaterfallHook } = tapable;

const webpack5Plugin: IBeaverPluginFactory = context => {
  const hooks = {
    webpack: new AsyncSeriesWaterfallHook<[webpack.Configuration, IModifyWebpackConfigArgs]>(['config', 'args']),
  };

  return {
    name: pkg.name,
    // handle webpack hook, everyone can modify webpackConfig here
    register({ addNewMethod, addNewHook }) {
      // add some methods for other plugins
      addNewMethod('getWebpack', () => webpack, true);
      addNewMethod(
        'getWebpackConfig',
        ({ env }: { env: string }) =>
          webpackConfigFactory(env as any, context).then(config => hooks.webpack.promise(config, { env, webpack })),
        true
      );
      // add webpack hook
      addNewHook(
        'webpack',
        ({ pluginName, callback }) => {
          hooks.webpack.tapPromise(pluginName, callback);
        },
        true
      );
    },
  };
};

export default webpack5Plugin;
