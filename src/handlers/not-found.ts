import { Handler } from '../handler';
import { Injectable } from 'injection-js';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { StatusCode } from '../serverx';

import { tap } from 'rxjs/operators';

/**
 * Catch all "not found" handler
 */

@Injectable() export class NotFound extends Handler {

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { request, response } = message;
        if (request.method === 'OPTIONS') {
          response.headers['Allow'] = 'CONNECT,DELETE,GET,HEAD,PATCH,POST,PUT,TRACE';
          response.statusCode = StatusCode.OK;
        }
        else response.statusCode = response.statusCode || StatusCode.NOT_FOUND;
      })
    );
  }

}
