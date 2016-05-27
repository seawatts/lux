/* @flow */
import { Readable } from 'stream';
import { dasherize, pluralize, camelize } from 'inflection';

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
   * @member model
   * @memberof Serializer
   * @instance
   * @readonly
   * @private
   */
  model: any;

  /**
   * The public domain where an `Application` instance is located. This is
   * defined in ./config/environments/{{NODE_ENV}.js} and is primarily used for
   * creating `links` resource objects.
   *
   * @member domain
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
   * @member serializers
   * @memberof Serializer
   * @instance
   * @readonly
   * @private
   */
  serializers: Map;

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
   * @member hasOne
   * @memberof Serializer
   * @instance
   * @type string[]
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
   * @member hasMany
   * @memberof Serializer
   * @instance
   * @type string[]
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
   * @member attributes
   * @memberof Serializer
   * @instance
   * @type string[]
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
   * @method constructor
   * @param {Object} [props={}] An object containing the model, domain, and
   * serializers to install on the `Serializer` instance.
   * @private
   */
   constructor({
     model,
     domain,
     serializers
   }: {
     model: any,
     domain: string,
     serializers: Map
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
   * @method formatKey
   * @private
   */
  formatKey(key: string): string {
    return dasherize(underscore(key));
  }

  /**
   * @method fieldsFor
   * @private
   */
  fieldsFor(name: string, fields: Object = {}): Array<string> {
    const match: ?Array<string> = fields[camelize(underscore(name), true)];

    return match ? [...match] : [];
  }

  /**
   * @method attributesFor
   * @private
   */
   attributesFor(item: Object, fields: Array<string> = []): Object {
     return (fields.length ? fields : this.attributes)
       .reduce((hash, attr) => {
         if (attr.indexOf('id') < 0) {
           hash[this.formatKey(attr)] = item[attr];
         }

         return hash;
       }, {});
   }

   /**
    * @method relationshipsFor
    * @private
    */
   relationshipsFor(
     item: any,
     include: Array<any>,
     fields: Object
   ): Object {
    const { domain, hasOne, hasMany } = this;
    const hash: Object = { data: {}, included: [] };

    hash.data = {
      ...hasOne.reduce((obj, key) => {
        const related = item[key];

        if (related) {
          const { id, modelName } = related;
          const type = pluralize(modelName);

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
        const records = item[key];

        if (records && records.length) {
          obj[key] = {
            data: records.map(related => {
              const { id, modelName } = related;
              const type = pluralize(modelName);

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
   * @method serializeGroup
   * @private
   */
  serializeGroup(
    stream: Readable,
    key: string,
    data: any,
    include: any,
    fields: any
  ): void {
    stream.push(`"${this.formatKey(key)}":`);

    if (key === 'data') {
      let included = [];
      let lastItemIndex;

      if (isArray(data)) {
        lastItemIndex = max(data.length - 1, 0);

        stream.push('[');

        for (let i = 0; i < data.length; i++) {
          let item = this.serializeOne(data[i], include, fields);

          if (item.included && item.included.length) {
            included = item.included.reduce((value, record) => {
              const { id, type } = record;
              const shouldInclude = !value.some(({ id: vId, type: vType }) => {
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
        data = this.serializeOne(data, include, fields, false);

        if (data.included && data.included.length) {
          included = [...included, ...data.included];
          delete data.included;
        }

        stream.push(
          JSON.stringify(data)
        );
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
   * @method serializePayload
   * @private
   */
  async serializePayload(
    stream: Readable,
    payload: any,
    include: any,
    fields: any
  ): Promise<Readable> {
    tryCatch(() => {
      let i, key, payloadKeys;

      stream.push('{');

      payloadKeys = keys(payload);

      for (i = 0; i < payloadKeys.length; i++) {
        key = payloadKeys[i];

        this.serializeGroup(stream, key, payload[key], include, fields);
        stream.push(',');
      }

      stream.push('"jsonapi":{"version":"1.0"}}');
    }, err => {
      console.error(err);
    });

    stream.push(null);

    return stream;
  }

  /**
   * @method stream
   * @private
   */
  stream(payload: any, include: any, fields: any): Readable {
    const stream: Readable = new Readable({
      encoding: 'utf8'
    });

    this.serializePayload(stream, payload, include, fields);

    return stream;
  }

  @bound
  /**
   * @method serializeOne
   * @private
   */
  serializeOne(
    item: Object,
    include: any,
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
