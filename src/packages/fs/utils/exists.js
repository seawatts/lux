// @flow
import { stat, readdir } from 'fs';

/**
 * @private
 */
export default function exists(
  path: string | RegExp,
  dir: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (typeof path === 'string') {
      stat(path, err => resolve(Boolean(!err)));
    } else if (path instanceof RegExp) {
      const pattern = path;

      readdir(dir, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files.some(file => pattern.test(file)));
        }
      });
    }
  });
}
