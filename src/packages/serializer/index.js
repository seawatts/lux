import { Readable } from 'stream';
import { dasherize, pluralize, camelize } from 'inflection';

import tryCatch from '../../utils/try-catch';
import underscore from '../../utils/underscore';

import bound from '../../decorators/bound';

const { max } = Math;
const { isArray } = Array;
const { keys, defineProperties } = Object;

/**
  @module lux-framework
*/

/**
  The `Serializer` class is where you declare the specific attributes and
  relationships you would like to include for a particular resource (`Model`).

  To create a new `Serializer` in your application, you can use the generate
  command.

  ```bash
  lux generate serializer post
  ```

  @class Serializer
  @constructor
  @public
 */
class Serializer {
  /**
    The resolved `Model` that a `Serializer` instance represents.

    ```javascript
    PostsSerializer.model
    //=> Post
    ```

    @attribute model
    @type Model
    @private
    @readOnly
   */
  model;

  /**
    The public domain where an `Application` instance is located. This is
    defined in ./config/environments/{{NODE_ENV}.js} and is primarily used for
    creating `links` resource objects.

    @attribute domain
    @type String
    @private
    @readOnly
   */
  domain;

  /**
    A Map of all resolved serializers in a an `Application` instance. This is
    used when a `Serializer` instance has to serialize an embedded
    relationship.

    @attribute serializers
    @type Map
    @private
    @readOnly
   */
  serializers;

  /**
    An Array of the `hasOne` or `belongsTo` relationships on a `Serializer`
    instance's model to include in the `relationships` resource object of a
    serialized payload.

    ```javascript
    class PostsSerializer extends Serializer {
      hasOne = [
        'author'
      ];
    }
    ```

    ```json
    {
      "data": [
        {
          "type": "posts",
          "id": 1,
          "attributes": {},
          "relationships": [
            {
              "data": {
                "id": 1,
                "type": "authors"
              },
               "links": {
                 "self": "http://localhost:4000/authors/1"
              }
            }
          ],
          "links": {
            "self": "http://localhost:4000/posts/1"
          }
        }
      ],
      "links": {
        "self": "http://localhost:4000/posts",
        "first": "http://localhost:4000/posts?page=1",
        "last": "http://localhost:4000/posts?page=1",
        "prev": null,
        "next": null
      }
      "jsonapi": {
        "version": "1.0"
      }
    }
    ```

    @attribute hasOne
    @type Array
   */
  hasOne = [];

  /**
    An Array of the `hasMany` relationships on a `Serializer` instance's model
    to include in the `relationships` resource object of a serialized payload.

    ```javascript
    class PostsSerializer extends Serializer {
      hasMany = [
        'comments'
      ];
    }
    ```

    ```json
    {
      "data": [
        {
          "type": "posts",
          "id": 1,
          "attributes": {},
          "relationships": [
            {
              "data": {
                "id": 1,
                "type": "comments"
              },
               "links": {
                 "self": "http://localhost:4000/comments/1"
              }
            },
            {
              "data": {
                "id": 2,
                "type": "comments"
              },
               "links": {
                 "self": "http://localhost:4000/comments/2"
              }
            }
          ],
          "links": {
            "self": "http://localhost:4000/posts/1"
          }
        }
      ],
      "links": {
        "self": "http://localhost:4000/posts",
        "first": "http://localhost:4000/posts?page=1",
        "last": "http://localhost:4000/posts?page=1",
        "prev": null,
        "next": null
      }
      "jsonapi": {
        "version": "1.0"
      }
    }
    ```

    @attribute hasMany
    @type Array
   */
  hasMany = [];

  /**
    An Array of the `attributes` on a `Serializer` instance's model to include
    in the `attributes` resource object of a serialized payload.

    ```javascript
    class PostsSerializer extends Serializer {
      attributes = [
        'title',
        'isPublic'
      ];
    }
    ```

    ```json
    {
      "data": [
        {
          "type": "posts",
          "id": 1,
          "attributes": {
            "title": "Not another Node.js framework...",
            "is-public": true
          },
          "links": {
            "self": "http://localhost:4000/posts/1"
          }
        }
      ],
      "links": {
        "self": "http://localhost:4000/posts",
        "first": "http://localhost:4000/posts?page=1",
        "last": "http://localhost:4000/posts?page=1",
        "prev": null,
        "next": null
      }
      "jsonapi": {
        "version": "1.0"
      }
    }
    ```

    @attribute attributes
    @type Array
   */
  attributes = [];

  /**
    Create an instance of `Serializer`.

    WARNING:
    This is a private constructor and you should not instantiate a `Serializer`
    manually. Serializers are instantiated automatically by your application
    when it is started.

    @method constructor
    @param {Object} [props={}] An object containing the model, domain, and
    serializers to install on the `Serializer` instance.
    @private
   */
  constructor({ model, domain, serializers } = {}) {
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

  formatKey(key) {
    return dasherize(underscore(key));
  }

  fieldsFor(name, fields = {}) {
    fields = fields[camelize(name.replace(/\-/g, '_'), true)];

    if (fields) {
      fields = [...fields];
    }

    return fields;
  }

  attributesFor(item, fields = []) {
    return (fields.length ? fields : this.attributes)
      .reduce((hash, attr) => {
        if (attr.indexOf('id') < 0) {
          hash[this.formatKey(attr)] = item[attr];
        }

        return hash;
      }, {});
  }

  relationshipsFor(item, include, fields) {
    const { domain, hasOne, hasMany } = this;
    const hash = { data: {}, included: [] };

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

  serializeGroup(stream, key, data, include, fields) {
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

  async serializePayload(stream, payload, include, fields) {
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

  stream(payload, include, fields) {
    const stream = new Readable({
      encoding: 'utf8'
    });

    this.serializePayload(stream, payload, include, fields);

    return stream;
  }

  @bound
  serializeOne(item, include, fields, links = true) {
    const { id, modelName: name } = item;
    const type = pluralize(name);

    const data = {
      id,
      type,
      attributes: this.attributesFor(item, this.fieldsFor(name, fields))
    };

    const relationships = this.relationshipsFor(item, include, fields);

    if (keys(relationships.data).length) {
      data.relationships = relationships.data;
    }

    if (relationships.included.length) {
      data.included = relationships.included;
    }

    if (links) {
      data.links = {
        self: `${this.domain}/${type}/${id}`
      };
    }

    return data;
  }
}

export default Serializer;
