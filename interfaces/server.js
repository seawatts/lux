import { IncomingMessage } from 'http';

import type { Model } from '../src/packages/database';

type params = {
  data?: {
    id: number | string | Buffer;
    type: string;
    attributes?: Object;
    relationships?: Object;
  };

  fields: Object;
  filter: Object;
  id?: number | string | Buffer;
  include: Array<string>;
  limit: number;
  page: number;
  sort: string;
};

type url = {
  protocol?: string;
  slashes?: boolean;
  auth?: string;
  host?: string;
  port?: string;
  hostname?: string;
  hash?: string;
  search?: string;
  query?: any;
  pathname?: string;
  path?: string;
  href: string;
};

declare module 'server' {
  declare class Request mixins IncomingMessage {
    params: params;
    record?: Model;
    url: url;
  }
}
