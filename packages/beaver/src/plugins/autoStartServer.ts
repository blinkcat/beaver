import { Compiler } from 'webpack';
import { IApi } from '../api';

class AutoStartServerPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.afterEmit.tapAsync('auto-start-server-plugin', (compilation, callback) => {
      callback();
    });
  }
}

export default (api: IApi) => {
  api.modifyWebpackConfig(async (config, { type, env }) => {
    const should = type === 'server' && env === 'development';

    if (!should) {
      return config;
    }

    if (!Array.isArray(config.plugins)) {
      // eslint-disable-next-line no-param-reassign
      config.plugins = [];
    }

    config.plugins.push(new AutoStartServerPlugin());

    return config;
  });
};
