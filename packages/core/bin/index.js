#!/usr/bin/env node
const { fork } = require('child_process');

const execArgv = [];

if (process.env.NODE_ENABLE_SOURCE_MAP === 'true') {
  execArgv.push('--enable-source-maps');
}

const child = fork(require.resolve('../dist'), process.argv.slice(2), {
  execArgv,
  stdio: 'inherit',
});

process.on('SIGINT', () => {
  child.kill(0);
});
