import { Catcher } from './catcher';
import { Class } from './serverx';
import { Exception } from './serverx';
import { Handler } from './handler';
import { Message } from './serverx';
import { Middleware } from './middleware';
import { MiddlewareMethod } from './middleware';
import { Observable } from 'rxjs';
import { Readable } from 'stream';
import { Route } from './serverx';
import { Router } from './router';

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

  // @see https://github.com/marblejs/marble/blob/master/packages/middleware-body/src/index.ts
  protected fromReadableStream(stream: Readable): Observable<any> {
    stream.pause();
    return new Observable(observer => {
      const next = chunk => observer.next(chunk);
      const error = err => observer.error(err);
      const complete = () => observer.complete();
      stream
        .on('data', next)
        .on('error', error)
        .on('end', complete)
        .resume();
      return () => {
        stream.removeListener('data', next);
        stream.removeListener('error', error);
        stream.removeListener('end', complete);
      };
    });
  }

  protected makePipeline(message: Message) {
    const { context, request } = message;
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
        if (error instanceof Exception)
          return of({ context, request, response: error.exception });
        else return of(error).pipe(
          // the catcher can create the response only
          mergeMap((error: Error): Observable<Message> => {
            return this.makeCatcher$(request.route, error);
          }),
          // ... so we merge back in the original context, request
          map((message: Message): Message => {
            return { context, request, response: message.response };
          })
        );
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

  private makeCatcher$(route: Route,
                       error: any): Observable<Message> {
    // we find the first available catcher up the route tree
    while (route && !route.catcher) 
      route = route.parent;
    const catcher = Catcher.makeInstance(route);
    return catcher? catcher.catch(of(error)) : of(/* should never happen! */);
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
