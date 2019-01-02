import { Handler } from '../handler';
import { Injectable } from 'injection-js';
import { Message } from '../interfaces';
import { Observable } from 'rxjs';

import { tap } from 'rxjs/operators';

/**
 * Redirect handler
 */

@Injectable() export class RedirectTo extends Handler {

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ request, response }) => {
        response.headers = { Location: request.route.redirectTo };
        response.statusCode = request.route.redirectAs || 301;
      })
    );
  }

}
