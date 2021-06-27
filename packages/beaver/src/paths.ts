import path from 'path';
import fs from 'fs';

// https://github.com/facebookincubator/create-react-app/issues/637
const realAppDirectory = fs.realpathSync(process.cwd());

function resolveApp(relativePath: string) {
  return path.resolve(realAppDirectory, relativePath);
}

const paths = {
  appRoot: resolveApp('.'),
  appSrc: resolveApp('src'),
  appSrcClientIndex: resolveApp('src/index'),
  appPublic: resolveApp('public'),
  appPackageJson: resolveApp('package.json'),
  appTsconfig: resolveApp('tsconfig.json'),
  appBeaverConfig: resolveApp('beaver.config.ts'),
  appOutputPath: resolveApp('./dist'),
};

export type TPaths = typeof paths;

export default paths;
