import { RuleSetRule } from 'webpack';

export function getAssetRule(): RuleSetRule {
  // https://webpack.js.org/guides/asset-modules/#general-asset-type
  return {
    test: /\.(jpe?g|png|gif|bmp|svg)$/,
    type: 'asset',
    parser: {
      dataUrlCondition: {
        maxSize: 4 * 1024, // 4kb
      },
    },
  };
}

export function getBabelRule(): RuleSetRule {
  return {
    test: /\.(jsx?|tsx?|mjs)$/,
    loader: 'babel-loader',
  };
}

export function getDefaultRule(): RuleSetRule {
  // https://webpack.js.org/migrate/3/#json-loader-is-not-required-anymore
  return {
    exclude: /\.(jsx?|tsx?|mjs|jpe?g|png|gif|bmp|svg|json|html)$/,
    type: 'asset/source',
  };
}

const postCssRule: RuleSetRule = {
  // https://webpack.js.org/loaders/postcss-loader/
  loader: 'postcss-loader',
  options: {
    postcssOptions: {
      plugins: [
        'postcss-flexbugs-fixes',
        [
          'postcss-preset-env',
          // https://github.com/csstools/postcss-preset-env#options
          {
            autoprefixer: {
              flexbox: 'no-2009',
            },
            stage: 3,
          },
        ],
      ],
    },
  },
};

export function getCssRules(options: RuleSetRule['options']): RuleSetRule[] {
  return [{ loader: 'css-loader', options }, postCssRule];
}

export const extensions = ['.js', '.jsx', '.ts', '.tsx'];
