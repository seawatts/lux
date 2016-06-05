// @flow
import createHash from './utils/create-hash';

/**
 * @private
 */
class MemoryStore extends Map {
  prefix: string;

  constructor(prefix: string): MemoryStore {
    super();

    Object.defineProperty(this, 'prefix', {
      value: prefix,
      writable: false,
      enumerable: true,
      configurable: false
    });

    return this;
  }

  get(key: mixed): mixed | void {
    key = `${this.prefix}::${createHash(key)}`;
    return super.get(key);
  }

  set (key: mixed, value: mixed): MemoryStore {
    key = `${this.prefix}::${createHash(key)}`;
    super.set(key, value);
    return this;
  }

  has(key: mixed): boolean {
    key = `${this.prefix}::${createHash(key)}`;
    return super.has(key);
  }

  delete(key: mixed): boolean {
    key = `${this.prefix}::${createHash(key)}`;
    return super.delete(key);
  }
}

export default MemoryStore;
