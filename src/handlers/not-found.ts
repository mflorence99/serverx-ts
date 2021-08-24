import { ALL_METHODS } from '../interfaces';
import { Handler } from '../handler';
import { Message } from '../interfaces';

import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';

import { tap } from 'rxjs/operators';

/**
 * Catch all "not found" handler
 */

@Injectable()
export class NotFound extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ request, response }) => {
        if (request.method === 'OPTIONS') {
          response.headers['Allow'] = ALL_METHODS.join(',');
          response.statusCode = 200;
        } else response.statusCode = response.statusCode || 404;
      })
    );
  }
}
