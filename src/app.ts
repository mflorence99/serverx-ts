import { Class } from './serverx';
import { ContentType } from './serverx';
import { Exception } from './serverx';
import { Handler } from './handler';
import { Message } from './serverx';
import { Middleware } from './middleware';
import { MiddlewareMethod } from './middleware';
import { Observable } from 'rxjs';
import { Response } from './serverx';
import { Route } from './serverx';
import { Router } from './router';
import { StatusCode } from './serverx';

import { catchError } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { pipe } from 'rxjs';

/**
 * Base app class
 */

export abstract class App {

  protected router: Router;

  /** ctor */
  constructor(routes: Route[],
              required: Class[] = []) {
    this.router = new Router(routes, required);
  }

  // protected methods

  protected makePipeline(message: Message) {
    const { request } = message;
    return pipe(
      // run pre-handle middleware
      mergeMap((message: Message): Observable<Message[]> => {
        const middlewares$ = this.makeMiddlewares$(request.route, message, 'prehandle');
        return combineLatest(middlewares$);
      }),
      // NOTE: because of muatability, they're all the same message
      map((messages: Message[]): Message => messages[0]),
      // run the handler
      mergeMap((message: Message): Observable<Message> => {
        return this.makeHandler$(request.route, message);
      }),
      // run post-handle middleware
      // NOTE: in reverse order
      mergeMap((message: Message): Observable<Message[]> => {
        const middlewares$ = this.makeMiddlewares$(request.route, message, 'posthandle');
        return combineLatest(middlewares$.reverse());
      }),
      // NOTE: because of muatability, they're all the same message
      map((messages: Message[]): Message => messages[0]),
      // turn any error into a message
      catchError((error: any): Observable<Message> => {
        return this.catchError$(error, message);
      }),
      // run post-catch middleware
      // NOTE: in reverse order
      mergeMap((message: Message): Observable<Message[]> => {
        const middlewares$ = this.makeMiddlewares$(request.route, message, 'postcatch');
        return combineLatest(middlewares$.reverse());
      }),
      // NOTE: because of muatability, they're all the same message
      map((messages: Message[]): Message => messages[0]),
    );
  }

  // private methods

  private catchError$(error: any,
                      message: Message): Observable<Message> {
    const { context, request } = message;
    if (error instanceof Exception)
      return of({ context, request, response: error.exception });
    else {
      const response: Response = {
        // NOTE: we have to stringify manually because we are now past the Normalizer
        body: JSON.stringify({
          error: error.toString(),
          stack: error.stack
        }),
        headers: { 'Content-Type': ContentType.APPLICATION_JSON },
        statusCode: StatusCode.INTERNAL_SERVER_ERROR
      };
      return of({ context, request, response });
    }
  }

  private makeHandler$(route: Route,
                       message: Message): Observable<Message> {
    const handler = Handler.makeInstance(route);
    return handler? handler.handle(of(message)) : of(message);
  }

  private makeMiddlewares$(route: Route,
                           message: Message,
                           method: MiddlewareMethod): Observable<Message>[] {
    const middlewares = [];
    // we find all the middlewares up the route tree
    while (route) {
      middlewares.push(...Middleware.makeInstances(route));
      route = route.parent;
    }
    return (middlewares.length === 0) ? [of(message)] :
      middlewares.map(middleware => middleware[method](of(message)));
  }

}
