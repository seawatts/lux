import type Model from '../../model';
import type Collection from '../index';

export default function insert(
  collection: Collection,
  records: Array<Model>
): void {
  for (let i = 0; i < collection.length; i++) {
    collection[i] = records[i];
  }
}
