// @flow
import { VALID_STORES } from '../constants';

import { line } from '../../logger';

/**
 * @private
 */
class InvalidStoreError extends Error {
  constructor(store: mixed): InvalidStoreError {
    super(line`
      '${store}' is not a valid cache store. Pleas use one of the following
      valid cache stores ${VALID_STORES.map(s => `'${s}'`).join(', ')}.
    `);

    return this;
  }
}

export default InvalidStoreError;
