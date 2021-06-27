export interface IOptions {
  react?: boolean;
  typescript?: boolean;
  dev?: boolean;
  autoCssModules?: boolean;
  transformReactRemovePropTypes?: boolean;
  noAnonymousDefaultExport?: boolean;
  transformRuntime?: boolean;
}

const defaultOptions: IOptions = {
  react: true,
  typescript: true,
  dev: false,
  autoCssModules: true,
  transformReactRemovePropTypes: false,
  noAnonymousDefaultExport: true,
  transformRuntime: true,
};

// eslint-disable-next-line func-names
export default function (api: any, userOptions: IOptions = {}) {
  const options = { ...defaultOptions, ...userOptions };
  const {
    react,
    typescript,
    dev,
    transformReactRemovePropTypes,
    autoCssModules,
    noAnonymousDefaultExport,
    transformRuntime,
  } = options;

  /** @see https://babeljs.io/docs/en/config-files#apiassertversionrange */
  api.assertVersion('^7.0.0');

  return {
    presets: [
      /** @see https://babel.dev/docs/en/babel-preset-env */
      [require('@babel/preset-env'), { useBuiltIns: 'entry', corejs: 3 }],
      /** @see https://babel.dev/docs/en/babel-preset-react */
      react && [require('@babel/preset-react'), { development: dev }],
      /** @see https://babel.dev/docs/en/babel-preset-typescript */
      typescript && require('@babel/preset-typescript'),
    ].filter(Boolean),

    plugins: [
      /** @see https://babel.dev/docs/en/babel-plugin-transform-runtime */
      transformRuntime && [
        require('@babel/plugin-transform-runtime'),
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
          require('babel-plugin-transform-react-remove-prop-types'),
          { mode: 'remove', removeImport: true },
        ],
      autoCssModules && require('./babel-plugins/auto-css-modules').default,
      noAnonymousDefaultExport && require('./babel-plugins/no-anonymous-default-export').default,
    ].filter(Boolean),
  };
}
