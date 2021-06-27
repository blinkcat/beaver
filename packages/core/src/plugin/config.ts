import { IBeaverConfig, IBeaverPluginFactory } from '@beaver/types';
import { tapable, makeReadonly } from '@beaver/utils';
import configManager from '../configManager';

export const resolvedConfigProxy = makeReadonly(configManager.resolvedConfig, 'ResolvedConfig is readonly.');

const inputConfigProxy = makeReadonly(configManager.inputConfig, 'InputConfig is readonly.');
const { AsyncSeriesWaterfallHook } = tapable;

export const hooks = {
  config: new AsyncSeriesWaterfallHook<IBeaverConfig>(['config']),
};

const configPlugin: IBeaverPluginFactory = () => ({
  name: '__configPlugin',
  register({ addNewMethod, addNewHook }) {
    addNewMethod('getResolvedConfig', () => resolvedConfigProxy);
    addNewMethod('getInputConfig', () => inputConfigProxy);
    addNewHook('config', ({ pluginName, callback }) => {
      hooks.config.tapPromise(pluginName, callback);
    });
  },
});

export default configPlugin;
