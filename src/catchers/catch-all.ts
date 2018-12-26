import { Catcher } from '../catcher';
import { ContentType } from '../serverx';
import { Injectable } from 'injection-js';
import { LogProvider } from '../services/log-provider';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { Response } from '../serverx';
import { StatusCode } from '../serverx';

import { map } from 'rxjs/operators';

/**
 * Default "catch all" error catcher
 * 
 * TODO: how to integrate into a central logger?
 */

@Injectable() export class CatchAll extends Catcher {

  constructor(private log: LogProvider) { 
    super();
  }

  catch(error$: Observable<Error>): Observable<Message> {
    return error$.pipe(
      map((error: Error): Message => {
        // log the error
        this.log.logError(error);
        // turn it into a message
        const response: Response = {
          body: JSON.stringify({
            error: error.toString(),
            stack: error.stack
          }),
          headers: { 'Content-Type': ContentType.APPLICATION_JSON },
          statusCode: StatusCode.INTERNAL_SERVER_ERROR
        };
        return { response };
      })
    );
  }

}
