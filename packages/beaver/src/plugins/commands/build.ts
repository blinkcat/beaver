import webpack, { Configuration } from 'webpack';
import { IApi } from '../../api';
import { getConfig } from '../../config/client-prod';
import { ETriggerType } from '../../coreService';

export default (api: IApi) => {
  api.registerCommand('build', async (args: any) => {
    process.env.NODE_ENV = 'production';

    const config: Configuration = await api.context.trigger({
      type: ETriggerType.modify,
      name: 'modifyWebpackConfig',
      initialValue: await getConfig(api, args),
      args: { env: 'development', type: 'client' },
    });

    const compiler = webpack(config);

    compiler.run((err, stats) => {
      if (err) {
        console.error(err);
        return;
      }

      const info = stats?.toJson();

      if (stats?.hasErrors()) {
        console.error(info?.errors);
      }

      if (stats?.hasWarnings()) {
        console.warn(info?.warnings);
      }

      // console.log(
      //   stats?.toString({
      //     chunks: false, // Makes the build much quieter
      //     colors: true, // Shows colors in the console
      //   })
      // );
      console.log(
        stats?.toJson({
          assets: true,
          timings: true,
          builtAt: true,
          outputPath: true,
          modules: false,
          chunks: false,
          children: false,
          errors: false,
          warnings: false,
          entrypoints: false,
          nestedModules: false,
        })
      );
    });
  });
};
