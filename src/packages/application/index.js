// @flow
import initialize from './initialize';

import type Database from '../database';
import type Logger from '../logger';
import type Router from '../router';
import type Server from '../server';

/**
 *
 */
class Application {
  /**
   *
   */
  log: boolean;

  /**
   *
   */
  path: string;

  /**
   *
   */
  port: number;

  /**
   * @private
   */
  store: Database;

  /**
   *
   */
  domain: string;

  /**
   *
   */
  logger: Logger;

  /**
   * @private
   */
  router: Router;

  /**
   * @private
   */
  server: Server;

  constructor({
    log = true,
    path,
    port,
    domain = 'http://localhost',
    database
  }: {
    log: boolean,
    path: string,
    port: number,
    domain: string,
    database: {}
  } = {}): Promise<Application> {
    return initialize(this, {
      log,
      path,
      port,
      domain,
      database
    });
  }
}

export default Application;
