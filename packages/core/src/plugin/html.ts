import { IBeaverPluginFactory } from '@beaver/types';
import { cheerio, CheerioAPI, tapable } from '@beaver/utils';
import path from 'path';

const { AsyncSeriesHook } = tapable;

const hooks = {
  html: new AsyncSeriesHook<CheerioAPI>(['$']),
};

const htmlPlugin: IBeaverPluginFactory = context => {
  const html = `
  <!DOCTYPE html>
  <html lang="zh">
  <head>
	  <meta charset="UTF-8">
	  <meta http-equiv="X-UA-Compatible" content="IE=edge">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Beaver app</title>
  </head>
  <body>
	  <div id="root"></div>
  </body>
  </html>   
  `;
  const $ = cheerio.load(html);

  return {
    name: '__htmlPlugin',
    register({ addNewHook, addNewMethod }) {
      addNewHook('html', ({ pluginName, callback }) => {
        hooks.html.tapPromise(pluginName, callback);
      });

      addNewMethod('getHtml', async () => {
        await hooks.html.promise($);
        return $.html();
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-shadow
    async html($) {
      const config = context.methods.getResolvedConfig();
      // add favicon
      $(`<link rel="icon" href="${path.join(config.publicPath || '/', 'favicon.ico')}" />`).insertAfter(
        $('head meta').eq(0)
      );
    },
  };
};

export default htmlPlugin;
