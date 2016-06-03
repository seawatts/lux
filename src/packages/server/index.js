// @flow
import http from 'http';
import { parse as parseURL } from 'url';

import chalk, { cyan } from 'chalk';

import { line } from '../logger';

import formatParams from './utils/format-params';

import type {
  Server as HTTPServer,
  IncomingMessage,
  ServerResponse
} from 'http';

import type Logger from '../logger';
import type Router from '../router';

/**
 * @private
 */
class Server {
  router: Router;
  logger: Logger;
  instance: HTTPServer;

  constructor({
    logger,
    router
  }: {
    logger: Logger,
    router: Router
  } = {}): Server {
    const instance = http.createServer((req, res) => {
      this.receiveRequest(req, res);
    });

    Object.defineProperties(this, {
      router: {
        value: router,
        writable: false,
        enumerable: false,
        configurable: false
      },

      logger: {
        value: logger,
        writable: false,
        enumerable: false,
        configurable: false
      },

      instance: {
        value: instance,
        writable: false,
        enumerable: false,
        configurable: false
      }
    });

    return this;
  }

  listen(port: number): void {
    this.instance.listen(port);
  }

  async receiveRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const { headers } = req;
    const methodOverride = headers['X-HTTP-Method-Override'];

    this.logRequest(req, res);

    req.setEncoding('utf8');
    res.setHeader('Content-Type', 'application/vnd.api+json');

    if (methodOverride) {
      req.method = methodOverride;
    }

    req.url = parseURL(req.url, true);
    req.params = await formatParams(req);

    this.router.resolve(req, res);
  }

  logRequest(req: IncomingMessage, res: ServerResponse): void {
    const startTime = new Date();

    res.once('finish', () => {
      const { url, method } = req;
      const { statusCode, statusMessage } = res;
      let statusColor;

      if (statusCode >= 200 && statusCode < 400) {
        statusColor = 'green';
      } else {
        statusColor = 'red';
      }

      this.logger.log(line`
        ${cyan(`${method}`)} ${url.pathname} -> Finished after
        ${new Date().getTime() - startTime.getTime()} ms with
        ${chalk[statusColor].call(null, `${statusCode}`)}
        ${chalk[statusColor].call(null, `${statusMessage}`)}
      `);
    });
  }
}

export default Server;
