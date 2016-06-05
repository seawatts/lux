// @flow
import { MemoryStore } from './stores';
import { InvalidStoreError } from './errors';

/**
 * @private
 */
class Cache {
  store: MemoryStore;

  constructor({
    type,
    prefix
  }: {
    type: 'memory' | 'redis' | mixed,
    prefix: string
  }): Cache {
    let store;

    if (type === 'memory') {
      store = new MemoryStore(prefix);
    } else if (type === 'redis') {
      store = new MemoryStore(prefix);
    } else {
      throw new InvalidStoreError(type);
    }

    Object.defineProperty(this, 'store', {
      value: store,
      writable: false,
      enumerable: true,
      configurable: false
    });

    return this;
  }

  async get(key: mixed): Promise<mixed|void> {
    return await this.store.get(key);
  }

  async set (key: mixed, value: mixed): Promise<MemoryStore> {
    return await this.store.set(key, value);
  }

  async has(key: mixed): Promise<boolean> {
    return await this.store.has(key);
  }

  async delete(key: mixed): Promise<boolean> {
    return await this.store.delete(key);
  }
}

export default Cache;
