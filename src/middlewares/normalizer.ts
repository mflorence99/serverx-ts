import * as fileType from 'file-type';
import * as mime from 'mime';

import { ContentType } from '../serverx';
import { Message } from '../serverx';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';
import { StatusCode } from '../serverx';

import { tap } from 'rxjs/operators';

/**
 * Response normalizer
 * 
 * NOTE: internal use only
 */

export class Normalizer extends Middleware {

  posthandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { request, response } = message;
        // status code is OK unless otherwise set
        const statusCode = response.statusCode || StatusCode.OK;
        // if not already set, try to deduce MIME type from content or path
        const headers = { ...response.headers };
        if (response.body && !headers['Content-Type']) {
          const fromBuffer = Buffer.isBuffer(response.body) && fileType(response.body);
          const mimeType = fromBuffer ? fromBuffer.mime : (mime.getType(request.path) || ContentType.APPLICATION_JSON);
          headers['Content-Type'] = mimeType;
        }
        // set Content-Length and stringify any JSON body
        let body = response.body;
        if (body) {
          if (headers['Content-Type'] === ContentType.APPLICATION_JSON)
            body = JSON.stringify(response.body);
          headers['Content-Length'] = Buffer.byteLength(body);
        }
        message.response = { body, headers, statusCode };
      })
    );
  }

}
