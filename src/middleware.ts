import { Message } from './serverx';
import { Observable } from 'rxjs';
import { Route } from './serverx';

/**
 * Middleware definition
 */

export class Middleware {

  /** Instantiate a set of Middlewares from a Route or Class[] */
  static makeInstances(route: Route): Middleware[] {
    return (route.middlewares || [])
      .map(middleware => <Middleware>route.injector.get(middleware));
  }

  /** Pre-handle a message */
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$;
  }

  /** Post-handle a message */
  posthandle(message$: Observable<Message>): Observable<Message> {
    return message$;
  }

}
