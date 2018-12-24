import * as lambdaLocal from 'lambda-local';
import * as path from 'path';

import { APIGatewayProxyEvent } from 'aws-lambda';
import { AWSLambdaApp } from './app';
import { Context } from 'aws-lambda';
import { Handler } from '../handler';
import { Injectable } from 'injection-js';
import { Message } from '../serverx';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';
import { Route } from '../serverx';

import { tap } from 'rxjs/operators';

@Injectable() class Hello extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { request, response } = message;
        response.body = `Hello, ${request.query.get('bizz')}`;
      })
    );
  }
}

@Injectable() class Goodbye extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { request, response } = message;
        response.body = `Goodbye, ${request.query.get('buzz')}`;
      })
    );
  }
}

@Injectable() class Explode extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response['x']['y'] = 'z';
      })
    );
  }
}

@Injectable() class Middleware1 extends Middleware {
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response.headers['X-this'] = 'that';
      })
    );
  }
}

@Injectable() class Middleware2 extends Middleware {
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { request, response } = message;
        response.headers['X-that'] = 'this';
        Object.keys(request.body).forEach(k => response.headers[k] = request.body[k]);
      })
    );
  }
}

const event = <APIGatewayProxyEvent>{
  body: JSON.stringify({a: 'b', c: 'd'}),
  headers: {
    'this': 'that'
  },
  httpMethod: 'GET',
  isBase64Encoded: false,
  multiValueHeaders: null,
  multiValueQueryStringParameters: null,
  path: '/foo/bar',
  pathParameters: null,
  queryStringParameters: {
    'bizz': 'bazz',
    'buzz': 'bozz'
  },
  requestContext: null,
  resource: null,
  stageVariables: null,
};

const context = <Context>{
  awsRequestId: '0'
};

const routes: Route[] = [

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

];

const app = new AWSLambdaApp(routes);

test('AWSLambdaApp smoke test #1', async done => {
  const response = await app.handle({ ...event, httpMethod: 'GET' }, context);
  expect(response.body).toEqual('"Hello, bazz"');
  expect(response.headers['X-this']).toEqual('that');
  expect(response.headers['X-that']).toEqual('this');
  expect(response.headers['a']).toEqual('b');
  expect(response.headers['c']).toEqual('d');
  expect(response.statusCode).toEqual(200);
  done();
});

test('AWSLambdaApp smoke test #2', async done => {
  const response = await app.handle({ ...event, httpMethod: 'PUT' }, context);
  expect(response.body).toEqual('"Goodbye, bozz"');
  expect(response.headers['X-this']).toEqual('that');
  expect(response.headers['X-that']).toBeUndefined();
  expect(response.statusCode).toEqual(200);
  done();
});

test('AWSLambdaApp smoke test #3', async done => {
  const response = await app.handle({ ...event, httpMethod: 'PUT', path: '/xxx' }, context);
  expect(response.statusCode).toEqual(404);
  done();
});

test('AWSLambdaApp smoke test #4', async done => {
  const response = await app.handle({ ...event, httpMethod: 'GET', path: '/not-here' }, context);
  expect(response.headers['Location']).toEqual('http://over-there.com');
  expect(response.statusCode).toEqual(301);
  done();
});

test('AWSLambdaApp error 500', async done => {
  const response = await app.handle({ ...event, httpMethod: 'GET', path: '/explode' }, context);
  expect(response.body.error).toEqual(`TypeError: Cannot set property 'y' of undefined`);
  expect(response.statusCode).toEqual(500);
  done();
});

test('AWSLambdaApp lambda local 200', async done => {
  const apiGatewayEvent = require('lambda-local/examples/event_apigateway');
  const response = await lambdaLocal.execute({
    event: { ...apiGatewayEvent, path: '/foo/bar' },
    lambdaFunc: { handler: (event, context) => app.handle(event, context) },
    lambdaHandler: 'handler',
    profilePath: path.join(__dirname, 'credentials'),
    profileName: 'default',
    verboseLevel: 0
  });
  expect(response.body).toEqual('"Hello, null"');
  expect(response.statusCode).toEqual(200);
  done();
});

test('AWSLambdaApp lambda local 404', async done => {
  const apiGatewayEvent = require('lambda-local/examples/event_apigateway');
  const response = await lambdaLocal.execute({
    event: { ...apiGatewayEvent, path: '/xxx' },
    lambdaFunc: { handler: (event, context) => app.handle(event, context) },
    lambdaHandler: 'handler',
    profilePath: path.join(__dirname, 'credentials'),
    profileName: 'default',
    verboseLevel: 0
  });
  expect(response.statusCode).toEqual(404);
  done();
});
