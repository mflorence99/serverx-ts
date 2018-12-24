import { Class } from './serverx';
import { Error } from './serverx';
import { Handler } from './handler';
import { Message } from './serverx';
import { Middleware } from './middleware';
import { Normalizer } from './middlewares/normalizer';
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
  constructor(routes: Route[]) {
    this.router = new Router(routes);
  }

  // protected methods

  protected makePipeline(message: Message) {
    const { request } = message;
    // these are built-in middlewares
    const PREHANDLERS = [];
    const POSTHANDLERS = [Normalizer];
    return pipe(
      // run pre-handle middleware
      mergeMap((message: Message): Observable<Message[]> => {
        const middlewares$ = this.makeMiddlewares$(request.route, message, 'prehandle', PREHANDLERS);
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
        const middlewares$ = this.makeMiddlewares$(request.route, message, 'posthandle', POSTHANDLERS);
        return combineLatest(middlewares$.reverse());
      }),
      // NOTE: because of muatability, they're all the same message
      map((messages: Message[]): Message => messages[0]),
      // turn any error into a message
      catchError((error: any): Observable<Message> => this.makeMessageFromError(error)),
    );
  }

  // private methods

  private makeMessageFromError(error: any): Observable<Message> {
    let response: Response;
    if (error instanceof Error)
      response = error.error;
    // TODO: stack trace?
    else response = {
      body: error.toString(),
      statusCode: StatusCode.INTERNAL_SERVER_ERROR
    };
    return of({ response });
  }

  private makeHandler$(route: Route,
                       message: Message): Observable<Message> {
    const handler = Handler.makeInstance(route);
    return handler ? handler.handle(of(message)) : of(message);
  }

  private makeMiddlewares$(route: Route,
                           message: Message,
                           method: 'prehandle' | 'posthandle',
                           extras: Class[] = []): Observable<Message>[] {
    const middlewares = [];
    while (route) {
      middlewares.push(...Middleware.makeInstances(route));
      route = route.parent;
    }
    // NOTE: extras have no provider, but we can instantiate ourselves
    extras.forEach(extra => middlewares.push(new extra()));
    return (middlewares.length === 0) ? [of(message)] :
      middlewares.map(middleware => middleware[method](of(message)));
  }

}
