/* @flow */
import { dasherize } from 'inflection';

import underscore from '../../../utils/underscore';

/**
 * @private
 */
export default function formatKey(
  key: string,
  formatter: ?(k: string) => string
): string {
  if (formatter) {
    key = formatter.call(null, key);
  }

  return dasherize(underscore(key));
}
