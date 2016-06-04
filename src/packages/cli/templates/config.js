// @flow
import template from '../../template';

/**
 * @private
 */
export default (name: string, env: string): string => {
  const isProdENV = env === 'production';
  let keyPrefix = `${name}`;

  if (!isProdENV) {
    keyPrefix += `::${env}`;
  }

  return template`
    export default {
      log: ${!isProdENV},
      domain: 'http://localhost:4000'
    };
  `;
};
