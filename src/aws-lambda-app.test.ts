import * as aws from 'aws-lambda';

import { AWSLambdaApp } from './aws-lambda-app';
import { Handler } from './handler';
import { Injectable } from 'injection-js';
import { Message } from './serverx';
import { Middleware } from './middleware';
import { Observable } from 'rxjs';
import { Route } from './router';

import { map } from 'rxjs/operators';

@Injectable()
class Hello implements Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        message.response.body = 'Hello, lambda!';
        return message;
      })
    );
  }
}

@Injectable()
class Goodbye implements Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        message.response.body = 'Goodbye, lambda!';
        return message;
      })
    );
  }
}

@Injectable()
class Middleware1 implements Middleware {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        message.response.headers['X-this'] = 'that';
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
        message.response.headers['X-that'] = 'this';
        return message;
      })
    );
  }
}

const event = <aws.APIGatewayProxyEvent>{
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

const context = <aws.Context>{
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
  }

];

const app = new AWSLambdaApp(routes);

test('handler under normal conditions', async () => {
  expect.assertions(9);
  let response = await app.handle({ ...event, httpMethod: 'GET' }, context);
  expect(response.body).toEqual('Hello, lambda!');
  expect(response.headers['X-this']).toEqual('that');
  expect(response.headers['X-that']).toEqual('this');
  expect(response.statusCode).toEqual(200);
  response = await app.handle({ ...event, httpMethod: 'PUT' }, context);
  expect(response.body).toEqual('Goodbye, lambda!');
  expect(response.headers['X-this']).toEqual('that');
  expect(response.headers['X-that']).toBeUndefined();
  expect(response.statusCode).toEqual(200);
  response = await app.handle({ ...event, httpMethod: 'PUT', path: '/xxx' }, context);
  expect(response.statusCode).toEqual(404);
});
