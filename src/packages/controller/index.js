import Promise from 'bluebird';
import Serializer from '../serializer';

import omit from '../../utils/omit';
import formatInclude from './utils/format-include';
import createPageLinks from './utils/create-page-links';

import action from './decorators/action';

import type Database, { Model } from '../database';
import type { Request } from 'server';

const { defineProperties } = Object;

/**
 *
 */
class Controller {
  /**
   *
   */
  params: Array<string> = [];

  /**
   *
   */
  beforeAction: Array<Function> = [];

  /**
   *
   */
  defaultPerPage: number = 25;

  /**
   * @private
   */
  store: Database;

  /**
   * @private
   */
  model: typeof Model;

  /**
   * @private
   */
  domain: string;

  /**
   * @private
   */
  modelName: string;

  /**
   * @private
   */
  attributes: Array<string>;

  /**
   * @private
   */
  relationships: Array<string>;

  /**
   * @private
   */
  serializer: Serializer;

  /**
   * @private
   */
  serializers: Map<string, Serializer>;

  /**
   * @private
   */
  parentController: ?Controller;

  /**
   * @private
   */
  _sort: Array<string> = [];

  /**
   * @private
   */
  _filter: Array<string> = [];

  constructor({
    store,
    model,
    domain,
    serializer,
    serializers = new Map(),
    parentController
  }: {
    store: Database,
    model: ?Model,
    domain: string,
    serializer: Serializer,
    serializers: Map<string, Serializer>,
    parentController: ?Controller
  }) {
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

    defineProperties(this, {
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
   *
   */
  get sort(): Array<string> {
    const { attributes, _sort: sort } = this;

    return sort.length ? sort : attributes;
  }

  set sort(value: Array<string>): void {
    this._sort = value;
  }

  /**
   *
   */
  get filter(): Array<string> {
    const { attributes, _filter: filter } = this;

    return filter.length ? filter : attributes;
  }

  set filter(value: Array<string>): void {
    this._filter = value;
  }

  /**
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

  @action
  /**
   *
   */
  async index(req: Request): Promise<Object> {
    const { url, params } = req;
    const { model, modelName, domain, relationships } = this;

    let {
      page,
      limit,
      fields,
      include = [],
      sort: order,
      filter: where
    } = params;

    let select = fields[modelName];
    let includedFields = omit(fields, modelName);

    if (!limit) {
      limit = this.defaultPerPage;
    }

    if (!select) {
      select = this.attributes;
    }

    include = formatInclude(model, include, includedFields, relationships);

    const [count, data]: [number, Array<Model>] = await Promise.all([
      model.count(where),

      model.findAll({
        page,
        limit,
        where,
        order,
        select,
        include
      })
    ]);

    return {
      data,

      links: {
        self: domain + url.path,
        ...createPageLinks(domain, url.pathname, { ...params, limit }, count)
      }
    };
  }

  @action
  /**
   *
   */
  show(req: Request): {} {
    let { url, record: data } = req;
    let links;

    if (data) {
      links = { self: this.domain + url.path };
    }

    return {
      data,
      links
    };
  }

  @action
  async create(req: Request): Promise<Object> {
    const { domain, model } = this;

    const {
      url: {
        pathname
      },

      params: {
        data: {
          attributes,
          // relationships
        }
      }
    } = req;

    return {
      data: await model.create(attributes),

      links: {
        self: domain + pathname
      }
    };
  }

  @action
  async update(req: Request): Promise<Object> {
    const { domain } = this;

    const {
      record: data,

      url: {
        pathname
      },

      params: {
        data: {
          attributes,
          // relationships
        }
      }
    } = req;

    let links;

    if (data) {
      links = { self: domain + pathname };
      await data.update(attributes);
    }

    return {
      data,
      links
    };
  }

  @action
  async destroy(req: Request): Promise<Object> {
    const { domain } = this;
    const { url: { pathname }, record: data } = req;
    let links;

    if (data) {
      links = { self: domain + pathname };
      await data.destroy();
    }

    return {
      data,
      links
    };
  }

  @action
  preflight(): {} {
    return {
      data: true
    };
  }
}

export { default as action } from './decorators/action';
export default Controller;
