import { Handler } from '../handler';
import { Message } from '../interfaces';

import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';

import { tap } from 'rxjs/operators';

/**
 * StatusCode 200 handler
 */

@Injectable()
export class StatusCode200 extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response.statusCode = 200;
      })
    );
  }
}
