// @flow
const pattern = /(:\w+)/g;

/**
 * @private
 */
export default function getDynamicSegments(path: string): Array<string> {
  return (path.match(pattern) || []).map(part => part.substr(1));
}
