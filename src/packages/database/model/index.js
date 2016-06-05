import { dasherize, pluralize } from 'inflection';

import Query from '../query';
import { sql } from '../../logger';

import validate from './utils/validate';

import pick from '../../../utils/pick';
import omit from '../../../utils/omit';
import entries from '../../../utils/entries';
import underscore from '../../../utils/underscore';

import type Cache from '../../cache';

class Model {
  /**
   * A reference to the instance of `Cache`.
   *
   * @property cache
   * @memberof Model
   * @readonly
   */
  static cache: Cache;

  /**
   * @private
   */
  static table;

  /**
   * @private
   */
  static store;

  /**
   *
   */
  static logger;

  /**
   * @private
   */
  static serializer;

  /**
   * @private
   */
  static attributes: {};

  /**
   *
   */
  static belongsTo: {};

  /**
   *
   */
  static hasOne: {};

  /**
   *
   */
  static hasMany: {};

  /**
   * @private
   */
  static _tableName: ?string;

  /**
   *
   */
  static hooks: {} = {};

  /**
   *
   */
  static validates: {} = {};

  /**
   *
   */
  static primaryKey: string = 'id';

  /**
   *
   */
  static defaultPerPage: number = 25;

  constructor(attrs: {} = {}, initialize: boolean = true): Model {
    const {
      constructor: {
        attributeNames,
        relationshipNames
      }
    } = this;

    Object.defineProperties(this, {
      initialized: {
        value: initialize,
        writable: !initialize,
        enumerable: false,
        configurable: !initialize
      },

      initialValues: {
        value: new Map(),
        writable: false,
        enumerable: false,
        configurable: false
      },

      dirtyAttributes: {
        value: new Set(),
        writable: false,
        enumerable: false,
        configurable: false
      }
    });

    Object.assign(
      this,
      pick(attrs, ...attributeNames, ...relationshipNames)
    );

    return this;
  }

  get isDirty(): boolean {
    return Boolean(this.dirtyAttributes.size);
  }

  get modelName(): string {
    return this.constructor.modelName;
  }

  static get modelName(): string {
    return dasherize(underscore(this.name));
  }

  static get tableName(): string {
    return this._tableName ?
      this._tableName : pluralize(underscore(this.name));
  }

  static set tableName(value): void {
    this._tableName = value;
  }

  static get relationships(): {} {
    const {
      belongsTo,
      hasOne,
      hasMany
    } = this;

    return {
      ...belongsTo,
      ...hasOne,
      ...hasMany
    };
  }

  static get attributeNames(): Array<string> {
    return Object.keys(this.attributes);
  }

  static get relationshipNames(): Array<string> {
    return Object.keys(this.relationships);
  }

  async update(props = {}): Model {
    const {
      constructor: {
        primaryKey,
        table,

        store: {
          debug
        },

        hooks: {
          afterUpdate,
          afterSave,
          afterValidation,
          beforeUpdate,
          beforeSave,
          beforeValidation
        }
      }
    } = this;

    Object.assign(this, props);

    if (this.isDirty) {
      await beforeValidation(this);

      validate(this);

      await afterValidation(this);
      await beforeUpdate(this);
      await beforeSave(this);

      this.updatedAt = new Date();

      const query = table()
        .where({ [primaryKey]: this[primaryKey] })
        .update(this.format('database', ...this.dirtyAttributes));

      if (debug) {
        const { constructor: { logger } } = this;

        query.on('query', () => {
          setImmediate(() => logger.info(sql`${query.toString()}`));
        });
      }

      await query;

      this.dirtyAttributes.clear();

      await afterUpdate(this);
      await afterSave(this);
    }

    return this;
  }

  async destroy(): Model {
    const {
      constructor: {
        primaryKey,
        table,

        store: {
          debug
        },

        hooks: {
          afterDestroy,
          beforeDestroy
        }
      }
    } = this;

    await beforeDestroy(this);

    const query = table()
      .where({ [primaryKey]: this[primaryKey] })
      .del();

    if (debug) {
      const {
        constructor: {
          logger
        }
      } = this;

      query.on('query', () => {
        setImmediate(() => logger.info(sql`${query.toString()}`));
      });
    }

    await query;

    await afterDestroy(this);

    return this;
  }

  format(dest: string, ...only: Array<string>): {} {
    const {
      constructor: {
        attributes
      }
    } = this;

    switch (dest) {
      case 'database':
        return entries(only.length ? pick(attributes, ...only) : attributes)
          .reduce((hash, [key, { columnName }]) => {
            return {
              ...hash,
              [columnName]: this[key]
            };
          }, {});

      case 'jsonapi':
        return entries(only.length ? pick(attributes, ...only) : attributes)
          .reduce((hash, [key, { docName }]) => {
            return {
              ...hash,
              [docName]: this[key]
            };
          }, {});
    }
  }

  static async create(props = {}): Model {
    const {
      primaryKey,
      table,

      store: {
        debug
      },

      hooks: {
        afterCreate,
        afterSave,
        afterValidation,
        beforeCreate,
        beforeSave,
        beforeValidation
      }
    } = this;

    const datetime = new Date();
    const instance = new this({
      ...props,
      createdAt: datetime,
      updatedAt: datetime
    }, false);

    await beforeValidation(instance);

    validate(instance);

    await afterValidation(instance);
    await beforeCreate(instance);
    await beforeSave(instance);

    const query = table()
      .returning(primaryKey)
      .insert(omit(instance.format('database'), primaryKey));

    if (debug) {
      const { logger } = this;

      query.on('query', () => {
        setImmediate(() => logger.info(sql`${query.toString()}`));
      });
    }

    Object.assign(instance, {
      [primaryKey]: (await query)[0]
    });

    Object.defineProperty(instance, 'initialized', {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false
    });

    await afterCreate(instance);
    await afterSave(instance);

    return instance;
  }

  static async count(where = {}): number {
    const { table, store: { debug } } = this;
    const query = table().count('* AS count').where(where);

    if (debug) {
      const { logger } = this;

      query.on('query', () => {
        setImmediate(() => logger.info(sql`${query.toString()}`));
      });
    }

    let [{ count }] = await query;
    count = parseInt(count, 10);

    return Number.isFinite(count) ? count : 0;
  }

  static all(): Query {
    return new Query(this).all();
  }

  static find(pk: number): Query {
    return new Query(this).find(pk);
  }

  static page(num: number): Query {
    return new Query(this).page(num);
  }

  static limit(amount: number): Query {
    return new Query(this).limit(amount);
  }

  static offset(amount: number): Query {
    return new Query(this).offset(amount);
  }

  static order(attr: string, direction?: string): Query {
    return new Query(this).order(attr, direction);
  }

  static where(params): Query {
    return new Query(this).where(params);
  }

  static select(...params: Array<string>): Query {
    return new Query(this).select(...params);
  }

  static include(...relationships: Array<Object|string>): Query {
    return new Query(this).include(...relationships);
  }

  static getColumn(key): {} {
    const {
      attributes: {
        [key]: column
      }
    } = this;

    return column;
  }

  static getColumnName(key): string {
    const column = this.getColumn(key);

    if (column) {
      return column.columnName;
    }
  }

  static getRelationship(key): {} {
    const {
      relationships: {
        [key]: relationship
      }
    } = this;

    return relationship;
  }
}

export { default as initialize } from './utils/initialize';
export default Model;
