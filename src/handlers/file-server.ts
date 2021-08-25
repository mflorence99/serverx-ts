import { Exception } from '../interfaces';
import { Handler } from '../handler';
import { Message } from '../interfaces';

import { fromReadableStream } from '../utils';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Inject } from 'injection-js';
import { Injectable } from 'injection-js';
import { InjectionToken } from 'injection-js';
import { Observable } from 'rxjs';
import { Optional } from 'injection-js';

import { bindNodeCallback } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { mapTo } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * File server options
 */

export interface FileServerOpts {
  maxAge?: number;
  root?: string;
}

export const FILE_SERVER_OPTS = new InjectionToken<FileServerOpts>(
  'FILE_SERVER_OPTS'
);

export const FILE_SERVER_DEFAULT_OPTS: FileServerOpts = {
  maxAge: 600,
  root: os.homedir()
};

/**
 * File server
 */

@Injectable()
export class FileServer extends Handler {
  private opts: FileServerOpts;

  constructor(@Optional() @Inject(FILE_SERVER_OPTS) opts: FileServerOpts) {
    super();
    this.opts = opts
      ? { ...FILE_SERVER_DEFAULT_OPTS, ...opts }
      : FILE_SERVER_DEFAULT_OPTS;
  }

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      mergeMap((message: Message): Observable<Message> => {
        const { request, response } = message;
        const fpath = this.makeFPath(message);
        // Etag is the mod time
        const etag = Number(request.headers['If-None-Match']);
        return of(message).pipe(
          // NOTE: exception thrown if not found
          mergeMap(
            (_message: Message): Observable<fs.Stats> =>
              bindNodeCallback(fs.stat, null)(fpath)
          ),
          // set the response headers
          tap((stat: fs.Stats) => {
            response.headers['Cache-Control'] = `max-age=${this.opts.maxAge}`;
            response.headers['Etag'] = stat.mtime.getTime();
          }),
          // flip to cached/not cached pipes
          mergeMap((stat: fs.Stats): Observable<Message> => {
            const cached = etag === stat.mtime.getTime();
            // cached pipe
            const cached$ = of(stat).pipe(
              tap((_stat: fs.Stats) => (response.statusCode = 304)),
              mapTo(message)
            );
            // not cached pipe
            const notCached$ = of(stat).pipe(
              mergeMap(
                (_stat: fs.Stats): Observable<Buffer> =>
                  fromReadableStream(fs.createReadStream(fpath))
              ),
              tap((buffer: Buffer) => {
                response.body = buffer;
                response.statusCode = 200;
              }),
              mapTo(message)
            );
            return cached ? cached$ : notCached$;
          }),
          catchError(() => throwError(new Exception({ statusCode: 404 })))
        );
      })
    );
  }

  // private methods

  private makeFPath(message: Message): string {
    const { context, request, response } = message;
    const router = context.router;
    // NOTE: we never allow dot files and router.validate takes care of that
    let tail = router.tailOf(router.validate(request.path), request.route);
    // TODO: hack if this is a client-side route and not a path, deploy default
    if (!tail.includes('.')) {
      tail = 'index.html';
      response.headers['Content-Type'] = 'text/html';
    }
    return path.join(this.opts.root, tail);
  }
}
