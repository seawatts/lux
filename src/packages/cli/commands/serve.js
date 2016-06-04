// @flow
import { cyan } from 'chalk';

import Logger from '../../logger';
import { createCluster } from '../../pm';

const { env: { PWD, PORT } } = process;

/**
 * @private
 */
export default async function serve(
  port: ?number | ?string = PORT
): Promise<void> {
  let path = PWD;

  if (typeof path !== 'string') {
    path = __dirname;
  }

  if (typeof port !== 'number') {
    port = 4000;
  }

  const logger = await new Logger({
    path,
    enabled: true
  });

  const cluster = createCluster({
    path,
    port,
    logger
  });

  const { maxWorkers: count } = cluster;

  logger.info(`Starting Lux Server with ${cyan(`${count}`)} worker processes`);

  cluster.once('ready', () => {
    logger.info(`Lux Server listening on port: ${cyan(`${port}`)}`);
  });
}
