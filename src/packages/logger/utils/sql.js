// @flow
import { insertValues } from '../../template';

/**
 * @private
 */
export default function sql(
  strings: Array<string>,
  ...values: Array<mixed>
): string {
  return insertValues(strings, ...values)
    .split(' ')
    .map(part => /(,?`|'|").+(`|'|"),?/g.test(part) ? part : part.toUpperCase())
    .join(' ');
}
