// @flow
import Model from '../model';

import insert from './utils/insert';
import entries from '../../../utils/entries';

/**
 * @private
 */
class Collection extends Array<Model> {
  constructor({
    model,
    records = [],
    related = {}
  }: {
    model: typeof Model,
    records: Array<Object>,
    related: Object
  } = {}): Collection {
    const { length } = records;
    const { tableName, primaryKey } = model;
    const pkPattern = new RegExp(`^.+\.${primaryKey}$`);

    super(length);

    records = records.map((row): model => {
      entries(related)
        .forEach(([name, relatedRecords]: [string, Array<{}>]) => {
          const match = relatedRecords
            .filter((relatedRecord): boolean => {
              const pk: ?string = relatedRecord[`${tableName}.${primaryKey}`];

              return pk === row[primaryKey];
            })
            .map(relatedRecord => {
              return entries(relatedRecord)
                .reduce((rR, [key, value]: [string, Object]) => {
                  if (key.indexOf('.') >= 0) {
                    return {
                      ...rR,
                      [key.replace(`${name}.`, '')]: value
                    };
                  } else {
                    return rR;
                  }
                }, {});
            });

          if (match.length) {
            row[name] = match;
          }
        });

      row = entries(row)
        .reduce((r, [key, value]) => {
          if (!value && pkPattern.test(key)) {
            return r;
          } else if (key.indexOf('.') >= 0) {
            const [a, b] = key.split('.');
            let parent: ?Object = r[a];

            if (!parent) {
              parent = {};
            }

            key = a;
            value = {
              ...parent,
              [b]: value
            };
          }

          return {
            ...r,
            [key]: value
          };
        }, {});

      return new model(row);
    });

    insert(this, records);

    return this;
  }
}

export default Collection;
