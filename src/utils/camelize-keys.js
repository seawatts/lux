/* @flow */
import { camelize } from 'inflection';

import entries from './entries';

/**
 * @private
 */
export default function camelizeKeys(
  obj: {} | Array<mixed>,
  deep: boolean = false
): {} | Array<mixed> {
  if (Array.isArray(obj)) {
    return obj.slice(0);
  } else if (obj && typeof obj === 'object') {
    return entries(obj)
      .reduce((result, [key, value]) => {
        if (deep && value && typeof value === 'object'
            && !Array.isArray(value)) {
          value = camelizeKeys(value, true);
        }

        return {
          ...result,
          [camelize(key.replace(/-/g, '_'), true)]: value
        };
      }, {});
  } else {
    return {};
  }
}
