import { dasherize, pluralize } from 'inflection';

import Collection from '../collection';
import { sql } from '../../logger';

import validate from './utils/validate';
import getOffset from './utils/get-offset';
import formatSelect from './utils/format-select';
import fetchHasMany from './utils/fetch-has-many';

import K from '../../../utils/k';
import pick from '../../../utils/pick';
import omit from '../../../utils/omit';
import entries from '../../../utils/entries';
import underscore from '../../../utils/underscore';

class Model {
  static table;
  static store;
  static logger;
  static serializer;
  static attributes;
  static belongsTo;
  static hasOne;
  static hasMany;

  static _tableName;

  static hooks = {};
  static validates = {};
  static primaryKey = 'id';
  static defaultPerPage = 25;

  constructor(props = {}, initialize = true) {
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
      pick(props, ...attributeNames, ...relationshipNames)
    );

    return this;
  }

  get isDirty() {
    return Boolean(this.dirtyAttributes.size);
  }

  get modelName() {
    return this.constructor.modelName;
  }

  static get modelName() {
    return dasherize(underscore(this.name));
  }

  static get tableName() {
    return this._tableName ?
      this._tableName : pluralize(underscore(this.name));
  }

  static set tableName(value) {
    this._tableName = value;
  }

  static get relationships() {
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

  static get attributeNames() {
    return Object.keys(this.attributes);
  }

  static get relationshipNames() {
    return Object.keys(this.relationships);
  }

  async update(props = {}) {
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

  async destroy() {
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

  format(dest, ...only) {
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

  static async find(pk, options = {}): Model {
    const { primaryKey, tableName } = this;

    return await this.findOne({
      ...options,
      where: {
        [`${tableName}.${primaryKey}`]: pk
      }
    });
  }

  static async findAll(options: {} = {}, count: boolean = false): Collection {
    const {
      table,
      tableName,
      primaryKey,

      store: {
        debug
      }
    } = this;

    let {
      page,
      order,
      limit,
      where,
      select,
      include = []
    } = options;

    if (!limit) {
      limit = this.defaultPerPage;
    }

    select = formatSelect(this, select);

    include = include
      .map(included => {
        let name, attrs;

        if (typeof included === 'string') {
          name = included;
        } else if (typeof included === 'object') {
          [[name, attrs]] = entries(included);
        }

        included = this.getRelationship(name);

        if (!included) {
          return null;
        }

        if (!attrs) {
          attrs = included.model.attributeNames;
        }

        return {
          name,
          attrs,
          relationship: included
        };
      })
      .filter(included => included);

    let total: ?number;

    let related = include.filter(({ relationship: { type } }) => {
      return type === 'hasMany';
    });

    let records = table()
      .select(select)
      .where(where)
      .limit(limit)
      .offset(getOffset(page, limit));

    if (order) {
      if (typeof order === 'string') {
        const direction = order.charAt(0) === '-' ? 'desc' : 'asc';

        records = records.orderBy(
          `${tableName}.` + this.getColumnName(
            direction === 'desc' ? order.substr(1) : order
          ) || 'created_at',
          direction
        );
      } else if (Array.isArray(order)) {
        records = records.orderBy(order[0], order[1]);
      }
    }

    include
      .filter(({ relationship: { type } }) => type !== 'hasMany')
      .forEach(({ name, attrs, relationship: { type, model, foreignKey } }) => {
        records = records.select(
          ...formatSelect(model, attrs, `${name}.`)
        );

        if (type === 'belongsTo') {
          records = records.leftOuterJoin(
            model.tableName,
            `${tableName}.${foreignKey}`,
            '=',
            `${model.tableName}.${model.primaryKey}`
          );
        } else if (type === 'hasOne') {
          records = records.leftOuterJoin(
            model.tableName,
            `${tableName}.${primaryKey}`,
            '=',
            `${model.tableName}.${foreignKey}`
          );
        }
      });

    if (debug) {
      const { logger } = this;

      records.on('query', () => {
        setImmediate(() => logger.info(sql`${records.toString()}`));
      });
    }

    [records, total] = await Promise.all([
      records,
      count ? this.count() : K.call(null)
    ]);

    related = await fetchHasMany(this, related, records);

    return new Collection({
      records,
      related,
      total,
      model: this
    });
  }

  static async findOne(options = {}): Model {
    const [record] = await this.findAll({
      ...options,
      limit: 1
    });

    return record ? record : null;
  }

  static getColumn(key) {
    const {
      attributes: {
        [key]: column
      }
    } = this;

    return column;
  }

  static getColumnName(key) {
    const column = this.getColumn(key);

    if (column) {
      return column.columnName;
    }
  }

  static getRelationship(key) {
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
