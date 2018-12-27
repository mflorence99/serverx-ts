import { Injectable } from 'injection-js';
import { Message } from '../serverx';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';
import { Request as ExpressRequest } from './express/request';
import { Response as ExpressResponse } from './express/response';

import { tap } from 'rxjs/operators';

/**
 * Express middleware wrapper
 */

@Injectable() export class Expresserator extends Middleware {

  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { request, response } = message;
        // create proxies
        const req = new ExpressRequest(request);
        const res = new ExpressResponse(response);
        req.res = res;
        res.req = req;
      })
    );
  }

}
