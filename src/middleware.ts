import { Message } from './serverx';
import { Observable } from 'rxjs';
import { Route } from './serverx';

/**
 * Middleware definition
 */

export type MiddlewareMethod = 'prehandle' | 'posthandle' | 'postcatch';

export class Middleware {

  /** Instantiate a set of Middlewares from a Route or Class[] */
  static makeInstances(route: Route): Middleware[] {
    return (route.middlewares || [])
      .map(middleware => <Middleware>route.injector.get(middleware));
  }

  /** Process a message BEFORE handler */
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$;
  }

  /** Process a message AFTER handler */
  posthandle(message$: Observable<Message>): Observable<Message> {
    return message$;
  }

  /** Process a message AFTER catcher */
  postcatch(message$: Observable<Message>): Observable<Message> {
    return message$;
  }

}
