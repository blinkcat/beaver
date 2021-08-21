import { IApi } from '../../api';

export default (api: IApi) => {
  api.registerCommand('debug', () => {
    const logger = api.getLogger('test', { level: 0 });

    logger.info('test', 123, new Date(), { a: 1, b: 2 });

    logger.debug(123, '43223');
  });
};
