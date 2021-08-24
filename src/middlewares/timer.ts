import { Message } from '../interfaces';
import { Middleware } from '../middleware';

import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';

import { tap } from 'rxjs/operators';

/**
 * Response timer
 *
 * X-Request-Timein
 * X-Request-Timeout
 * X-Response-Time
 */

@Injectable()
export class Timer extends Middleware {
  posthandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response.headers['X-Request-Timeout'] = Date.now();
        const timein = Number(response.headers['X-Request-Timein']);
        const timeout = Number(response.headers['X-Request-Timeout']);
        response.headers['X-Response-Time'] = String(timeout - timein);
      })
    );
  }

  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response.headers['X-Request-Timein'] = Date.now();
      })
    );
  }
}
