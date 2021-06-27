import webpack, { Configuration } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { IApi } from '../../api';
import { getConfig } from '../../config/dev';

// https://github.com/node-modules/detect-port

export default (api: IApi) => {
  api.registerCommand('dev', async (args: any) => {
    process.env.NODE_ENV = 'development';

    async function triggerModifyWebpackConfig(type: string, isNode = false): Promise<Configuration> {
      return api.trigger({
        type: api.triggerType.modify,
        name: 'modifyWebpackConfig',
        initialValue: await getConfig(api, args, isNode),
        args: { env: 'development', type },
      });
    }

    const clientCompiler = webpack(await triggerModifyWebpackConfig('client'));
    let watching: webpack.Watching | undefined;

    if (api.userConfig.ssr) {
      const serverCompiler = webpack(await triggerModifyWebpackConfig('server', true));

      clientCompiler.hooks.done.tap('beaver-dev', () => {
        if (watching) {
          return;
        }

        watching = serverCompiler.watch({}, (err, stats) => {
          if (err) {
            console.log(err);
          }

          if (stats?.hasErrors()) {
            console.log(stats.toString({ all: false, errors: true, colors: true }));
          }

          if (stats?.hasWarnings()) {
            console.log(stats.toString({ all: false, warnings: true, colors: true }));
          }
        });
      });
    }

    const clientServer = new WebpackDevServer(
      {
        hot: true,
        open: true,
        historyApiFallback: true,
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: 'all',
      },
      clientCompiler
    );
    // suppress log
    (clientServer as any).logStatus = () => {};
    clientServer.start().catch(console.log);

    // https://nodejs.org/docs/latest-v12.x/api/process.html#process_signal_events
    ['SIGTERM', 'SIGINT'].forEach(sig => {
      process.on(sig, () => {
        clientServer.stop();
        watching?.close(() => {});
        process.exit();
      });
    });
  });
};
