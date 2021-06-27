// import { TPaths } from '../paths';
// import { IBeaverConfig } from '../loadConfig';
import { IApi } from '../api';

export interface IWebpackConfigFactoryOptions {
  type: 'client' | 'server';
  env: 'development' | 'production';
}

export interface ITHIS {
  options: IWebpackConfigFactoryOptions;
  api: IApi;
}
