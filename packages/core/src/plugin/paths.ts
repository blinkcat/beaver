import { IBeaverConfig, IBeaverPaths, IBeaverPluginFactory } from '@beaver/types';
import { tapable, makeReadonly } from '@beaver/utils';
import paths from '../paths';

const pathsProxy = makeReadonly(paths, 'Paths is readonly.');
const { AsyncSeriesWaterfallHook } = tapable;

export const hooks = {
  paths: new AsyncSeriesWaterfallHook<[IBeaverPaths, { config: IBeaverConfig }]>(['paths', 'args']),
};

const pathsPlugin: IBeaverPluginFactory = () => ({
  name: '__pathsPlugin',
  register({ addNewMethod, addNewHook }) {
    addNewMethod('getPaths', () => pathsProxy);
    addNewHook('paths', ({ pluginName, callback }) => {
      hooks.paths.tapPromise(pluginName, callback);
    });
  },
});

export default pathsPlugin;
