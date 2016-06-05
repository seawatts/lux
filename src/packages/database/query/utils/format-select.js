// @flow
import typeof Model from '../../model';

export default function formatSelect(
  model: Model,
  attrs: Array<string> = [],
  prefix: string = ''
): Array<string> {
  const { tableName } = model;

  return attrs.map(attr => {
    return `${tableName}.${model.getColumnName(attr)} AS ${prefix + attr}`;
  });
}
