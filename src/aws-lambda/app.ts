import { APIGatewayProxyEvent } from 'aws-lambda';
import { App } from '../app';
import { Context } from 'aws-lambda';
import { Message } from '../serverx';
import { Method } from '../serverx';
import { Response } from '../serverx';
import { Route } from '../router';
import { StatusCode } from '../serverx';
import { URLSearchParams } from 'url';

import { catchError } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * AWS Lambda application
 */

export class AWSLambdaApp extends App {

  /** ctor */
  constructor(routes: Route[]) {
    super(routes);
  }

  /** AWS Lambda handler method */
  handle(event: APIGatewayProxyEvent,
         context: Context): Promise<Response> {
    // synthesize Message from Lambda event and context
    const message: Message = {
      context: {
        routes: this.router.routes,
      },
      request: {
        // TODO: how to get body?
        body: null,
        headers: event.headers || { },
        method: <Method>event.httpMethod,
        params: { },
        path: event.path,
        query: this.makeSearchParamsFromEvent(event),
        route: null
      },
      response: {
        body: null,
        headers: { },
        statusCode: null
      }
    };
    return of(message).pipe(
      // route the request
      map((message: Message) => {
        const { request } = message;
        return { ...message, request: this.router.route(request) };
      }),
      // let's see if we found a route
      tap((message: Message) => this.validateMessage(message)),
      // run any middleware
      mergeMap((message: Message) => {
        const { request } = message;
        const middlewares$ = this.router.makeMiddlewares$(request.route, message);
        return combineLatest(middlewares$);
      }),
      map((messages: Message[]) => this.mergeMessages(messages)),
      // run the handler
      mergeMap((message: Message) => {
        const { request } = message;
        return this.router.makeHandler$(request.route, message);
      }),
      // turn any error into a response
      catchError((error: any) => this.makeMessageFromError(error)),
      // ready to send!
      map((message: Message) => {
        // TODO: proper response mapping
        const { response } = message;
        return { ...response, statusCode: response.statusCode || StatusCode.OK};
      })
    ).toPromise();
  }

  // private methods

  private makeSearchParamsFromEvent(event: APIGatewayProxyEvent): URLSearchParams {
    const params = new URLSearchParams();
    if (event.queryStringParameters) {
      Object.keys(event.queryStringParameters).forEach(k => {
        params.append(k, event.queryStringParameters[k]);
      });
    }
    if (event.multiValueQueryStringParameters) {
      Object.keys(event.multiValueQueryStringParameters).forEach(k => {
        if (!params.has(k)) {
          const vs = event.multiValueQueryStringParameters[k];
          vs.forEach(v => params.append(k, v));
        }
      });
    }
    return params;
  }

}
