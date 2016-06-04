// @flow
import { PassThrough } from 'stream';
import { createWriteStream } from 'fs';
import { join as joinPath } from 'path';

import AnsiRemover from './ansi-remover';
import fs, { exists } from '../fs';

import type Logger from './index';

const { env: { NODE_ENV = 'development' } } = process;

/**
 * @private
 */
export default async function initialize(instance: Logger, isMaster: boolean, {
  path,
  enabled
}: {
  path: string,
  enabled: boolean
}): Promise<Logger> {
  const stdout = new PassThrough();
  const stderr = new PassThrough();

  Object.defineProperties(instance, {
    path: {
      value: path,
      writable: false,
      enumerable: false,
      configurable: false
    },

    stdout: {
      value: stdout,
      writable: false,
      enumerable: false,
      configurable: false
    },

    stderr: {
      value: stderr,
      writable: false,
      enumerable: false,
      configurable: false
    },

    enabled: {
      value: Boolean(enabled),
      writable: false,
      enumerable: true,
      configurable: false
    }
  });

  if (isMaster) {
    const logsDir = joinPath(path, 'log');
    const logPath = joinPath(logsDir, `${NODE_ENV}.log`);
    const ansiRemover = new AnsiRemover();
    let doesExist = await exists(logsDir);

    if (!doesExist) {
      await fs.mkdirAsync(logsDir);
    }

    const writeStream = createWriteStream(logPath);

    stdout
      .pipe(process.stdout, { end: false });

    stdout
      .pipe(ansiRemover, { end: false })
      .pipe(writeStream, { end: false });

    stderr
      .pipe(process.stdout, { end: false });

    stderr
      .pipe(ansiRemover, { end: false })
      .pipe(writeStream, { end: false });
  }

  return instance;
}
