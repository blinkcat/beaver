import { AsyncSeriesWaterfallHook, Tap } from 'tapable';
import resolve from 'resolve';
import pkgUp from 'pkg-up';
import { dirname, extname, basename, resolve as pathResolve } from 'path';

import loadConfig, { IBeaverConfig } from './loadConfig';
import paths from './paths';
import Api from './api';
import builtinPlugins from './plugins';

export interface IPluginObj {
  path: string;
  name: string;
  exec: Function;
  options: object;
}

export interface IHook extends Tap {
  fn: Function;
}

export enum ETriggerType {
  modify,
  add,
  event,
}

export default class CoreService {
  userConfig: IBeaverConfig = {};

  paths = paths;

  plugins: IPluginObj[] = [];

  methods = new Map<string, Function>();

  hooks = new Map<string, IHook[]>();

  commands = new Map<string, Function>();

  triggerType = ETriggerType;

  async init() {
    this.userConfig = loadConfig();
    this.initPlugins();

    this.userConfig = await this.trigger({
      type: ETriggerType.modify,
      name: 'modifyConfig',
      initialValue: this.userConfig,
    });

    this.paths = await this.trigger({
      type: ETriggerType.modify,
      initialValue: this.paths,
      name: 'modifyPaths',
    });
  }

  getApi() {
    const self = this;

    return new Proxy(new Api(self), {
      get(target, prop: keyof CoreService) {
        if (['userConfig', 'paths', 'trigger', 'triggerType'].includes(prop)) {
          if (typeof self[prop] === 'function') {
            return (self[prop] as Function).bind(self);
          }
          return self[prop];
        }

        if (self.methods.has(prop)) {
          return self.methods.get(prop)!;
        }

        return (target as any)[prop];
      },
    });
  }

  initPlugins() {
    // load plugins
    this.plugins = [...builtinPlugins, ...(this.userConfig.plugins || [])].map(plugin => {
      if (Array.isArray(plugin)) {
        return this.loadPlugin(plugin[0], plugin[1]);
      }
      return this.loadPlugin(plugin);
    });

    for (const plugin of this.plugins) {
      plugin.exec(this.getApi(), plugin.options);
    }
  }

  loadPlugin(pluginPath: string, options?: any): IPluginObj {
    const pluginOptions = typeof options !== 'object' ? {} : options;
    const isScope = pluginPath.startsWith('@');
    /**
     * 1. xxx -> beaver-plugin-xxx
     * 2. @xxx -> @xxx/beaver-plugin
     */
    const possiblePluginNames: string[] = [
      pluginPath,
      `beaver-plugin-${pluginPath}`,
      isScope ? `${pluginPath}/beaver-plugin` : '',
    ].filter(Boolean);

    for (const pluginName of possiblePluginNames) {
      try {
        const path = resolve.sync(pluginName, {
          basedir: pluginName.startsWith('.') || pluginName.startsWith('/') ? pluginName : process.cwd(),
        });
        const pkgJsonPath = pkgUp.sync({ cwd: path });
        let name = '';

        if (pkgJsonPath) {
          const pkgJson = require(pkgJsonPath);

          // try use package.json name
          if (pkgJson.main) {
            name = pathResolve(dirname(pkgJsonPath), pkgJson.main) === path ? pkgJson.name : '';
          }
        }

        if (name === '') {
          // use filename
          name = basename(path, extname(path));
        }

        return {
          name,
          path,
          options: pluginOptions,
          exec(...args: any[]) {
            const exports = require(path);

            if (typeof exports === 'function') {
              return exports(...args);
            }

            if (typeof exports.default === 'function') {
              return exports.default(...args);
            }

            throw Error(`plugin ${pluginName} should export a function`);
          },
        };
      } catch (_) {
        continue;
      }
    }
    throw Error(`can't find beaver plugin with name ${pluginPath}`);
  }

  trigger({ type, name, initialValue, args }: { type: ETriggerType; name: string; initialValue?: any; args?: any }) {
    switch (type) {
      case ETriggerType.modify: {
        const modifyHook = new AsyncSeriesWaterfallHook<[any]>(['value']);
        const hooks = this.hooks.get(name) || [];

        for (const hook of hooks) {
          modifyHook.tapPromise(
            { name: hook.name, stage: hook.stage, before: hook.before },
            async value => await hook.fn(value, args)
          );
        }

        return modifyHook.promise(initialValue);
      }
      case ETriggerType.add: {
        if (initialValue != null) {
          if (Array.isArray(initialValue) === false) {
            throw Error('');
          }
        }

        const addHook = new AsyncSeriesWaterfallHook<[any[]]>(['value']);
        const hooks = this.hooks.get(name) || [];

        for (const hook of hooks) {
          // https://github.com/webpack/tapable/issues/86
          addHook.tapPromise({ name: hook.name, stage: hook.stage, before: hook.before }, async value =>
            value.concat(await hook.fn(args))
          );
        }

        return addHook.promise(initialValue || []);
      }
      case ETriggerType.event: {
        const eventHook = new AsyncSeriesWaterfallHook(['_']);
        const hooks = this.hooks.get(name) || [];

        for (const hook of hooks) {
          eventHook.tapPromise(
            { name: hook.name, stage: hook.stage, before: hook.before },
            async () => await hook.fn(args)
          );
        }

        // @ts-ignore
        return eventHook.promise();
      }
      default:
        throw Error('');
    }
  }

  async run(name: string, args: object) {
    await this.init();
    this.commands.get(name)?.(args);
  }
}
