// @flow
import entries from './entries';

/**
 * @private
 */
class PromiseHash<Object> extends Promise {
  constructor(promises: {}): PromiseHash {
    super((resolveHash, rejectHash) => {
      Promise.all(
        entries(promises).map(([key, value]) => {
          return new Promise((resolve, reject) => {
            value.then(resolvedValue => {
              resolve({ [key]: value });
            }, reject);
          });
        })
      ).then((objects) => {
        resolveHash(
          objects.reduce((hash, object) => Object.assign(hash, object))
        );
      }, rejectHash);
    });

    return this;
  }
}

export default PromiseHash;
