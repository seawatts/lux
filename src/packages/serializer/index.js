/* @flow */
import { Readable } from 'stream';
import { dasherize, pluralize, camelize } from 'inflection';

import { Model } from '../database';

import tryCatch from '../../utils/try-catch';
import underscore from '../../utils/underscore';

import bound from '../../decorators/bound';

const { max } = Math;
const { isArray } = Array;
const { keys, defineProperties } = Object;

/**
 * The `Serializer` class is where you declare the specific attributes and
 * relationships you would like to include for a particular resource (`Model`).
 */
class Serializer {
  /**
   * The resolved `Model` that a `Serializer` instance represents.
   *
   * @example
   * PostsSerializer.model
   * // => Post
   *
   * @property model
   * @memberof Serializer
   * @instance
   * @readonly
   * @private
   */
  model: typeof Model;

  /**
   * The public domain where an `Application` instance is located. This is
   * defined in ./config/environments/{{NODE_ENV}.js} and is primarily used for
   * creating `links` resource objects.
   *
   * @property domain
   * @memberof Serializer
   * @instance
   * @readonly
   * @private
   */
  domain: ?string;

  /**
   * A Map of all resolved serializers in a an `Application` instance. This is
   * used when a `Serializer` instance has to serialize an embedded
   * relationship.
   *
   * @property serializers
   * @memberof Serializer
   * @instance
   * @readonly
   * @private
   */
  serializers: Map<string, Serializer>;

  /**
   * An Array of the `hasOne` or `belongsTo` relationships on a `Serializer`
   * instance's model to include in the `relationships` resource object of a
   * serialized payload.
   *
   * @example
   * class PostsSerializer extends Serializer {
   *   hasOne = [
   *     'author'
   *   ];
   * }
   *
   * // A request to `/posts` would result in the following payload:
   *
   * {
   *   "data": [
   *     {
   *       "id": 1,
   *       "type": "posts",
   *       "attributes": {},
   *       "relationships": [
   *         {
   *           "data": {
   *             "id": 1,
   *             "type": "authors"
   *           },
   *            "links": {
   *              "self": "http://localhost:4000/authors/1"
   *           }
   *         }
   *       ],
   *       "links": {
   *         "self": "http://localhost:4000/posts/1"
   *       }
   *     }
   *   ],
   *   "links": {
   *     "self": "http://localhost:4000/posts",
   *     "first": "http://localhost:4000/posts?page=1",
   *     "last": "http://localhost:4000/posts?page=1",
   *     "prev": null,
   *     "next": null
   *   }
   *   "jsonapi": {
   *     "version": "1.0"
   *   }
   * }
   *
   * @property hasOne
   * @memberof Serializer
   * @instance
   */
  hasOne: Array<string> = [];

  /**
   * An Array of the `hasMany` relationships on a `Serializer` instance's model
   * to include in the `relationships` resource object of a serialized payload.
   *
   * @example
   * class PostsSerializer extends Serializer {
   *   hasMany = [
   *     'comments'
   *   ];
   * }
   *
   * // A request to `/posts` would result in the following payload:
   *
   * {
   *   "data": [
   *     {
   *       "id": 1,
   *       "type": "posts",
   *       "attributes": {},
   *       "relationships": [
   *         {
   *           "data": {
   *             "id": 1,
   *             "type": "comments"
   *           },
   *            "links": {
   *              "self": "http://localhost:4000/comments/1"
   *           }
   *         },
   *         {
   *           "data": {
   *             "id": 2,
   *             "type": "comments"
   *           },
   *            "links": {
   *              "self": "http://localhost:4000/comments/2"
   *           }
   *         }
   *       ],
   *       "links": {
   *         "self": "http://localhost:4000/posts/1"
   *       }
   *     }
   *   ],
   *   "links": {
   *     "self": "http://localhost:4000/posts",
   *     "first": "http://localhost:4000/posts?page=1",
   *     "last": "http://localhost:4000/posts?page=1",
   *     "prev": null,
   *     "next": null
   *   }
   *   "jsonapi": {
   *     "version": "1.0"
   *   }
   * }
   *
   * @property hasMany
   * @memberof Serializer
   * @instance
   */
  hasMany: Array<string> = [];

