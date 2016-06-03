import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import multiEntry from 'rollup-plugin-multi-entry';
import nodeResolve from 'rollup-plugin-node-resolve';
import { readdirSync } from 'fs';
import { join as joinPath } from 'path';

export default {
  entry: [
    joinPath(__dirname, '../test/index.js'),
    joinPath(__dirname, '../test/unit/**/*.js'),
    joinPath(__dirname, '../test/integration/**/*.js'),
  ],

  external: [
    ...readdirSync(joinPath(__dirname, '../node_modules')),
    ...readdirSync(joinPath(__dirname, '../test/test-app/node_modules')),
    joinPath(__dirname, '../test/test-app/dist/boot.js'),
    joinPath(__dirname, '../test/test-app/dist/bundle.js')
  ],

  plugins: [
    commonjs({
      include: joinPath(__dirname, '../node_modules/**'),
      ignoreGlobal: true
    }),

    nodeResolve({
      preferBuiltins: true
    }),

    babel(),

    multiEntry()
  ],
};
