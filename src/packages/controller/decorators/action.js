import { Collection, Model } from '../../database';

import sanitizeParams from '../middleware/sanitize-params';
import createPageLinks from '../utils/create-page-links';

export default function action(target, key, desc) {
  const { value } = desc;

  return {
    get() {
      return () => [
        sanitizeParams,
        ...this.middleware,

        async function (req, res) {
          const { domain } = this;
          const { url: { pathname } } = req;
          let links = { self: domain + pathname };
          let data = await value.call(this, req, res);

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

              data = this.serializer.stream({ data, links }, include, fields);
            }
          }

          return data;
        }
      ].map(handler => {
        return (req, res) => handler.call(this, req, res);
      });
    }
  };
}
