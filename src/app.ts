import { Error } from './serverx';
import { Message } from './serverx';
import { Observable } from 'rxjs';
import { Response } from './serverx';
import { Route } from './router';
import { Router } from './router';
import { StatusCode } from './serverx';

import { of } from 'rxjs';

/**
 * Base app class
 */

export abstract class App {

  protected router: Router;

  /** ctor */
  constructor(routes: Route[]) {
    this.router = new Router(routes);
  }

  // protected methods

  protected makeMessageFromError(error: any): Observable<Message> {
    let response: Response;
    if (error instanceof Error)
      response = error.error;
    // TODO: stack trace?
    else response = {
      body: error.toString(),
      statusCode: StatusCode.INTERNAL_SERVER_ERROR
    };
    return of({ response });
  }

  protected validateRoute(message: Message): void {
    const { request } = message;
    if (!request.route)
      throw new Error({ statusCode: StatusCode.NOT_FOUND });
    // NOTE: route but no handler just sends OK
    if (!request.route.handler)
      throw new Error({ statusCode: StatusCode.OK });
  }

}
