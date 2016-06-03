// @flow
import path from 'path';

import fs from '../../fs';
import template from '../../template';

/**
 * @private
 */
export default async function createBootScript(dir: string): Promise<void> {
  await fs.writeFileAsync(path.join(dir, 'dist/boot.js'), template`
    const { env: { PWD, PORT } } = process;
    const { Application, config, database } = require('./bundle');

    new Application(
      Object.assign(config, {
        database,
        path: PWD,
        port: PORT
      })
    );
  `, 'utf8');
}
