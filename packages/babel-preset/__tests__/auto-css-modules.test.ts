import { transformSync } from '@babel/core';
import babelPluginAutoCssModules from '../babel-plugins/auto-css-modules';

function transform(code: string) {
  return transformSync(code, {
    filename: 'test.js',
    plugins: [babelPluginAutoCssModules],
  });
}

['css', 'less', 'scss', 'sass'].forEach(ext => {
  test(`works on ${ext} file`, () => {
    const ret = transform(`import styles from './test.${ext}'`);
    expect(ret?.code).toMatchSnapshot();
  });
});

test('ignores directly import', () => {
  const ret = transform(`import './test.css'`);
  expect(ret?.code).toMatchSnapshot();
});