  /**
   * An Array of the `attributes` on a `Serializer` instance's model to include
   * in the `attributes` resource object of a serialized payload.
   *
   * @example
   * class PostsSerializer extends Serializer {
   *   attributes = [
   *     'title',
   *     'isPublic'
   *   ];
   * }
   *
   * // A request to `/posts` would result in the following payload:
   *
   * {
   *   "data": [
   *     {
   *       "id": 1,
   *       "type": "posts",
   *       "attributes": {
   *         "title": "Not another Node.js framework...",
   *         "is-public": true
   *       },
   *       "links": {
   *         "self": "http://localhost:4000/posts/1"
   *       }
   *     }
   *   ],
   *   "links": {
   *     "self": "http://localhost:4000/posts",
   *     "first": "http://localhost:4000/posts?page=1",
   *     "last": "http://localhost:4000/posts?page=1",
   *     "prev": null,
   *     "next": null
   *   }
   *   "jsonapi": {
   *     "version": "1.0"
   *   }
   * }
   *
   * @property attributes
   * @memberof Serializer
   * @instance
   */
  attributes: Array<string> = [];

  /**
   * Create an instance of `Serializer`.
   *
   * WARNING:
   * This is a private constructor and you should not instantiate a `Serializer`
   * manually. Serializers are instantiated automatically by your application
   * when it is started.
   *
   * @private
   */
   constructor({
     model,
     domain,
     serializers
   }: {
     model: typeof Model,
     domain: string,
     serializers: Map<string, Serializer>
   } = {}) {
     defineProperties(this, {
       model: {
         value: model,
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

       serializers: {
         value: serializers,
         writable: false,
         enumerable: false,
         configurable: false
       }
     });

     return this;
   }

  /**
   * @private
   */
  formatKey(key: string): string {
    return dasherize(underscore(key));
  }

  /**
   * @private
   */
  fieldsFor(name: string, fields: Object = {}): Array<string> {
    const match: ?Array<string> = fields[camelize(underscore(name), true)];

    return match ? [...match] : [];
  }

  /**
   * @private
   */
   attributesFor(item: Model, fields: Array<string> = []): Object {
     return (fields.length ? fields : this.attributes)
       .reduce((hash, attr) => {
         if (attr.indexOf('id') < 0) {
           hash[this.formatKey(attr)] = item[attr];
         }

         return hash;
       }, {});
   }

   /**
    * @private
    */
   relationshipsFor(
     item: Model,
     include: Array<any>,
     fields: Object
   ): Object {
    const { domain, hasOne, hasMany } = this;
    const hash: Object = { data: {}, included: [] };

    hash.data = {
      ...hasOne.reduce((obj, key) => {
        const related: ?Model = item[key];

        if (related) {
          const { id, modelName }: { id: number, modelName: string } = related;
          const type: string = pluralize(modelName);

          obj[key] = {
            data: {
              id,
              type
            },

            links: {
              self: `${domain}/${type}/${id}`
            }
          };

          if (include.indexOf(key) >= 0) {
            const {
              constructor: {
                serializer: relatedSerializer
              }
            } = related;

            if (relatedSerializer) {
              hash.included.push(
                relatedSerializer.serializeOne(related, [], fields)
              );
            }
          }
        }

        return obj;
      }, {}),

      ...hasMany.reduce((obj, key) => {
        const records: ?Array<Model> = item[key];

        if (records && records.length) {
          obj[key] = {
            data: records.map(related => {
              const {
                id,
                modelName
              }: {
                id: number,
                modelName: string
              } = related;

              const type: string = pluralize(modelName);

              if (include.indexOf(key) >= 0) {
                const {
                  constructor: {
                    serializer: relatedSerializer
                  }
                } = related;

                if (relatedSerializer) {
                  hash.included.push(
                    relatedSerializer.serializeOne(related, [], fields)
                  );
                }
              }

              return {
                id,
                type,

                links: {
                  self: `${domain}/${type}/${id}`
                }
              };
            })
          };
        }

        return obj;
      }, {})
    };

    return hash;
  }

  /**
   * @private
   */
  serializeGroup(
    stream: Readable,
    key: string,
    data: Array<Model> | Model,
    include: Array<any>,
    fields: Object
  ): void {
    stream.push(`"${this.formatKey(key)}":`);

    if (key === 'data') {
      let included: Array<Object> = [];
      let lastItemIndex: number;

      if (isArray(data)) {
        lastItemIndex = max(data.length - 1, 0);

        stream.push('[');

        for (let i = 0; i < data.length; i++) {
          let item = this.serializeOne(data[i], include, fields);

          if (item.included && item.included.length) {
            included = item.included.reduce((value, record: Object) => {
              const { id, type }: { id: number, type: string } = record;
              const shouldInclude = !value.some(({
                id: vId,
                type: vType
              }: {
                id: number,
                type: string
              }) => {
                return vId === id && vType === type;
              });

              if (shouldInclude) {
                value = [...value, record];
              }

              return value;
            }, included);

            delete item.included;
          }

          stream.push(
            JSON.stringify(item)
          );

          if (i !== lastItemIndex) {
            stream.push(',');
          }
        }

        stream.push(']');
      } else {
        if (data instanceof Object) {
          data = this.serializeOne(data, include, fields, false);

          if (data.included && data.included.length) {
            included = [...included, ...data.included];
            delete data.included;
          }

          stream.push(
            JSON.stringify(data)
          );
        }
      }

      if (included.length) {
        lastItemIndex = max(included.length - 1, 0);

        stream.push(',"included":[');

        for (let i = 0; i < included.length; i++) {
          stream.push(
            JSON.stringify(included[i])
          );

          if (i !== lastItemIndex) {
            stream.push(',');
          }
        }

        stream.push(']');
      }
    } else {
      stream.push(JSON.stringify(data));
    }
  }

  /**
   * @private
   */
  async serializePayload(
    stream: Readable,
    payload: Object,
    include: Array<any>,
    fields: Object
  ): Promise<Readable> {
    tryCatch(() => {
      const payloadKeys: Array<string> = keys(payload);
      let i: number;

      stream.push('{');

      for (i = 0; i < payloadKeys.length; i++) {
        const key: string = payloadKeys[i];
        const value: ?Object = payload[key];

        if (value) {
          this.serializeGroup(stream, key, value, include, fields);
          stream.push(',');
        }
      }

      stream.push('"jsonapi":{"version":"1.0"}}');
    }, (err: Error) => {
      console.error(err);
    });

    stream.push(null);

    return stream;
  }

  /**
   * @private
   */
  stream(payload: Object, include: Array<any>, fields: Object): Readable {
    const stream: Readable = new Readable({
      encoding: 'utf8'
    });

    this.serializePayload(stream, payload, include, fields);

    return stream;
  }

  @bound
  /**
   * @private
   */
  serializeOne(
    item: Model,
    include: Array<any>,
    fields: Object,
    links: boolean = true
  ): Object {
    const {
      id,
      modelName: name
    }: {
      id: number,
      modelName: string
    } = item;

    const type: string = pluralize(name);

    const data = {
      id,
      type,
      attributes: this.attributesFor(item, this.fieldsFor(name, fields)),
      relationships: null,
      included: null,
      links: {}
    };

    const relationships = this.relationshipsFor(item, include, fields);

    if (keys(relationships.data).length) {
      data.relationships = relationships.data;
    } else {
      delete data.relationships;
    }

    if (relationships.included.length) {
      data.included = relationships.included;
    } else {
      delete data.included;
    }

    if (links) {
      data.links = {
        self: `${this.domain}/${type}/${id}`
      };
    } else {
      delete data.links;
    }

    return data;
  }
}

export default Serializer;
