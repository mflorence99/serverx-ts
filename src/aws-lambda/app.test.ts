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
import { Route } from '../router';

import { map } from 'rxjs/operators';

@Injectable()
class Hello implements Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { request, response } = message;
        const body = `Hello, ${request.query.get('bizz')}`;
        return { ...message, response: { ...response, body } };
      })
    );
  }
}

@Injectable()
class Goodbye implements Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { request, response } = message;
        const body = `Goodbye, ${request.query.get('buzz')}`;
        return { ...message, response: { ...response, body } };
      })
    );
  }
}

@Injectable()
class Middleware1 implements Middleware {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { response } = message;
        response.headers['X-this'] = 'that';
        return message;
      })
    );
  }
}

@Injectable()
class Middleware2 implements Middleware {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { response } = message;
        response.headers['X-that'] = 'this';
        return message;
      })
    );
  }
}

const event = <APIGatewayProxyEvent>{
  body: 'x=y',
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
    path: '/not-here',
    redirectTo: 'http://over-there.com'
  }

];

const app = new AWSLambdaApp(routes);

test('AWSLambdaApp smoke test #1', async done => {
  const response = await app.handle({ ...event, httpMethod: 'GET' }, context);
  expect(response.body).toEqual('Hello, bazz');
  expect(response.headers['X-this']).toEqual('that');
  expect(response.headers['X-that']).toEqual('this');
  expect(response.statusCode).toEqual(200);
  done();
});

test('AWSLambdaApp smoke test #2', async done => {
  const response = await app.handle({ ...event, httpMethod: 'PUT' }, context);
  expect(response.body).toEqual('Goodbye, bozz');
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
  expect(response.body).toEqual('Hello, null');
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
