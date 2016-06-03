class Validation {
  key;
  value;
  model;
  validator;

  constructor({ key, value, model, validator = () => true } = {}) {
    return Object.assign(this, {
      key,
      value,
      model,
      validator
    });
  }

  get isValid() {
    const {
      model,
      value,
      validator
    } = this;

    return validator.call(model, value);
  }
}

export default Validation;
