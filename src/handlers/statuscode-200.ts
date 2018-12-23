import { Handler } from '../handler';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { StatusCode } from '../serverx';

import { map } from 'rxjs/operators';

/**
 * StatusCode 200 handler
 */

export class StatusCode200 implements Handler {

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map((message: Message): Message => {
        const { response } = message;
        return { ...message, response: { ...response, statusCode: StatusCode.OK } };
      })
    );
  }

}
