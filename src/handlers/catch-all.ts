import { Handler } from '../handler';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { StatusCode } from '../serverx';

import { map } from 'rxjs/operators';

/**
 * Catch all "not found" handler
 */

export class CatchAll implements Handler {

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map((message: Message): Message => {
        const { response } = message;
        return { ...message, response: { ...response, statusCode: response.statusCode || StatusCode.NOT_FOUND } };
      })
    );
  }

}
