// @flow
import moment from 'moment';
import { dim, red, yellow } from 'chalk';
import { isMaster, isWorker } from 'cluster';

import initialize from './initialize';

import type { PassThrough } from 'stream';

const { env: { NODE_ENV = 'development' } } = process;

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
  stdout: PassThrough;

  /**
   *
   */
  stderr: PassThrough;

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
    return initialize(this, isMaster, {
      path,
      enabled
    });
  }

  get file(): string {
    return `${this.path}/log/${NODE_ENV}.log`;
  }

  get timestamp(): string {
    return moment().format('M/D/YY h:m:ss A');
  }

  info(msg: string): void {
    if (this.enabled) {
      if (isWorker && typeof process.send === 'function') {
        process.send({
          data: msg,
          type: 'info',
          message: 'log'
        });
      } else if (isMaster && this.stdout) {
        const chunk = new Buffer(`${dim(`[${this.timestamp}]`)} ${msg}\n\n`);

        this.stdout.push(chunk);
      }
    }
  }

  error(msg: string): void {
    if (this.enabled) {
      if (isWorker && typeof process.send === 'function') {
        process.send({
          data: msg,
          type: 'error',
          message: 'log'
        });
      } else if (isMaster && this.stderr) {
        const chunk = new Buffer(`${red(`[${this.timestamp}]`)} ${msg}\n\n`);

        this.stderr.push(chunk);
      }
    }
  }

  warn(msg: string): void {
    if (this.enabled) {
      if (isWorker && typeof process.send === 'function') {
        process.send({
          data: msg,
          type: 'warn',
          message: 'log'
        });
      } else if (isMaster && this.stderr) {
        const chunk = new Buffer(`${yellow(`[${this.timestamp}]`)} ${msg}\n\n`);

        this.stderr.push(chunk);
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
          return this.info(data);

        case 'warn':
          return this.warn(data);
      }
    }
  }
}

export { default as line } from './utils/line';
export { default as sql } from './utils/sql';
export default Logger;
