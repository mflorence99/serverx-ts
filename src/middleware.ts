import { Message } from './serverx';
import { Observable } from 'rxjs';
import { Route } from './router';

/**
 * Middleware definition
 */

export abstract class Middleware {

  /** Instantiate a set of Middlewares from a Route */
  static makeInstances(route: Route): Middleware[] {
    return (route.middlewares || [])
      .map(middleware => <Middleware>route.injector.get(middleware));
  }

  /** Handle a message */
  abstract handle(message$: Observable<Message>): Observable<Message>;

}
