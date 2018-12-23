import { APIGatewayProxyEvent } from 'aws-lambda';
import { App } from '../app';
import { Context } from 'aws-lambda';
import { Message } from '../serverx';
import { Method } from '../serverx';
import { Response } from '../serverx';
import { Route } from '../serverx';
import { URLSearchParams } from 'url';

import { map } from 'rxjs/operators';
import { of } from 'rxjs';

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
        route: null,
      },
      response: {
        body: null,
        headers: { },
        statusCode: null
      }
    };
    return of(message)
      .pipe(map((message: Message): Message => this.router.route(message)))
      .pipe(this.makePipeline(message))
      .pipe(map((message: Message): Response => message.response))
      .toPromise();
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
