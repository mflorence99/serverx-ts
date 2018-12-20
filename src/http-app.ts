import * as url from 'url';

import { App } from './app';
import { IncomingMessage } from 'http';
import { Message } from './serverx';
import { Method } from './serverx';
import { OutgoingMessage } from 'http';
import { Response } from './serverx';
import { Route } from './router';
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

  response$ = new Subject<Response>();

  private message$ = new Subject<Message>(); 
  private subToMessages: Subscription;

  /** ctor */
  constructor(routes: Route[]) {
    super(routes);
  }

  /** Create a listener */
  listen(): (req: IncomingMessage, res: OutgoingMessage) => void {
    this.startListening();
    return (req: IncomingMessage, 
            res: OutgoingMessage): void => {
      const parsed = <any>url.parse(req.url, true); 
      // synthesize Message from Http req/res
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
          statusCode: 200
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
      switchMap((message: Message) => {
        return of(message).pipe(
          // route the request
          map((message: Message) => {
            return { ...message, request: this.router.route(message.request) };
          }),
          // let's see if we found a route
          tap((message: Message) => this.validateRoute(message)),
          // run any middleware
          mergeMap((message: Message) => {
            const middlewares$ = this.router.makeMiddlewares$(message.request.route, message);
            return combineLatest(middlewares$);
          }),
          map((messages: Message[]) => messages[messages.length - 1]),
          // run the handler
          mergeMap((message: Message) => {
            return this.router.makeHandler$(message.request.route, message);
          }),
          // turn any error into a response
          catchError((error: any) => this.makeMessageFromError(error)),
          // ready to send!
          tap((message: Message) => this.response$.next(message.response))
        );
      })
    ).subscribe();
  }

}
