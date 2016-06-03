// @flow

/**
 * @private
 */
export default function insertValues(
  strings: Array<string>,
  ...values: Array<mixed>
): string {
 return strings.reduce((result, part, idx) => {
   const value = values[idx];

   return result + part + (value ? value : '');
 }, '');
}
