import * as aws from 'aws-lambda';

import { App } from './app';
import { Message } from './serverx';
import { Method } from './serverx';
import { Response } from './serverx';
import { Route } from './router';
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
  handle(event: aws.APIGatewayProxyEvent,
         context: aws.Context): Promise<Response> {
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
        statusCode: 200
      }
    };
    return of(message).pipe(
      // route the request
      map((message: Message) => {
        return { ...message, request: this.router.route(message.request) };
      }),
      // let's see if we found a route
      tap((message: Message) => this.validateRoute(message)),
      // run any middleware
      mergeMap((message: Message) => {
        const middlewares$ = this.router.makeMiddlewares$(message.request.route, message);
        return combineLatest(middlewares$);
      }),
      map((messages: Message[]) => messages[messages.length - 1]),
      // run the handler
      mergeMap((message: Message) => {
        return this.router.makeHandler$(message.request.route, message);
      }),
      // turn any error into a response
      catchError((error: any) => this.makeMessageFromError(error)),
      // ready to send!
      map((message: Message) => message.response)
    ).toPromise();
  }

  // private methods

  private makeSearchParamsFromEvent(event: aws.APIGatewayProxyEvent): URLSearchParams {
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
