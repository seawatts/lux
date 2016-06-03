// @flow
import moment from 'moment';
import { dim, red, yellow } from 'chalk';
import { isMaster, isWorker } from 'cluster';

import write from './utils/write';
import initialize from './initialize';

import bound from '../../decorators/bound';
import memoize from '../../decorators/memoize';

const {
  stderr,
  stdout,

  env: {
    NODE_ENV = 'development'
  }
} = process;

/**
 *
 */
class Logger {
  /**
   * @private
   */
  path: string;

  /**
   *
   */
  enabled: boolean;

  constructor({
    path,
    enabled
  }: {
    path: string,
    enabled: boolean,
  } = {}): Promise<Logger> {
    Object.defineProperties(this, {
      path: {
        value: path,
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

    return initialize(this, isMaster);
  }

  @memoize
  get file(): string {
    return `${this.path}/log/${NODE_ENV}.log`;
  }

  get timestamp(): string {
    return moment().format('M/D/YY h:m:ss A');
  }

  @bound
  log(msg: string): void {
    if (this.enabled) {
      if (isWorker && typeof process.send === 'function') {
        process.send({
          data: msg,
          type: 'info',
          message: 'log'
        });
      } else if (isMaster) {
        msg = `${dim(`[${this.timestamp}]`)} ${msg}\n\n`;

        stdout.write(msg);
        setImmediate(write, this.file, msg);
      }
    }
  }

  @bound
  error(msg: string): void {
    if (this.enabled) {
      if (isWorker && typeof process.send === 'function') {
        process.send({
          data: msg,
          type: 'error',
          message: 'log'
        });
      } else if (isMaster) {
        msg = `${red(`[${this.timestamp}]`)} ${msg}\n\n`;

        stderr.write(msg);
        setImmediate(write, this.file, msg);
      }
    }
  }

  @bound
  warn(msg: string): void {
    if (this.enabled) {
      if (isWorker && typeof process.send === 'function') {
        process.send({
          data: msg,
          type: 'warn',
          message: 'log'
        });
      } else if (isMaster) {
        msg = `${yellow(`\n\n[${this.timestamp}] Warning:`)} ${msg}\n\n`;

        stderr.write(msg);
        setImmediate(write, this.file, msg);
      }
    }
  }

  logFromMessage({
    data,
    type,
  }: {
    data: string,
    type: string
  }): void {
    if (isMaster) {
      switch (type) {
        case 'error':
          return this.error(data);

        case 'info':
          return this.log(data);

        case 'warn':
          return this.warn(data);
      }
    }
  }
}

export { default as line } from './utils/line';
export { default as sql } from './utils/sql';
export default Logger;
