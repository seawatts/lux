/* @flow */

/**
 * @private
 */
export default function* range(
  start: number = 1,
  end: number = 1
): Iterable<number> {
  while (start <= end) {
    yield start++;
  }
}
