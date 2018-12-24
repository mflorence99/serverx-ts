import { Message } from '../serverx';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';

import { tap } from 'rxjs/operators';

/**
 * Response timer
 * 
 * X-Request-Timein
 * X-Request-Timeout
 * X-Response-Time
 */

export class Timer extends Middleware {

  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response.headers['X-Request-Timein'] = Date.now();
      })
    );
  }

  posthandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response.headers['X-Request-Timeout'] = Date.now();
        const timein = Number(response.headers['X-Request-Timein']);
        const timeout = Number(response.headers['X-Request-Timeout']);
        response.headers['X-Response-Time'] = String(timeout-timein);
      })
    );
  }

}
