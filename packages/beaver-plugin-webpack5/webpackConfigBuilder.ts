import type { Configuration } from 'webpack';

class WebpackConfigBuilder {
  // workaround for ts(2590)
  private make =
    <C, T extends keyof C>(obj: C, name: T) =>
    (args?: C[T]) => {
      // eslint-disable-next-line no-param-reassign
      obj[name] = args!;
      return this;
    };

  constructor(private config: Configuration = {}) {
    const ckeys: Array<keyof Configuration> = [
      'target',
      'mode',
      'bail',
      'devtool',
      'entry',
      'output',
      'cache',
      'infrastructureLogging',
      'optimization',
      'resolve',
      'module',
      'plugins',
      'performance',
    ];

    for (const ckey of ckeys) {
      (this as any)[ckey] = this.make(this.config, ckey);
    }
  }

  getConfig() {
    return this.config;
  }
}

export type TWebpackConfigurationKeysHandler<C> = {
  [prop in keyof Required<Configuration>]: (args?: Configuration[prop]) => C & TWebpackConfigurationKeysHandler<C>;
};

export default function createWebpackConfigBuilder(baseConfig: Configuration = {}) {
  return new WebpackConfigBuilder(baseConfig) as WebpackConfigBuilder &
    TWebpackConfigurationKeysHandler<WebpackConfigBuilder>;
}
