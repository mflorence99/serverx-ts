import * as url from 'url';

import { Error } from './serverx';
import { IncomingMessage } from 'http';
import { Message } from './serverx';
import { Method } from './serverx';
import { OutgoingMessage } from 'http';
import { Route } from './router';
import { Router } from './router';
import { Status } from './serverx';
import { Subject } from 'rxjs';

import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

/**
 * Http application
 */

export class HttpApp {

  private message$: Subject<Message>;
  private router: Router;

  /** ctor */
  constructor(routes: Route[]) {
    this.message$ = new Subject<Message>(); 
    this.router = new Router(routes);
  }

  /** Create a listener */
  listener(): (req: IncomingMessage, res: OutgoingMessage) => void {
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
          body: null,
          headers: req.headers,
          method: <Method>req.method,
          params: { },
          path: parsed.pathname,
          query: parsed.searchParams,
          route: null
        },
        response: {
          body: null,
          headers: { },
          status: 200
        }
      };
      this.message$.next(message);
    };
  }

  // private methods

  private startListening(): void {
    this.message$.pipe(
      // switch map so we can keep going on error
      // @see https://iamturns.com/continue-rxjs-streams-when-errors-occur/
      switchMap((message: Message) => {
        return of(message).pipe(
          // route the request
          map((message: Message) => {
            return { ...message, request: this.router.route(message.request) };
          }),
          // let's see if we found a route
          tap((message: Message) => {
            if (!message.request.route)
              throw new Error({ status: Status.NOT_FOUND });
              // NOTE: route but no handler just sends OK
            if (!message.request.route.handler)
              throw new Error({ status: Status.OK });
          }),
          // run any middleware
          // TODO: not tight yet!
          mergeMap((message: Message) => {
            return this.router.makeMiddlewares$(message.request.route, message)[0];
          }),
          // run the handler
          mergeMap((message: Message) => {
            return this.router.makeHandler$(message.request.route, message);
          }),
          // turn any error into a response
          catchError((error: Error) => of({ response: { ...error.error } })),
          // readsy to send!
          tap((message: Message) => {
            console.log('FINAL', message);
          })
        );
      })
    ).subscribe();
  }

}
