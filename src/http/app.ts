import { App } from '../app';
import { BodyParser } from '../middlewares/body-parser';
import { Message } from '../interfaces';
import { Method } from '../interfaces';
import { Normalizer } from '../middlewares/normalizer';
import { Response } from '../interfaces';
import { Route } from '../interfaces';

import { caseInsensitiveObject } from '../utils';
import { fromReadableStream } from '../utils';

import * as url from 'url';

import { IncomingMessage } from 'http';
import { InfoObject } from 'openapi3-ts';
import { Observable } from 'rxjs';
import { OutgoingMessage } from 'http';
import { ServerResponse } from 'http';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs';
import { URLSearchParams } from 'url';

import { map } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

// NOTE: this middleware is required
const MIDDLEWARES = [BodyParser, Normalizer];

/**
 * Http application
 */

export class HttpApp extends App {
  private message$ = new Subject<Message>();
  private response$ = new Subject<Response>();
  private subToMessages: Subscription;

  /** ctor */
  constructor(routes: Route[], info: InfoObject = null) {
    super(routes, MIDDLEWARES, info);
  }

  /** Create a listener */
  listen(): (req: IncomingMessage, res: OutgoingMessage) => void {
    this.startListening();
    return (req: IncomingMessage, res: OutgoingMessage): void => {
      // synthesize Message from Http req/res
      const parsed = url.parse(req.url);
      const message: Message = {
        context: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          _internal: { res },
          info: this.info,
          router: this.router
        },
        request: {
          body: {},
          headers: caseInsensitiveObject(req.headers || {}),
          httpVersion: req.httpVersion,
          method: <Method>req.method,
          params: {},
          path: this.normalizePath(parsed.pathname),
          query: new URLSearchParams(parsed.search),
          remoteAddr: req.connection ? req.connection.remoteAddress : null,
          route: null,
          stream$: req.on ? fromReadableStream(req) : null,
          timestamp: Date.now()
        },
        response: {
          body: null,
          headers: caseInsensitiveObject({}),
          statusCode: null
        }
      };
      this.message$.next(message);
    };
  }

  /** Create a listener */
  unlisten(): void {
    if (this.subToMessages) this.subToMessages.unsubscribe();
  }

  // private methods

  private handleResponse(res: ServerResponse, response: Response): void {
    if (res.end) {
      res.writeHead(response.statusCode, response.headers);
      res.end(response.body);
    }
    // NOTE: back-door for tests
    else this.response$.next(response);
  }

  private startListening(): void {
    this.subToMessages = this.message$
      .pipe(
        // route the message
        map((message: Message): Message => this.router.route(message)),
        mergeMap((message: Message): Observable<Message> => {
          return of(message)
            .pipe(this.makePipeline(message))
            .pipe(
              tap(({ context, response }) =>
                this.handleResponse(context._internal.res, response)
              )
            );
        })
      )
      .subscribe();
  }
}
