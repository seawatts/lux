/* @flow */
import path from 'path';

import fs, { isJSFile } from '../fs';

import type { Model } from '../database';
import type Controller from '../controller';
import type Serializer from '../serializer';

/**
 * @private
 */
export default async function loader(
  appPath: string,
  type: string
): Promise<Map<string, Model|Controller|Serializer|Function>> {
  if (type === 'routes') {
    const routes = path.join(appPath, 'dist', 'app', 'routes');

    return new Map([
      ['routes', external(routes).default]
    ]);
  } else {
    const pathForType = path.join(appPath, 'dist', 'app', type);
    const dependencies: Array<string> = await fs.readdirAsync(pathForType);

    return new Map(
      dependencies
        .filter(isJSFile)
        .map((file): [string, Module] => {
          return [
            file.replace('.js', ''),
            external(path.join(pathForType, file)).default
          ];
        })
    );
  }
}
