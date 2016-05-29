/* @flow */

import omit from '../../../utils/omit';
import tryCatch from '../../../utils/try-catch';
import formatInclude from './format-include';

import type { IncomingMessage, ServerResponse } from 'http';

import type Controller from '../index';
import type { Model } from '../../database';

/**
 * Retrieve a record relative to request parameters for a member route.
 *
 * @private
 */
export default async function getRecord(
  controller: Controller,
  req: IncomingMessage,
  res: ServerResponse
): Promise<?Model> {
  return tryCatch(async () => {
    const { model, modelName, relationships } = controller;

    let {
      params: {
        fields,
        include,
        id: pk
      }
    } = req;

    const includedFields = omit(fields, modelName);
    let select: ?Array<string> = fields[modelName];

    if (pk) {
      if (!select) {
        select = controller.attributes;
      }

      include = formatInclude(model, include, includedFields, relationships);

      return await model.find(pk, {
        select,
        include
      });
    }
  });
}
