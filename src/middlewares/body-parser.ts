import { Exception } from '../interfaces';
import { Message } from '../interfaces';
import { Method } from '../interfaces';
import { Middleware } from '../middleware';

import { Inject } from 'injection-js';
import { Injectable } from 'injection-js';
import { InjectionToken } from 'injection-js';
import { Observable } from 'rxjs';
import { Optional } from 'injection-js';

import { catchError } from 'rxjs/operators';
import { defaultIfEmpty } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { mapTo } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { toArray } from 'rxjs/operators';

/**
 * Body parser options
 */

export interface BodyParserOpts {
  methods?: Method[];
}

export const BODY_PARSER_OPTS = new InjectionToken<BodyParserOpts>(
  'BODY_PARSER_OPTS'
);

export const BODY_PARSER_DEFAULT_OPTS: BodyParserOpts = {
  methods: ['POST', 'PUT', 'PATCH']
};

/**
 * Body parser
 *
 * @see https://github.com/marblejs/marble/blob/master/packages/middleware-body/src/index.ts
 */

@Injectable()
export class BodyParser extends Middleware {
  private opts: BodyParserOpts;

  constructor(@Optional() @Inject(BODY_PARSER_OPTS) opts: BodyParserOpts) {
    super();
    this.opts = opts
      ? { ...BODY_PARSER_DEFAULT_OPTS, ...opts }
      : BODY_PARSER_DEFAULT_OPTS;
  }

  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      mergeMap((message: Message): Observable<Message> => {
        return of(message).pipe(
          filter(
            ({ request }) =>
              !!request.stream$ &&
              (!this.opts.methods || this.opts.methods.includes(request.method))
          ),
          // read the stream into a string, then into encoded form
          mergeMap(({ request }): Observable<any> => {
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
                      .map((kv) => kv.split('='))
                      .reduce((acc, [k, v]) => {
                        acc[k] = isNaN(+v) ? v : +v;
                        return acc;
                      }, {});
                  default:
                    return data;
                }
              })
            );
          }),
          // map the encoded body object back to the original message
          tap((body: any) => (message.request.body = body)),
          mapTo(message),
          catchError(() => throwError(new Exception({ statusCode: 400 }))),
          defaultIfEmpty(message)
        );
      })
    );
  }
}
