import { transformSync } from '@babel/core';
import path from 'path';
import babelPluginNoAnonymousDefaultExport from '../babel-plugins/no-anonymous-default-export';

function transform(code: string, filename: string) {
  return transformSync(code, {
    filename,
    plugins: [babelPluginNoAnonymousDefaultExport],
  });
}

test('convert arrowFunction', () => {
  const ret = transform('export default ()=>{}', path.resolve('./src/test.jsx'));
  expect(ret?.code).toMatchSnapshot();
});

test('convert anonymous function', () => {
  const ret = transform('export default function(){}', path.resolve('./src/test.tsx'));
  expect(ret?.code).toMatchSnapshot();
});

test('file extension matters', () => {
  const ret = transform('export default ()=>{}', path.resolve('./src/test.js'));
  expect(ret?.code).toMatchSnapshot();
});
