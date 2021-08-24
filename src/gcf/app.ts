import { App } from '../app';
import { Message } from '../interfaces';
import { Method } from '../interfaces';
import { Normalizer } from '../middlewares/normalizer';
import { Response } from '../interfaces';
import { Route } from '../interfaces';

import { caseInsensitiveObject } from '../utils';

import * as express from 'express';
import * as url from 'url';

import { InfoObject } from 'openapi3-ts';
import { URLSearchParams } from 'url';

import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

// NOTE: this middleware is required
const MIDDLEWARES = [Normalizer];

/**
 * Google Cloud Function application
 */

export class GCFApp extends App {
  /** ctor */
  constructor(routes: Route[], info: InfoObject = null) {
    super(routes, MIDDLEWARES, info);
  }

  /** AWS Lambda handler method */
  handle(req: express.Request, res: express.Response): Promise<Response> {
    // synthesize Message from GCF Express-simulated req and res
    // NOTE: req is augmented IncomingMessage
    const parsed = url.parse(req.url);
    const message: Message = {
      context: {
        info: this.info,
        router: this.router
      },
      request: {
        // NOTE: body is pre-parsed by Google Cloud
        body: req.body,
        headers: caseInsensitiveObject(req.headers || {}),
        httpVersion: req.httpVersion,
        method: <Method>req.method,
        params: {},
        path: this.normalizePath(parsed.pathname),
        query: new URLSearchParams(parsed.search),
        remoteAddr: req.connection ? req.connection.remoteAddress : null,
        route: null,
        stream$: null,
        timestamp: Date.now()
      },
      response: {
        body: null,
        headers: caseInsensitiveObject({}),
        statusCode: null
      }
    };
    return of(message)
      .pipe(map((message: Message): Message => this.router.route(message)))
      .pipe(this.makePipeline(message))
      .pipe(
        map((message: Message): Response => message.response),
        tap((response: Response) => {
          if (res.send) {
            Object.entries(response.headers).forEach(([k, v]) =>
              res.set(k, <any>v)
            );
            res.status(response.statusCode).send(response.body).end();
          }
        })
      )
      .toPromise();
  }
}
