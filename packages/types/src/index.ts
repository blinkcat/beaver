import type webpack from 'webpack';
import type { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import type { CheerioAPI } from 'cheerio';

export type TWebpack = typeof webpack;
export type TWebpackCompiler = webpack.Compiler;
export type TWebpackCompilation = webpack.Compilation;
export type TWebpackStatsCompilation = webpack.StatsCompilation;

export type TCommandHookArg = { _: string[] } & Record<string, any>;

export interface ISsgAssets {
  js: string[];
  css: string[];
}

export interface IModifyWebpackConfigArgs {
  env: string;
  webpack: TWebpack;
  isServer?: boolean;
}

export interface IBeaverPlugin {
  name: string;
  register?: (args: IRegisterHookArgs) => void;
  webpack?: (config: webpack.Configuration, args: IModifyWebpackConfigArgs) => Promise<webpack.Configuration>;
  webpackConfigs?: (configs: Array<webpack.Configuration>) => Promise<Array<webpack.Configuration>>;
  config?: (config: IBeaverConfig) => Promise<IBeaverConfig>;
  paths?: (paths: IBeaverPaths, args: { config: IBeaverConfig }) => Promise<IBeaverPaths>;
  devServer?: (
    config: WebpackDevServerConfiguration,
    args: { config: IBeaverConfig }
  ) => Promise<WebpackDevServerConfiguration>;
  html?: ($: CheerioAPI) => Promise<void>;
  [other: string]: any;
}

export type TCreateWebpackConfig = ({
  env,
  isServer,
}: {
  env: 'development' | 'production';
  isServer?: boolean;
}) => Promise<webpack.Configuration>;

export interface IBeaverPluginContext {
  methods: {
    getWebpack: () => TWebpack;
    getWebpackConfigs: (initalConfig: webpack.Configuration) => Promise<webpack.Configuration[]>;
    getResolvedConfig(): Readonly<IBeaverConfig>;
    getInputConfig(): Readonly<IBeaverConfig>;
    getPaths(): Readonly<IBeaverPaths>;
    getHtml(): Promise<string>;
    createWebpackConfig: TCreateWebpackConfig;
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
  ssg?: boolean;
  [other: string]: any;
}

export interface IBeaverPaths {
  appRoot: string;
  appSrc: string;
  appSrcIndex: string;
  appPublic: string;
  appPackageJson: string;
  appTsConfig: string;
  appBeaverConfig: string;
  appOutputPath: string;
  appWebpackCache: string;
  appNodeModules: string;
  appHtml: string;
  appTsBuildInfoFile: string;
  appSrcSsgIndex: string;
}
