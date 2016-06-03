// @flow
import { EventEmitter } from 'events';
import { join as joinPath } from 'path';
import { watch } from 'fs';

import isJSFile from '../fs/utils/is-js-file';

import type { FSWatcher } from 'fs';

/**
 * @private
 */
class Watcher extends EventEmitter {
  path: string;

  client: FSWatcher;

  constructor(path: string): Watcher {
    super();

    path = joinPath(path, 'app');

    const client = watch(path, {
      recursive: true
    }, (type, filename) => {
      if (isJSFile(filename)) {
        this.emit('change', type, filename);
      }
    });

    Object.defineProperties(this, {
      path: {
        value: path,
        writable: false,
        enumerable: true,
        configurable: false
      },

      client: {
        value: client,
        writable: false,
        enumerable: true,
        configurable: false
      }
    });

    return this;
  }

  destroy(): void {
    this.client.close();
  }
}

export default Watcher;
