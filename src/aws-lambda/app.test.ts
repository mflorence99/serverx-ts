import { AWSLambdaApp } from './app';
import { Handler } from '../handler';
import { Message } from '../interfaces';
import { Middleware } from '../middleware';
import { Response } from '../interfaces';
import { Route } from '../interfaces';

import * as lambdaLocal from 'lambda-local';
import * as path from 'path';

import { APIGatewayProxyEvent } from 'aws-lambda';
import { Context } from 'aws-lambda';
import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';

import { tap } from 'rxjs/operators';

@Injectable()
class Hello extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ request, response }) => {
        response.body = `Hello, ${request.query.get('bizz')}`;
      })
    );
  }
}

@Injectable()
class Goodbye extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ request, response }) => {
        response.body = `Goodbye, ${request.query.get('buzz')}`;
      })
    );
  }
}

@Injectable()
class Explode extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response['x']['y'] = 'z';
      })
    );
  }
}

@Injectable()
class Middleware1 extends Middleware {
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response.headers['X-this'] = 'that';
      })
    );
  }
}

@Injectable()
class Middleware2 extends Middleware {
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ request, response }) => {
        response.headers['X-that'] = 'this';
        Object.keys(request.body).forEach(
          (k) => (response.headers[k] = request.body[k])
        );
      })
    );
  }
}

const event = <APIGatewayProxyEvent>{
  body: JSON.stringify({ a: 'b', c: 'd' }),
  headers: {
    this: 'that'
  },
  httpMethod: 'GET',
  isBase64Encoded: false,
  multiValueHeaders: null,
  multiValueQueryStringParameters: null,
  path: '/foo/bar',
  pathParameters: null,
  queryStringParameters: {
    bizz: 'bazz',
    buzz: 'bozz'
  },
  requestContext: null,
  resource: null,
  stageVariables: null
};

const context = <Context>{
  awsRequestId: '0'
};

const routes: Route[] = [
  {
    path: '',
    children: [
      {
        methods: ['GET'],
        path: '/foo/bar',
        handler: Hello,
        middlewares: [Middleware1, Middleware2]
      },

      {
        methods: ['PUT'],
        path: '/foo/bar',
        handler: Goodbye,
        middlewares: [Middleware1]
      },

      {
        methods: ['GET'],
        path: '/explode',
        handler: Explode
      },

      {
        methods: ['GET'],
        path: '/not-here',
        redirectTo: 'http://over-there.com'
      }
    ]
  }
];

const app = new AWSLambdaApp(routes);

describe('AWSLambdaApp unit tests', () => {
  test('smoke test #1', () => {
    return app
      .handle({ ...event, httpMethod: 'GET' }, context)
      .then((response: Response) => {
        expect(response.body).toEqual('"Hello, bazz"');
        expect(response.headers['X-this']).toEqual('that');
        expect(response.headers['X-that']).toEqual('this');
        expect(response.headers['a']).toEqual('b');
        expect(response.headers['c']).toEqual('d');
        expect(response.statusCode).toEqual(200);
      });
  });

  test('smoke test #2', () => {
    return app
      .handle({ ...event, httpMethod: 'PUT' }, context)
      .then((response: Response) => {
        expect(response.body).toEqual('"Goodbye, bozz"');
        expect(response.headers['X-this']).toEqual('that');
        expect(response.headers['X-that']).toBeUndefined();
        expect(response.statusCode).toEqual(200);
      });
  });

  test('smoke test #3', () => {
    return app
      .handle({ ...event, httpMethod: 'PUT', path: '/xxx' }, context)
      .then((response: Response) => {
        expect(response.statusCode).toEqual(404);
      });
  });

  test('smoke test #4', () => {
    return app
      .handle({ ...event, httpMethod: 'GET', path: '/not-here' }, context)
      .then((response: Response) => {
        expect(response.headers['Location']).toEqual('http://over-there.com');
        expect(response.statusCode).toEqual(301);
      });
  });

  test('error 500', () => {
    return app
      .handle({ ...event, httpMethod: 'GET', path: '/explode' }, context)
      .then((response: Response) => {
        expect(response.body).toContain(
          `TypeError: Cannot set properties of undefined`
        );
        expect(response.statusCode).toEqual(500);
      });
  });

  test('lambda local 200', () => {
    const apiGatewayEvent = require('lambda-local/examples/event_apigateway');
    return lambdaLocal
      .execute({
        event: { ...apiGatewayEvent, path: '/foo/bar' },
        lambdaFunc: { handler: (event, context) => app.handle(event, context) },
        lambdaHandler: 'handler',
        profilePath: path.join(__dirname, 'credentials'),
        profileName: 'default',
        verboseLevel: 0
      })
      .then((response: Response) => {
        expect(response.body).toEqual('"Hello, null"');
        expect(response.statusCode).toEqual(200);
      });
  });

  test('lambda local 404', () => {
    const apiGatewayEvent = require('lambda-local/examples/event_apigateway');
    return lambdaLocal
      .execute({
        event: { ...apiGatewayEvent, path: '/xxx' },
        lambdaFunc: { handler: (event, context) => app.handle(event, context) },
        lambdaHandler: 'handler',
        profilePath: path.join(__dirname, 'credentials'),
        profileName: 'default',
        verboseLevel: 0
      })
      .then((response: Response) => {
        expect(response.statusCode).toEqual(404);
      });
  });
});
