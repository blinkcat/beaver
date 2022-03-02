import { IBeaverPluginFactory } from '@beaver/types';
import { fs, chalk } from '@beaver/utils';
import type { StatsCompilation } from 'webpack';
import path from 'path';
import filesize from 'filesize';
import gzipSize from 'gzip-size';

const buildCommandPlugin: IBeaverPluginFactory = context => ({
  name: '__buildCommandPlugin',
  register({ addNewCommand }) {
    addNewCommand('build', async () => {
      // Makes the script crash on unhandled rejections instead of silently
      // ignoring them. In the future, promise rejections that are not handled will
      // terminate the Node.js process with a non-zero exit code.
      process.on('unhandledRejection', err => {
        console.error('Unexpected error', err);
        process.exit(1);
      });
      process.env.NODE_ENV = 'production';

      const { getWebpackConfigs, getWebpack, createWebpackConfig } = context.methods;
      const webpack = getWebpack();
      const webpackConfigs = await getWebpackConfigs(await createWebpackConfig({ env: 'production', isServer: false }));
      const compiler = webpack(webpackConfigs);

      console.log('creating a production build...');

      const paths = context.methods.getPaths();
      // copy public directory to output directory
      fs.copySync(paths.appPublic, paths.appOutputPath, { dereference: true });

      compiler.run((err, stats) => {
        if (err) {
          console.error(err);
          return;
        }

        const info = stats!.toJson({
          all: false,
          errors: true,
          warnings: true,
          assets: true,
          timings: true,
          outputPath: true,
          errorStack: true,
        });

        if (stats!.hasErrors()) {
          console.error(info.errors);
          return;
        }

        if (stats!.hasWarnings()) {
          console.warn(info.warnings);
        }

        info.children?.forEach(printBuildResult);
      });
    });
  },
});

export default buildCommandPlugin;

function printBuildResult(statsJson: StatsCompilation) {
  console.log();
  console.log(chalk.green('It took ') + chalk.yellow(`${statsJson.time}ms`) + chalk.green(' to build successfully'));
  console.log();
  console.log('File sizes after gzip:');
  console.log();

  const assets = statsJson
    .assets!.filter(asset => asset.name && (asset.name.endsWith('.js') || asset.name.endsWith('.css')))
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
        path.basename(statsJson.outputPath || '') + path.sep + chalk.dim(asset.dir) + path.sep
      )}${chalk.cyan(asset.name)}`
    );
  });
}
