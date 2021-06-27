import { CheerioAPI } from 'cheerio';
import type { Tap } from 'tapable';
import type { Configuration as WebpackConfiguration } from 'webpack';
import type CoreService from './coreService';
import paths from './paths';
import { IBeaverConfig } from './loadConfig';

type TApiContext = Pick<CoreService, 'userConfig' | 'paths' | 'trigger'>;

type TModifyHook<T = any> = ((value: T) => Promise<T>) | ({ fn(value: T): Promise<T> } & Tap);

export interface IApi extends Api {
  modifyPaths(fn: TModifyHook<typeof paths>): void;
  modifyConfig(fn: TModifyHook<IBeaverConfig>): void;
  modifyWebpackConfig(fn: TModifyHook<WebpackConfiguration>): void;
  modifyBabelConfig(fn: TModifyHook): void;
  modifyHtml(fn: TModifyHook<CheerioAPI>): void;
}

export default class Api {
  context: TApiContext;

  constructor(private readonly coreService: CoreService) {
    this.context = new Proxy({} as TApiContext, {
      get(_, prop: keyof CoreService) {
        if (['userConfig', 'paths', 'trigger'].includes(prop)) {
          if (typeof coreService[prop] === 'function') {
            return (coreService[prop] as Function).bind(coreService);
          }
          return coreService[prop];
        }
        return undefined;
      },
    });
  }

  registerMethod(name: string, fn?: Function) {
    const { methods, hooks } = this.coreService;

    if (methods.has(name)) {
      return false;
    }

    if (typeof fn === 'function') {
      methods.set(name, fn);
    } else {
      methods.set(name, (hookFn: Function | ({ fn: Function } & Tap)) => {
        if (hooks.has(name) === false) {
          hooks.set(name, []);
        }

        hooks.get(name)!.push(typeof hookFn === 'function' ? { name, fn: hookFn, stage: 0 } : { ...hookFn });
      });
    }

    return true;
  }

  registerCommand(name: string, fn: Function) {
    const { commands } = this.coreService;

    if (commands.has(name)) {
      return false;
    }
    commands.set(name, fn);
    return true;
  }

  getLog() {}

  validate() {}
}
