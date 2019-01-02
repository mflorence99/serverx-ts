import { Exception } from '../interfaces';
import { Injectable } from 'injection-js';
import { Message } from '../interfaces';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';

import { catchError } from 'rxjs/operators';
import { defaultIfEmpty } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
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

@Injectable() export class BodyParser extends Middleware {

  prehandle(message$: Observable<Message>): Observable<Message> {
    const PARSEABLE_METHODS = ['POST', 'PUT', 'PATCH'];
    return message$.pipe(
      switchMap((message: Message): Observable<Message> => {
        return of(message).pipe(
          filter(({ request }) => !!request.stream$ && PARSEABLE_METHODS.includes(request.method)),
          // read the stream into a string, then into encoded form
          switchMap(({ request }): Observable<any> => {
            return request.stream$.pipe(
              toArray(),
              map((chunks: any[]): Buffer => Buffer.concat(chunks)),
              map((buffer: Buffer): string => buffer.toString()),
              map((data: string): any => {
                switch (request.headers['content-type']) {
                  case 'application/json':
                    return JSON.parse(data);
                  case 'x-www-form-urlencoded':
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
          tap((body: any) => message.request.body = body),
          mapTo(message),
          catchError(() => throwError(new Exception({ statusCode: 400 }))),
          defaultIfEmpty(message)
        );
      })
    );
  }

}
