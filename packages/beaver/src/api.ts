import { CheerioAPI } from 'cheerio';
import type { Tap } from 'tapable';
import webpack from 'webpack';
import type { Configuration as WebpackConfiguration } from 'webpack';
import type CoreService from './coreService';
import paths from './paths';
import { IBeaverConfig } from './loadConfig';
import type { TGetLogger } from './plugins/logger';

type TApiContext = Pick<CoreService, 'userConfig' | 'paths' | 'trigger' | 'triggerType'>;

interface IApiArgs {
  env: 'development' | 'production';
  type: 'client' | 'server';
}

type TModifyHook<T = any, A = IApiArgs> =
  | ((value: T, args: A) => Promise<T>)
  | ({ fn(value: T, args: A): Promise<T> } & Tap);

export interface IApi extends Api, TApiContext {
  modifyPaths(fn: TModifyHook<typeof paths, {}>): void;
  modifyConfig(fn: TModifyHook<IBeaverConfig, {}>): void;
  modifyWebpackConfig(fn: TModifyHook<WebpackConfiguration, IApiArgs & { webpack: typeof webpack }>): void;
  modifyBabelConfig(fn: TModifyHook): void;
  modifyHtml(fn: TModifyHook<CheerioAPI>): void;
  getLogger: TGetLogger;
}

export default class Api {
  constructor(private readonly coreService: CoreService) {}

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
}
