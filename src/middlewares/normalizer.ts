import * as fileType from 'file-type';
import * as mime from 'mime';
import * as yaml from 'js-yaml';

import { ContentType } from '../interfaces';
import { Injectable } from 'injection-js';
import { Message } from '../interfaces';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';
import { StatusCode } from '../interfaces';

import { map } from 'rxjs/operators';
import { mapTo } from 'rxjs/operators';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

/**
 * Response normalizer
 * 
 * NOTE: internal use only
 */

@Injectable() export class Normalizer extends Middleware {

  posthandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      switchMap((message: Message): Observable<Message> => {
        return of(message).pipe(
          map(({ request, response } ) => ({ body: response.body, headers: response.headers, path: request.path, statusCode: response.statusCode })),
          map(({ body, headers, path, statusCode }) => ({ body, headers, path, statusCode: statusCode || StatusCode.OK })),
          tap(({ body, headers, path }) => {
            if (!headers['Content-Type']) {
              const fromBuffer = (body instanceof Buffer) && fileType(body);
              const mimeType = fromBuffer? fromBuffer.mime : mime.getType(path);
              // NOTE: JSON is the default
              headers['Content-Type'] = mimeType || ContentType.APPLICATION_JSON;
            }
          }),
          map(({ body, headers, statusCode }) => {
            if (body && !(body instanceof Buffer)) {
              switch (headers['Content-Type']) {
                case ContentType.APPLICATION_JSON:
                  body = JSON.stringify(body);
                  break;
                case ContentType.TEXT_YAML:
                  body = yaml.safeDump(body);
                  break;
              }
            }
            return { body, headers, statusCode }; 
          }),
          tap(({ body, headers }) => {
            if (body)
              headers['Content-Length'] = Buffer.byteLength(body);
          }),
          tap(({ body, headers, statusCode }) => message.response = { body, headers, statusCode }),
          mapTo(message)
        );
      }),
    );
  }

}
