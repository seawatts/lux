import os from 'os';
import cluster from 'cluster';
import Promise from 'bluebird';
import { EventEmitter } from 'events';
import { red, green } from 'chalk';

import range from '../../../utils/range';

import bound from '../../../decorators/bound';

import type Logger from '../../logger';

const { env: { NODE_ENV = 'development' } } = process;

const { defineProperties } = Object;

/**
 * @private
 */
class Cluster extends EventEmitter {
  logger: Logger;

  worker: Object = cluster.worker;

  workers: Set<Object> = new Set();

  isMaster: boolean = cluster.isMaster;

  maxWorkers: number = os.cpus().length;

  constructor({
    logger,
    setupMaster,
    setupWorker
  }: {
    logger: Logger,
    setupMaster: () => void,
    setupWorker: () => void
  }) {
    super();

    const { isMaster } = this;

    defineProperties(this, {
      logger: {
        value: logger,
        writable: false,
        enumerable: false,
        configurable: false
      },

      setupMaster: {
        value: setupMaster,
        writable: false,
        enumerable: false,
        configurable: false
      },

      setupWorker: {
        value: setupMaster,
        writable: false,
        enumerable: false,
        configurable: false
      }
    });

    if (isMaster) {
      setupMaster(this);
      process.on('update', this.reload);

      this.forkAll().then(workers => {
        this.emit('ready');
        workers.forEach(worker => this.workers.add(worker));
      });
    } else {
      setupWorker(this.worker);
    }

    return this;
  }

  fork(): Promise<Object> {
    return new Promise((resolve, reject) => {
      const worker = cluster.fork({ NODE_ENV });

      const handleError = (code: number) => {
        console.log(code);
        reject(new Error(`${code}`));
      };

      worker.once('error', handleError);
      worker.once('message', (msg: string) => {
        if (msg === 'ready') {
          const { process: { pid } } = worker;

          this.logger.log(`Added worker process: ${green(`${pid}`)}`);

          worker.removeListener('error', handleError);

          resolve(worker);
        }
      });
    });
  }

  shutdown(worker: Object): Promise<Object> {
    return new Promise(resolve => {
      worker.send('shutdown');
      worker.disconnect();

      const timeout = setTimeout(() => worker.kill(), 2000);

      worker.once('exit', () => {
        const { process: { pid } } = worker;

        this.logger.log(`Removed worker process: ${red(`${pid}`)}`);
        resolve(worker);
        clearTimeout(timeout);
      });
    });
  }

  @bound
  async reload(): Promise<void> {
    let workers = Array.from(this.workers);

    for (let worker of workers) {
      await this.shutdown(worker);
      this.workers.delete(worker);

      worker = await this.fork();
      this.workers.add(worker);
    }
  }

  forkAll(): Promise<Array<Object>> {
    return Promise.all([...range(1, this.maxWorkers)].map(() => {
      return this.fork();
    }));
  }
}

export default Cluster;
