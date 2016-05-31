/* @flow */
import Server from '../server';
import Router from '../router';
import Database from '../database';

import boot from './utils/boot';

import type Logger from '../logger';

const { defineProperties } = Object;
const { env: { PWD, PORT } } = process;

/**
 *
 */
class Application {
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
    path = PWD || '/',
    port = PORT || 4000,
    domain = 'http://localhost',
    logger,
    database
  }: {
    path: string,
    port: number,
    domain: string,
    logger: Logger,
    database: Database
  } = {}): Promise<Application> {
    const router = new Router();

    const server = new Server({
      router,
      logger
    });

    const store = new Database({
      logger,
      path,
      config: database
    });

    defineProperties(this, {
      path: {
        value: path,
        writable: false,
        enumerable: true,
        configurable: false
      },

      port: {
        value: port,
        writable: false,
        enumerable: true,
        configurable: false
      },

      store: {
        value: store,
        writable: false,
        enumerable: true,
        configurable: false
      },

      domain: {
        value: domain,
        writable: false,
        enumerable: true,
        configurable: false
      },

      router: {
        value: router,
        writable: false,
        enumerable: true,
        configurable: false
      },

      logger: {
        value: logger,
        writable: false,
        enumerable: true,
        configurable: false
      },

      server: {
        value: server,
        writable: false,
        enumerable: false,
        configurable: false
      }
    });

    return boot(this);
  }
}

export default Application;
