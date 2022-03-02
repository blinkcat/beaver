/* eslint-disable consistent-return */
import { IBeaverConfig, IBeaverPluginFactory, IBeaverPaths } from '@beaver/types';
import { tapable } from '@beaver/utils';
import WebpackDevServer, { Configuration } from 'webpack-dev-server';
import escape from 'escape-string-regexp';
import path from 'path';

const { AsyncSeriesWaterfallHook } = tapable;

export const hooks = {
  devServer: new AsyncSeriesWaterfallHook<[Configuration, { config: IBeaverConfig }]>(['config', 'args']),
};

const devCommandPlugin: IBeaverPluginFactory = context => ({
  name: '__devCommandPlugin',
  register({ addNewCommand, addNewHook }) {
    // add new command for beaver dev
    addNewCommand('dev', async () => {
      // Makes the script crash on unhandled rejections instead of silently
      // ignoring them. In the future, promise rejections that are not handled will
      // terminate the Node.js process with a non-zero exit code.
      process.on('unhandledRejection', err => {
        console.error('Unexpected error', err);
        process.exit(1);
      });
      process.env.NODE_ENV = 'development';

      const { getWebpackConfigs, getWebpack, createWebpackConfig } = context.methods;

      const webpack = getWebpack();
      const webpackConfigs = await getWebpackConfigs(await createWebpackConfig({ env: 'development' }));

      const devServerConfig = await hooks.devServer.promise(
        getDevServerConfig(context.methods.getResolvedConfig(), context.methods.getPaths()),
        { config: context.methods.getResolvedConfig() }
      );

      const compiler = webpack(webpackConfigs);
      const server = new WebpackDevServer(devServerConfig, compiler);

      server.start().catch(err => {
        if (err && err.message) {
          console.log(err.message);
        }
        process.exit(1);
      });
    });
    // add webpack-dev-server config hook
    addNewHook('devServer', ({ pluginName, callback }) => {
      hooks.devServer.tapPromise(pluginName, callback);
    });
  },
});

export default devCommandPlugin;

function getDevServerConfig(config: IBeaverConfig, paths: IBeaverPaths): Configuration {
  return {
    port: config.port,
    host: config.host,
    open: { app: { name: 'Google Chrome' } },
    hot: true,
    liveReload: true,
    setupExitSignals: true,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    },
    // Enable gzip compression of generated files.
    compress: true,
    static: {
      // By default WebpackDevServer serves physical files from current directory
      // in addition to all the virtual build products that it serves from memory.
      // This is confusing because those files won’t automatically be available in
      // production build folder unless we copy them. However, copying the whole
      // project directory is dangerous because we may expose sensitive files.
      // Instead, we establish a convention that only files in `public` directory
      // get served. Our build script will copy `public` into the `build` folder.
      // In `index.html`, you can get URL of `public` folder with %PUBLIC_URL%:
      // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
      // In JavaScript code, you can access it with `process.env.PUBLIC_URL`.
      // Note that we only recommend to use `public` folder as an escape hatch
      // for files like `favicon.ico`, `manifest.json`, and libraries that are
      // for some reason broken when imported through webpack. If you just want to
      // use an image, put it in `src` and `import` it from JavaScript instead.
      directory: paths.appPublic,
      publicPath: [config.publicPath || '/'],
      watch: {
        // Reportedly, this avoids CPU overload on some systems.
        // https://github.com/facebook/create-react-app/issues/293
        // src/node_modules is not ignored to support absolute imports
        // https://github.com/facebook/create-react-app/issues/1065
        ignored: ignoredFiles(paths.appSrc),
      },
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    historyApiFallback: {
      // Paths with dots should still use the history fallback.
      // See https://github.com/facebook/create-react-app/issues/387.
      disableDotRule: true,
      index: config.publicPath,
    },
  };
}

function ignoredFiles(appSrc: string) {
  // eslint-disable-next-line prefer-template
  return new RegExp(`^(?!${escape(path.normalize(appSrc + '/').replace(/[\\]+/g, '/'))}).+/node_modules/`, 'g');
}
