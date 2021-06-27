import { IApi } from '../api';
import { client } from './client';
import { IWebpackConfigFactoryOptions } from './types';

export function getWebpackConfig(options: IWebpackConfigFactoryOptions, api: IApi, args?: any) {
  return client.bind({ options, api }, args)();
}
