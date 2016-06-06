// @flow
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * @private
 */
export default function setFields(
  req: IncomingMessage,
  res: ServerResponse
): void {
  const { route } = req;

  if (route && /^(index|show)$/g.test(route.action)) {
    let {
      params: {
        fields
      }
    } = req;

    fields = fields[this.modelName];
    req.params.fields = fields ? fields : this.attributes;
  }
}
