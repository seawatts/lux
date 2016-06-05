// @flow
import template from '../../template';

/**
 * @private
 */
export default (name: string, env: string): string => {
  const isProdENV = env === 'production';

  return template`
    export default {
      log: ${!isProdENV},
      domain: 'http://localhost:4000',

      /**
       * It is highly reccomended that you use the 'redis' cache store in
       * production.
       */
      cache: {
        type: 'memory',
        prefix: '${name}-cache::${env}'
      }
    };
  `;
};
