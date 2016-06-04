// @flow
import template from '../../template';

/**
 * @private
 */
export default (): string => template`
  {
    "plugins": [
      "external-helpers-2",
      "syntax-trailing-function-commas",
      "transform-decorators-legacy",
      "transform-class-properties",
      "transform-decorators",
      "transform-es2015-destructuring",
      "transform-es2015-parameters",
      "transform-es2015-spread",
      "transform-object-rest-spread",
      "transform-async-to-generator",
      "transform-exponentiation-operator"
    ]
  }
`;
