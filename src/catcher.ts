import { Message } from './serverx';
import { Observable } from 'rxjs';
import { Route } from './serverx';

/**
 * Catcher definition
 */

export class Catcher {

  /** Instantiate a Handler from a Route */
  static makeInstance<T = Catcher>(route: Route): T {
    return route.catcher? route.injector.get(route.catcher) : null;
  }

  /** Catch an error */
  catch(error$: Observable<any>): Observable<Message> {
    return error$;
  }

}
