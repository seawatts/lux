// @flow
import { Client } from 'fb-watchman';
import { FSWatcher } from 'fs';
import { EventEmitter } from 'events';

import initialize from './initialize';

/**
 * @private
 */
class Watcher extends EventEmitter {
  path: string;

  client: Client | FSWatcher;

  constructor(path: string): Promise<Watcher> {
    super();
    return initialize(this, path);
  }

  destroy(): void {
    const { client } = this;

    if (client instanceof FSWatcher) {
      client.close();
    } else if (client instanceof Client) {
      client.end();
    }
  }
}

export default Watcher;
