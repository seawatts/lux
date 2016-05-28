/* @flow */

/**
 * @private
 */
export default function pick(source: {}, ...keys: Array<string>) {
  return keys
    .map((key: string): [string, mixed] => [key, source[key]])
    .filter(([key, value]: [string, mixed]): boolean => {
      return typeof value !== 'undefined';
    })
    .reduce((result: Object, [key, value]: [string, mixed]): {} => {
      return {
        ...result,
        [key]: value
      };
    }, {});
}
