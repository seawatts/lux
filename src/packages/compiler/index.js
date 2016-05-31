import path from 'path';
import webpack from 'webpack';
import { green } from 'chalk';

import fs from '../fs';

import createManifest from './utils/create-manifest';

import type { Asset, Compiler, Stats } from 'webpack';

const { stdout, stderr } = process;

/**
 * @private
 */
export async function createCompiler(dir: string, env: string): Compiler {
  let plugins = [];

  const externals = (await fs.readdirAsync(path.join(dir, 'node_modules')))
    .filter(pkg => !/\.bin/g.test(pkg))
    .reduce((hash, pkg) => {
      return {
        ...hash,
        [pkg]: pkg
      };
    }, {});

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

  await createManifest(dir, assets);

  return webpack({
    plugins,
    externals,
    entry: path.join(dir, 'dist/index.js'),
    target: 'node',

    output: {
      path: path.join(dir, 'dist'),
      filename: 'bundle.js',
      libraryTarget: 'commonjs'
    },

    module: {
      preLoaders: [
        {
          test: /\.js$/,
          loader: ['eslint'],
          exclude: /node_modules/
        },
      ],

      loaders: [
        {
          test: /\.js$/,
          loader: ['babel'],
          exclude: /node_modules/
        },

        {
          test: /\.json$/,
          loader: ['json']
        }
      ]
    },

    eslint: {
      failOnError: true
    }
  });
}

/**
 * @private
 */
 export function displayStats(stats: Stats, isRunning: boolean = true): void {
  const {
    assets,
    warnings
  }: {
    assets: Array<Asset>,
    warnings: Array<string>
  } = stats.toJson();

  if (isRunning) {
    const changed = assets.filter(({
      emitted
    }: {
      emitted: boolean
    }) => emitted);

    changed.forEach(({ name }: { name: string }) => {
      stdout.write(`${green('update')} ${name}\n`);
    });

    stdout.write('\n');
  }

  if (warnings.length) {
    warnings.forEach(warning => stderr.write(`${warning}\n`));
  }
}
