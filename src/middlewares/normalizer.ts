import { Message } from '../interfaces';
import { Middleware } from '../middleware';

import * as mime from 'mime';
import * as yaml from 'js-yaml';

import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';
import { mapTo } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

import fileType from 'file-type';

/**
 * Response normalizer
 *
 * NOTE: internal use only
 */

@Injectable()
export class Normalizer extends Middleware {
  posthandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      mergeMap((message: Message): Observable<Message> => {
        return of(message).pipe(
          map(({ request, response }) => ({
            body: response.body,
            headers: response.headers,
            path: request.path,
            statusCode: response.statusCode
          })),
          map(({ body, headers, path, statusCode }) => ({
            body,
            headers,
            path,
            statusCode: statusCode || (body ? 200 : 204)
          })),
          tap(({ headers }) => {
            if (!headers['Cache-Control'])
              headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
          }),
          tap(({ body, headers, path }) => {
            if (!headers['Content-Type']) {
              const fromBuffer = body instanceof Buffer && fileType(body);
              const contentType = fromBuffer
                ? fromBuffer.mime
                : mime.getType(path);
              // NOTE: JSON is the default
              headers['Content-Type'] = contentType || 'application/json';
            }
          }),
          map(({ body, headers, statusCode }) => {
            if (body && !(body instanceof Buffer)) {
              switch (headers['Content-Type']) {
                case 'application/json':
                  body = JSON.stringify(body);
                  break;
                case 'text/yaml':
                  body = yaml.dump(body);
                  break;
              }
            }
            return { body, headers, statusCode };
          }),
          tap(({ body, headers, statusCode }) => {
            // NOTE: Safari (and potentially other browsers) need content-length 0,
            // for 204 or they just hang waiting for a body
            if (!body || statusCode === 204) headers['Content-Length'] = '0';
            else if (body) headers['Content-Length'] = Buffer.byteLength(body);
          }),
          tap(
            ({ body, headers, statusCode }) =>
              (message.response = { body, headers, statusCode })
          ),
          mapTo(message)
        );
      })
    );
  }
}
