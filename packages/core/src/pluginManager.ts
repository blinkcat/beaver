/* eslint-disable no-underscore-dangle */
import { resolve } from '@beaver/utils';
import type {
  IBeaverConfig,
  IBeaverPlugin,
  IBeaverPluginContext,
  IBeaverPluginFactory,
  IPluginManager,
  IPluginHookHandler,
} from '@beaver/types';

// eslint-disable-next-line @typescript-eslint/naming-convention
let __index = 0;

export class PluginManager implements IPluginManager {
  private plugins = new Set<IBeaverPlugin>();

  private pluginContexts = new Map<IBeaverPlugin, IBeaverPluginContext>();

  // shared methods
  methods: IBeaverPluginContext['methods'] = {} as any;

  // make it readonly
  // prevent ts(2742)
  methodsProxy: any = this.makeProxy(this.methods);

  addNewMethod = this.createAdd(this.methods);

  get existingMethodNames() {
    return Object.keys(this.methods);
  }

  // all hooks
  hooks: { [name: string]: IPluginHookHandler } = {};

  hooksProxy = this.makeProxy(this.hooks);

  addNewHook = this.createAdd(this.hooks);

  get existingHookNames() {
    return Object.keys(this.hooks);
  }

  // cli command
  commands: { [name: string]: Function } = {};

  commandsProxy = this.makeProxy(this.commands);

  addNewCommand = this.createAdd(this.commands);

  get existingCommandNames() {
    return Object.keys(this.commands);
  }

  // pathsProxy = this.makeProxy(this.coreService.paths);

  // configProxy = this.makeProxy(this.coreService.config);

  // constructor() {}

  receiveCommand(name: string, args: any) {
    if (this.commands[name]) {
      this.commands[name](args);
    } else {
      throw Error(`failed to find plugin available to respond to this command. command name is ${name}`);
    }
  }

  loadPlugins(plugins: IBeaverConfig['plugins'] = []) {
    for (const plugin of plugins) {
      if (Array.isArray(plugin)) {
        this.loadPlugin(plugin[0], plugin[1]);
      } else {
        this.loadPlugin(plugin);
      }
    }
    this.registerPlugins();
    this.tapAllPluginHooks();
  }

  loadPlugin(pluginPathOrFactory: string | IBeaverPluginFactory, options?: any) {
    let pluginFactory: IBeaverPluginFactory;

    if (typeof pluginPathOrFactory === 'function') {
      pluginFactory = pluginPathOrFactory;
    } else if (typeof (pluginPathOrFactory as any).default === 'function') {
      pluginFactory = (pluginPathOrFactory as any).default;
    } else {
      // try to import factory from all possible path
      const hasScope = pluginPathOrFactory.startsWith('@');
      /**
       * 1. xxx -> beaver-plugin-xxx
       * 2. @xxx -> @xxx/beaver-plugin
       */
      const allPossiblePluginNames = [
        pluginPathOrFactory,
        `beaver-plugin-${pluginPathOrFactory}`,
        hasScope && `${pluginPathOrFactory}/beaver-plugin`,
      ].filter(Boolean) as string[];

      let actualPluginName = '';

      for (const pluginName of allPossiblePluginNames) {
        try {
          actualPluginName = resolve.sync(pluginName);
          pluginFactory = require(actualPluginName);
        } catch {
          continue;
        }

        if (typeof pluginFactory !== 'function' && typeof (pluginFactory as any).default === 'function') {
          pluginFactory = (pluginFactory as any).default;
        } else {
          throw Error(`plugin ${pluginName} should export a function`);
        }

        break;
      }

      if (pluginFactory! == null) {
        throw Error(`Failed to find beaver plugin with the name ${pluginPathOrFactory}`);
      }
    }

    const pluginContext: IBeaverPluginContext = this.createPluginContext();
    const pluginOptions = typeof options === 'object' ? options : {};
    const plugin: IBeaverPlugin = pluginFactory(pluginContext, pluginOptions);

    if (plugin.name == null) {
      plugin.name = `anonymous-plugin-${__index++}`;
    }

    this.plugins.add(plugin);
    this.pluginContexts.set(plugin, pluginContext);
  }

  registerPlugins() {
    for (const plugin of this.plugins) {
      const pluginContext = this.pluginContexts.get(plugin)! as IBeaverPluginContext & { __registered: boolean };

      if (plugin.register && pluginContext.__registered === false) {
        pluginContext.__registered = true;

        plugin.register({
          addNewMethod: this.addNewMethod,
          existingMethodNames: this.existingMethodNames,
          addNewHook: this.addNewHook,
          existingHookNames: this.existingHookNames,
          addNewCommand: this.addNewCommand,
          existingCommandNames: this.existingCommandNames,
        });
      }
    }
  }

  tapAllPluginHooks() {
    for (const plugin of this.plugins) {
      const pluginContext = this.pluginContexts.get(plugin)! as IBeaverPluginContext & {
        __tapped: boolean;
        __ignored: boolean;
      };

      if (pluginContext.__tapped === false && pluginContext.__ignored === false) {
        pluginContext.__tapped = true;

        for (const hookName in plugin) {
          if (hookName === 'register' || hookName === 'name') {
            continue;
          }
          if (typeof this.hooks[hookName] === 'function' && typeof plugin[hookName] === 'function') {
            this.hooks[hookName]({ pluginName: plugin.name, callback: plugin[hookName] });
          }
        }
      }
    }
  }

  ignorePluginByName = (name: string) => {
    for (const plugin of this.plugins) {
      if (plugin.name === name) {
        (this.pluginContexts.get(plugin) as any).__ignore = true;

        return true;
      }
    }

    return false;
  };

  private createPluginContext(): IBeaverPluginContext {
    const pluginContext = {
      methods: this.methodsProxy,
      ignorePluginByName: this.ignorePluginByName,
    };

    // hide private properties
    Object.defineProperties(pluginContext, {
      __tapped: {
        value: false,
        writable: true,
      },
      __ignored: {
        value: false,
        writable: true,
      },
      __registered: {
        value: false,
        writable: true,
      },
    });

    return pluginContext;
  }

  private makeProxy<T extends { [index: string]: any }>(target: T) {
    return new Proxy(target, {
      get(t, p: string) {
        return t[p];
      },
      set() {
        return false;
      },
    });
  }

  private createAdd<T extends { [index: string]: any }>(target: T) {
    return (name: string, value: T[0], override = false) => {
      if (target[name] == null || override) {
        // @ts-ignore
        target[name] = value; // eslint-disable-line no-param-reassign
        return true;
      }
      return false;
    };
  }
}

const pluginManager = new PluginManager();

export default pluginManager;
