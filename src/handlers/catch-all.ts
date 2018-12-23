import { Handler } from '../handler';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { StatusCode } from '../serverx';

import { tap } from 'rxjs/operators';

/**
 * Catch all "not found" handler
 */

export class CatchAll extends Handler {

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response.statusCode = response.statusCode || StatusCode.NOT_FOUND;
      })
    );
  }

}
