import { transformSync } from '@babel/core';
import babelPresetBeaver, { IOptions } from '../index';

function transform(code: string, filename: string, presetOptions: IOptions = {}) {
  return transformSync(code, {
    filename,
    presets: [[babelPresetBeaver, presetOptions]],
  });
}

test('works on react and typescript', () => {
  const ret = transform(
    `
  	import React from 'react';

	export interface NameProps{
		name:string
	}

	const Name:React.FC<NameProps>=({name})=>{
		return <p>{name}</p>
	}

	const Test:React.FC=()=>{
		return <div><Name name="test" /></div>
	}

	export default Test;
  `,
    'test.tsx',
    { react: true, typescript: true }
  );
  expect(ret?.code).toMatchSnapshot();
});
