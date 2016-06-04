// @flow

/**
 * @private
 */
export default function insertValues(
  strings: Array<string>,
  ...values: Array<mixed>
): string {
 return values.length ? strings.reduce((result, part, idx) => {
   const value = values[idx];

   return result + part + (typeof value !== 'undefined' ? value : '');
 }, '') : strings.join('');
}
