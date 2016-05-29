/* @flow */
import os from 'os';
import cluster from 'cluster';
import Promise from 'bluebird';
import { EventEmitter } from 'events';

import range from '../../../utils/range';

import bound from '../../../decorators/bound';

import type { Worker } from 'cluster';
import type Logger from '../../logger';

const { env: { NODE_ENV = 'development' } } = process;

const { defineProperties } = Object;

/**
 * @private
 */
class Cluster extends EventEmitter {
  logger: Logger;

  worker: Worker = cluster.worker;

  workers: Set<Worker> = new Set();

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

    if (this.isMaster) {
      setupMaster(this);

      process.on('update', this.reload);
      this.forkAll().then(() => this.emit('ready'));
    } else {
      setupWorker(this.worker);
    }

    return this;
  }

  fork(retry: boolean = true): Promise<Worker> {
    return new Promise(resolve => {
      if (this.workers.size < this.maxWorkers) {
        const worker = cluster.fork({ NODE_ENV });

        const timeout = setTimeout(() => {
          handleError();

          worker.removeListener('exit', handleExit);
          worker.kill();

          if (retry) {
            this.fork(false);
          }
        }, 30000);

        const cleanup = () => {
          worker.removeListener('error', handleError);
          worker.removeListener('message', handleMessage);

          clearTimeout(timeout);
        };

        const handleExit = (code: ?number) => {
          this.workers.delete(worker);
          this.fork();
        };

        const handleError = () => {
          this.workers.delete(worker);
          cleanup();
        };

        const handleMessage = (msg: string) => {
          if (msg === 'ready') {
            this.workers.add(worker);

            cleanup();
            resolve(worker);
          }
        };

        worker.on('exit', handleExit);
        worker.once('error', handleError);
        worker.once('message', handleMessage);
      }
    });
  }

  shutdown(worker: Object): Promise<Object> {
    return new Promise(resolve => {
      this.workers.delete(worker);

      worker.send('shutdown');
      worker.disconnect();

      const timeout = setTimeout(() => worker.kill(), 5000);

      worker.once('exit', () => {
        resolve(worker);
        clearTimeout(timeout);
      });
    });
  }

  @bound
  async reload(): Promise<void> {
    const workers: Array<[Worker, Worker]> = Array.from(this.workers)
      .reduce((arr, item, idx, src) => {
        return (idx + 1) % 2 ? [...arr, src.slice(idx, idx + 2)] : arr;
      }, []);

    for (const group of workers) {
      await Promise.all(group.map(worker => this.shutdown(worker)));
    }
  }

  forkAll(): Promise<Worker> {
    return Promise.race([...range(1, this.maxWorkers)].map(() => {
      return this.fork();
    }));
  }
}

export default Cluster;
