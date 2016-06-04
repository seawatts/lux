// @flow
import { Collection, Model } from '../../database';

import sanitizeParams from '../../controller/middleware/sanitize-params';
import createPageLinks from '../../controller/utils/create-page-links';

import type Controller from '../../controller';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * @private
 */
export default function createAction(
  controller: Controller,
  action: () => Promise
): Array<Function> {
  return [
    sanitizeParams,
    ...controller.middleware,

    async function (req: IncomingMessage, res: ServerResponse) {
      const { domain } = controller;
      const { url: { pathname } } = req;
      let links = { self: domain + pathname };
      let data = await action.call(controller, req, res);

      if (typeof data === 'object') {
        const {
          params,

          params: {
            fields,
            include
          },

          url: {
            path
          }
        } = req;

        if (data instanceof Collection || data instanceof Model) {
          if (data instanceof Collection) {
            links = {
              self: domain + path,
              ...createPageLinks(domain, pathname, params, data.total)
            };
          }

          data = controller.serializer.stream({
            data,
            links
          }, include, fields);
        }
      }

      return data;
    }
  ].map((handler: Function): Function => {
    return (req: IncomingMessage, res: ServerResponse) => {
      return handler.call(controller, req, res);
    };
  });
}
