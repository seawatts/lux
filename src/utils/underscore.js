/* @flow */
import { underscore as _ } from 'inflection';

export default function underscore(
  source: string = '',
  upper: boolean = false
): string {
  return _(source, upper).replace(/-/g, '_');
}
