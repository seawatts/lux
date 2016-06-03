// @flow
import path from 'path';
import json from 'rollup-plugin-json';
import alias from 'rollup-plugin-alias';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import { rollup } from 'rollup';

import fs, { rmrf } from '../fs';
import createManifest from './utils/create-manifest';
import createBootScript from './utils/create-boot-script';
import { default as onwarn } from './utils/handle-warning';

import type { Bundle } from 'rollup';

/**
 * @private
 */
export async function compile(
  dir: string,
  env: string,
  useStrict: boolean = false
): Promise<void> {
  const local = path.join(__dirname, 'index');
  const entry = path.join(dir, 'dist/index.js');

  const external = await Promise.all([
    fs.readdirAsync(path.join(dir, 'node_modules')),
    fs.readdirAsync(path.join(__dirname, '../node_modules')),
  ]).then(([a, b]: [Array<string>, Array<string>]) => {
    return a.concat(b);
  });

  const assets = await Promise.all([
    fs.readdirAsync(path.join(dir, 'app/models')),
    fs.readdirAsync(path.join(dir, 'app/controllers')),
    fs.readdirAsync(path.join(dir, 'app/serializers')),
    fs.readdirAsync(path.join(dir, 'db/migrate')),
  ]).then(([
    models,
    controllers,
    serializers,
    migrations
  ]) => {
    return new Map([
      ['Application', path.join('app', 'index.js')],
      ['config', path.join('config', 'environments', `${env}.js`)],
      ['controllers', controllers],
      ['database', path.join('config', 'database.js')],
      ['migrations', migrations],
      ['models', models],
      ['routes', path.join('app', 'routes.js')],
      ['seed', path.join('db', 'seed.js')],
      ['serializers', serializers]
    ]);
  });

  await Promise.all([
    createManifest(dir, assets),
    createBootScript(dir)
  ]);

  const bundle: Bundle = await rollup({
    entry,
    onwarn,
    external,

    plugins: [
      alias({
        LUX_LOCAL: local
      }),

      json(),

      commonjs({
        ignoreGlobal: true,

        include: [
          path.join(__dirname, '**'),
          path.join(dir, 'node_modules/**')
        ]
      }),

      nodeResolve({
        preferBuiltins: true
      }),

      eslint({
        include: [
          path.join(dir, 'app/**'),
        ],

        exclude: [
          path.join(dir, 'node_modules/**'),
          path.join(dir, 'package.json')
        ]
      }),

      babel({
        exclude: [
          path.join(__dirname, '**'),
          path.join(dir, 'node_modules/**')
        ]
      })
    ]
  });

  await rmrf(entry);

  return await bundle.write({
    dest: path.join(dir, 'dist/bundle.js'),
    format: 'cjs',
    useStrict: false
  });
}
