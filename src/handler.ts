import { Observable } from 'rxjs';
import { Request } from './http';
import { Response } from './http';

/**
 * Handler definition
 */

export abstract class Handler {

  /** Handle a request */
  abstract handle(request$: Observable<Request>): Observable<Response>;

}
