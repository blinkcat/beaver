import { ConfigAPI } from '@babel/core';

export interface IOptions {
  react?: boolean;
  typescript?: boolean;
  dev?: boolean;
  autoCssModules?: boolean;
  transformReactRemovePropTypes?: boolean;
  noAnonymousDefaultExport?: boolean;
  transformRuntime?: boolean;
  runtime?: 'classic' | 'automatic';
}

const defaultOptions: IOptions = {
  react: true,
  typescript: true,
  dev: false,
  autoCssModules: false,
  transformReactRemovePropTypes: false,
  noAnonymousDefaultExport: false,
  transformRuntime: true,
  runtime: 'classic',
};

// eslint-disable-next-line func-names
export default function (api: ConfigAPI, userOptions: IOptions = {}) {
  const options = { ...defaultOptions, ...userOptions };
  const {
    react,
    typescript,
    dev,
    transformReactRemovePropTypes,
    autoCssModules,
    noAnonymousDefaultExport,
    transformRuntime,
    runtime,
  } = options;

  /** @see https://babeljs.io/docs/en/config-files#apiassertversionrange */
  api.assertVersion('^7.0.0');

  return {
    presets: [
      /** @see https://babel.dev/docs/en/babel-preset-env */
      [require('@babel/preset-env').default, { useBuiltIns: 'entry', corejs: 3 }],
      /** @see https://babel.dev/docs/en/babel-preset-react */
      react && [require('@babel/preset-react').default, { development: dev, runtime }],
      /** @see https://babel.dev/docs/en/babel-preset-typescript */
      typescript && require('@babel/preset-typescript').default,
    ].filter(Boolean),

    plugins: [
      /** @see https://babel.dev/docs/en/babel-plugin-transform-runtime */
      transformRuntime && [
        require('@babel/plugin-transform-runtime').default,
        {
          corejs: false,
          helpers: true,
          regenerator: true,
          version: require('@babel/runtime/package.json').version,
        },
      ],
      /** @see https://github.com/oliviertassinari/babel-plugin-transform-react-remove-prop-types */
      react &&
        transformReactRemovePropTypes && [
          require('babel-plugin-transform-react-remove-prop-types').default,
          { mode: 'remove', removeImport: true },
        ],
      autoCssModules && require('./babel-plugins/auto-css-modules').default,
      noAnonymousDefaultExport && require('./babel-plugins/no-anonymous-default-export').default,
    ].filter(Boolean),
  };
}
