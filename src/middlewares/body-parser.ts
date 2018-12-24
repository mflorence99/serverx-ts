import { ContentType } from '../serverx';
import { Error } from '../serverx';
import { Message } from '../serverx';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';
import { StatusCode } from '../serverx';

import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { mapTo } from 'rxjs/operators';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { toArray } from 'rxjs/operators';

/**
 * Body parser
 * 
 * @see https://github.com/marblejs/marble/blob/master/packages/middleware-body/src/index.ts
 */

export class BodyParser extends Middleware {

  prehandle(message$: Observable<Message>): Observable<Message> {
    const PARSEABLE_METHODS = ['POST', 'PUT', 'PATCH'];
    return message$.pipe(
      switchMap((message: Message): Observable<Message> => {
        const { request } = message;
        // quick exit if nothing to stream
        if (!(request.stream$ && PARSEABLE_METHODS.includes(request.method)))
          return of(message);
        else return of(message).pipe(
          // read the stream into a string, then into encoded form
          switchMap((message: Message): Observable<any> => {
            return request.stream$.pipe(
              toArray(),
              map((chunks: any[]): Buffer => Buffer.concat(chunks)),
              map((buffer: Buffer): string => buffer.toString()),
              map((data: string): any => {
                switch (request.headers['content-type']) {
                  case ContentType.APPLICATION_JSON:
                    return JSON.parse(data);
                  case ContentType.APPLICATION_X_WWW_FORM_URLENCODED:
                    return decodeURIComponent(data)
                      .split('&')
                      .map(kv => kv.split('='))
                      .reduce((acc, [k, v]) => {
                        acc[k] = isNaN(+v) ? v : +v;
                        return acc;
                      }, { });
                  default:
                    return data;
                }              
              })
            );
          }),
          // map the encoded body object back to the original message
          tap((body: any) => request.body = body),
          mapTo(message),
          catchError(() => throwError(new Error({ statusCode: StatusCode.BAD_REQUEST })))
        );
      })
    );
  }

}
