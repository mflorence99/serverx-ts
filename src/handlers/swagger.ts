import { Handler } from '../handler';
import { Injectable } from 'injection-js';
import { Message } from '../serverx';
import { Observable } from 'rxjs';

import { tap } from 'rxjs/operators';

/**
 * Swagger YML generator
 */

@Injectable() export class Swagger extends Handler {

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { context, response } = message;
        const flattened = context.router.flatten();
        // TODO: temporary
        response.body = flattened;
      })
    );
  }

}
