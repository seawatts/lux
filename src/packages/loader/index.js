import path from 'path';
import requireReload from 'require-reload';

import fs, { isJSFile } from '../fs';

const reload = requireReload(external);

/**
 * @private
 */
export default async function loader(appPath, type) {
  if (type === 'routes') {
    const routes = path.join(appPath, 'dist', 'app', 'routes');

    return new Map([
      ['routes', reload(routes).default]
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
            reload(path.join(pathForType, file)).default
          ];
        })
    );
  }
}
