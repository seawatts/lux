import Model from '../database/model';

import omit from '../../utils/omit';
import getRecord from './utils/get-record';
import formatInclude from './utils/format-include';

import type { IncomingMessage, ServerResponse } from 'http';

import type Cache from '../cache';
import type Database, { Collection } from '../database';
import type Serializer from '../serializer';

/**
 * The `Controller` class is responsible for taking in requests from the outside
 * world and returning the appropriate response.
 *
 * You can think of a `Controller` like a waiter or waitress at a restaurant.
 * A client makes a request to an application, that request is routed to the
 * appropriate `Controller` and then the `Controller` interprets the request
 * and returns data relative to what the client has request.
 */
class Controller {
  /**
   * A reference to the instance of `Cache`.
   *
   * @property cache
   * @memberof Controller
   * @instance
   * @readonly
   */
  cache: Cache;

  /**
   * Whitelisted parameter keys to allow in incoming PATCH and POST requests.
   *
   * For security reasons, parameters passed to controller actions from an
   * incoming request must have their key whitelisted.
   *
   * @example
   * class UsersController extends Controller {
   *   // Do not allow incoming PATCH or POST requests to modify User#isAdmin.
   *   params = [
   *     'name',
   *     'email',
   *     'password',
   *     // 'isAdmin'
   *   ];
   * }
   *
   * @property params
   * @memberof Controller
   * @instance
   */
  params: Array<string> = [];

  /**
   * Middleware functions to execute on each request handled by a `Controller`.
   *
   * Middleware functions declared in beforeAction on an `ApplicationController`
   * will be executed before ALL route handlers.
   *
   * @property beforeAction
   * @memberof Controller
   * @instance
   */
  beforeAction: Array<Function> = [];

  /**
   * The number of records to return for the #index action when a `?limit`
   * parameter is not specified.
   *
   * @property defaultPerPage
   * @memberof Controller
   * @instance
   */
  defaultPerPage: number = 25;

  /**
   * @property store
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  store: Database;

  /**
   * @property model
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  model: typeof Model;

  /**
   * @property domain
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  domain: string;

  /**
   * @property modelName
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  modelName: string;

  /**
   * @property attributes
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  attributes: Array<string>;

  /**
   * @property relationships
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  relationships: Array<string>;

  /**
   * @property serializer
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  serializer: Serializer;

  /**
   * @property serializers
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  serializers: Map<string, Serializer>;

  /**
   * @property parentController
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  parentController: ?Controller;

  /**
   * @property _sort
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  _sort: Array<string> = [];

  /**
   * @property _filter
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  _filter: Array<string> = [];

  constructor({
    cache,
    store,
    model,
    domain,
    serializer,
    serializers = new Map(),
    parentController
  }: {
    cache: Cache,
    store: Database,
    model: ?Model<T>,
    domain: string,
    serializer: Serializer,
    serializers: Map<string, Serializer>,
    parentController: ?Controller
  }): Controller {
    let attributes = [];
    let relationships = [];

    if (model && serializer) {
      const { primaryKey, attributeNames, relationshipNames } = model;
      const { attributes: serializedAttributes } = serializer;

      const serializedRelationships = [
        ...serializer.hasOne,
        ...serializer.hasMany
      ];

      attributes = attributeNames.filter(attr => {
        return attr === primaryKey || serializedAttributes.indexOf(attr) >= 0;
      });

      relationships = relationshipNames.filter(relationship => {
        return serializedRelationships.indexOf(relationship) >= 0;
      });
    }

    Object.defineProperties(this, {
      cache: {
        value: cache,
        writable: false,
        enumerable: true,
        configurable: false
      },

      model: {
        value: model,
        writable: false,
        enumerable: true,
        configurable: false
      },

      serializer: {
        value: serializer,
        writable: false,
        enumerable: true,
        configurable: false
      },

      store: {
        value: store,
        writable: false,
        enumerable: false,
        configurable: false
      },

      domain: {
        value: domain,
        writable: false,
        enumerable: false,
        configurable: false
      },

      modelName: {
        value: model ? model.modelName : null,
        writable: false,
        enumerable: false,
        configurable: false
      },

      attributes: {
        value: attributes,
        writable: false,
        enumerable: false,
        configurable: false
      },

      relationships: {
        value: relationships,
        writable: false,
        enumerable: false,
        configurable: false
      },

      serializers: {
        value: serializers,
        writable: false,
        enumerable: false,
        configurable: false
      },

      parentController: {
        value: parentController,
        writable: false,
        enumerable: false,
        configurable: false
      }
    });

    return this;
  }

  /**
   * Whitelisted `?sort` parameter values.
   *
   * If you do not override this property all of the attributes of the Model
   * that this Controller represents will be valid.
   *
   * @property sort
   * @memberof Controller
   * @instance
   */
  get sort(): Array<string> {
    const { attributes, _sort: sort } = this;

    return sort.length ? sort : attributes;
  }

