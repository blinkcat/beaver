#!/usr/bin/env node
const { Command } = require('commander');
const { src, dest } = require('vinyl-fs');

const program = new Command();
program.version('0.0.1');

program
  .command('copy <source> <destination>')
  .description('copy source to destination')
  .action((source, destination) => {
    src(source).pipe(dest(destination));
  });

program.parse(process.argv);
