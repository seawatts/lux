// @flow
import { pluralize, singularize } from 'inflection';

import Database from '../database';
import Logger from '../logger';
import Router from '../router';
import Server from '../server';
import loader from '../loader';

import {
  ControllerMissingError,
  SerializerMissingError
} from './errors';

import type Application from './index';

/**
 * @private
 */
export default async function initialize(app: Application, {
  log,
  path,
  port,
  domain,
  database
}: {
  log: boolean,
  path: string,
  port: number,
  domain: string,
  database: {}
} = {}): Promise<Application> {
  const routes = loader(path, 'routes');
  const models = loader(path, 'models');
  const controllers = loader(path, 'controllers');
  const serializers = loader(path, 'serializers');

  const logger = await new Logger({
    path,
    enabled: log
  });

  const router = new Router();

  const server = new Server({
    router,
    logger
  });

  const store = new Database({
    logger,
    path,
    config: database
  });

  Object.defineProperties(app, {
    path: {
      value: path,
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
      enumerable: false,
      configurable: false
    },

    domain: {
      value: domain,
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

    router: {
      value: router,
      writable: false,
      enumerable: false,
      configurable: false
    },

    server: {
      value: server,
      writable: false,
      enumerable: false,
      configurable: false
    }
  });

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
  routes.call(null, router.route, router.resource);

  server.instance.listen(port).once('listening', () => {
    if (typeof process.send === 'function') {
      process.send({
        message: 'ready'
      });
    } else {
      process.emit('ready');
    }
  });

  return app;
}
