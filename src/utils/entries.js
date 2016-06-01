/* @flow */

const { keys } = Object;

/**
 * @private
 */
export default function entries(source: Object = {} ): Array<[string, any]> {
  return keys(source).reduce((result: Array<[string, mixed]>, key: string) => {
    result[result.length] = [key, source[key]];
    return result;
  }, []);
}
