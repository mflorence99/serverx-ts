import * as express from 'express';
import * as url from 'url';

import { App } from '../app';
import { InfoObject } from 'openapi3-ts';
import { Message } from '../interfaces';
import { Method } from '../interfaces';
import { Normalizer } from '../middlewares/normalizer';
import { Response } from '../interfaces';
import { Route } from '../interfaces';
import { URLSearchParams } from 'url';

import { caseInsensitiveObject } from '../utils';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

// NOTE: this middleware is required
const MIDDLEWARES = [Normalizer];

/**
 * Google Cloud Function application
 */

export class GCFApp extends App {

  private req: express.Request;
  private res: express.Response;

  /** ctor */
  constructor(routes: Route[],
              info: InfoObject = null) {
    super(routes, MIDDLEWARES, info);
  }

  /** AWS Lambda handler method */
  handle(req: express.Request,
         res: express.Response): Promise<Response> {
    this.req = req;
    this.res = res;
    // synthesize Message from GCF Express-simulated req and res
    // NOTE: req is augmented IncomingMessage
    const parsed = url.parse(this.req.url);
    const message: Message = {
      context: {
        info: this.info,
        router: this.router,
      },
      request: {
        // NOTE: body is pre-parsed by Google Cloud
        body: this.req.body,
        headers: caseInsensitiveObject(this.req.headers || { }),
        httpVersion: this.req.httpVersion,
        method: <Method>this.req.method,
        params: { },
        path: parsed.pathname,
        query: new URLSearchParams(parsed.search),
        remoteAddr: this.req.connection? this.req.connection.remoteAddress : null,
        route: null,
        stream$: null,
        timestamp: Date.now()
      },
      response: {
        body: null,
        headers: caseInsensitiveObject({ }),
        statusCode: null
      }
    };
    return of(message)
      .pipe(map((message: Message): Message => this.router.route(message)))
      .pipe(this.makePipeline(message))
      .pipe(
        map((message: Message): Response => message.response),
        tap((response: Response) => {
          if (this.res.send) {
            Object.entries(response.headers).forEach(([k, v]) => this.res.set(k, <any>v));
            this.res.status(response.statusCode).send(response.body);
          }
        })
      ).toPromise();
  }

}
