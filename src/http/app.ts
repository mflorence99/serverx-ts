import * as url from 'url';

import { App } from '../app';
import { IncomingMessage } from 'http';
import { Message } from '../serverx';
import { Method } from '../serverx';
import { Observable } from 'rxjs';
import { OutgoingMessage } from 'http';
import { Response } from '../serverx';
import { Route } from '../serverx';
import { ServerResponse } from 'http';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs';
import { URLSearchParams } from 'url';

import { catchError } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

/**
 * Http application
 */

export class HttpApp extends App {

  private message$ = new Subject<Message>(); 
  private response$ = new Subject<Response>();
  private subToMessages: Subscription;

  private res: ServerResponse;

  /** ctor */
  constructor(routes: Route[]) {
    super(routes);
  }

  /** Create a listener */
  listen(): (req: IncomingMessage, res: OutgoingMessage) => void {
    this.startListening();
    return (req: IncomingMessage, 
            res: OutgoingMessage): void => {
      this.res = res as ServerResponse;
      // synthesize Message from Http req/res
      const parsed = <any>url.parse(req.url, true); 
      const message: Message = {
        context: {
          routes: this.router.routes,
        },
        request: {
          // TODO: how to get body?
          body: null,
          headers: req.headers || { },
          method: <Method>req.method,
          params: { },
          path: parsed.pathname,
          query: parsed.searchParams || new URLSearchParams(),
          route: null
        },
        response: {
          body: null,
          headers: { },
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
      // switch map so we can keep going on error
      // @see https://iamturns.com/continue-rxjs-streams-when-errors-occur/
      switchMap((message: Message): Observable<Message> => {
        return of(message).pipe(
          // route the message
          map((message: Message): Message => this.router.route(message)),
          // run pre-handle middleware
          mergeMap((message: Message): Observable<Message[]> => {
            const { request } = message;
            const middlewares$ = this.makeMiddlewares$(request.route, message, 'prehandle');
            return combineLatest(middlewares$);
          }),
          map((messages: Message[]): Message => this.mergeMessages(messages)),
          // run the handler
          mergeMap((message: Message): Observable<Message> => {
            const { request } = message;
            return this.makeHandler$(request.route, message);
          }),
          // run post-handle middleware
          // NOTE: in reverse order
          mergeMap((message: Message): Observable<Message[]> => {
            const { request } = message;
            const middlewares$ = this.makeMiddlewares$(request.route, message, 'posthandle');
            return combineLatest(middlewares$.reverse());
          }),
          map((messages: Message[]): Message => this.mergeMessages(messages)),
          // turn any error into a response
          catchError((error: any): Observable<Message> => this.makeMessageFromError(error)),
          // ready to send!
          tap((message: Message) => this.handleResponse(this.makeResponseFromMessage(message)))
        );
      })
    ).subscribe();
  }

  // private methods

  private handleResponse(response: Response): void {
    // TODO: this isn't right yet
    if (this.res.end) {
      this.res.writeHead(response.statusCode, response.headers);
      this.res.end(response.body);
    }
    else this.response$.next(response);
  }

}
