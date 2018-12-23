import { Handler } from '../handler';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { StatusCode } from '../serverx';

import { map } from 'rxjs/operators';

/**
 * Redirect handler
 */

export class RedirectTo implements Handler {

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map((message: Message): Message => {
        const { request, response } = message;
        const headers = { Location: request.route.redirectTo };
        const statusCode = request.route.redirectAs || StatusCode.REDIRECT;
        return { ...message, response: { ...response, headers, statusCode } };
      })
    );
  }

}
