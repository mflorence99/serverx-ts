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

  protected readonly router: Router;

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

  // NOTE: messages are processed serially by middlewares via combineLatest
  // however that doesn't make the message output by one the input of the next
  // as each receive the original -- so we merge them together here 

  protected mergeMessages(messages: Message[]): Message {
    return messages.reduce((acc, message) => {
      const { context } = acc;
      let { request, response } = acc;
      if (message.request.body)
        request = { ...request, body: message.request.body };
      this.mergeHeaders(request, message.request);
      if (message.response.body)
        response = { ...response, body: message.response.body };
      this.mergeHeaders(response, message.response);
      if (message.response.statusCode)
        response = { ...response, statusCode: message.response.statusCode };
      return { context, request, response };
    } /* first message is acc */ );
  }

  protected validateMessage(message: Message): void {
    const { request } = message;
    if (!request.route)
      throw new Error({ statusCode: StatusCode.NOT_FOUND });
    if (request.route.redirectTo) {
      const headers = { Location: request.route.redirectTo };
      throw new Error({ headers, statusCode: request.route.redirectAs || StatusCode.REDIRECT });
    }
    // NOTE: route but no handler just sends OK
    if (!request.route.handler)
      throw new Error({ statusCode: StatusCode.OK });
  }

  // private methods

  private mergeHeaders(to, from): void {
    Object.keys(from).forEach(k => to[k] = from[k]);
  }

}
