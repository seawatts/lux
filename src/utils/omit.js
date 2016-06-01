/* @flow */
import entries from './entries';

/**
 * @private
 */
 export default function omit(source: {}, ...omitted: Array<string>): {} {
  return entries(source)
    .filter(([key, value]: [string, mixed]): boolean => {
      return omitted.indexOf(key) < 0;
    })
    .reduce((result: {}, [key, value]: [string, mixed]): {} => {
      return {
        ...result,
        [key]: value
      };
    }, {});
}
