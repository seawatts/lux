/* @flow */
import Promise from 'bluebird';
import cluster from 'cluster';
import { pluralize, singularize } from 'inflection';

import loader from '../../loader';

import {
  ControllerMissingError,
  SerializerMissingError
} from '../errors';

import type Application from '../index';

const { isMaster } = cluster;

/**
 * @private
 */
export default async function boot(app: Application): Promise<Application> {
  const {
    router,
    domain,
    server,
    port,
    path,
    store
  } = app;

  const routes = loader(path, 'routes');
  const models = loader(path, 'models');
  const controllers = loader(path, 'controllers');
  const serializers = loader(path, 'serializers');

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
    if (isMaster) {
      process.emit('ready');
    } else if (typeof process.send === 'function') {
      process.send('ready');
    }
  });

  return app;
}
