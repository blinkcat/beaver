import type { IApi } from '../api';

export default (api: IApi) => {
  ['modifyPaths', 'modifyConfig', 'modifyWebpackConfig', 'modifyBabelConfig', 'modifyHtml'].forEach(method =>
    api.registerMethod(method)
  );
};
