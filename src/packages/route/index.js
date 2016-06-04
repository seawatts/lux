// @flow
import createAction from './utils/create-action';
import getStaticPath from './utils/get-static-path';
import getDynamicSegments from './utils/get-dynamic-segments';

import type { Controller } from '../controller';

/**
 * @private
 */
class Route {
  path: string;

  action: string;

  method: string;

  resource: string;

  handlers: Array<Function>;

  controller: Controller;

  staticPath: string;

  dynamicSegments: Array<string>;

  constructor({
    path,
    action,
    controllers,
    method
  }: {
    path: string,
    action: string,
    controllers: Map<string, Controller>,
    method: string
  }) {
    const resource = path.replace(/^(.+)\/.+$/ig, '$1');
    const controller: ?Controller = controllers.get(resource);
    const dynamicSegments = getDynamicSegments(path);
    let handlers;

    if (action && controller) {
      const handler: ?Function = controller[action];

      if (typeof handler === 'function') {
        handlers = createAction(controller, handler);

        Object.defineProperties(this, {
          path: {
            value: path,
            writable: false,
            enumerable: true,
            configurable: false
          },

          action: {
            value: action,
            writable: false,
            enumerable: true,
            configurable: false
          },

          method: {
            value: method.toUpperCase(),
            writable: false,
            enumerable: true,
            configurable: false
          },

          resource: {
            value: resource,
            writable: false,
            enumerable: false,
            configurable: false
          },

          handlers: {
            value: handlers,
            writable: false,
            enumerable: false,
            configurable: false
          },

          controller: {
            value: controller,
            writable: false,
            enumerable: false,
            configurable: false
          },

          dynamicSegments: {
            value: dynamicSegments,
            writable: false,
            enumerable: false,
            configurable: false
          },

          staticPath: {
            value: getStaticPath(path, dynamicSegments),
            writable: false,
            enumerable: false,
            configurable: false
          }
        });
      } else {
        throw new TypeError(
          `Handler for ${controller.name}#${action} is not a function.`
        );
      }
    } else {
      throw new TypeError(
        'Arguements `controller` and `action`  must not be undefined'
      );
    }

    return this;
  }
}

export default Route;
