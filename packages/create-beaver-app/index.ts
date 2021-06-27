#!/usr/bin/env node
import { mri, fs, chalk } from '@beaver/utils';
import semver from 'semver';
import { execSync } from 'child_process';
import path from 'path';
import packageJson from './package.json';

ensureNodeVersion();
ensureCliVersion();

// parse args
const parsed = mri(process.argv.slice(2));

if (parsed._.length === 0 || parsed.help === true || parsed.h === true) {
  printHelpInfo();
} else {
  const [projectName] = parsed._;

  create(projectName);
}

function create(projectName: string) {
  if (projectName == null) {
    console.log(chalk.red('you must provide project directory!'));
    // To exit with a 'failure' code
    process.exit(1);
  }

  // path like app ./app ./a/b/c/app ....
  const appPath = path.resolve(projectName);
  const appName = path.basename(appPath);

  ensureAppDirectory(appPath, appName);

  console.log('copy template to the target project folder...');

  const templatePackageJson = require('../template/package.json');

  templatePackageJson.name = appName;
  templatePackageJson.devDependencies['@beaver/core'] = `^${getLastestPackageVersion('@beaver/core')}`;
  templatePackageJson.devDependencies['beaver-plugin-webpack5'] = `^${getLastestPackageVersion(
    'beaver-plugin-webpack5'
  )}`;

  fs.copySync(path.resolve(__dirname, '../template'), appPath);
  fs.writeJSONSync(path.join(appPath, './package.json'), templatePackageJson, { spaces: 2 });
  fs.renameSync(path.join(appPath, './gitignore'), path.join(appPath, './.gitignore'));

  console.log('install dependencies...');

  execSync('npm install', {
    cwd: appPath,
    stdio: 'inherit',
  });
}

function getLastestPackageVersion(pkgName: string) {
  return execSync(`npm view ${pkgName} version`).toString().trim();
}

function printHelpInfo() {
  console.log(`${packageJson.name} usage:`);
  console.log(`npx ${packageJson.name} <project-directory>`);
}

function ensureNodeVersion() {
  if (!semver.satisfies(process.versions.node, packageJson.engines.node)) {
    console.error(
      chalk.red`${packageJson.name} requires Node version ${packageJson.engines.node}, but current Node version is ${process.versions.node}`
    );
    process.exit(1);
  }
}

function ensureCliVersion() {
  try {
    const version = execSync(`npm view ${packageJson.name} version`).toString().trim();

    if (version !== packageJson.version) {
      console.log(chalk.red`${packageJson.name} is not the latest version!`);
      console.log(`current version is ${chalk.yellow(packageJson.version)}`);
      console.log(`latest version is ${chalk.yellow(version)}`);
      console.log('Please try:');
      console.log(chalk.cyan`npx ${packageJson.name} ${chalk.green('<project-directory>')} [options]`);
      console.log('or');
      console.log(
        chalk.cyan`npx --ignore-existing ${packageJson.name} ${chalk.green('<project-directory>')} [options]`
      );
    }

    return;
  } catch (err) {
    console.log(chalk.red`failed to fetch the latest cli version!`);
    console.error(err);
  }
  process.exit(1);
}

function ensureAppDirectory(appPath: string, appName: string) {
  console.log(`Creating a new app in ${chalk.green(appPath)}`);

  fs.ensureDirSync(appPath);

  const validFileNames = ['.git', '.gitignore', '.gitattributes', 'LICENSE', 'README.md'];
  const conflicts = fs.readdirSync(appPath).filter(name => !validFileNames.includes(name));

  if (conflicts.length > 0) {
    console.log(chalk.yellow`some files/folders in ${appName} directory may cause conflicts`);
    conflicts.forEach(name => {
      console.log(`- ${name}`);
    });
    console.log(chalk.yellow('remove these or try a new name'));
    process.exit(1);
  }
}
