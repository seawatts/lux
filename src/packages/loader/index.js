import path from 'path';

import fs, { isJSFile } from '../fs';

/**
 * @private
 */
export default async function loader(appPath, type) {
  if (type === 'routes') {
    const routes = path.join(appPath, 'dist', 'app', 'routes');

    return new Map([
      ['routes', external(routes).default]
    ]);
  } else {
    const pathForType = path.join(appPath, 'dist', 'app', type);
    const dependencies = await fs.readdirAsync(pathForType);

    return new Map(
      dependencies
        .filter(isJSFile)
        .map(file => {
          return [
            file.replace('.js', ''),
            external(path.join(pathForType, file)).default
          ];
        })
    );
  }
}
