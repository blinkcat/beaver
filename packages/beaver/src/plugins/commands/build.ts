import { IApi } from '../../api';

export default (api: IApi) => {
  api.registerCommand('build', async (args: any) => {
    console.log(args);
  });
};
