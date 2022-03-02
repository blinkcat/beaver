import { mri } from '@beaver/utils';
import pluginManager from './pluginManager';
import configManager from './configManager';
import configPlugin, { hooks as configPluginHooks, resolvedConfigProxy } from './plugin/config';
import pathsPlugin, { hooks as pathsPluginHooks } from './plugin/paths';
import htmlPlugin from './plugin/html';
import ssgPlugin from './plugin/ssg';
import devCommandPlugin from './plugin/command/dev';
import buildCommandPlugin from './plugin/command/build';
import paths from './paths';

export default async function init() {
  // load config first, so we can get user's plugins
  configManager.loadConfig();
  // then, prepend internal plugins, and load all these plugins
  pluginManager.loadPlugins([
    configPlugin,
    pathsPlugin,
    htmlPlugin,
    ssgPlugin,
    devCommandPlugin,
    buildCommandPlugin,
    ...(configManager.inputConfig?.plugins || []),
  ]);

  // trigger internal hooks
  configManager.resolveConfig(await configPluginHooks.config.promise({ ...configManager.inputConfig }));
  Object.assign(paths, await pathsPluginHooks.paths.promise(paths, { config: resolvedConfigProxy }));

  const {
    _: [command],
    ...args
  } = mri(process.argv.slice(2));

  pluginManager.receiveCommand(command, args);
}

init();
