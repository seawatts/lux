import os from 'os';
import path from 'path';
import cluster from 'cluster';

import { cyan } from 'chalk';

import Logger from '../../logger';

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

  if (cluster.isMaster) {
    const total = os.cpus().length;
    let current = 0;

    logger.log(`Starting Lux Server with ${cyan(`${total}`)} worker processes`);

    for (let i = 0; i < total; i++) {
      cluster.fork({ NODE_ENV }).once('message', msg => {
        if (msg === 'ready') {
          current++;
          if (current === total) {
            logger.log(`Lux Server listening on port ${cyan(`${port}`)}`);
          }
        }
      });
    }
  } else {
    await new Application({
      ...config,
      port,
      logger,
      path: PWD
    }).boot();
  }
}
