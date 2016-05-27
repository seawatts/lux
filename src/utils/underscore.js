/* @flow */
import inflection from 'inflection';

export default function underscore(
  source: string = '',
  upper: boolean = false
): string {
  return inflection.underscore(source, upper).replace(/-/g, '_');
}
