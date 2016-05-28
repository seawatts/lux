/* @flow */

const { keys } = Object;

export default function entries(source: Object = {} ): Array<[string, mixed]> {
  return keys(source).reduce((result: Array<[string, mixed]>, key: string) => {
    result[result.length] = [key, source[key]];
    return result;
  }, []);
}
