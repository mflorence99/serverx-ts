import { Message } from './serverx';
import { Observable } from 'rxjs';
import { Route } from './serverx';

/**
 * Handler definition
 */

export class Handler {

  /** Instantiate a Handler from a Route */
  static makeInstance<T = Handler>(route: Route): T {
    return route.handler? route.injector.get(route.handler) : null;
  }

  /** Handle a message */
  handle(message$: Observable<Message>): Observable<Message> {
    return message$;
  }

}
