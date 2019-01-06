import { Exception } from '../interfaces';
import { Inject } from 'injection-js';
import { Injectable } from 'injection-js';
import { InjectionToken } from 'injection-js';
import { Message } from '../interfaces';
import { Method } from '../interfaces';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';
import { Optional } from 'injection-js';

import { cors } from '../ported/cors';
import { iif } from 'rxjs';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * CORS options
 */

export interface CORSOpts {
  allowedHeaders?: string[];
  credentials?: boolean;
  exposedHeaders?: string[];
  headers?: string[];
  maxAge?: number;
  methods?: Method[];
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
  origin?: string;
}

export const CORS_OPTS = new InjectionToken<CORSOpts>('CORS_OPTS');

export const CORS_DEFAULT_OPTS: CORSOpts = {
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  preflightContinue: true,
  optionsSuccessStatus: 204,
  origin: ''
};

/**
 * CORS
 * 
 * @see https://expressjs.com/en/resources/middleware/cors.html
 */

@Injectable() export class CORS extends Middleware {

  private opts: CORSOpts;

  constructor(@Optional() @Inject(CORS_OPTS) opts: CORSOpts) {
    super();
    this.opts = opts? { ...CORS_DEFAULT_OPTS, ...opts } : CORS_DEFAULT_OPTS;
  }

  prehandle(message$: Observable<Message>): Observable<Message> {
    const next = () => { };
    return message$.pipe(
      tap(({ request, response }) => cors(this.opts, request, response, next)),
      switchMap((message: Message): Observable<Message> => {
        const { request, response } = message;
        return iif(() => (!this.opts.preflightContinue && (request.method === 'OPTIONS')), 
          throwError(new Exception(response)),
          of(message)); 
      })
    );
  }

}
