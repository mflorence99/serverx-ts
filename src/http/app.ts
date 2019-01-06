import * as url from 'url';

import { App } from '../app';
import { BodyParser } from '../middlewares/body-parser';
import { IncomingMessage } from 'http';
import { InfoObject } from 'openapi3-ts';
import { Message } from '../interfaces';
import { Method } from '../interfaces';
import { Normalizer } from '../middlewares/normalizer';
import { Observable } from 'rxjs';
import { OutgoingMessage } from 'http';
import { Response } from '../interfaces';
import { Route } from '../interfaces';
import { ServerResponse } from 'http';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs';
import { URLSearchParams } from 'url';

import { caseInsensitiveObject } from '../utils';
import { fromReadableStream } from '../utils';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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

  private req: IncomingMessage;
  private res: ServerResponse;

  /** ctor */
  constructor(routes: Route[],
              info: InfoObject = null) {
    super(routes, MIDDLEWARES, info);
  }

  /** Create a listener */
  listen(): (req: IncomingMessage, res: OutgoingMessage) => void {
    this.startListening();
    return (req: IncomingMessage, 
            res: OutgoingMessage): void => {
      this.req = req;
      this.res = res as ServerResponse;
      // synthesize Message from Http req/res
      const parsed = url.parse(this.req.url); 
      const message: Message = {
        context: {
          info: this.info,
          router: this.router,
        },
        request: {
          body: { },
          headers: caseInsensitiveObject(this.req.headers || { }),
          httpVersion: this.req.httpVersion,
          method: <Method>this.req.method,
          params: { },
          path: parsed.pathname,
          query: new URLSearchParams(parsed.search),
          remoteAddr: this.req.connection? this.req.connection.remoteAddress : null,
          route: null,
          stream$: this.req.on? fromReadableStream(this.req) : null,
          timestamp: Date.now()
        },
        response: {
          body: null,
          headers: caseInsensitiveObject({ }),
          statusCode: null
        }
      };
      this.message$.next(message);
    };
  }

  /** Create a listener */
  unlisten(): void {
    if (this.subToMessages)
      this.subToMessages.unsubscribe();
  }

  // private methods

  private startListening(): void {
    this.subToMessages = this.message$.pipe(
      // route the message
      map((message: Message): Message => this.router.route(message)),
      // switch map so we can keep going on error
      // @see https://iamturns.com/continue-rxjs-streams-when-errors-occur/
      switchMap((message: Message): Observable<Message> => {
        return of(message)
          .pipe(this.makePipeline(message))
          .pipe(tap((message: Message) => this.handleResponse(message.response)));
      })
    ).subscribe();
  }

  // private methods

  private handleResponse(response: Response): void {
    if (this.res.end) {
      this.res.writeHead(response.statusCode, response.headers);
      this.res.end(response.body);
    }
    // NOTE: back-door for tests
    else this.response$.next(response);
  }

}
