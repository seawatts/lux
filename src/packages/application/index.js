import Promise from 'bluebird';
import cluster from 'cluster';
import requireReload from 'require-reload';
import { basename, join as joinPath } from 'path';
import { dasherize, pluralize, singularize } from 'inflection';

import Server from '../server';
import Router from '../router';
import Database from '../database';

import loader from '../loader';

import bound from '../../decorators/bound';

import tryCatch from '../../utils/try-catch';
import underscore from '../../utils/underscore';

import {
  ControllerMissingError,
  SerializerMissingError
} from './errors';

const { assign, defineProperties } = Object;
const { env: { PWD, PORT } } = process;
const { isMaster } = cluster;
const reload = requireReload(external);

class Application {
  path;
  port;
  store;
  domain;
  logger;
  router;

  models: Map<string, Object> = new Map();

  controllers: Map<string, Object> = new Map();

  serializers: Map<string, Object> = new Map();

  constructor({
    appPath = PWD,
    port = PORT || 4000,
    domain = 'http://localhost',
    logger
  } = {}) {
    const router = new Router();

    const server = new Server({
      router,
      logger
    });

    const store = new Database({
      path: appPath,
      logger,
      config: external(joinPath(appPath, 'dist', 'config', 'database')).default
    });

    defineProperties(this, {
      path: {
        value: appPath,
        writable: false,
        enumerable: true,
        configurable: false
      },

      port: {
        value: port,
        writable: false,
        enumerable: true,
        configurable: false
      },

      store: {
        value: store,
        writable: false,
        enumerable: true,
        configurable: false
      },

      domain: {
        value: domain,
        writable: false,
        enumerable: true,
        configurable: false
      },

      router: {
        value: router,
        writable: false,
        enumerable: true,
        configurable: false
      },

      logger: {
        value: logger,
        writable: false,
        enumerable: true,
        configurable: false
      },

      server: {
        value: server,
        writable: false,
        enumerable: false,
        configurable: false
      }
    });

    process.on('update', this.refresh);

    return this;
  }

  async boot() {
    const { router, domain, server, port, path, store } = this;

    let [
      routes,
      models,
      controllers,
      serializers
    ] = await Promise.all([
      loader(path, 'routes'),
      loader(path, 'models'),
      loader(path, 'controllers'),
      loader(path, 'serializers')
    ]);

    await store.define(models);

    models.forEach((model, name) => {
      const resource = pluralize(name);

      if (!controllers.get(resource)) {
        throw new ControllerMissingError(resource);
      }

      if (!serializers.get(resource)) {
        throw new SerializerMissingError(resource);
      }
    });

    serializers.forEach((serializer, name) => {
      const model = models.get(singularize(name));

      serializer = new serializer({
        model,
        domain,
        serializers
      });

      if (model) {
        model.serializer = serializer;
      }

      serializers.set(name, serializer);
    });

    let appController = controllers.get('application');
    appController = new appController({
      store,
      domain,
      serializers,
      serializer: serializers.get('application')
    });

    controllers.set('application', appController);

    controllers.forEach((controller, key) => {
      if (key !== 'application') {
        const model = store.modelFor(singularize(key));

        controller = new controller({
          store,
          model,
          domain,
          serializers,
          serializer: serializers.get(key),
          parentController: appController
        });

        controllers.set(key, controller);
      }
    });

    router.controllers = controllers;

    routes.get('routes').call(null, router.route, router.resource);

    server.instance.listen(port).once('listening', () => {
      if (isMaster) {
        process.emit('ready');
      } else {
        process.send('ready');
      }
    });

    assign(this, {
      models,
      controllers,
      serializers
    });

    return this;
  }

  @bound
  refresh(changed: Array<{}> = []): void {
    tryCatch(async () => {
      const types = /(models|controllers|serializers)/g;
      let controllerDidChange = false;

      const {
        store,
        domain,
        router,
        models,
        controllers,
        serializers,
        path: appPath
      } = this;

      changed
        .map(({ name: path }: { name: string }) => {
          const [type] = path.match(types) || [];

          return {
            path,
            type: type ? singularize(type) : null
          };
        })
        .filter(({ type }: { type: ?string }) => Boolean(type))
        .forEach(({ path, type }: { path: string, type: string }) => {
          let mod = reload(joinPath(appPath, 'dist', path));
          const key = dasherize(underscore(basename(path)));

          switch (type) {
            case 'model':
              break;

            case 'controller':
              const match = controllers.get(key);

              controllerDidChange = true;

              if (match) {
                const {
                  model,
                  serializer,
                  parentController
                } = match;

                mod = new mod({
                  store,
                  model,
                  domain,
                  serializer,
                  serializers,
                  parentController
                });

                controllers.set(key, mod);

                if (key === 'application') {
                  controllers.forEach(controller => {
                    if (controller !== mod) {
                      controller.parentController = mod;
                    }
                  });
                }
              }

              break;

            case 'serializers':
              break;
          }
        });

      if (controllerDidChange) {
        const routes = await loader(appPath, 'routes');

        routes.get('routes').call(null, router.route, router.resource);
      }
    }, ({ message }: { message: string }) => {
      if (message) {
        this.logger.error(message);
      }
    });
  }
}

export default Application;
