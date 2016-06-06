// @flow
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * @private
 */
export default function setLimit(
  req: IncomingMessage,
  res: ServerResponse
): void {
  const { route } = req;

  if (route && route.action === 'index') {
    let {
      params: {
        limit
      }
    } = req;

    if (!limit) {
      req.params.limit = this.defaultPerPage;
    }
  }
}
