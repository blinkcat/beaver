import { extname } from 'path';

// eslint-disable-next-line func-names
export default function () {
  const styleExtensions = ['.css', '.scss', '.sass', '.less'];

  return {
    visitor: {
      ImportDeclaration(path: any) {
        const { specifiers, source } = path.node;

        if (specifiers.length && styleExtensions.includes(extname(source.value))) {
          source.value = `${source.value}?modules`;
        }
      },
    },
  };
}
