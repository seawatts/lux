import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import { readdirSync } from 'fs';
import { join as joinPath } from 'path';

export default {
  external: readdirSync(joinPath(__dirname, '../node_modules')),

  banner:
    'require(\'source-map-support\').install();\n' +
    'const external = require;\n',

  plugins: [
    json(),

    commonjs({
      include: joinPath(__dirname, '../node_modules/**'),
      ignoreGlobal: true
    }),

    nodeResolve({
      preferBuiltins: true
    }),

    eslint({
      throwError: true,

      exclude: [
        joinPath(__dirname, '../node_modules/**'),
        joinPath(__dirname, '../package.json')
      ]
    }),

    babel()
  ],
};
