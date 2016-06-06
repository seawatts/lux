// @flow
import { Collection, Model } from '../../database';

import sanitizeParams from '../../controller/middleware/sanitize-params';
import setInclude from '../../controller/middleware/set-include';
import setFields from '../../controller/middleware/set-fields';
import setLimit from '../../controller/middleware/set-limit';

import createPageLinks from './create-page-links';

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
    setInclude,
    setFields,
    setLimit,

    ...controller.middleware,

    async function (req: IncomingMessage, res: ServerResponse) {
      const { model, domain } = controller;
      const { url: { pathname } } = req;
      let links = { self: domain + pathname };
      let data = await action.call(controller, req, res);

      if (typeof data === 'object') {
        const {
          params,

          params: {
            fields,
            filter,
            include
          },

          url: {
            path
          }
        } = req;

        if (data instanceof Collection || data instanceof Model) {
          if (data instanceof Collection) {
            const total = await model.count(filter);

            links = {
              self: domain + path,
              ...createPageLinks(domain, pathname, params, total)
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
