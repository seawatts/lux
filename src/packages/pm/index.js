// @flow
import Cluster from './cluster';

import type Logger from '../logger';

/**
 * @private
 */
export function createCluster({
  path,
  port,
  logger
}: {
  path: string,
  port: number,
  logger: Logger
}): Cluster {
  return new Cluster({
    path,
    port,
    logger
  });
}
