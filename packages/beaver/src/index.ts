import { fork } from 'child_process';
import resolve from 'resolve';

const execArgv: string[] = [];

if (process.env.NODE_ENABLE_SOURCE_MAP === 'true') {
  execArgv.push('--enable-source-maps');
}

const child = fork(resolve.sync('./starter'), process.argv.slice(2), {
  execArgv,
});

process.on('SIGINT', () => {
  child.kill(0);
});
