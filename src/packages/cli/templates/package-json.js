// @flow
import { version } from '../../../../package.json';

import template from '../../template';

const VERSION: string = version;

/**
 * @private
 */
export default (name: string): string => template`
  {
    "name": "${name}",
    "version": "0.0.1",
    "description": "",
    "scripts": {
      "start": "lux serve",
      "test": "lux test"
    },
    "author": "",
    "license": "MIT",
    "dependencies": {
      "babel-core": "6.9.1",
      "babel-plugin-external-helpers-2": "6.3.13",
      "babel-plugin-syntax-trailing-function-commas": "6.8.0",
      "babel-plugin-transform-async-to-generator": "6.8.0",
      "babel-plugin-transform-class-properties": "6.9.1",
      "babel-plugin-transform-decorators": "6.8.0",
      "babel-plugin-transform-decorators-legacy": "1.3.4",
      "babel-plugin-transform-es2015-destructuring": "6.9.0",
      "babel-plugin-transform-es2015-parameters": "6.9.0",
      "babel-plugin-transform-es2015-spread": "6.8.0",
      "babel-plugin-transform-exponentiation-operator": "6.8.0",
      "babel-plugin-transform-object-rest-spread": "6.8.0",
      "knex": "0.11.5",
      "lux-framework": "${VERSION}"
    }
  }
`;
