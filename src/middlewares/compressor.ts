import { ALL_METHODS } from '../interfaces';
import { Exception } from '../interfaces';
import { Message } from '../interfaces';
import { Method } from '../interfaces';
import { Middleware } from '../middleware';

import { vary } from '../ported/vary';

import * as zlib from 'zlib';

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

/**
 * Compressor options
 *
 * @see https://nodejs.org/api/zlib.html#zlib_class_options
 * @see http://zlib.net/manual.html#Constants
 */

/* eslint-disable @typescript-eslint/naming-convention */

export enum CompressorLevel {
  NO_COMPRESSION = 0,
  BEST_SPEED = 1,
  BEST_COMPRESSION = 2,
  DEFAULT_COMPRESSION = -1
}

export enum CompressorStrategy {
  FILTERED = 1,
  HUFFMAN_ONLY = 2,
  RLE = 3,
  FIXED = 4,
  DEFAULT_STRATEGY = 0
}

/* eslint-enable @typescript-eslint/naming-convention */

export interface CompressorOpts {
  level?: CompressorLevel;
  methods?: Method[];
  strategy?: CompressorStrategy;
  threshold?: number;
}

export const COMPRESSOR_OPTS = new InjectionToken<CompressorOpts>(
  'COMPRESSOR_OPTS'
);

export const COMPRESSOR_DEFAULT_OPTS: CompressorOpts = {
  level: CompressorLevel.DEFAULT_COMPRESSION,
  methods: ALL_METHODS,
  strategy: CompressorStrategy.DEFAULT_STRATEGY,
  threshold: 1024
};

/**
 * Request logger
 */

@Injectable()
export class Compressor extends Middleware {
  private opts: CompressorOpts;

  constructor(@Optional() @Inject(COMPRESSOR_OPTS) opts: CompressorOpts) {
    super();
    this.opts = opts
      ? { ...COMPRESSOR_DEFAULT_OPTS, ...opts }
      : COMPRESSOR_DEFAULT_OPTS;
  }

  posthandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      mergeMap((message: Message): Observable<Message> => {
        const { request, response } = message;
        return of(message).pipe(
          tap(({ response }) => vary(response, 'Accept-Encoding')),
          map((_message: Message) => {
            const accepts = (
              String(request.headers['Accept-Encoding']) || ''
            ).split(/, /);
            const willDeflate = accepts.includes('deflate');
            const willGZIP = accepts.includes('gzip');
            return { willDeflate, willGZIP };
          }),
          filter(({ willDeflate, willGZIP }) => {
            const alreadyEncoded = !!request.headers['Content-Encoding'];
            const size = Number(response.headers['Content-Length'] || '0');
            return (
              (!this.opts.methods ||
                this.opts.methods.includes(request.method)) &&
              response.body &&
              !alreadyEncoded &&
              (willDeflate || willGZIP) &&
              size >= this.opts.threshold
            );
          }),
          tap(({ willGZIP }) => {
            // NOTE: prefer gzip to deflate
            const type = willGZIP ? 'gzip' : 'deflate';
            response.body = zlib[`${type}Sync`](response.body, this.opts);
            response.headers['Content-Encoding'] = type;
            response.headers['Content-Length'] = Buffer.byteLength(
              response.body
            );
          }),
          mapTo(message),
          catchError(() => throwError(new Exception({ statusCode: 400 }))),
          defaultIfEmpty(message)
        );
      })
    );
  }
}
