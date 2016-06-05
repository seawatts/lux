// @flow
import { createHash as hash } from 'crypto';

/**
 * @private
 */
export default function createHash(key: mixed): string {
  if (typeof key === 'object') {
    key = JSON.stringify(key);
  }

  return hash('sha1')
    .update(key)
    .digest('base64');
}
