import { Catcher } from '../catcher';
import { Injectable } from 'injection-js';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { Response } from '../serverx';
import { StatusCode } from '../serverx';

import { map } from 'rxjs/operators';

import chalk from 'chalk';

/**
 * Default "catch all" error catcher
 * 
 * TODO: how to integrate into a central logger?
 */

@Injectable() export class CatchAll extends Catcher {

  catch(error$: Observable<Error>): Observable<Message> {
    return error$.pipe(
      map((error: Error): Message => {
        console.log(chalk.red(error.toString()));
        console.log(error.stack);
        const response: Response = {
          body: {
            error: error.toString(),
            stack: error.stack
          },
          statusCode: StatusCode.INTERNAL_SERVER_ERROR
        };
        return { response };
      })
    );
  }

}
