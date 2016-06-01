import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import { readdirSync } from 'fs';

export default {
  external: readdirSync('node_modules'),

  banner: 'const external = require;\n' +
    'require(\'source-map-support\').install();\n',

  plugins: [
    json(),

    commonjs({
      include: 'node_modules/**',
      ignoreGlobal: true
    }),

    nodeResolve({
      preferBuiltins: true
    }),

    eslint({
      throwError: true,

      exclude: [
        'node_modules/**',
        'package.json'
      ]
    }),

    babel(),
  ],
};
