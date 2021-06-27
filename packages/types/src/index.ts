import type webpack from 'webpack';
import type { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import type { CheerioAPI } from 'cheerio';

export type TWebpack = typeof webpack;

export type TCommandHookArg = { _: string[] } & Record<string, any>;

export interface IModifyWebpackConfigArgs {
  env: string;
  webpack: TWebpack;
}

export interface IBeaverPlugin {
  name: string;
  register?: (args: IRegisterHookArgs) => void;
  webpack?: (config: webpack.Configuration, args: IModifyWebpackConfigArgs) => Promise<webpack.Configuration>;
  config?: (config: IBeaverConfig) => Promise<IBeaverConfig>;
  paths?: (paths: IBeaverPaths, args: { config: IBeaverConfig }) => Promise<IBeaverPaths>;
  devServer?: (
    config: WebpackDevServerConfiguration,
    args: { config: IBeaverConfig }
  ) => Promise<WebpackDevServerConfiguration>;
  html?: ($: CheerioAPI) => Promise<void>;
  [other: string]: any;
}

export interface IBeaverPluginContext {
  methods: {
    getWebpack: () => TWebpack;
    getWebpackConfig: (args: { env: string }) => Promise<webpack.Configuration>;
    getResolvedConfig(): Readonly<IBeaverConfig>;
    getInputConfig(): Readonly<IBeaverConfig>;
    getPaths(): Readonly<IBeaverPaths>;
    getHtml(): Promise<string>;
  } & Partial<{
    [other: string]: Function;
  }>;
  ignorePluginByName: IPluginManager['ignorePluginByName'];
}

export interface IBeaverPluginFactory {
  (context: IBeaverPluginContext, options?: any): IBeaverPlugin;
  [other: string]: any;
}

export interface IRegisterHookArgs {
  addNewMethod: IPluginManager['addNewMethod'];
  existingMethodNames: IPluginManager['existingMethodNames'];
  addNewHook: IPluginManager['addNewHook'];
  existingHookNames: IPluginManager['existingHookNames'];
  addNewCommand: IPluginManager['addNewCommand'];
  existingCommandNames: IPluginManager['existingCommandNames'];
}

export interface IPluginHookHandler {
  (obj: { pluginName: string; callback: (...args: any[]) => any }): void;
}

export interface IPluginManager {
  addNewMethod: (name: string, value: Function, override?: boolean) => boolean;
  existingMethodNames: string[];

  addNewHook: (name: string, value: IPluginHookHandler, override?: boolean) => boolean;
  existingHookNames: string[];

  addNewCommand: (name: string, value: Function, override?: boolean) => boolean;
  existingCommandNames: string[];

  ignorePluginByName: (name: string) => boolean;
}

export interface IBeaverConfig {
  sourceMap?: boolean;
  plugins?: Array<string | IBeaverPluginFactory | [string | IBeaverPluginFactory, { [index: string]: any }]>;
  fastRefresh?: boolean;
  profile?: boolean;
  imageInlineSizeLimit?: number;
  jsxRuntime?: boolean;
  port?: number;
  host?: string;
  publicPath?: string;
  [other: string]: any;
}

export interface IBeaverPaths {
  appRoot: string;
  appSrc: string;
  appSrcClientIndex: string;
  appSrcServerIndex: string;
  appPublic: string;
  appPackageJson: string;
  appTsConfig: string;
  appBeaverConfig: string;
  appOutputPath: string;
  appWebpackCache: string;
  appNodeModules: string;
  appHtml: string;
  appTsBuildInfoFile: string;
}
