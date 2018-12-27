import { Request } from './request';
import { Response as ServeRXResponse } from '../../serverx';

// type ExpressResponse = import('express').Response;

/**
 * Proxied Express Response
 */

export class Response /* implements ExpressResponse */ {
  
  req: Request;

  // TODO: properties not yet implemented

  app = { };
  charset;
  headersSent;
  json;
  jsonp;
  locals;
  send;

  /** ctor */
  constructor(response: ServeRXResponse) { }

  // TODO: methods not yet implemented

  append() { throw new Error('ExpressResponse append() not yet implemented'); }

  attachment() { throw new Error('ExpressResponse attachment() not yet implemented'); }

  clearCookie() { throw new Error('ExpressResponse clearCookie() not yet implemented'); }

  contentType() { throw new Error('ExpressResponse contentType() not yet implemented'); }

  cookie() { throw new Error('ExpressResponse cookie() not yet implemented'); }

  download() { throw new Error('ExpressResponse download() not yet implemented'); }

  format() { throw new Error('ExpressResponse format() not yet implemented'); }

  get() { throw new Error('ExpressResponse get() not yet implemented'); }

  header() { throw new Error('ExpressResponse header() not yet implemented'); }

  links() { throw new Error('ExpressResponse links() not yet implemented'); }

  location() { throw new Error('ExpressResponse location() not yet implemented'); }

  redirect() { throw new Error('ExpressResponse redirect() not yet implemented'); }

  render() { throw new Error('ExpressResponse render() not yet implemented'); }

  sendFile() { throw new Error('ExpressResponse sendFile() not yet implemented'); }

  sendfile() { throw new Error('ExpressResponse sendfile() not yet implemented'); }

  sendStatus() { throw new Error('ExpressResponse sendStatus() not yet implemented'); }

  set() { throw new Error('ExpressResponse set() not yet implemented'); }

  status() { throw new Error('ExpressResponse status() not yet implemented'); }

  type() { throw new Error('ExpressResponse type() not yet implemented'); }

  vary() { throw new Error('ExpressResponse var() not yet implemented'); }
  
}
