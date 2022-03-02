import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Helmet } from 'react-helmet';
import { ISsgAssets } from '@beaver/types';
import App from './App';

export function render({ url, assets }: { url: string; assets: ISsgAssets }) {
  const appStr = renderToString(
    <StaticRouter location={url}>
      <Helmet>
        {assets.css.map(url => (
          <link rel="stylesheet" href={url} key={url} />
        ))}
        {assets.js.map(url => (
          <script defer type="text/javascript" src={url} key={url} />
        ))}
      </Helmet>
      <App />
    </StaticRouter>
  );
  const helmet = Helmet.renderStatic();
  const html = `
      <!DOCTYPE html>
      <html lang="zh" ${helmet.htmlAttributes.toString()}>
        <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        ${helmet.script.toString()}
        ${helmet.title.toString()}
        </head>
        <body ${helmet.bodyAttributes.toString()}>
          <div id="root">${appStr}</div>
        </body>
      </html>
      `;

  return { html };
}

export const routes = async () => {
  return ['/', '/world'];
};
