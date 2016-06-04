// @flow
import { worker, isMaster } from 'cluster';

import {
  ModelMissingError,
  MigrationsPendingError
} from './errors';

import Logger from '../logger';
import Model, { initialize } from './model';

import connect from './utils/connect';
import createMigrations from './utils/create-migrations';
import pendingMigrations from './utils/pending-migrations';

const { env: { NODE_ENV = 'development' } } = process;

/**
 * @private
 */
class Database {
  path: string;

  debug: boolean;

  logger: Logger;

  config: Object;

  schema: Function;

  connection: any;

  models: Map<string, typeof Model> = new Map();

  constructor({
    path,
    config,
    logger,
  } : {
    path: string,
    config: Object,
    logger: Logger,
  } = {}): Database {
    config = config[NODE_ENV];

    const {
      debug = (NODE_ENV === 'development')
    }: {
      debug: boolean
    } = config;

    Object.defineProperties(this, {
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

      schema: {
        value: () => this.connection.schema,
        writable: false,
        enumerable: false,
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

  modelFor(type: string): typeof Model  {
    const model: typeof Model = this.models.get(type);

    if (!model) {
      throw new ModelMissingError(type);
    }

    return model;
  }

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
export { default as Migration } from './migration';
export { default as Collection } from './collection';
export default Database;
