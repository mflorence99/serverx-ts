import { App } from '../app';
import { Message } from '../interfaces';
import { Method } from '../interfaces';
import { Normalizer } from '../middlewares/normalizer';
import { Response } from '../interfaces';
import { Route } from '../interfaces';

import { caseInsensitiveObject } from '../utils';

import { APIGatewayProxyEvent } from 'aws-lambda';
import { Context } from 'aws-lambda';
import { InfoObject } from 'openapi3-ts';
import { URLSearchParams } from 'url';

import { map } from 'rxjs/operators';
import { of } from 'rxjs';

// NOTE: this middleware is required
const MIDDLEWARES = [Normalizer];

/**
 * AWS Lambda application
 */

export class AWSLambdaApp extends App {
  /** ctor */
  constructor(routes: Route[], info: InfoObject = null) {
    super(routes, MIDDLEWARES, info);
  }

  /** AWS Lambda handler method */
  handle(event: APIGatewayProxyEvent, _context: Context): Promise<Response> {
    // synthesize Message from Lambda event and context
    const message: Message = {
      context: {
        info: this.info,
        router: this.router
      },
      request: {
        // @see https://stackoverflow.com/questions/41648467
        body: event.body != null ? JSON.parse(event.body) : {},
        headers: caseInsensitiveObject(event.headers || {}),
        httpVersion: '1.1',
        method: <Method>event.httpMethod,
        params: {},
        path: this.normalizePath(event.path),
        query: this.makeSearchParamsFromEvent(event),
        remoteAddr: null,
        route: null,
        stream$: null,
        timestamp: Date.now()
      },
      response: {
        body: null,
        headers: caseInsensitiveObject({}),
        statusCode: null
      }
    };
    return of(message)
      .pipe(map((message: Message): Message => this.router.route(message)))
      .pipe(this.makePipeline(message))
      .pipe(
        map((message: Message): Response => message.response),
        // NOTE: properly encode binary responses as base64
        // @see https://techblog.commercetools.com/gzip-on-aws-lambda-and-api-gateway-5170bb02b543
        map((response: Response): Response => {
          // @see https://stackoverflow.com/questions/21858138
          if (response.body instanceof Buffer) {
            const encoding = response.isBase64Encoded ? 'base64' : 'utf8';
            response.body = response.body.toString(encoding);
          }
          return response;
        })
      )
      .toPromise();
  }

  // private methods

  private makeSearchParamsFromEvent(
    event: APIGatewayProxyEvent
  ): URLSearchParams {
    const params = new URLSearchParams();
    if (event.queryStringParameters) {
      Object.entries(event.queryStringParameters).forEach(([k, v]) => {
        params.append(k, v);
      });
    }
    if (event.multiValueQueryStringParameters) {
      Object.entries(event.multiValueQueryStringParameters).forEach(
        ([k, vs]) => {
          if (!params.has(k)) vs.forEach((v) => params.append(k, v));
        }
      );
    }
    return params;
  }
}
