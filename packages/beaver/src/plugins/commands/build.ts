import webpack, { Configuration } from 'webpack';
import fs from 'fs';
import path from 'path';
import filesize from 'filesize';
import gzipSize from 'gzip-size';
import chalk from 'chalk';
import { IApi } from '../../api';
import { getConfig } from '../../config/client-prod';
import { ETriggerType } from '../../coreService';

export default (api: IApi) => {
  api.registerCommand('build', async (args: any) => {
    process.env.NODE_ENV = 'production';

    const config: Configuration = await api.trigger({
      type: ETriggerType.modify,
      name: 'modifyWebpackConfig',
      initialValue: await getConfig(api, args),
      args: { env: 'development', type: 'client' },
    });

    const compiler = webpack(config);

    console.log('creating a production build...');

    compiler.run((err, stats) => {
      if (err) {
        console.error(err);
        return;
      }

      const info = stats!.toJson();

      if (stats!.hasErrors()) {
        console.error(info?.errors);
      }

      if (stats!.hasWarnings()) {
        console.warn(info?.warnings);
      }

      const statsJson = getStatsJson(stats!);

      console.log();
      console.log(
        chalk.green('It took ') + chalk.yellow(`${statsJson.time}ms`) + chalk.green(' to build successfully')
      );
      console.log();
      console.log('File sizes after gzip:');
      console.log();

      const assets = statsJson
        .assets!.filter(asset => asset.name.endsWith('.js') || asset.name.endsWith('.css'))
        .map(asset => {
          const content = fs.readFileSync(path.join(statsJson.outputPath!, asset.name));
          const size = gzipSize.sync(content);
          const sizeWithUnit = filesize(size);

          return {
            size: sizeWithUnit,
            name: path.basename(asset.name),
            dir: path.dirname(asset.name),
          };
        });

      const maxSizeLength = Math.max(...assets.map(asset => asset.size.length));

      assets.forEach(asset => {
        console.log(
          `${asset.size}${' '.repeat(maxSizeLength - asset.size.length)}  ${chalk.dim(
            path.basename(api.paths.appOutputPath) + path.sep + chalk.dim(asset.dir) + path.sep
          )}${chalk.cyan(asset.name)}`
        );
      });
    });
  });
};

function getStatsJson(stats: webpack.Stats) {
  return stats.toJson({
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
    errorsCount: false,
    warningsCount: false,
  });
}
