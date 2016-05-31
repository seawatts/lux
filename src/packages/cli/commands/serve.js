import { cyan } from 'chalk';

import Logger from '../../logger';
import loader from '../../loader';
import { createCluster } from '../../pm';

import type Cluster from '../../pm/cluster';

const { env: { PWD } } = process;

export default async function serve(port = 4000) {
  const Application = loader(PWD, 'application');
  const config = loader(PWD, 'config');

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
      await new Application({
        ...config,
        port,
        logger,
        path: PWD
      });
    }
  });
}
