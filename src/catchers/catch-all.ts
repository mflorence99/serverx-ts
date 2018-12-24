import { Catcher } from '../catcher';
import { Error } from '../serverx';
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

  catch(error$: Observable<any>): Observable<Message> {
    return error$.pipe(
      map((error: any) => {
        let response: Response;
        if (error instanceof Error)
          response = error.error;
        else {
          console.log(chalk.red(error.toString()));
          console.log(error.stack);
          response = {
            body: {
              error: error.toString(),
              stack: error.stack
            },
            statusCode: StatusCode.INTERNAL_SERVER_ERROR
          };
        }
        return { response };
      })
    );
  }

}
