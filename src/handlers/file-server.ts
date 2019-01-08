import * as fs from 'fs';
import * as path from 'path';

import { Exception } from '../interfaces';
import { Handler } from '../handler';
import { Inject } from 'injection-js';
import { Injectable } from 'injection-js';
import { InjectionToken } from 'injection-js';
import { Message } from '../interfaces';
import { Observable } from 'rxjs';
import { Optional } from 'injection-js';

import { bindNodeCallback } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { defaultIfEmpty } from 'rxjs/operators';
import { fromReadableStream } from '../utils';
import { mapTo } from 'rxjs/operators';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * File server options
 */

export interface FileServerOpts {
  root?: string;
}

export const FILE_SERVER_OPTS = new InjectionToken<FileServerOpts>('FILE_SERVER_OPTS');

export const FILE_SERVER_DEFAULT_OPTS: FileServerOpts = {
  root: __dirname
};

/**
 * File server
 */

@Injectable() export class FileServer extends Handler {

  private opts: FileServerOpts;

  constructor( @Optional() @Inject(FILE_SERVER_OPTS) opts: FileServerOpts) {
    super();
    this.opts = opts ? { ...FILE_SERVER_DEFAULT_OPTS, ...opts } : FILE_SERVER_DEFAULT_OPTS;
  }

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      switchMap((message: Message): Observable<Message> => {
        const { context, request, response } = message;
        const fpath = path.join(this.opts.root, context.router.tailOf(request.path, request.route));
        return of(message).pipe(
          switchMap(() => bindNodeCallback(fs.stat)(fpath)),
          switchMap(() => fromReadableStream(fs.createReadStream(fpath))),
          tap(buffer => response.body = buffer),
          mapTo(message),
          catchError(() => throwError(new Exception({ statusCode: 404 }))),
          defaultIfEmpty(message)
        );
      })
    );
  }

}
