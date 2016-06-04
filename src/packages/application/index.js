// @flow
import initialize from './initialize';

import type Database from '../database';
import type Logger from '../logger';
import type Router from '../router';
import type Server from '../server';

/**
 * The `Application` class is responsible for constructing an application and
 * putting all the moving parts (`Model`, `Controller`, `Serializer`) together.
 */
class Application {
  /**
   * An absolute path to the root directory of the `Application` instance.
   *
   * @example
   * '/projects/my-app'
   *
   * @property path
   * @memberof Application
   * @instance
   * @readonly
   */
  path: string;

  /**
   * The port that the `Application` instance will listen for connections.
   *
   * @property port
   * @memberof Application
   * @instance
   * @readonly
   */
  port: number;

  /**
   * A reference to the instance of `Database`.
   *
   * @property store
   * @memberof Application
   * @instance
   * @readonly
   * @private
   */
  store: Database;

  /**
   * The public domain where the `Application` instance is located. This is
   * primarily used for creating `links` resource objects.
   *
   * @property domain
   * @memberof Application
   * @instance
   * @readonly
   */
  domain: string;

  /**
   * A reference to the instance of `Logger`.
   *
   * @property logger
   * @memberof Application
   * @instance
   * @readonly
   */
  logger: Logger;

  /**
   * A reference to the instance of `Router`.
   *
   * @property logger
   * @memberof Application
   * @instance
   * @readonly
   * @private
   */
  router: Router;

  /**
   * A reference to the instance of `Server`.
   *
   * @property server
   * @memberof Application
   * @instance
   * @readonly
   * @private
   */
  server: Server;

  /**
   * Create an instance of `Application`.
   *
   * WARNING:
   * It is highly reccomended that you do not override this method.
   */
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
