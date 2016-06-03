// @flow

/**
 * @private
 */
export default function entries(source: Object = {} ): Array<[string, any]> {
  return Object.keys(source).reduce((result, key) => {
    result[result.length] = [key, source[key]];
    return result;
  }, []);
}
