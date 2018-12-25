import { Message } from './serverx';
import { Observable } from 'rxjs';
import { Route } from './serverx';
import { StatusCode } from './serverx';

import { of } from 'rxjs';

/**
 * Catcher definition
 */

export class Catcher {

  /** Instantiate a Handler from a Route */
  static makeInstance<T = Catcher>(route: Route): T {
    return route.catcher? route.injector.get(route.catcher) : null;
  }

  /** Catch an error */
  catch(error$: Observable<Error>): Observable<Message> {
    return of({ response: { statusCode: StatusCode.INTERNAL_SERVER_ERROR } });
  }

}
