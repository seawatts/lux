// @flow
const pattern = /^(?!\.).+\.js$/;

/**
 * [isJSFile description]
 * @private
 */
export default function isJSFile(file: string): boolean {
  return pattern.test(file);
}
