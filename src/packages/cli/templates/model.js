// @flow
import { classify, camelize } from 'inflection';

import template from '../../template';

import indent from '../utils/indent';
import entries from '../../../utils/entries';
import underscore from '../../../utils/underscore';

/**
 * @private
 */
export default (name: string, attrs: Array<string>): string => {
  name = classify(underscore(name));

  if (!attrs) {
    attrs = [];
  }

  const body = entries(
    attrs
      .filter(attr => /^(\w|-)+:(\w|-)+$/g.test(attr))
      .map(attr => attr.split(':'))
      .filter(([, type]) => /^belongs-to|has-(one|many)$/g.test(type))
      .reduce(({ belongsTo, hasOne, hasMany }, [related, type]) => {
        const inverse = camelize(name, true);

        related = camelize(underscore(related), true);

        switch (type) {
          case 'belongs-to':
            belongsTo = [
              ...belongsTo,

              indent(8) + `${related}: {\n` +
              indent(10) + `inverse: '${inverse}'\n` +
              indent(8) + '}'
            ];
            break;

          case 'has-one':
            hasOne = [
              ...hasOne,

              indent(8) + `${related}: {\n` +
              indent(10) + `inverse: '${inverse}'\n` +
              indent(8) + '}'
            ];
            break;

          case 'has-many':
            hasMany = [
              ...hasMany,

              indent(8) + `${related}: {\n` +
              indent(10) + `inverse: '${inverse}'\n` +
              indent(8) + '}'
            ];
            break;
        }

        return {
          belongsTo,
          hasOne,
          hasMany
        };
      }, { belongsTo: [], hasOne: [], hasMany: [] })
  ).reduce((str, [key, value], index) => {
    if (value.length) {
      value = value.join(',\n\n');

      if (index && str.length) {
        str += '\n\n';
      }

      str += `${indent(index === 0 ? 2 : 6)}static ${key} = ` +
        `{\n${value}\n${indent(6)}};`;
    }

    return str;
  }, '');

  return template`
    import { Model } from 'lux-framework';

    class ${name} extends Model {
    ${body}
    }

    export default ${name};
  `;
};
