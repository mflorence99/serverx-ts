import { Injectable } from 'injection-js';
import { LogProvider } from '../services/log-provider';
import { Message } from '../serverx';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';

import { tap } from 'rxjs/operators';

/**
 * Request logger
 */

@Injectable() export class Logger extends Middleware {

  constructor(private log: LogProvider) {
    super();
  }

  postcatch(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        this.log.logMessage(message);
      })
    );
  }

}

