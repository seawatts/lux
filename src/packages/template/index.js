// @flow
import insertValues from './utils/insert-values';

const bodyPattern = /^\n([\s\S]+)\s{2}$/gm;

/**
 * @private
 */
export default function template(
 strings: Array<string>,
 ...values: Array<mixed>
): string {
  const [body] = insertValues(strings, ...values).match(bodyPattern) || [];

  return body ? body.split('\n')
    .slice(1)
    .map(line => line.substr(4))
    .join('\n') : '';
}

export { default as insertValues } from './utils/insert-values';
