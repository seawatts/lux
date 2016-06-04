// @flow
import { classify } from 'inflection';

import template from '../../template';

/**
 * @private
 */
export default (name: string): string => {
  name = classify(name.replace('-', '_'));

  return template`
    import { Application } from 'lux-framework';

    class ${name} extends Application {

    }

    export default ${name};
  `;
};
