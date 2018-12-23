import * as fileType from 'file-type';
import * as mime from 'mime';

import { ContentType } from './serverx';
import { Error } from './serverx';
import { Handler } from './handler';
import { Message } from './serverx';
import { Middleware } from './middleware';
import { Observable } from 'rxjs';
import { Response } from './serverx';
import { Route } from './serverx';
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

  protected makeHandler$(route: Route,
                         message: Message): Observable<Message> {
    const handler = Handler.makeInstance(route);
    return handler ? handler.handle(of(message)) : of(message);
  }

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

  protected makeMiddlewares$(route: Route,
                             message: Message,
                             method: string): Observable<Message>[] {
    const middlewares = [];
    while (route) {
      middlewares.push(...Middleware.makeInstances(route));
      route = route.parent;
    }
    return (middlewares.length === 0) ? [of(message)] :
      middlewares.map(middleware => middleware[method](of(message)));
  }

  protected makeResponseFromMessage(message: Message): Response {
    const { request, response } = message;
    const statusCode = response.statusCode || StatusCode.OK ;
    const fromBuffer = Buffer.isBuffer(response.body) && fileType(response.body);
    const mimeType = fromBuffer ? fromBuffer.mime : (mime.getType(request.path) || ContentType.APPLICATION_JSON);
    const headers = { 'Content-Type': mimeType, ...response.headers };
    const body = (response.body && headers['Content-Type'])? JSON.stringify(response.body) : response.body;
    if (body)
      headers['Content-Length'] = Buffer.byteLength(body);
    return { body, headers, statusCode };
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
    } /* first message seeds accumulator */ );
  }

  // private methods

  private mergeHeaders(to, from): void {
    Object.keys(from).forEach(k => to[k] = from[k]);
  }

}
