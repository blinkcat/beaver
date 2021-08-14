import webpack, { Configuration } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { IApi } from '../../api';
import { getConfig } from '../../config/client-dev';
import { ETriggerType } from '../../coreService';

// https://github.com/node-modules/detect-port

export default (api: IApi) => {
  api.registerCommand('dev', async (args: any) => {
    process.env.NODE_ENV = 'development';

    const config: Configuration = await api.context.trigger({
      type: ETriggerType.modify,
      name: 'modifyWebpackConfig',
      initialValue: await getConfig(api, args),
      args: { env: 'development', type: 'client' },
    });

    const server = new WebpackDevServer(webpack(config), {
      hot: true,
      open: true,
      historyApiFallback: true,
      // 如果是 false 会和 Webpackbar 冲突
      noInfo: true,
    });

    server.listen(3000, err => {
      if (err) {
        console.log(err);
      }
    });

    // https://nodejs.org/docs/latest-v12.x/api/process.html#process_signal_events
    ['SIGTERM', 'SIGINT'].forEach(sig => {
      process.on(sig, () => {
        server.close();
        process.exit();
      });
    });
  });
};
