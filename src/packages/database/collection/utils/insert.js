/* @flow */
export default function insert(
  collection: Array<Object>,
  records: Array<Object>
): void {
  for (let i = 0; i < collection.length; i++) {
    collection[i] = records[i];
  }
}
