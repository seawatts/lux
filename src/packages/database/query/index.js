// @flow
import Model from '../model';
import Collection from '../collection';
import { sql } from '../../logger';

// import PromiseHash from '../../../utils/promise-hash';
import entries from '../../../utils/entries';
import tryCatch from '../../../utils/try-catch';
import formatSelect from './utils/format-select';

/**
 * @private
 */
class Query {
  /**
   * @private
   */
  model: typeof Model;

  /**
   * @private
   */
  collection: boolean;

  /**
   * @private
   */
  snapshots: Array<[string, mixed]>;

  /**
   * @private
   */
  relationships: {};

  constructor(model: typeof Model): Query {
    Object.defineProperties(this, {
      model: {
        value: model,
        writable: false,
        enumerable: false,
        configurable: false
      },

      collection: {
        value: true,
        writable: true,
        enumerable: false,
        configurable: false
      },

      snapshots: {
        value: [],
        writable: false,
        enumerable: false,
        configurable: false
      },

      relationships: {
        value: {},
        writable: false,
        enumerable: false,
        configurable: false
      }
    });

    return this;
  }

  all(): Query {
    return this;
  }

  find(pk: number): Query {
    this.collection = false;

    this.snapshots.push(
      ['limit', 1],

      ['where', {
        [`${this.model.tableName}.${this.model.primaryKey}`]: pk
      }]
    );

    return this;
  }

  page(num: number): Query {
    let limit = this.snapshots.find(([name, params]) => name === 'limit');

    if (limit) {
      [, limit] = limit;
    } else {
      limit = this.model.defaultPerPage;
      this.snapshots.push(['limit', limit]);
    }

    if (typeof limit !== 'number') {
      limit = 25;
    }

    return this.offset(Math.max(parseInt(num, 10) - 1 , 0) * limit);
  }

  limit(amount: number): Query {
    this.snapshots.push(['limit', amount]);

    return this;
  }

  order(attr: string, direction: string = 'ASC'): Query {
    this.snapshots.push(['orderBy', [
      `${this.model.tableName}.${this.model.getColumnName(attr)}`,
      direction
    ]]);

    return this;
  }

  where(params: {} = {}): Query {
    const { where, whereIn } = entries(params).reduce((hash, [key, value]) => {
      if (typeof value === 'undefined') {
        value = null;
      }

      if (Array.isArray(value)) {
        if (value.length > 1) {
          hash.whereIn[key] = value;
        } else {
          hash.where[key] = value[0];
        }
      } else {
        hash.where[key] = value;
      }

      return hash;
    }, {
      where: {},
      whereIn: {}
    });

    if (Object.keys(where).length) {
      this.snapshots.push(['where', where]);
    } else if (Object.keys(whereIn).length) {
      this.snapshots.push(['whereIn', whereIn]);
    }

    return this;
  }

  offset(amount: number): Query {
    this.snapshots.push(['offset', amount]);

    return this;
  }

  select(...attrs: Array<string>): Query {
    this.snapshots.push(['select', formatSelect(this.model, attrs)]);

    return this;
  }

  /**
   * @private
   */
  async run(): Promise<?Model|Collection> {
    const {
      model,
      snapshots,
      collection
    } = this;

    let results = await model.cache.get(snapshots);

    if (!results) {
      if (!snapshots.some(([name]) => name === 'select')) {
        this.select(...this.model.attributeNames);
      }

      const records = snapshots.reduce((query, [name, params]) => {
        const method = query[name];

        if (Array.isArray(params)) {
          return method.apply(query, params);
        } else {
          return method.call(query, params);
        }
      }, model.table());

      if (model.store.debug) {
        records.on('query', () => {
          setImmediate(() => model.logger.info(sql`${records.toString()}`));
        });
      }

      results = new Collection({
        model,
        total: 0,
        related: {},
        records: await records
      });

      await model.cache.set(snapshots, results);
    }

    return collection ? results : results.shift();
  }

  async then(
    onData: ?(data: ?Model|Collection) => void,
    onError: ?(err: Error) => void
  ): Promise<?Model|Collection> {
    return tryCatch(async () => {
      const data = await this.run();

      if (typeof onData === 'function') {
        onData(data);
      }
    }, (err) => {
      if (typeof onError === 'function') {
        onError(err);
      }
    });
  }
}

export default Query;
