import insert from './utils/insert';

const { entries } = Object;

/**
 * @private
 */
class Collection extends Array<Object> {
  constructor({
    model,
    records = [],
    related = {}
  }: {
    model: any,
    records: Array<Object>,
    related: Object
  } = {}) {
    const { length } = records;

    const {
      tableName,
      primaryKey
    }: {
      tableName: string,
      primaryKey: string
    } = model;

    super(length);
    insert(this, records);

    return this.map(row => {
      entries(related)
        .forEach(([name, relatedRecords]) => {
          const match = relatedRecords
            .filter(relatedRecord => {
              const pk: ?string = relatedRecord[`${tableName}.${primaryKey}`];

              return pk === row[primaryKey];
            })
            .map(relatedRecord => {
              return entries(relatedRecord).reduce((rR, [key, value]) => {
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
          if (new RegExp(`^.+\.${primaryKey}$`).test(key) && !value) {
            return r;
          } else if (key.indexOf('.') >= 0) {
            const [a, b] = key.split('.');
            let parent = r[a];

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
  }
}

export default Collection;