  set sort(value: Array<string>): void {
    this._sort = value;
  }

  /**
   * Whitelisted `?filter[{key}]` parameter keys.
   *
   * If you do not override this property all of the attributes of the Model
   * that this Controller represents will be valid.
   *
   * @property filter
   * @memberof Controller
   * @instance
   */
  get filter(): Array<string> {
    const { attributes, _filter: filter } = this;

    return filter.length ? filter : attributes;
  }

  set filter(value: Array<string>): void {
    this._filter = value;
  }

  /**
   * @property middleware
   * @memberof Controller
   * @instance
   * @readonly
   * @private
   */
  get middleware(): Array<Function> {
    const { beforeAction, parentController } = this;

    if (parentController) {
      return [
        ...parentController.middleware,
        ...beforeAction
      ];
    } else {
      return beforeAction;
    }
  }

  /**
   * Returns a list of `Model` instances that the Controller instance
   * represents.
   *
   * This method supports filtering, sorting, pagination, including
   * relationships, and sparse fieldsets via query parameters.
   */
  async index(req: IncomingMessage, res: ServerResponse): Promise<Collection> {
    const {
      model,
      modelName,
      relationships
    } = this;

    let {
      params: {
        sort,
        page,
        limit,
        fields,
        include = [],
        filter
      }
    } = req;

    let select = fields[modelName];
    let includedFields = omit(fields, modelName);

    if (!limit) {
      limit = this.defaultPerPage;
      req.params.limit = limit;
    }

    if (!select) {
      select = this.attributes;
    }

    include = formatInclude(model, include, includedFields, relationships);

    return await model.select(...select)
      .limit(limit)
      .page(page)
      .where(filter)
      .order(...sort);
  }

  /**
   * Returns a single `Model` instance that the Controller instance represents.
   *
   * This method supports including relationships, and sparse fieldsets via
   * query parameters.
   */
  show(req: IncomingMessage, res: ServerResponse): Promise<?Model> {
    return getRecord(this, req, res);
  }

  /**
   * Create and return a single `Model` instance that the Controller instance
   * represents.
   */
  async create(req: IncomingMessage, res: ServerResponse): Promise<Model> {
    const {
      params: {
        data: {
          attributes
        }
      }
    } = req;

    return await this.model.create(attributes);
  }

  /**
   * Update and return a single `Model` instance that the Controller instance
   * represents.
   */
  async update(req: IncomingMessage, res: ServerResponse): Promise<?Model> {
    const record = await getRecord(this, req, res);

    const {
      params: {
        data: {
          attributes
        }
      }
    } = req;

    if (record) {
      await record.update(attributes);
    }

    return record;
  }

  /**
   * Destroy a single `Model` instance that the Controller instance represents.
   */
  async destroy(req: IncomingMessage, res: ServerResponse): Promise<?Model> {
    const record = await getRecord(this, req, res);

    if (record) {
      await record.destroy();
    }

    return record;
  }

  /**
   * An action handler used for responding to HEAD or OPTIONS requests.
   *
   * @private
   */
  preflight(req: IncomingMessage, res: ServerResponse): boolean {
    return true;
  }
}

export default Controller;
