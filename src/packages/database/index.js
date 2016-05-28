/* @flow */
import Promise from 'bluebird';
import cluster from 'cluster';

import {
  ModelMissingError,
  MigrationsPendingError
} from './errors';

import Logger from '../logger';
import Model, { initialize } from './model';

import connect from './utils/connect';
import createMigrations from './utils/create-migrations';
import pendingMigrations from './utils/pending-migrations';

import bound from '../../decorators/bound';
import readonly from '../../decorators/readonly';
import nonenumerable from '../../decorators/nonenumerable';
import nonconfigurable from '../../decorators/nonconfigurable';

const { defineProperties } = Object;
const { worker, isMaster } = cluster;
const { env: { PWD, NODE_ENV: environment = 'development' } } = process;

/**
 * @private
 */
class Database {
  /**
   * @private
   */
  path: string;

  /**
   * @private
   */
  debug: boolean;

  /**
   * @private
   */
  logger: Logger;

  /**
   * @private
   */
  config: Object;

  /**
   * @private
   */
  connection: any;

  @readonly
  @nonenumerable
  @nonconfigurable
  /**
   * @private
   */
  models: Map<string, typeof Model> = new Map();

  constructor({
    path = PWD,
    config,
    logger,
  } : {
    path: string,
    config: Object,
    logger: Logger,
  } = {}) {
    config = config[environment];

    const {
      debug = (environment === 'development')
    }: {
      debug: boolean
    } = config;

    defineProperties(this, {
      path: {
        value: path,
        writable: false,
        enumerable: false,
        configurable: false
      },

      debug: {
        value: debug,
        writable: false,
        enumerable: false,
        configurable: false
      },

      logger: {
        value: logger,
        writable: false,
        enumerable: false,
        configurable: false
      },

      config: {
        value: config,
        writable: false,
        enumerable: true,
        configurable: false
      },

      connection: {
        value: connect(path, config),
        writable: false,
        enumerable: false,
        configurable: false
      }
    });

    return this;
  }

  @bound
  /**
   * @private
   */
  schema(): Function {
    const {
      connection: {
        schema
      }
    } = this;

    return schema;
  }

  /**
   * @private
   */
  modelFor(type: string): typeof Model  {
    const model: typeof Model = this.models.get(type);

    if (!model) {
      throw new ModelMissingError(type);
    }

    return model;
  }

  /**
   * @private
   */
  async define(
    models: Map<string, typeof Model>
  ): Promise<Model[]> {
    const { path, connection, schema } = this;

    if (isMaster || worker && worker.id === 1) {
      await createMigrations(schema);

      const pending = await pendingMigrations(path, () => {
        return connection('migrations');
      });

      if (pending.length) {
        throw new MigrationsPendingError(pending);
      }
    }

    models.forEach((model, name) => {
      this.models.set(name, model);
    });

    return await Promise.all(
      Array
        .from(models.values())
        .map(model => {
          return initialize(this, model, () => {
            return connection(model.tableName);
          });
        })
    );
  }
}

export { default as connect } from './utils/connect';
export { default as createMigrations } from './utils/create-migrations';
export { default as pendingMigrations } from './utils/pending-migrations';

export { default as Model } from './model';
export default Database;
