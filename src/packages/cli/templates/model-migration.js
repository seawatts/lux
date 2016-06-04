// @flow
import { pluralize } from 'inflection';

import template from '../../template';

import indent from '../utils/indent';
import underscore from '../../../utils/underscore';

/**
 * @private
 */
export default (name: string, attrs: Array<string> | string): string => {
  const table = pluralize(underscore(name));
  let indices: Array<string> | string = ['id'];

  if (!attrs) {
    attrs = [];
  }

  if (Array.isArray(attrs)) {
    attrs = attrs
      .filter(attr => /^(\w|-)+:(\w|-)+$/g.test(attr))
      .map(attr => attr.split(':'))
      .filter(([, type]) => !/^has-(one|many)$/g.test(type))
      .map(([column, type]) => {
        column = underscore(column);

        if (type === 'belongs-to') {
          type = 'integer';
          column = `${column}_id`;

          if (Array.isArray(indices)) {
            indices.push(column);
          }
        }

        return [column, type];
      })
      .map(([column, type], index) => {
        return `${indent(index > 0 ? 8 : 0)}table.${type}('${column}');`;
      })
      .join('\n');
  }

  if (Array.isArray(indices)) {
    indices.push('created_at', 'updated_at');

    indices = '\n' + indices
      .map(column => indent(10) + `'${column}'`)
      .join(',\n') + '\n' + indent(8);
  }

  return template`
    export function up(schema) {
      return schema.createTable('${table}', table => {
        table.increments('id');
        ${attrs}
        table.timestamps();

        table.index([${indices}]);
      });
    }

    export function down(schema) {
      return schema.dropTable('${table}');
    }
  `;
};
