// @flow

/**
 * @private
 */
export default function getOffset(
  page: number = 1,
  limit: number = 25
): number {
  return Math.max(parseInt(page, 10) - 1 , 0) * limit;
}
