/* @flow */
import Cluster from './cluster';

import type Logger from '../logger';

/**
 * @private
 */
export function createCluster({
  logger,
  setupMaster,
  setupWorker
}: {
  logger: Logger,
  setupMaster: () => void,
  setupWorker: () => void,
}): Cluster {
  return new Cluster({
    logger,
    setupMaster,
    setupWorker
  });
}
