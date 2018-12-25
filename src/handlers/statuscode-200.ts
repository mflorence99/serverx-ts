import { Handler } from '../handler';
import { Injectable } from 'injection-js';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { StatusCode } from '../serverx';

import { tap } from 'rxjs/operators';

/**
 * StatusCode 200 handler
 */

@Injectable() export class StatusCode200 extends Handler {

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response.statusCode = StatusCode.OK;
      })
    );
  }

}