// @flow
import { join as joinPath } from 'path';

import fs, { exists } from '../fs';

import type Logger from './index';

const { env: { NODE_ENV = 'development' } } = process;

/**
 * @private
 */
export default async function initialize(
  instance: Logger,
  isMaster: boolean
): Promise<Logger> {
  if (isMaster) {
    const { path } = instance;
    const logsDir = joinPath(path, 'log');
    const logPath = joinPath(logsDir, `${NODE_ENV}.log`);
    let doesExist = await exists(logsDir);

    if (!doesExist) {
      await fs.mkdirAsync(logsDir);
    }

    doesExist = await exists(logPath);

    if (!doesExist) {
      await fs.writeFileAsync(logPath, '', 'utf8');
    }
  }

  return instance;
}
