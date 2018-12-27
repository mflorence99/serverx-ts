import { Request as ServeRXRequest } from '../../serverx';
import { Response } from './response';

// type ExpressRequest = import('ExpressRequest').Request;

/**
 * Proxied Express Request
 */

export class Request /* implements ExpressRequest */ { 

  body: any;
  httpVersion: string;
  ip: string;
  method: string;
  params: any;
  path: string;
  res: Response;

  // TODO: properties not yet implemented

  accepted = [];
  app = { };
  baseUrl;
  cookies = { };
  fresh;
  host;
  hostname;
  ips = [];
  next;
  originalUrl;
  protocol;
  query;
  route;
  secure;
  signedCookies;
  stale;
  subdomains;
  url;
  xhr;

  /** ctor */
  constructor(request: ServeRXRequest) { 
    this.body = request.body;
    this.httpVersion = request.httpVersion;
    this.ip = request.remoteAddr;
    this.method = request.method;
    this.params = request.params;
    this.path = request.path;
  }

  // TODO: methods not yet implemented

  accepts() { throw new Error('ExpressRequest accepts() not yet implemented'); }

  acceptsCharsets() { throw new Error('ExpressRequest acceptsCharsets() not yet implemented'); }

  acceptsEncodings() { throw new Error('ExpressRequest acceptsEncodings() not yet implemented'); }

  acceptsLanguages() { throw new Error('ExpressRequest acceptsLanguages() not yet implemented'); }

  clearCookie() { throw new Error('ExpressRequest clearCookie() not yet implemented'); }

  get() { throw new Error('ExpressRequest get() not yet implemented'); }

  header() { throw new Error('ExpressRequest header() not yet implemented'); }

  is() { throw new Error('ExpressRequest is() not yet implemented'); }

  param() { throw new Error('ExpressRequest param() not yet implemented'); }

  range() { throw new Error('ExpressRequest range() not yet implemented'); }
  
}
