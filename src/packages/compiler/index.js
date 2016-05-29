/* @flow */
import path from 'path';
import webpack from 'webpack';
import { green } from 'chalk';

import fs from '../fs';

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
    }, {
      ['/Users/zacharygolba/.nvm/versions/node/v6.2.0/lib/node_modules/lux-' +
        'framework']: '/Users/zacharygolba/.nvm/versions/node/v6.2.0/lib/' +
          'node_modules/lux-framework'
    });

  const entry = await Promise.all([
    fs.readdirAsync(path.join(dir, 'app/models')),
    fs.readdirAsync(path.join(dir, 'app/controllers')),
    fs.readdirAsync(path.join(dir, 'app/serializers'))
  ]).then(([
    models,
    controllers,
    serializers
  ]) => {
    const app = path.join('app', 'index.js');
    const routes = path.join('app', 'routes.js');
    const config = path.join('config', 'environments', `${env}.js`);
    const database = path.join('config', 'database.js');

    const reducer = (type, files) => files.reduce((hash, file) => {
      file = path.join('app', type, file);

      return {
        ...hash,
        [file]: path.join(dir, file)
      };
    }, {});

    return {
      [app]: path.join(dir, app),
      [routes]: path.join(dir, routes),
      [config]: path.join(dir, config),
      [database]: path.join(dir, database),
      ...reducer('models', models),
      ...reducer('controllers', controllers),
      ...reducer('serializers', serializers)
    };
  });

  return webpack({
    entry,
    plugins,
    externals,
    target: 'node',

    output: {
      path: path.join(dir, 'dist'),
      filename: '[name]',
      libraryTarget: 'commonjs'
    },

    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: ['babel', 'eslint'],
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
