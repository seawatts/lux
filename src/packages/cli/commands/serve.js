import path from 'path';
import { cyan } from 'chalk';

import Logger from '../../logger';
import { createCluster } from '../../pm';

import type Cluster from '../../pm/cluster';

const {
  env: {
    PWD,
    NODE_ENV = 'development'
  }
} = process;

export default async function serve(port = 4000) {
  const dist = path.join(PWD, 'dist');
  const Application = external(path.join(dist, 'app', 'index')).default;

  const config = external(
    path.join(dist, 'config', 'environments', NODE_ENV)
  ).default;

  const logger = await Logger.create({
    enabled: config.log,
    appPath: PWD
  });

  if (config.port) {
    port = config.port;
  }

  createCluster({
    logger,

    setupMaster(master: Cluster) {
      const { maxWorkers: total }: { maxWorkers: number } = master;

      logger.log(
        `Starting Lux Server with ${cyan(`${total}`)} worker processes`
      );

      master.once('ready', () => {
        logger.log(`Lux Server listening on port: ${cyan(`${port}`)}`);
      });
    },

    async setupWorker(worker: Object) {
      const app = new Application({
        ...config,
        port,
        logger,
        path: PWD
      });

      await app.boot();
    }
  });
}
