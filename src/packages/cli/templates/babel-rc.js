export default (name) => {
  return `
{
  "plugins": [
    "transform-es2015-modules-commonjs",
    "transform-decorators-legacy",
    "transform-class-properties",
    "transform-es2015-classes",
    "transform-es2015-destructuring",
    "transform-es2015-parameters",
    "transform-es2015-spread",
    "transform-decorators",
    "syntax-trailing-function-commas",
    "transform-object-rest-spread",
    "transform-async-to-generator",
    "transform-exponentiation-operator"
  ]
}
  `.substr(1).trim();
};
