import { http$IncomingMessage, http$ServerResponse } from 'http';

import { Model } from '../src/packages/database';

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

declare module 'http' {
  declare class IncomingMessage extends http$IncomingMessage {
    params: params;
    record?: Model;
    url: url;
  }

  declare class ServerResponse extends http$ServerResponse {
    params: params;
    record?: Model;
    url: url;
  }
}
