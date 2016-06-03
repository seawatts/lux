// @flow

/**
 * @private
 */
class Migration {
  fn: () => Promise<void>;

  constructor(fn: () => Promise<void>): Migration {
    Object.defineProperties(this, {
      fn: {
        value: fn,
        writeable: false,
        enumerable: false,
        configurable: false
      }
    });

    return this;
  }

  run(schema: Object): Promise<void> {
    return this.fn.call(null, schema);
  }
}

export default Migration;
