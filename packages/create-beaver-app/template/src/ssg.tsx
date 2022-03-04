import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
// @ts-ignore
import { ChunkExtractor } from '@loadable/server';
import { Helmet } from 'react-helmet';
import { TWebpackStatsCompilation } from '@beaver/types';
import App from './App';

export function render({ url, stats }: { url: string; stats: TWebpackStatsCompilation }) {
  const extractor = new ChunkExtractor({ stats });
  const appStr = renderToString(
    extractor.collectChunks(
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    )
  );
  const helmet = Helmet.renderStatic();
  const html =
    '<!DOCTYPE html>\n' +
    renderToStaticMarkup(
      <html {...helmet.htmlAttributes.toComponent()}>
        <head>
          <meta charSet="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          {helmet.meta.toComponent()}
          {helmet.link.toComponent()}
          {helmet.script.toComponent()}
          {helmet.title.toComponent()}
          {extractor.getStyleElements()}
          {extractor.getScriptElements({ async: false, defer: true })}
        </head>
        <body {...helmet.bodyAttributes.toComponent()}>
          <div id="root" dangerouslySetInnerHTML={{ __html: appStr }} />
        </body>
      </html>
    );

  return { html };
}

export async function routes() {
  return ['/', '/world'];
}
