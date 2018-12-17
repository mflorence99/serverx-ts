import { Observable } from 'rxjs';
import { Request } from './http';

/**
 * Handler definition
 */

export abstract class Handler {

  /** Handle a request */
  abstract handle(request$: Observable<Request>): void;

}
