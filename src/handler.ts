import { Observable } from 'rxjs';
import { Request } from './serverx';
import { Response } from './serverx';

/**
 * Handler definition
 */

export abstract class Handler {

  /** Handle a request */
  abstract handle(request$: Observable<Request>): Observable<Response>;

}
