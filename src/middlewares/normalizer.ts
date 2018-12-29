import * as fileType from 'file-type';
import * as mime from 'mime';
import * as yaml from 'js-yaml';

import { ContentType } from '../interfaces';
import { Injectable } from 'injection-js';
import { Message } from '../interfaces';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';
import { StatusCode } from '../interfaces';

import { tap } from 'rxjs/operators';

/**
 * Response normalizer
 * 
 * NOTE: internal use only
 */

@Injectable() export class Normalizer extends Middleware {

  posthandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { request, response } = message;
        // status code is OK unless otherwise set
        const statusCode = response.statusCode || StatusCode.OK;
        // if not already set, try to deduce MIME type from content or path
        const headers = response.headers;
        if (!headers['Content-Type']) {
          const fromBuffer = (response.body instanceof Buffer) && fileType(response.body);
          const mimeType = fromBuffer? fromBuffer.mime : (mime.getType(request.path) || ContentType.APPLICATION_JSON);
          headers['Content-Type'] = mimeType;
        }
        // stringify any JSON object
        let body = response.body;
        if (body && !(body instanceof Buffer)) {
          switch (headers['Content-Type']) {
            case ContentType.APPLICATION_JSON:
              body = JSON.stringify(response.body);
              break;
            case ContentType.TEXT_YAML:
              body = yaml.safeDump(response.body);
              break;
          }
        } 
        // set Content-Length 
        if (body) 
          headers['Content-Length'] = Buffer.byteLength(body);
          // now we have a normalized messsage
        message.response = { body, headers, statusCode };
      })
    );
  }

}
