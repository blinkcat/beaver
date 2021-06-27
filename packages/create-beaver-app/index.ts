#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import semver from 'semver';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import packageJson from './package.json';

checkNodeVersion();
checkCliVersion();

const program = new Command();
let projectName = '';

program
  .name(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .action((name: string) => {
    projectName = name;
  })
  .parse(process.argv);

init();

function init() {
  if (projectName == null) {
    console.log(chalk.red('you must provide project directory!'));
    return;
  }

  const root = path.resolve(projectName);
  const appName = path.basename(root);

  checkAppDirectory(root, appName);
  create(root, appName);
}

function create(projectRootPath: string, appName: string) {
  console.log('copy template to the target project folder...');

  const templatePackageJson = require('../template/package.json');
  const bVersion = execSync(`npm view beaver version`).toString().trim();

  templatePackageJson.name = appName;
  templatePackageJson.devDependencies.beaver = `^${bVersion}`;

  fs.copySync(path.resolve(__dirname, '../template'), projectRootPath);
  fs.writeJSONSync(path.join(projectRootPath, './package.json'), templatePackageJson, { spaces: 2 });
  fs.renameSync(path.join(projectRootPath, './gitignore'), path.join(projectRootPath, './.gitignore'));

  console.log('install dependencies...');

  execSync('npm install', {
    cwd: projectRootPath,
    stdio: 'inherit',
  });
}

function checkNodeVersion() {
  if (!semver.satisfies(process.versions.node, packageJson.engines.node)) {
    console.error(
      chalk.red`${packageJson.name} requires Node version ${packageJson.engines.node}, but current Node version is ${process.versions.node}`
    );
    process.exit(1);
  }
}

function checkCliVersion() {
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
    } else {
      return;
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(1);
}

function checkAppDirectory(appPath: string, appName: string) {
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
