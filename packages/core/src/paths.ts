import path from 'path';
import fs from 'fs';
import { IBeaverPaths } from '@beaver/types';

// https://github.com/facebookincubator/create-react-app/issues/637
const realAppDirectory = fs.realpathSync(process.cwd());

function resolveApp(relativePath: string) {
  return path.resolve(realAppDirectory, relativePath);
}

const paths: IBeaverPaths = {
  appRoot: resolveApp('.'),
  appSrc: resolveApp('src'),
  appSrcClientIndex: resolveApp('src/index'),
  appSrcServerIndex: resolveApp('src/server'),
  appPublic: resolveApp('public'),
  appPackageJson: resolveApp('package.json'),
  appTsConfig: resolveApp('tsconfig.json'),
  appBeaverConfig: resolveApp('beaver.config.ts'),
  appOutputPath: resolveApp('./dist'),
  appWebpackCache: resolveApp('node_modules/.cache'),
  appNodeModules: resolveApp('node_modules'),
  appHtml: resolveApp('public/index.html'),
  appTsBuildInfoFile: resolveApp('node_modules/.cache/tsconfig.tsbuildinfo'),
};

export default paths;
