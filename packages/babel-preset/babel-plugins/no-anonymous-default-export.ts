// eslint-disable-next-line func-names
import { extname, relative, sep } from 'path';
import _ from 'lodash';

function getNewName(filename: string, cwd: string) {
  return relative(cwd, filename)
    .replace(extname(filename), '')
    .split(sep)
    .map(seg => _.upperFirst(seg.replace(/[^a-zA-Z0-9_$]/g, '')))
    .join('');
}

// eslint-disable-next-line func-names
export default function (babel: any) {
  const { types: t, template } = babel;

  return {
    visitor: {
      ExportDefaultDeclaration(path: any, state: any) {
        const {
          file: {
            opts: { filename, cwd },
          },
        } = state;

        if (!['.tsx', '.jsx'].includes(extname(filename as string)) || filename.indexOf('node_modules') > -1) {
          return;
        }

        getNewName(filename, cwd);

        const tpath = path.get('declaration');
        let newName = getNewName(filename, cwd);
        let id = 0;

        while (path.scope.hasBinding(newName)) {
          // eslint-disable-next-line no-plusplus
          newName += id++;
        }

        const newNameNode = t.identifier(newName);

        if (tpath.isArrowFunctionExpression()) {
          const ast = template('const %%name%% = %%arrowfunc%%;')({
            name: newNameNode,
            arrowfunc: tpath.node,
          });

          path.scope.registerDeclaration(path.insertBefore(ast)[0]);
          tpath.replaceWith(newNameNode);
        } else if (tpath.isFunctionDeclaration() && tpath.node.id == null) {
          tpath.node.id = newNameNode;
        }
      },
    },
  };
}
